// ──────────────────────────────────────────────
// promptBlockRegistry — Epic 25.2
// Central registry for self-registering prompt
// blocks. Each block declares priority,
// dependencies, token budgets, and strategy
// filters. The PromptBuilder uses this registry
// to assemble the final LLM prompt.
// ──────────────────────────────────────────────

import type { GenerationStrategy } from "./generatorTypes";
import type { PromptBuilderInput } from "./generatorTypes";

// ── Block Types ───────────────────────────────

/**
 * Result of building a single prompt block.
 */
export interface PromptBlockResult {
  /** The rendered block content (markdown text) */
  content: string;
  /** Estimated token count for this block */
  estimatedTokens: number;
  /** Priority passed through from block definition */
  priority: number;
}

/**
 * A self-registering prompt block.
 *
 * Each block is responsible for rendering a specific
 * section of the prompt. Blocks declare their priority
 * (assembly order), dependencies (blocks that must appear
 * before this one), token budget, and which strategies
 * they apply to.
 */
export interface PromptBlock {
  /** Unique block identifier (e.g. "system-prompt", "ai-contract") */
  id: string;
  /** Assembly order — lower numbers appear earlier */
  priority: number;
  /** Block IDs that must appear before this block */
  dependencies: string[];
  /** Maximum tokens for this block's output */
  tokenBudget: number;
  /** Which generation strategies this block applies to */
  enabledForStrategy: GenerationStrategy[];
  /** Build the block content from input */
  build(input: PromptBuilderInput): PromptBlockResult;
}

// ── Registry ──────────────────────────────────

/**
 * Registry of prompt blocks.
 *
 * Blocks self-register via `register()`. The registry
 * provides lookup, dependency resolution, and strategy
 * filtering for the PromptBuilder.
 */
export class PromptBlockRegistry {
  private blocks: Map<string, PromptBlock> = new Map();

  /**
   * Register a prompt block.
   * Throws if a block with the same ID already exists.
   */
  register(block: PromptBlock): void {
    if (this.blocks.has(block.id)) {
      throw new Error(
        `PromptBlock "${block.id}" is already registered.`,
      );
    }
    this.blocks.set(block.id, block);
  }

  /**
   * Get a registered block by ID.
   * Returns undefined if not found.
   */
  get(id: string): PromptBlock | undefined {
    return this.blocks.get(id);
  }

  /**
   * Get all registered blocks, sorted by priority (ascending).
   */
  getAll(): PromptBlock[] {
    return Array.from(this.blocks.values()).sort(
      (a, b) => a.priority - b.priority,
    );
  }

  /**
   * Get blocks enabled for a specific strategy, sorted by priority.
   */
  getForStrategy(strategy: GenerationStrategy): PromptBlock[] {
    return this.getAll().filter((b) =>
      b.enabledForStrategy.includes(strategy),
    );
  }

  /**
   * Check if all dependencies for a block are satisfied
   * within a set of enabled block IDs.
   */
  dependenciesSatisfied(
    blockId: string,
    enabledBlockIds: Set<string>,
  ): boolean {
    const block = this.blocks.get(blockId);
    if (!block) return false;
    return block.dependencies.every((dep) => enabledBlockIds.has(dep));
  }

  /**
   * Resolve the build order for a given strategy.
   * Returns blocks in dependency-resolved priority order.
   * Throws if a dependency is missing or circular.
   */
  resolveBuildOrder(strategy: GenerationStrategy): PromptBlock[] {
    const enabled = this.getForStrategy(strategy);
    const enabledIds = new Set(enabled.map((b) => b.id));

    // Topological sort by dependencies
    const visited = new Set<string>();
    const sorted: PromptBlock[] = [];

    function visit(
      block: PromptBlock,
      registry: PromptBlockRegistry,
      stack: Set<string>,
    ): void {
      if (stack.has(block.id)) {
        throw new Error(
          `Circular dependency detected for PromptBlock "${block.id}".`,
        );
      }
      if (visited.has(block.id)) return;
      stack.add(block.id);

      for (const dep of block.dependencies) {
        const depBlock = registry.get(dep);
        if (!depBlock) {
          throw new Error(
            `PromptBlock "${block.id}" depends on "${dep}" which is not registered.`,
          );
        }
        if (!enabledIds.has(dep)) {
          throw new Error(
            `PromptBlock "${block.id}" depends on "${dep}" which is not enabled for strategy "${strategy}".`,
          );
        }
        visit(depBlock, registry, stack);
      }

      visited.add(block.id);
      sorted.push(block);
      stack.delete(block.id);
    }

    for (const block of enabled) {
      visit(block, this, new Set());
    }

    return sorted;
  }

  /**
   * Get the total token budget for all blocks enabled for a strategy.
   */
  totalTokenBudget(strategy: GenerationStrategy): number {
    return this.getForStrategy(strategy).reduce(
      (sum, b) => sum + b.tokenBudget,
      0,
    );
  }

  /**
   * Remove all registered blocks (useful for testing).
   */
  clear(): void {
    this.blocks.clear();
  }

  /**
   * Get the number of registered blocks.
   */
  get size(): number {
    return this.blocks.size;
  }
}

// ── Default Registry ──────────────────────────

/**
 * Create the default PromptBlockRegistry with all
 * standard blocks registered.
 *
 * Blocks are registered in priority order:
 *  10 - system-prompt
 *  20 - ai-contract
 *  30 - workspace-summary
 *  40 - requirements-summary
 *  50 - architecture-summary
 *  60 - generation-rules
 *  70 - output-schema
 *  80 - few-shot-examples (model-dependent)
 *  90 - user-notes
 */
export function createDefaultRegistry(): PromptBlockRegistry {
  const registry = new PromptBlockRegistry();

  // Blocks are registered here but their implementations
  // are imported and registered by the PromptBuilder.
  // This function exists for convenience and testing.
  // Actual registration happens in promptBuilder.ts.

  return registry;
}
