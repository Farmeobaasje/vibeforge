// ──────────────────────────────────────────────
// aiContract — Epic 25.2
// Prompt block: ai-contract (priority 20)
//
// Hallucination prevention rules that the LLM
// must follow. This block defines what the LLM
// must NOT do, and how to handle uncertainty.
// ──────────────────────────────────────────────

import type { PromptBlock, PromptBlockResult } from "../promptBlockRegistry";
import type { PromptBuilderInput } from "../generatorTypes";

/**
 * Estimate token count for a string.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * AI Contract block.
 * Priority 20 — appears after system prompt.
 * Depends on: system-prompt
 */
export const aiContractBlock: PromptBlock = {
  id: "ai-contract",
  priority: 20,
  dependencies: ["system-prompt"],
  tokenBudget: 300,
  enabledForStrategy: ["ai", "hybrid"],

  build(_input: PromptBuilderInput): PromptBlockResult {
    const content = `## AI Contract

You MUST follow these rules strictly:

### Never Invent
- Do NOT invent technology names, frameworks, libraries, or tools that don't exist.
- Do NOT assume specific version numbers unless they are mentioned in the input.
- Do NOT fabricate user stories, requirements, or constraints.
- If you are unsure about a specific detail, leave the field empty or use a generic description.

### Never Silently Overwrite
- If an existing ProjectDefinition is provided, preserve its values unless the input explicitly contradicts them.
- When updating an existing definition, clearly indicate which fields changed and why.

### Preserve Explicit Intent
- If the user says "I want to use PostgreSQL", use PostgreSQL — do not change it to "MySQL" or "MongoDB".
- If the user provides specific names, terms, or preferences, honor them exactly.
- Only suggest alternatives if the user explicitly asks for recommendations.

### Flag Uncertainty
- For each field in the output, include a "_confidence" meta-field with a value between 0 and 1.
- 1.0 = directly stated in input
- 0.7-0.9 = strongly implied by input
- 0.4-0.6 = reasonable inference
- 0.1-0.3 = best guess with little evidence
- 0.0 = completely unknown (leave field empty instead)

### Return Empty Rather Than Speculate
- If you have no information for a field, return an empty string, empty array, or sensible default — never fabricate content.
- Empty sections are acceptable and will be filled by deterministic fallback.`;

    return {
      content,
      estimatedTokens: estimateTokens(content),
      priority: 20,
    };
  },
};
