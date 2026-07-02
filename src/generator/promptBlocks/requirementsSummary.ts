// ──────────────────────────────────────────────
// requirementsSummary — Epic 25.2
// Prompt block: requirements-summary (priority 40)
//
// Compressed ProjectRequirements for the LLM.
// Includes problem statement, target users,
// features, tech preferences, and constraints.
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
 * Truncate a string to a maximum number of characters.
 * Appends "..." if truncated.
 */
function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 3) + "...";
}

/**
 * Requirements Summary block.
 * Priority 40 — appears after workspace context.
 * Depends on: system-prompt
 */
export const requirementsSummaryBlock: PromptBlock = {
  id: "requirements-summary",
  priority: 40,
  dependencies: ["system-prompt"],
  tokenBudget: 1000,
  enabledForStrategy: ["ai", "hybrid"],

  build(input: PromptBuilderInput): PromptBlockResult {
    const { requirements } = input;

    // Compress long fields to stay within token budget
    const vision = truncate(
      requirements.vision || "Not specified",
      500,
    );

    // Format target users
    const targetUsers = requirements.targetUsers?.length
      ? requirements.targetUsers.map((u) => `  - ${u}`).join("\n")
      : "  - Not specified";

    // Format problems
    const problems = requirements.problems?.length
      ? requirements.problems.map((p) => `  - ${p}`).join("\n")
      : "  - Not specified";

    // Format goals
    const goals = requirements.goals?.length
      ? requirements.goals.map((g) => `  - ${g}`).join("\n")
      : "  - Not specified";

    // Format solution ideas
    const solutionIdeas = requirements.solutionIdeas?.length
      ? requirements.solutionIdeas.map((s) => `  - ${s}`).join("\n")
      : "  - Not specified";

    // Format tech preferences
    const techPreferences = requirements.preferredTech?.length
      ? requirements.preferredTech.map((t) => `  - ${t}`).join("\n")
      : "  - Not specified";

    // Format constraints
    const constraints = requirements.constraints?.length
      ? requirements.constraints.map((c) => `  - ${c}`).join("\n")
      : "  - Not specified";

    // Format integrations
    const integrations = requirements.integrations?.length
      ? requirements.integrations.map((i) => `  - ${i}`).join("\n")
      : "  - Not specified";

    const content = `## Project Requirements

### Vision
${vision}

### Problems to Solve
${problems}

### Goals
${goals}

### Target Users
${targetUsers}

### Solution Ideas
${solutionIdeas}

### Technology Preferences
${techPreferences}

### Constraints
${constraints}

### Integrations
${integrations}

### MVP Scope
${requirements.mvpScope || "Not specified"}

### AI Workflow Target
${requirements.aiWorkflowTarget || "Not specified"}`;

    return {
      content,
      estimatedTokens: estimateTokens(content),
      priority: 40,
    };
  },
};
