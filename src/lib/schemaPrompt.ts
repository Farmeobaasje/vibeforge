// ──────────────────────────────────────────────
// schemaPrompt — rich JSON schema / prompt
// Genereert een beschrijvend schema dat de
// gebruiker kan kopiëren naar ChatGPT/Claude
// om een geldige ProjectDefinition JSON te krijgen.
// ──────────────────────────────────────────────

export function generateSchemaPrompt(): string {
  return `You are a Project Definition generator. Return ONLY valid JSON matching the schema below.

## Schema: ProjectDefinition

### project (object, required)
- name: string — short project name
- tagline: string — one-line description
- version: string — semver, default "0.1.0"
- description: string — longer markdown description
- status: "idea" | "draft" | "ready" | "bootstrapped"
- repositoryState: "greenfield" | "empty-repository" | "existing-project" — "greenfield" = create from scratch, "empty-repository" = repo exists but empty, "existing-project" = continue in existing repo
- (aliases: "projectState", "mode", "projectMode" — all map to repositoryState)


### product (object, required)
- targetUsers: string[] — who is this for?
- problemStatement: string — what problem does it solve?
- solution: string — how does it solve it?
- userStories: string[] — list of user stories
- mvpScope: string — what's in scope for MVP?

### tech (object, required)
- languages: string[] — e.g. ["TypeScript", "Python"]
- frameworks: string[] — e.g. ["React", "Vite"]
- tools: string[] — e.g. ["Docker", "GitHub Actions"]
- dependencies: string[] — key packages
- constraints: string[] — hard constraints

### architecture (object, required)
- pattern: string — e.g. "Feature-Sliced", "Clean Architecture"
- directoryStructure: string — describe folder layout
- componentTree: string — describe component hierarchy
- dataFlow: string — describe data flow

### roadmap (object, required)
- phases: array of { id: string, title: string, tasks: array of { id: string, title: string, status: "pending" | "done" } }
- activePhaseId: string | null — currently active phase id

### memory (object, required)
- files: array of { path: string, description: string, required: boolean }
- updateCadence: string — e.g. "After every session"
- patterns: string[] — memory patterns

### agents (object, required)
- agents: array of { role: string, model: string, promptTemplate: string }

### quality (object, required)
- codeStyle: string
- testingStrategy: string
- validationRules: string[]
- fallbackBehavior: string

### options (object, required)
- compression: boolean — (deprecated) use compressionMode instead
- compressionMode: "normal" | "compact" | "caveman-lite" | "handoff" — compression level for agent communication (default: "normal")
- orchestratorModel: string
- focusChain: boolean
- extraDocs: string[]

### generatedFiles (array, optional)
- path: string
- language: "markdown" | "json" | "typescript" | "text"
- content: string

## Example (minimal)
{
  "project": {
    "name": "My App",
    "tagline": "Does something cool",
    "version": "0.1.0",
    "description": "",
    "status": "idea"
  },
  "product": {
    "targetUsers": ["developers"],
    "problemStatement": "",
    "solution": "",
    "userStories": [],
    "mvpScope": ""
  },
  "tech": {
    "languages": [],
    "frameworks": [],
    "tools": [],
    "dependencies": [],
    "constraints": []
  },
  "architecture": {
    "pattern": "",
    "directoryStructure": "",
    "componentTree": "",
    "dataFlow": ""
  },
  "roadmap": {
    "phases": [],
    "activePhaseId": null
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
    "patterns": []
  },
  "agents": {
    "agents": [
      { "role": "orchestrator", "model": "gpt-4o", "promptTemplate": "..." },
      { "role": "plan", "model": "claude-sonnet-4-20250514", "promptTemplate": "..." },
      { "role": "act", "model": "claude-sonnet-4-20250514", "promptTemplate": "..." }
    ]
  },
  "quality": {
    "codeStyle": "TypeScript strict mode, functional components, Tailwind classes",
    "testingStrategy": "Manual review in MVP; vitest planned",
    "validationRules": ["JSON parse errors must show a clear message"],
    "fallbackBehavior": "Empty sections render a helpful hint instead of crashing"
  },
  "options": {
    "compression": false,
    "orchestratorModel": "gpt-4o",
    "focusChain": true,
    "extraDocs": []
  }
}

Return ONLY the JSON object. No markdown fences, no explanation.`;
}
