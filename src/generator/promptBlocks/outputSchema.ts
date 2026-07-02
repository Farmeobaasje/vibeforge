// ──────────────────────────────────────────────
// outputSchema — Epic 25.2
// Prompt block: output-schema (priority 70)
//
// JSON schema that the LLM must follow when
// generating the ProjectDefinition. Includes
// the _confidence meta-field requirement.
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
 * Output Schema block.
 * Priority 70 — appears after generation rules.
 * Depends on: system-prompt
 *
 * Provides the exact JSON schema the LLM must output.
 * The schema mirrors ProjectDefinition but includes
 * _confidence meta-fields for per-field scoring.
 */
export const outputSchemaBlock: PromptBlock = {
  id: "output-schema",
  priority: 70,
  dependencies: ["system-prompt"],
  tokenBudget: 800,
  enabledForStrategy: ["ai", "hybrid"],

  build(_input: PromptBuilderInput): PromptBlockResult {
    const content = `## Output Schema

You MUST output a JSON object matching this exact structure. Include a "_confidence" meta-field for every field to indicate your confidence level (0.0-1.0).

\`\`\`json
{
  "_confidence": {
    "overall": 0.85,
    "fields": {
      "project.name": 0.9,
      "project.tagline": 0.7,
      "product.problemStatement": 0.8
    },
    "sections": {
      "project": 0.85,
      "product": 0.75
    }
  },
  "project": {
    "name": "ProjectName",
    "tagline": "A brief one-line description",
    "version": "0.1.0",
    "description": "2-4 sentence description of the project",
    "status": "idea",
    "repositoryState": "greenfield"
  },
  "product": {
    "targetUsers": ["developer persona 1", "developer persona 2"],
    "problemStatement": "The problem this project solves",
    "solution": "How this project solves it",
    "userStories": [
      "As a developer, I want to...",
      "As a user, I want to..."
    ],
    "mvpScope": "Minimum viable product scope"
  },
  "tech": {
    "languages": ["TypeScript"],
    "frameworks": ["React", "Vite"],
    "tools": ["Git", "ESLint"],
    "dependencies": ["library-1", "library-2"],
    "constraints": ["Must run locally without backend"]
  },
  "architecture": {
    "pattern": "Architectural pattern description",
    "directoryStructure": "High-level directory layout",
    "componentTree": "Key components and relationships",
    "dataFlow": "How data moves through the system"
  },
  "roadmap": {
    "phases": [
      {
        "id": "phase-1",
        "title": "Phase 1 Title",
        "tasks": [
          { "id": "task-1", "title": "Task description", "status": "pending" }
        ]
      }
    ],
    "activePhaseId": "phase-1"
  },
  "memory": {
    "files": [
      { "path": "memory-bank/projectbrief.md", "description": "...", "required": true }
    ],
    "updateCadence": "After every session and at milestones",
    "patterns": []
  },
  "agents": {
    "agents": [
      {
        "role": "orchestrator",
        "model": "gpt-4o",
        "promptTemplate": "You are an orchestrator..."
      }
    ]
  },
  "quality": {
    "codeStyle": "TypeScript strict mode, functional components",
    "testingStrategy": "Testing approach",
    "validationRules": ["Rule 1", "Rule 2"],
    "fallbackBehavior": "How errors are handled"
  },
  "options": {
    "compression": false,
    "orchestratorModel": "gpt-4o",
    "focusChain": true,
    "extraDocs": []
  }
}
\`\`\`

### Important Notes
- The "_confidence" object is REQUIRED at the top level.
- Include "_confidence" for EVERY field in the "fields" map.
- The "sections" map aggregates field confidences per section.
- "overall" is the weighted average of all field confidences (0-100).
- If a field is empty or default, set its confidence to 0.0.
- If you are regenerating only specific sections, only include those sections in the output.`;

    return {
      content,
      estimatedTokens: estimateTokens(content),
      priority: 70,
    };
  },
};
