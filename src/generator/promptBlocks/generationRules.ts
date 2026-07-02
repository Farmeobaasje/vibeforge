// ──────────────────────────────────────────────
// generationRules — Epic 25.2
// Prompt block: generation-rules (priority 60)
//
// Per-section field-level guidance for the LLM.
// Provides detailed instructions on what each
// section of the ProjectDefinition should contain
// and how to populate each field.
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
 * Generation Rules block.
 * Priority 60 — appears after architecture.
 * Depends on: system-prompt
 *
 * Provides field-level guidance for each section
 * of the ProjectDefinition. If config.sections is
 * specified, only those sections get detailed rules.
 */
export const generationRulesBlock: PromptBlock = {
  id: "generation-rules",
  priority: 60,
  dependencies: ["system-prompt"],
  tokenBudget: 1500,
  enabledForStrategy: ["ai", "hybrid"],

  build(_input: PromptBuilderInput): PromptBlockResult {
    const content = `## Field-Level Generation Rules

### project
- **name**: Short, descriptive, PascalCase or kebab-case. Reflect the project purpose.
- **tagline**: One-line summary (10-15 words). Should communicate what the project does.
- **version**: Start at "0.1.0" for new projects. Preserve existing version if provided.
- **description**: 2-4 sentences. What is this project? Who is it for? What problem does it solve?
- **status**: One of: "idea", "draft", "ready", "bootstrapped". Default: "idea".
- **repositoryState**: One of: "greenfield", "empty-repository", "existing-project".

### product
- **targetUsers**: Array of user personas. Be specific: "Solo developers building AI tools" not just "developers".
- **problemStatement**: 1-3 sentences describing the pain point this project addresses.
- **solution**: 1-3 sentences describing how this project solves the problem.
- **userStories**: 3-7 concrete user stories in "As a... I want... So that..." format.
- **mvpScope**: 1-2 sentences defining the minimum viable product scope.

### tech
- **languages**: Primary programming languages. Be specific: "TypeScript 5.x", "Python 3.12".
- **frameworks**: Key frameworks and runtime environments.
- **tools**: Build tools, linters, formatters, CI/CD, testing tools.
- **dependencies**: Core libraries and packages. Include only major dependencies.
- **constraints**: Technical constraints: "Must run in browser", "No backend required", "Must support offline mode".

### architecture
- **pattern**: Architectural pattern: "Monorepo with Vite + React", "Microservices", "Layered architecture".
- **directoryStructure**: High-level directory layout. Use tree notation.
- **componentTree**: Key components and their relationships.
- **dataFlow**: How data moves through the system. Include state management approach.

### roadmap
- **phases**: 3-7 phases ordered by dependency. Each phase has a clear goal and 3-8 concrete tasks.
- **activePhaseId**: The ID of the current/next phase to work on.

### memory
- **files**: Standard Memory Bank files. Include all 6 core files as required.
- **updateCadence**: "After every session and at milestones" is the default.
- **patterns**: Any project-specific patterns to document.

### agents
- **agents**: 3-4 agents: orchestrator, plan, act, and optionally a review agent.
- Each agent needs: role, model, promptTemplate.

### quality
- **codeStyle**: Coding conventions and style rules.
- **testingStrategy**: Testing approach and tools.
- **validationRules**: 3-5 validation rules specific to this project.
- **fallbackBehavior**: How the system handles errors or missing data.

### options
- **compression**: Default: false. Enable for large projects.
- **orchestratorModel**: The default model for orchestration.
- **focusChain**: Default: true.
- **extraDocs**: Any additional documentation paths.`;

    return {
      content,
      estimatedTokens: estimateTokens(content),
      priority: 60,
    };
  },
};
