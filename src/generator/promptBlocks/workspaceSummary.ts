// ──────────────────────────────────────────────
// workspaceSummary — Epic 25.2
// Prompt block: workspace-summary (priority 30)
//
// Provides the LLM with high-level workspace
// context: project name, status, current phase,
// and metadata from the conversation memory.
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
 * Workspace Summary block.
 * Priority 30 — appears after AI contract.
 * Depends on: system-prompt
 */
export const workspaceSummaryBlock: PromptBlock = {
  id: "workspace-summary",
  priority: 30,
  dependencies: ["system-prompt"],
  tokenBudget: 200,
  enabledForStrategy: ["ai", "hybrid"],

  build(input: PromptBuilderInput): PromptBlockResult {
    const { requirements } = input;

    // Extract project name from requirements
    const projectName = requirements.projectName || "Unnamed Project";

    // Extract status from requirements confidence level
    const status = requirements.confidence || "low";

    // Extract goals from requirements
    const goals = requirements.goals?.length
      ? requirements.goals.join(", ")
      : "No goals recorded";

    // Extract target users
    const targetUsers = requirements.targetUsers?.length
      ? requirements.targetUsers.join(", ")
      : "No target users specified";

    // Extract constraints
    const constraints = requirements.constraints?.length
      ? requirements.constraints.join(", ")
      : "No constraints specified";

    const content = `## Workspace Context

- **Project Name:** ${projectName}
- **Status:** ${status}
- **Goals:** ${goals}
- **Target Users:** ${targetUsers}
- **Constraints:** ${constraints}
- **Has Existing Definition:** ${input.existing ? "Yes" : "No"}
- **User Notes Provided:** ${input.userNotes ? "Yes" : "No"}`;

    return {
      content,
      estimatedTokens: estimateTokens(content),
      priority: 30,
    };
  },
};
