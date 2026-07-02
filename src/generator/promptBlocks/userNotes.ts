// ──────────────────────────────────────────────
// userNotes — Epic 25.2
// Prompt block: user-notes (priority 90)
//
// Optional user-provided notes or corrections
// that should be incorporated into the generated
// ProjectDefinition. This block is only included
// when the user has provided notes.
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
 * User Notes block.
 * Priority 90 — appears last.
 * Depends on: system-prompt
 *
 * Only included when input.userNotes is provided.
 * Contains the user's explicit corrections or
 * additional context for the generation.
 */
export const userNotesBlock: PromptBlock = {
  id: "user-notes",
  priority: 90,
  dependencies: ["system-prompt"],
  tokenBudget: 500,
  enabledForStrategy: ["ai", "hybrid"],

  build(input: PromptBuilderInput): PromptBlockResult {
    // If no user notes, return empty content
    if (!input.userNotes || input.userNotes.trim().length === 0) {
      return {
        content: "",
        estimatedTokens: 0,
        priority: 90,
      };
    }

    const content = `## User Notes / Corrections

The user has provided the following additional context or corrections. These take priority over any inferred or default values:

\`\`\`
${input.userNotes.trim()}
\`\`\`

### Instructions
- Apply these notes as overrides to the generated ProjectDefinition.
- If a note contradicts information from other sources, the user note wins.
- Mark fields affected by user notes with confidence 1.0.`;

    return {
      content,
      estimatedTokens: estimateTokens(content),
      priority: 90,
    };
  },
};
