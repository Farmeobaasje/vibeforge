// ──────────────────────────────────────────────
// fewShotExamples — Epic 25.2
// Prompt block: few-shot-examples (priority 80)
//
// Optional few-shot examples for the LLM.
// Model-dependent — enabled for weaker models
// that benefit from examples, disabled for
// strong models where examples add noise.
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
 * Few-Shot Examples block.
 * Priority 80 — appears before user notes.
 * Depends on: system-prompt, output-schema
 *
 * Provides a complete example of a ProjectDefinition
 * for a hypothetical project. This helps the LLM
 * understand the expected quality and structure.
 *
 * This block is typically removed first when token
 * budget is exceeded.
 */
export const fewShotExamplesBlock: PromptBlock = {
  id: "few-shot-examples",
  priority: 80,
  dependencies: ["system-prompt", "output-schema"],
  tokenBudget: 1200,
  enabledForStrategy: ["ai", "hybrid"],

  build(_input: PromptBuilderInput): PromptBlockResult {
    const content = `## Example Output

Here is a complete example for a hypothetical project called "LogLens":

\`\`\`json
{
  "_confidence": {
    "overall": 92,
    "fields": {
      "project.name": 1.0,
      "project.tagline": 0.9,
      "project.description": 0.85,
      "product.problemStatement": 0.8,
      "product.solution": 0.8,
      "tech.languages": 0.7,
      "tech.frameworks": 0.7,
      "roadmap.phases": 0.6
    },
    "sections": {
      "project": 0.92,
      "product": 0.8,
      "tech": 0.7,
      "architecture": 0.5,
      "roadmap": 0.6,
      "memory": 0.9,
      "agents": 0.8,
      "quality": 0.7,
      "options": 0.9
    }
  },
  "project": {
    "name": "LogLens",
    "tagline": "Real-time log aggregation and visualization for small teams",
    "version": "0.1.0",
    "description": "LogLens is a lightweight log aggregation tool designed for small development teams. It collects logs from multiple services, provides real-time filtering and search, and visualizes error patterns without the complexity of enterprise solutions like Splunk or Datadog.",
    "status": "draft",
    "repositoryState": "greenfield"
  },
  "product": {
    "targetUsers": [
      "Small development teams (2-15 people)",
      "Solo developers managing multiple services",
      "DevOps engineers who want lightweight log aggregation"
    ],
    "problemStatement": "Small teams need log aggregation but enterprise solutions are too expensive and complex. Existing open-source tools require significant setup and maintenance effort.",
    "solution": "A self-hosted, Docker-based log aggregation tool that can be set up in under 10 minutes. Provides real-time log streaming, regex-based search, and error pattern visualization.",
    "userStories": [
      "As a developer, I want to see logs from all my services in one place so I don't have to SSH into each server.",
      "As a DevOps engineer, I want to filter logs by service and severity so I can quickly find errors.",
      "As a team lead, I want to see error frequency over time so I can identify recurring issues."
    ],
    "mvpScope": "Docker Compose setup with log ingestion from HTTP and file sources, real-time web UI with filtering, and basic error pattern detection."
  },
  "tech": {
    "languages": ["TypeScript", "Go"],
    "frameworks": ["React 18", "Express", "Docker"],
    "tools": ["Docker Compose", "ESLint", "Prettier", "Vitest"],
    "dependencies": ["winston", "socket.io", "tailwindcss"],
    "constraints": ["Must run in Docker", "Minimal external dependencies", "Browser-based UI only"]
  },
  "architecture": {
    "pattern": "Microservices with message queue",
    "directoryStructure": "LogLens/\\n  ingester/     # Go service for log ingestion\\n  web/          # React frontend\\n  api/          # Express API server\\n  docker/       # Docker Compose files\\n  docs/         # Documentation",
    "componentTree": "Web UI <-> API Server <-> Message Queue <-> Ingester <-> Log Sources",
    "dataFlow": "Log sources send logs to Ingester via HTTP. Ingester publishes to message queue. API Server consumes from queue and stores in memory buffer. Web UI connects via WebSocket for real-time updates."
  },
  "roadmap": {
    "phases": [
      {
        "id": "phase-1",
        "title": "Core Ingestion & Viewing",
        "tasks": [
          { "id": "task-1", "title": "Set up Docker Compose project structure", "status": "pending" },
          { "id": "task-2", "title": "Build Go ingester with HTTP endpoint", "status": "pending" },
          { "id": "task-3", "title": "Build Express API with log storage", "status": "pending" },
          { "id": "task-4", "title": "Build React web UI with real-time log stream", "status": "pending" }
        ]
      },
      {
        "id": "phase-2",
        "title": "Search & Filter",
        "tasks": [
          { "id": "task-5", "title": "Add regex search to API", "status": "pending" },
          { "id": "task-6", "title": "Add severity and service filters to UI", "status": "pending" }
        ]
      }
    ],
    "activePhaseId": "phase-1"
  },
  "memory": {
    "files": [
      { "path": "memory-bank/projectbrief.md", "description": "Core requirements and goals", "required": true },
      { "path": "memory-bank/productContext.md", "description": "Why this exists and how it should work", "required": true },
      { "path": "memory-bank/activeContext.md", "description": "Current focus and recent changes", "required": true },
      { "path": "memory-bank/systemPatterns.md", "description": "Architecture and technical decisions", "required": true },
      { "path": "memory-bank/techContext.md", "description": "Technologies and setup", "required": true },
      { "path": "memory-bank/progress.md", "description": "What works and what's left", "required": true }
    ],
    "updateCadence": "After every session and at milestones",
    "patterns": ["Docker-first development", "API-first design"]
  },
  "agents": {
    "agents": [
      { "role": "orchestrator", "model": "gpt-4o", "promptTemplate": "You are an orchestrator. Convert raw project ideas into a structured ProjectDefinition JSON." },
      { "role": "plan", "model": "claude-sonnet-4-20250514", "promptTemplate": "You are a Cline Plan agent. Read the bootstrap prompt and present a file-by-file implementation plan." },
      { "role": "act", "model": "claude-sonnet-4-20250514", "promptTemplate": "You are a Cline Act agent. Write the exact files specified in the plan." }
    ]
  },
  "quality": {
    "codeStyle": "TypeScript strict mode, functional React components, Tailwind CSS",
    "testingStrategy": "Unit tests with Vitest for API and UI components. Integration tests for ingester.",
    "validationRules": [
      "All log entries must be validated before storage",
      "Web UI must handle connection loss gracefully",
      "API must return 400 for malformed log entries"
    ],
    "fallbackBehavior": "If message queue is unavailable, ingester buffers logs in memory and retries"
  },
  "options": {
    "compression": false,
    "orchestratorModel": "gpt-4o",
    "focusChain": true,
    "extraDocs": ["docs/architecture.md", "docs/deployment.md"]
  }
}
\`\`\`

### Notes on the Example
- The "_confidence" block shows high confidence for fields directly from input, lower for inferred fields.
- User stories are concrete and follow the "As a... I want... So that..." format.
- The roadmap has clear phases with actionable tasks.
- Architecture is consistent with the tech stack and project type.
- Memory Bank includes all 6 standard files.`;

    return {
      content,
      estimatedTokens: estimateTokens(content),
      priority: 80,
    };
  },
};
