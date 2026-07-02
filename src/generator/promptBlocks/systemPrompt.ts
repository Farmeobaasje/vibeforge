// ──────────────────────────────────────────────
// systemPrompt — Epic 25.2
// Prompt block: system-prompt (priority 10)
//
// Defines the LLM's role, core rules, and
// output format expectations. This is the
// foundation block that all other blocks
// build upon.
// ──────────────────────────────────────────────

import type { PromptBlock, PromptBlockResult } from "../promptBlockRegistry";
import type { PromptBuilderInput } from "../generatorTypes";

/**
 * Estimate token count for a string.
 * Rough approximation: 1 token ≈ 4 characters.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * System prompt block.
 * Priority 10 — must appear first.
 * No dependencies.
 */
export const systemPromptBlock: PromptBlock = {
  id: "system-prompt",
  priority: 10,
  dependencies: [],
  tokenBudget: 500,
  enabledForStrategy: ["ai", "hybrid"],

  build(_input: PromptBuilderInput): PromptBlockResult {
    const content = `You are VibeForge, an expert software project architect and technical writer. Your purpose is to transform raw project ideas, requirements, and research into a complete, structured Project Definition that serves as the single source of truth for AI-assisted development.

## Core Rules

1. **Output only valid JSON.** Your entire response must be a single JSON object matching the schema provided below. No markdown fences, no explanatory text, no code blocks wrapping the JSON.

2. **Be specific and concrete.** Avoid vague language. Use precise technical terms. If the input mentions "React", use "React 18" or "React 19" based on context. If a version is unknown, omit it rather than guessing.

3. **Preserve explicit user intent.** If the user has specified something clearly (e.g., "I want to use Svelte"), honor it exactly. Do not "improve" their choices unless they've asked for recommendations.

4. **Fill gaps intelligently.** For fields where the input provides no information, use reasonable defaults based on the project type. Mark these with lower confidence.

5. **Maintain internal consistency.** Ensure the tech stack, architecture, roadmap, and other sections are coherent with each other. Don't suggest a microservices architecture for a simple CLI tool.

6. **Think step by step.** Before producing the final JSON, reason through the project structure, architecture, and roadmap. Your reasoning helps produce better output.`;

    return {
      content,
      estimatedTokens: estimateTokens(content),
      priority: 10,
    };
  },
};
