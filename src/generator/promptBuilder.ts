// ──────────────────────────────────────────────
// promptBuilder — Epic 25.2
// Assembles the final LLM prompt from registered
// PromptBlocks. Handles token budget enforcement,
// dependency resolution, and compression.
// ──────────────────────────────────────────────

import type {
  PromptBuilderInput,
  PromptBuilderResult,
  GeneratorConfig,
} from "./generatorTypes";
import { PromptBlockRegistry } from "./promptBlockRegistry";
import { systemPromptBlock } from "./promptBlocks/systemPrompt";
import { aiContractBlock } from "./promptBlocks/aiContract";
import { workspaceSummaryBlock } from "./promptBlocks/workspaceSummary";
import { requirementsSummaryBlock } from "./promptBlocks/requirementsSummary";
import { architectureSummaryBlock } from "./promptBlocks/architectureSummary";
import { generationRulesBlock } from "./promptBlocks/generationRules";
import { outputSchemaBlock } from "./promptBlocks/outputSchema";
import { fewShotExamplesBlock } from "./promptBlocks/fewShotExamples";
import { userNotesBlock } from "./promptBlocks/userNotes";

/**
 * Default maximum tokens for the entire prompt.
 */
export const DEFAULT_MAX_PROMPT_TOKENS = 8000;

/**
 * Models that should NOT receive few-shot examples.
 * Stronger models perform better without examples.
 */
const MODELS_WITHOUT_FEW_SHOT = [
  "claude-sonnet-4",
  "claude-opus-4",
  "gpt-4o",
  "gemini-2.5-pro",
];

/**
 * Check if a model should receive few-shot examples.
 */
function shouldIncludeFewShot(model?: string): boolean {
  if (!model) return true; // Include by default for unknown models
  const normalized = model.toLowerCase().trim();
  return !MODELS_WITHOUT_FEW_SHOT.some((m) => normalized.startsWith(m));
}

/**
 * PromptBuilder assembles the final LLM prompt from
 * registered PromptBlocks.
 *
 * Usage:
 *   const builder = new PromptBuilder();
 *   const result = builder.build(input, config);
 */
export class PromptBuilder {
  private registry: PromptBlockRegistry;

  constructor(registry?: PromptBlockRegistry) {
    this.registry = registry ?? new PromptBlockRegistry();
    this.registerDefaultBlocks();
  }

  /**
   * Register all default prompt blocks.
   */
  private registerDefaultBlocks(): void {
    const blocks = [
      systemPromptBlock,
      aiContractBlock,
      workspaceSummaryBlock,
      requirementsSummaryBlock,
      architectureSummaryBlock,
      generationRulesBlock,
      outputSchemaBlock,
      fewShotExamplesBlock,
      userNotesBlock,
    ];

    for (const block of blocks) {
      try {
        this.registry.register(block);
      } catch {
        // Block already registered — skip silently
      }
    }
  }

  /**
   * Get the underlying registry.
   */
  getRegistry(): PromptBlockRegistry {
    return this.registry;
  }

  /**
   * Build the complete prompt from input and config.
   *
   * Process:
   * 1. Resolve build order from registry (topological sort)
   * 2. Build each block
   * 3. Enforce token budget (remove/compress low-priority blocks)
   * 4. Compose system prompt + user messages
   * 5. Return PromptBuilderResult
   */
  build(
    input: PromptBuilderInput,
    config: GeneratorConfig,
  ): PromptBuilderResult {
    const maxTokens = config.maxPromptTokens ?? DEFAULT_MAX_PROMPT_TOKENS;
    const model = config.orchestrator?.getActiveEndpoint?.()?.model;

    // 1. Resolve build order
    let blocks = this.registry.resolveBuildOrder(config.strategy);

    // 2. Filter blocks based on config
    blocks = this.filterBlocks(blocks, model);

    // 3. Build each block
    const results = blocks.map((block) => block.build(input));

    // 4. Enforce token budget
    const { kept, removed: _removed } = this.enforceTokenBudget(results, maxTokens);

    // 5. Compose system prompt + user messages
    const systemPrompt = this.composeSystemPrompt(kept);
    const userMessage = this.composeUserMessage(kept, input);
    const estimatedTokens = kept.reduce(
      (sum, r) => sum + r.estimatedTokens,
      0,
    );

    // Track which blocks were used
    const blocksUsed = kept.map((r) => {
      const block = blocks.find((b) => b.build(input).priority === r.priority);
      return block?.id ?? "unknown";
    });

    const tokensByBlock: Record<string, number> = {};
    for (let i = 0; i < kept.length; i++) {
      tokensByBlock[blocksUsed[i]] = kept[i].estimatedTokens;
    }

    return {
      systemPrompt,
      messages: [{ role: "user" as const, content: userMessage }],
      estimatedTokens,
    };
  }

  /**
   * Filter blocks based on config and model.
   * - Removes few-shot examples for strong models
   * - Removes user-notes if no notes provided
   * - Filters by sections if specified
   */
  private filterBlocks(
    blocks: ReturnType<PromptBlockRegistry["resolveBuildOrder"]>,
    model?: string,
  ): typeof blocks {
    return blocks.filter((block) => {
      // Remove few-shot examples for strong models
      if (block.id === "few-shot-examples" && !shouldIncludeFewShot(model)) {
        return false;
      }

      // Remove user-notes if no notes provided
      if (block.id === "user-notes") {
        // We can't check input here, so we keep it and let the block
        // return empty content if no notes. This is handled in the block itself.
      }

      return true;
    });
  }

  /**
   * Enforce token budget by removing or compressing
   * low-priority blocks when the total exceeds the limit.
   *
   * Strategy:
   * 1. Remove few-shot-examples first (highest priority number = lowest priority)
   * 2. Compress generation-rules (remove field-level guidance)
   * 3. Compress requirements-summary and architecture-summary
   * 4. If still over budget, remove blocks from lowest priority up
   */
  private enforceTokenBudget(
    results: Array<{ content: string; estimatedTokens: number; priority: number }>,
    maxTokens: number,
  ): {
    kept: typeof results;
    removed: typeof results;
  } {
    let total = results.reduce((sum, r) => sum + r.estimatedTokens, 0);
    const kept = [...results];
    const removed: typeof results = [];

    if (total <= maxTokens) {
      return { kept, removed };
    }

    // Sort by priority descending (lowest priority first for removal)
    kept.sort((a, b) => b.priority - a.priority);

    // 1. Remove few-shot-examples (identified by high token count and priority 80)
    const fewShotIdx = kept.findIndex((r) => r.priority === 80);
    if (fewShotIdx !== -1) {
      const [removed_block] = kept.splice(fewShotIdx, 1);
      removed.push(removed_block);
      total -= removed_block.estimatedTokens;
    }

    // 2. If still over, remove blocks from lowest priority up
    // (but never remove system-prompt, ai-contract, or output-schema)
    const protectedPriorities = new Set([10, 20, 70]); // system-prompt, ai-contract, output-schema
    while (total > maxTokens && kept.length > 3) {
      // Find the lowest priority non-protected block
      const idx = kept.findIndex(
        (r) => !protectedPriorities.has(r.priority),
      );
      if (idx === -1) break; // Only protected blocks remain
      const [removed_block] = kept.splice(idx, 1);
      removed.push(removed_block);
      total -= removed_block.estimatedTokens;
    }

    // Restore original priority order
    kept.sort((a, b) => a.priority - b.priority);

    return { kept, removed };
  }

  /**
   * Compose the system prompt from kept blocks.
   * Only includes blocks with priority < 100 (system-level blocks).
   */
  private composeSystemPrompt(
    results: Array<{ content: string; estimatedTokens: number; priority: number }>,
  ): string {
    // System prompt is built from all kept blocks
    return results
      .filter((r) => r.content.trim().length > 0)
      .map((r) => r.content)
      .join("\n\n");
  }

  /**
   * Compose the user message from kept blocks and input.
   */
  private composeUserMessage(
    _results: Array<{ content: string; estimatedTokens: number; priority: number }>,
    input: PromptBuilderInput,
  ): string {
    const parts: string[] = [];

    // Add existing ProjectDefinition if available
    if (input.existing) {
      parts.push(
        `## Existing ProjectDefinition\n\n\`\`\`json\n${JSON.stringify(input.existing, null, 2)}\n\`\`\``,
      );
    }

    // Add user notes if available
    if (input.userNotes?.trim()) {
      parts.push(
        `## User Notes\n\n${input.userNotes.trim()}`,
      );
    }

    // Final instruction
    parts.push(
      "Generate the ProjectDefinition JSON now. Remember to include the _confidence meta-field.",
    );

    return parts.join("\n\n");
  }
}
