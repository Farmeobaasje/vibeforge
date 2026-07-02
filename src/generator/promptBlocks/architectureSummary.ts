// ──────────────────────────────────────────────
// architectureSummary — Epic 25.2
// Prompt block: architecture-summary (priority 50)
//
// Compressed ArchitectureAnalysis for the LLM.
// Includes architectural patterns, component
// structure, data flow, and directory layout.
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
 */
function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 3) + "...";
}

/**
 * Architecture Summary block.
 * Priority 50 — appears after requirements.
 * Depends on: system-prompt
 */
export const architectureSummaryBlock: PromptBlock = {
  id: "architecture-summary",
  priority: 50,
  dependencies: ["system-prompt"],
  tokenBudget: 1000,
  enabledForStrategy: ["ai", "hybrid"],

  build(input: PromptBuilderInput): PromptBlockResult {
    const { architecture } = input;

    // Extract architecture pattern from technical analysis
    const pattern = architecture.technicalAnalysis?.architecturePattern || "Not analyzed";

    // Extract executive summary
    const executiveSummary = truncate(
      architecture.executiveSummary || "Not analyzed",
      600,
    );

    // Extract suggested architecture
    const suggestedArchitecture = truncate(
      architecture.suggestedArchitecture || "Not analyzed",
      600,
    );

    // Format suggested stack
    const stack = architecture.suggestedStack;
    const stackStr = stack
      ? `- **Frontend:** ${stack.frontend || "Not specified"}
- **Backend:** ${stack.backend || "Not specified"}
- **Database:** ${stack.database || "Not specified"}
- **Infrastructure:** ${stack.infrastructure || "Not specified"}
- **AI/ML:** ${stack.ai || "Not specified"}
- **Testing:** ${stack.testing || "Not specified"}
- **Monitoring:** ${stack.monitoring || "Not specified"}`
      : "  - Not specified";

    // Format recommendations
    const recommendations = architecture.recommendations?.length
      ? architecture.recommendations.map((r) => `  - [${r.priority}] ${r.description}`).join("\n")
      : "  - Not specified";

    // Format risks
    const risks = architecture.risks?.length
      ? architecture.risks.map((r) => `  - [${r.impact}/${r.likelihood}] ${r.description}`).join("\n")
      : "  - Not specified";

    const content = `## Architecture Analysis

### Executive Summary
${executiveSummary}

### Architecture Pattern
${pattern}

### Suggested Architecture
${suggestedArchitecture}

### Suggested Stack
${stackStr}

### Recommendations
${recommendations}

### Risks
${risks}

### Estimated Complexity
${architecture.estimatedComplexity || "Not analyzed"}

### Estimated Timeline
${architecture.estimatedTimeline || "Not specified"}`;

    return {
      content,
      estimatedTokens: estimateTokens(content),
      priority: 50,
    };
  },
};
