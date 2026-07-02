// ──────────────────────────────────────────────
// clinerulesGenerator — Phase 4.2
// Genereert .clinerules/* bestanden vanuit een
// ProjectDefinition via RenderModel.
//
// v0.4: Accepts RenderModel as parameter (no longer
// builds it internally). Renderers never derive.
// Renderers only format.
// ──────────────────────────────────────────────

import type {
  ProjectDefinition,
  GeneratedFile,
} from "../types/projectDefinition";
import type { RenderModel } from "../generator/renderModel";

/**
 * Genereer alle .clinerules bestanden op basis van de gegeven ProjectDefinition
 * en pre-built RenderModel.
 *
 * @param pd - The ProjectDefinition (unused in this generator, kept for API consistency)
 * @param rm - The pre-built RenderModel (all generators share this)
 */
export function generateClinerulesFiles(
  _pd: ProjectDefinition,
  rm: RenderModel
): GeneratedFile[] {
  return [
    {
      path: ".clinerules/00-project.md",
      language: "markdown",
      content: clinerules00Project(rm),
    },
    {
      path: ".clinerules/01-memory-bank.md",
      language: "markdown",
      content: clinerules01MemoryBank(rm),
    },
    {
      path: ".clinerules/02-roadmap-protocol.md",
      language: "markdown",
      content: clinerules02RoadmapProtocol(),
    },
    {
      path: ".clinerules/02-workflow.md",
      language: "markdown",
      content: clinerules02Workflow(rm),
    },
    {
      path: ".clinerules/03-architecture.md",
      language: "markdown",
      content: clinerules03Architecture(rm),
    },
    {
      path: ".clinerules/04-generator.md",
      language: "markdown",
      content: clinerules04Generator(rm),
    },
    {
      path: ".clinerules/05-quality.md",
      language: "markdown",
      content: clinerules05Quality(rm),
    },
    {
      path: ".clinerules/06-communication.md",
      language: "markdown",
      content: clinerules06Communication(rm),
    },
    {
      path: ".clinerules/07-release.md",
      language: "markdown",
      content: clinerules07Release(rm),
    },
    {
      path: "AGENTS.md",
      language: "markdown",
      content: agentsMd(rm),
    },
  ];
}

// ── Metadata frontmatter helper ──────────────

function frontmatter(meta: Record<string, string>): string {
  const lines = ["---"];
  for (const [key, value] of Object.entries(meta)) {
    lines.push(`${key}: ${value}`);
  }
  lines.push("---");
  lines.push("");
  return lines.join("\n");
}

// ── 00-project.md ───────────────────────────────

function clinerules00Project(rm: RenderModel): string {
  const lines: string[] = [];

  lines.push(frontmatter({
    "scope": "core",
    "priority": "high",
    "always_load": "true",
  }));

  lines.push(`# Project: ${rm.identity.fullName}`);
  lines.push(rm.identity.tagline);
  lines.push("");

  // What we're building
  lines.push("## What we're building");
  lines.push(rm.identity.description || "_(description pending)_");
  lines.push("");

  // Primary goal
  if (rm.product.solution) {
    lines.push("## Primary goal");
    lines.push(rm.product.solution);
    lines.push("");
  }

  // Product context
  const hasProductContext =
    rm.product.targetUsers.length > 0 ||
    rm.product.problemStatement ||
    rm.product.mvpScope;

  if (hasProductContext) {
    lines.push("## Product context");
    lines.push("");
    if (rm.product.targetUsers.length > 0) {
      lines.push("Target users:");
      rm.product.targetUsers.forEach((u) => lines.push(`- ${u}`));
      lines.push("");
    }
    if (rm.product.problemStatement) {
      lines.push("Problem:");
      lines.push(rm.product.problemStatement);
      lines.push("");
    }
    if (rm.product.mvpScope) {
      lines.push("MVP:");
      lines.push(rm.product.mvpScope);
      lines.push("");
    }
  }

  // Stack — use categorized for richer display, fall back to flat arrays
  const cat = rm.tech.categorized;
  const hasCategorized = cat.frontend.length > 0 || cat.backend.length > 0 || cat.database.length > 0 ||
    cat.infrastructure.length > 0 || cat.deployment.length > 0 || cat.integrations.length > 0 ||
    cat.uncategorized.length > 0;
  const hasFlat = rm.tech.languages.length > 0 || rm.tech.frameworks.length > 0 || rm.tech.tools.length > 0 || rm.tech.dependencies.length > 0;

  if (hasCategorized) {
    lines.push("## Stack");
    if (cat.frontend.length > 0) lines.push(`- **Frontend:** ${cat.frontend.join(", ")}`);
    if (cat.backend.length > 0) lines.push(`- **Backend:** ${cat.backend.join(", ")}`);
    if (cat.database.length > 0) lines.push(`- **Database:** ${cat.database.join(", ")}`);
    if (cat.infrastructure.length > 0) lines.push(`- **Infrastructure:** ${cat.infrastructure.join(", ")}`);
    if (cat.deployment.length > 0) lines.push(`- **Deployment:** ${cat.deployment.join(", ")}`);
    if (cat.integrations.length > 0) lines.push(`- **Integrations:** ${cat.integrations.join(", ")}`);
    if (cat.uncategorized.length > 0) lines.push(`- **Other:** ${cat.uncategorized.join(", ")}`);
    lines.push("");
  } else if (hasFlat) {
    lines.push("## Stack");
    if (rm.tech.languages.length > 0 && rm.tech.frameworks.length > 0) {
      lines.push(`${rm.tech.languages.join(" / ")} · ${rm.tech.frameworks.join(" / ")}`);
    } else if (rm.tech.languages.length > 0) {
      lines.push(rm.tech.languages.join(" / "));
    } else if (rm.tech.frameworks.length > 0) {
      lines.push(rm.tech.frameworks.join(" / "));
    }
    if (rm.tech.tools.length > 0) {
      lines.push(rm.tech.tools.join(", "));
    }
    if (rm.tech.dependencies.length > 0) {
      lines.push(`Key dependencies / services: ${rm.tech.dependencies.join(", ")}`);
    }
    lines.push("");
  }

  // Hard constraints
  if (rm.tech.constraints.length > 0) {
    lines.push("## Hard constraints");
    rm.tech.constraints.forEach((c) => lines.push(`- ${c}`));
    lines.push("");
  }

  // Quality rules
  if (rm.quality.rules.length > 0) {
    lines.push("## Quality rules");
    rm.quality.rules.forEach((r) => lines.push(`- ${r}`));
    lines.push("");
  }

  return lines.join("\n");
}

// ── 01-memory-bank.md ────────────────────────────

function clinerules01MemoryBank(rm: RenderModel): string {
  const lines: string[] = [];

  lines.push(frontmatter({
    "scope": "core",
    "priority": "high",
    "always_load": "true",
  }));

  lines.push("# Cline's Memory Bank");
  lines.push("");
  lines.push("I am Cline, an expert software engineer with a unique characteristic: my memory");
  lines.push("resets completely between sessions. This isn't a limitation - it's what drives me");
  lines.push("to maintain perfect documentation. After each reset, I rely ENTIRELY on my Memory");
  lines.push("Bank to understand the project and continue work effectively. I MUST read ALL");
  lines.push("memory bank files at the start of EVERY task - this is not optional.");
  lines.push("");

  // Memory Bank Structure
  lines.push("## Memory Bank Structure");
  lines.push("Core files (required), in hierarchy:");

  const fileHierarchy = [
    { num: 1, path: "projectbrief.md", desc: "foundation; core requirements/goals; source of truth for scope" },
    { num: 2, path: "productContext.md", desc: "why this exists; problems solved; how it should work; UX goals" },
    { num: 3, path: "activeContext.md", desc: "current focus; recent changes; next steps; active decisions" },
    { num: 4, path: "systemPatterns.md", desc: "architecture; key technical decisions; component relationships" },
    { num: 5, path: "techContext.md", desc: "technologies; setup; constraints; dependencies" },
    { num: 6, path: "progress.md", desc: "what works; what's left; current status (STATUS block); known issues" },
  ];

  for (const f of fileHierarchy) {
    lines.push(`${f.num}. ${f.path} - ${f.desc}`);
  }
  lines.push("");

  // Custom memory files from project
  if (rm.memory.files.length > 0) {
    const customFiles = rm.memory.files.filter(
      (f) => !fileHierarchy.some((hf) => f.path.endsWith(hf.path))
    );
    if (customFiles.length > 0) {
      lines.push("### Project-specific files");
      for (const f of customFiles) {
        const req = f.required ? "required" : "optional";
        lines.push(`- \`${f.path}\` — ${f.description} (${req})`);
      }
      lines.push("");
    }
  }

  // Documentation Updates
  lines.push("## Documentation Updates");
  lines.push("Update when: discovering new patterns; after significant changes; on the command");
  lines.push('"update memory bank" (I MUST review ALL files); when context needs clarification.');
  lines.push("");

  // Update cadence from project
  if (rm.memory.updateCadence) {
    lines.push(`**Update cadence:** ${rm.memory.updateCadence}`);
    lines.push("");
  }

  lines.push("REMEMBER: After every memory reset I begin completely fresh. The Memory Bank is my");
  lines.push("only link to previous work. It must be maintained with precision and clarity.");

  return lines.join("\n");
}

// ── 02-roadmap-protocol.md ───────────────────────

function clinerules02RoadmapProtocol(): string {
  const lines: string[] = [];

  lines.push("# Roadmap & Status Protocol");
  lines.push("");
  lines.push("Single source of truth for \"where are we\": roadmap.md (the plan) + the STATUS block");
  lines.push("in memory-bank/progress.md (the live state). Do NOT rely on the in-session Focus");
  lines.push("Chain for status — it can desync on restore. The committed files always win.");
  lines.push("");
  lines.push("## Phase numbering");
  lines.push("Phases are numbered N. Tasks are N.M. Checklist syntax: [x] done, [ ] pending. Active task is marked \"← CURRENT\".");
  lines.push("");
  lines.push("## Status-query protocol");
  lines.push("When asked \"where are we / where in the roadmap / what are we working on\", read memory-bank/progress.md AND roadmap.md, then reply exactly:");
  lines.push("CURRENT_PHASE: <N.M and title>");
  lines.push("DONE_LAST_SESSION: <items, or \"none\">");
  lines.push("NEXT: <next pending task>");
  lines.push("BLOCKERS: <none | description>");
  lines.push("");
  lines.push("## Updating");
  lines.push("At the end of every Act session: tick completed boxes in roadmap.md and rewrite the STATUS block in memory-bank/progress.md.");

  return lines.join("\n");
}

// ── 02-workflow.md ───────────────────────────────

function clinerules02Workflow(rm: RenderModel): string {
  const lines: string[] = [];

  lines.push(frontmatter({
    "scope": "core",
    "priority": "high",
    "always_load": "true",
  }));

  lines.push("# Workflow Discipline");
  lines.push("");

  // Plan / Act
  lines.push("## Plan / Act");
  if (rm.workflow.planAct.length > 0) {
    rm.workflow.planAct.forEach((rule) => lines.push(`- ${rule}`));
  } else {
    lines.push("- Start in PLAN mode for non-trivial changes; present plan and WAIT for approval.");
    lines.push("- Switch to ACT mode only after approval.");
    lines.push("- Do not auto-switch Plan -> Act.");
  }
  lines.push("");

  // Slash commands
  lines.push("## Slash commands");
  if (rm.workflow.slashCommands.length > 0) {
    rm.workflow.slashCommands.forEach((cmd) => lines.push(`- ${cmd}`));
  } else {
    lines.push("- /newphase <title> before a new phase -> produces implementation_plan.md.");
    lines.push("- /newtask at phase boundaries -> clean handoff.");
    lines.push("- /smol or Auto Compact when context fills.");
  }
  lines.push("");

  // Focus Chain
  lines.push("## Focus Chain");
  if (rm.workflow.focusChain) {
    lines.push("- Keep Focus Chain ON for long single tasks.");
  } else {
    lines.push("- Focus Chain is OFF by default.");
  }
  lines.push("- Treat memory-bank/progress.md as source of truth, not Focus Chain.");
  lines.push("- Scope Focus Chain OFF on MCP-heavy tasks to avoid task_progress leakage.");
  lines.push("");

  // Memory Bank cadence
  lines.push("## Memory Bank cadence");
  if (rm.workflow.memoryCadence) {
    lines.push(rm.workflow.memoryCadence);
  } else {
    lines.push("- Read ALL memory-bank files at start of every task.");
    lines.push("- Update activeContext.md after each session.");
    lines.push("- Run \"update memory bank\" at milestones.");
  }

  return lines.join("\n");
}

// ── 03-architecture.md ───────────────────────────

function clinerules03Architecture(rm: RenderModel): string {
  const lines: string[] = [];

  lines.push(frontmatter({
    "scope": "engineering",
    "priority": "high",
    "paths": JSON.stringify(["src/**", "app/**"]),
  }));

  lines.push("# Architecture Principles");
  lines.push("");

  // Core principles
  lines.push("## Core principles");
  lines.push("- **Reuse-first**: Before creating a new file, search for existing code that can be extended.");
  lines.push("- **Search-first**: Use search_files to find relevant code before making assumptions.");
  lines.push("- **No assumptions**: Never assume code exists or doesn't exist — verify with tools.");
  lines.push("- **Minimal changes**: Change only what's needed for the task. One thing at a time.");
  lines.push("");

  // Folder conventions
  lines.push("## Folder conventions");
  if (rm.architecture.directoryStructure) {
    lines.push("```");
    lines.push(rm.architecture.directoryStructure);
    lines.push("```");
  } else {
    lines.push("- `src/` — application source code");
    lines.push("- `src/lib/` — pure functions, utilities, generators");
    lines.push("- `src/components/` — React UI components");
    lines.push("- `src/hooks/` — custom React hooks");
    lines.push("- `src/types/` — TypeScript type definitions");
    lines.push("- `src/ai/` — AI provider abstractions and agents");
    lines.push("- `src/models/` — domain models");
    lines.push("- `src/orchestrator/` — workflow orchestration");
    lines.push("- `memory-bank/` — Cline Memory Bank documentation");
    lines.push("- `.clinerules/` — AI agent rules");
    lines.push("- `docs/` — project documentation and plans");
  }
  lines.push("");

  // Dependency rules
  lines.push("## Dependency rules");
  lines.push("- **Inward dependency**: Components may import from lib, hooks, types. Lib may NOT import from components.");
  lines.push("- **No circular imports**: If A imports B, B must not import A.");
  lines.push("- **Barrel exports**: Use index.ts barrel files for public API surfaces.");
  lines.push("- **Generator isolation**: Generators must not depend on React or browser APIs.");
  lines.push("");

  // Refactoring policy
  lines.push("## Refactoring policy");
  lines.push("- Make the minimal change that satisfies the requirement.");
  lines.push("- If refactoring is needed, do it as a separate step before feature work.");
  lines.push("- Never refactor and add features in the same change.");
  lines.push("- After refactoring, verify with `tsc --noEmit` and existing tests.");
  lines.push("");

  // No assumptions policy
  lines.push("## No assumptions policy");
  lines.push("- If you're unsure about a file's contents, read it.");
  lines.push("- If you're unsure about a function's signature, check the type definition.");
  lines.push("- If you're unsure about a pattern, search for existing usage.");
  lines.push("- Never guess — always verify.");
  lines.push("");

  // Domain model (from canonical domain model)
  if (rm.domainModel && rm.domainModel.entities.length > 0) {
    lines.push("## Domain Model");
    lines.push("");
    lines.push("### Entities");
    for (const entity of rm.domainModel.entities) {
      const attrs = entity.attributes ? ` (${entity.attributes.join(", ")})` : "";
      lines.push(`- **${entity.name}**: ${entity.description}${attrs}`);
    }
    if (rm.domainModel.relationships.length > 0) {
      lines.push("");
      lines.push("### Relationships");
      for (const rel of rm.domainModel.relationships) {
        lines.push(`- ${rel.from} ${rel.type} ${rel.to} — ${rel.description}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ── 04-generator.md ──────────────────────────────

function clinerules04Generator(_rm: RenderModel): string {
  const lines: string[] = [];

  lines.push(frontmatter({
    "scope": "engineering",
    "priority": "high",
    "paths": JSON.stringify(["src/generator/**", "src/lib/*Generator*"]),
  }));

  lines.push("# Generator Rules");
  lines.push("");

  // How generators behave
  lines.push("## How generators behave");
  lines.push("- Generators are **deterministic**: given the same input, they always produce the same output.");
  lines.push("- Generators are **pure functions**: no side effects, no API calls, no randomness.");
  lines.push("- Generators read from ProjectDefinition (via RenderModel) and return GeneratedFile[].");
  lines.push("");

  // No placeholders
  lines.push("## No placeholders");
  lines.push("- Never output \"TODO\", \"FIXME\", \"TBD\", or \"to be implemented\" in generated content.");
  lines.push("- If data is missing, use a contextual fallback that includes the project name.");
  lines.push("- Empty sections get useful hints, not bare placeholders.");
  lines.push("");

  // Never invent data
  lines.push("## Never invent data");
  lines.push("- If the ProjectDefinition doesn't specify a value, use the default fallback.");
  lines.push("- Never fabricate tech stack items, features, or requirements.");
  lines.push("- Never assume a language or framework based on the project name alone.");
  lines.push("");

  // Prefer deterministic generation
  lines.push("## Prefer deterministic generation");
  lines.push("- Use rule-based generation whenever possible.");
  lines.push("- Reserve AI-powered generation for complex synthesis (architecture, roadmap).");
  lines.push("- AI output must be validated against the schema before acceptance.");
  lines.push("");

  // Respect interview answers
  lines.push("## Respect interview answers");
  lines.push("- User-provided answers in ConversationMemory take priority over defaults.");
  lines.push("- Explicit user input in the ProjectDefinition takes priority over derived values.");
  lines.push("- Never overwrite a field the user has explicitly set.");
  lines.push("");

  // Fallback hierarchy
  lines.push("## Fallback hierarchy");
  lines.push("1. **Explicit user input** (from ProjectDefinition or ConversationMemory)");
  lines.push("2. **Derived values** (computed from other fields, e.g., mvpFeatures from mvpScope)");
  lines.push("3. **Default values** (from defaultProjectDefinition)");
  lines.push('4. **Contextual fallbacks** (e.g., "_(project name) — to be refined during project review._")');
  lines.push("");

  // Validation hierarchy
  lines.push("## Validation hierarchy");
  lines.push("1. **Schema validation** — is the output valid ProjectDefinition JSON?");
  lines.push('2. **Semantic validation** — do the values make sense? (e.g., no "Modular Monolith" for a CLI tool)');
  lines.push("3. **Golden test validation** — does the output match expected snapshots?");

  return lines.join("\n");
}

// ── 05-quality.md ────────────────────────────────

function clinerules05Quality(_rm: RenderModel): string {
  const lines: string[] = [];

  lines.push(frontmatter({
    "scope": "engineering",
    "priority": "high",
    "paths": JSON.stringify(["src/**", "app/**"]),
  }));

  lines.push("# Quality Rules");
  lines.push("");

  // Testing
  lines.push("## Testing");
  lines.push("- **Golden tests**: Run `vitest run` before every commit. All tests must pass.");
  lines.push("- **Snapshot policy**: Update snapshots intentionally. Never auto-accept without review.");
  lines.push("- **Regression**: When fixing a bug, add a test that reproduces it first.");
  lines.push("- **Coverage**: Focus on integration tests for generators; unit tests for pure functions.");
  lines.push("");

  // Build
  lines.push("## Build");
  lines.push("- **TypeScript**: `tsc --noEmit` must pass with zero errors before any commit.");
  lines.push("- **Vite build**: `vite build` must pass with zero errors.");
  lines.push("- **No warnings**: Treat warnings as errors. Fix them before committing.");
  lines.push("");

  // Formatting
  lines.push("## Formatting");
  lines.push("- Consistent indentation (2 spaces for TypeScript/React).");
  lines.push("- No Prettier dependency — use editor-native formatting.");
  lines.push("- Follow existing patterns in the codebase.");
  lines.push("");

  // Security
  lines.push("## Security");
  lines.push("- Never include API keys, tokens, or secrets in generated output.");
  lines.push("- Never store sensitive data in localStorage without user consent.");
  lines.push("- All user data stays local — no data leaves the browser.");
  lines.push("");

  // Performance
  lines.push("## Performance");
  lines.push("- Token budgets: generators should estimate and report token usage.");
  lines.push("- Lazy loading: defer expensive computations until needed.");
  lines.push("- Memoization: use useMemo for derived values in React components.");
  lines.push("");

  // Regression policy
  lines.push("## Regression policy");
  lines.push("- Before making changes, run the full test suite to establish a baseline.");
  lines.push("- After changes, run the full test suite again.");
  lines.push("- If a golden test fails, investigate whether the change is intentional.");
  lines.push("- If intentional, update the snapshot. If not, fix the regression.");

  return lines.join("\n");
}

// ── 06-communication.md ──────────────────────────

function clinerules06Communication(_rm: RenderModel): string {
  const lines: string[] = [];

  lines.push(frontmatter({
    "scope": "operations",
    "priority": "medium",
    "condition": "task-type == communication || task-type == release",
  }));

  lines.push("# Communication Policy");
  lines.push("");

  // Verbosity levels
  lines.push("## Verbosity levels");
  lines.push("| Phase | Level | Description |");
  lines.push("|-------|-------|-------------|");
  lines.push("| Planning | High | Full explanations, multiple options, reasoning |");
  lines.push("| Implementation | Medium | Concise but complete |");
  lines.push("| Status updates | Compact | What was done, what's next, blockers only |");
  lines.push("| Handoff | Minimal | Context for next session only |");
  lines.push("");

  // Compression modes
  lines.push("## Compression modes");
  lines.push("");

  // Compression mode is available via rm.communication.compressionMode
  // Default: "normal"
  
  lines.push("### Normal (default)");
  lines.push("- **Allowed**: Remove hedging and filler words where safe.");
  lines.push("- **Forbidden**: Never strip articles, conjunctions, or helper verbs.");
  lines.push("- **Use when**: Default mode for most interactions.");
  lines.push("");

  lines.push("### Compact");
  lines.push("- **Allowed**: Sentence fragments for status updates. Omit greetings and sign-offs.");
  lines.push("- **Forbidden**: Never strip code, paths, commands, errors, or stack traces.");
  lines.push("- **Use when**: Daily status updates, progress reports.");
  lines.push("");

  lines.push("### Caveman Lite");
  lines.push("- **Allowed**: Strip articles, conjunctions, and helper verbs where safe.");
  lines.push("- **Forbidden**: Never strip code, paths, commands, errors, API names, database names, schema names, JSON, TypeScript, Markdown code blocks, or terminal output.");
  lines.push("- **Use when**: Quick progress updates, task completion notifications.");
  lines.push("");

  lines.push("### Handoff");
  lines.push("- **Allowed**: Key=value format for session handoffs. Ultra-compact summaries.");
  lines.push("- **Forbidden**: Never strip code, paths, commands, errors, schema, or configuration values.");
  lines.push("- **Use when**: End of session, context handoff to another agent.");
  lines.push("");

  // Never compress
  lines.push("## Never compress (all modes)");
  lines.push("- Code, paths, commands, errors, stack traces");
  lines.push("- API names, database names, schema names");
  lines.push("- JSON, TypeScript, Markdown code blocks");
  lines.push("- Terminal output, configuration values, numbers");
  lines.push("");

  // Only compress
  lines.push("## Only compress");
  lines.push("- Status updates, planning summaries, reasoning");
  lines.push("- Documentation, meeting notes, Memory Bank summaries");
  lines.push("- Progress reports, task lists");
  lines.push("");

  // Summary triggers
  lines.push("## Summary triggers");
  lines.push("- After every 10 messages in a conversation");
  lines.push("- At phase boundaries (when switching Plan → Act or between tasks)");
  lines.push("- On explicit `/summary` command");
  lines.push("");

  // Handoff protocol
  lines.push("## Handoff protocol");
  lines.push("When ending a session, include:");
  lines.push("1. Current phase and task");
  lines.push("2. What was completed this session");
  lines.push("3. What's next");
  lines.push("4. Any blockers or decisions made");
  lines.push("5. Key files modified");
  lines.push("");

  // Terminology
  lines.push("## Terminology");
  lines.push("- Use consistent terms throughout. No synonyms for key concepts.");
  lines.push("- \"ProjectDefinition\" — never \"project definition\" or \"project-definition\" in code");
  lines.push("- \"Memory Bank\" — always capitalized");
  lines.push("- \"Plan mode\" / \"Act mode\" — always capitalized");

  return lines.join("\n");
}

// ── 07-release.md ────────────────────────────────

function clinerules07Release(_rm: RenderModel): string {
  const lines: string[] = [];

  lines.push(frontmatter({
    "scope": "operations",
    "priority": "medium",
    "condition": "task-type == release",
  }));

  lines.push("# Release Checklist");
  lines.push("");

  // Before release — verification
  lines.push("## Before release — verification");
  lines.push("");

  // Build
  lines.push("### Build");
  lines.push("- [ ] `tsc --noEmit` passes with zero errors");
  lines.push("- [ ] `vite build` passes with zero errors");
  lines.push("- [ ] No TypeScript warnings");
  lines.push("");

  // Tests
  lines.push("### Tests");
  lines.push("- [ ] `vitest run` passes — all tests green");
  lines.push("- [ ] Golden tests match expected snapshots");
  lines.push("- [ ] No flaky tests");
  lines.push("");

  // Lint / Quality
  lines.push("### Lint / Quality");
  lines.push("- [ ] No unused imports or variables");
  lines.push("- [ ] No `any` types (unless explicitly justified)");
  lines.push("- [ ] Consistent code style throughout");
  lines.push("");

  // Documentation
  lines.push("### Documentation");
  lines.push("- [ ] README is up to date");
  lines.push("- [ ] Memory Bank files are current");
  lines.push("- [ ] Roadmap reflects actual progress");
  lines.push("- [ ] SPEC and PRD match current implementation");
  lines.push("");

  // Memory Bank
  lines.push("### Memory Bank");
  lines.push("- [ ] `activeContext.md` — current focus and recent changes documented");
  lines.push("- [ ] `progress.md` — STATUS block updated with latest progress");
  lines.push("- [ ] `systemPatterns.md` — any new patterns documented");
  lines.push("- [ ] `techContext.md` — any new dependencies documented");
  lines.push("");

  // Roadmap
  lines.push("### Roadmap");
  lines.push("- [ ] Completed tasks marked as `[x]`");
  lines.push("- [ ] Active task marked as `← CURRENT`");
  lines.push("- [ ] Next steps are clear");
  lines.push("");

  // Versioning
  lines.push("## Versioning");
  lines.push("- Follow semver: `vMAJOR.MINOR.PATCH`");
  lines.push("- MVP phase: `v0.MINOR.PATCH` (major = 0 until stable)");
  lines.push("- Patch: bug fixes, minor improvements");
  lines.push("- Minor: new features, non-breaking changes");
  lines.push("- Major: breaking changes, architecture rewrites");
  lines.push("");

  // Export validation
  lines.push("## Export validation");
  lines.push("Before tagging a release:");
  lines.push("- [ ] ZIP export contains all expected files");
  lines.push("- [ ] Bootstrap prompt is complete and accurate");
  lines.push("- [ ] Project Definition JSON is valid");
  lines.push("- [ ] All generated files have correct paths");
  lines.push("");

  // Post-release
  lines.push("## Post-release");
  lines.push("- [ ] Tag the release in git");
  lines.push("- [ ] Update release notes with changelog");
  lines.push("- [ ] Verify the release build works from a clean clone");

  return lines.join("\n");
}

// ── AGENTS.md ────────────────────────────────────

function agentsMd(rm: RenderModel): string {
  const lines: string[] = [];

  lines.push(`# ${rm.identity.fullName} — Agent Guide`);
  lines.push("");

  // Project
  lines.push("## Project");
  lines.push("");
  lines.push(`**${rm.identity.fullName}** ${rm.identity.tagline ? rm.identity.tagline.toLowerCase() : "transforms raw project ideas into AI-ready software projects."}`);
  if (rm.identity.description) {
    lines.push("");
    lines.push(rm.identity.description);
  }
  lines.push("");

  // Workflow
  lines.push("## Workflow");
  lines.push("");
  lines.push("This project uses a two-mode workflow:");
  lines.push("");
  lines.push("1. **Plan mode** — Analyze the task, explore the codebase, create an implementation plan, and present it for approval. No code is written in Plan mode.");
  lines.push("2. **Act mode** — After plan approval, implement the changes. Write code, run tests, update documentation.");
  lines.push("");
  lines.push("Always start in Plan mode for non-trivial changes. Switch to Act mode only after the plan is approved.");
  lines.push("");

  // Rules hierarchy
  lines.push("## Rules hierarchy");
  lines.push("");
  lines.push("Rules are organized in three layers:");
  lines.push("");

  // Core
  lines.push("### Core (always loaded)");
  lines.push("- `00-project.md` — Project identity, goals, constraints");
  lines.push("- `01-memory-bank.md` — Memory Bank protocol and structure");
  lines.push("- `02-workflow.md` — Plan/Act workflow, commands, Focus Chain");
  lines.push("");

  // Engineering
  lines.push("### Engineering (loaded during development)");
  lines.push("- `03-architecture.md` — Architecture principles, folder conventions, dependency rules");
  lines.push("- `04-generator.md` — Generator behavior, fallbacks, validation");
  lines.push("- `05-quality.md` — Testing, build, formatting, security");
  lines.push("");

  // Operations
  lines.push("### Operations (loaded during releases and communication)");
  lines.push("- `06-communication.md` — Verbosity, compression modes, handoffs");
  lines.push("- `07-release.md` — Release checklist, versioning, export validation");
  lines.push("");

  // Memory Bank
  lines.push("## Memory Bank");
  lines.push("");
  lines.push("The Memory Bank is the project's persistent context. It consists of six files:");
  lines.push("");
  lines.push("| File | Purpose |");
  lines.push("|------|---------|");
  lines.push("| `projectbrief.md` | Core requirements, goals, scope |");
  lines.push("| `productContext.md` | Problem, solution, target users |");
  lines.push("| `activeContext.md` | Current focus, recent changes, next steps |");
  lines.push("| `systemPatterns.md` | Architecture, technical decisions |");
  lines.push("| `techContext.md` | Technologies, setup, constraints |");
  lines.push("| `progress.md` | What works, what's left, STATUS block |");
  lines.push("");
  lines.push("Read all Memory Bank files at the start of every task. Update `activeContext.md` after each session. Run \"update memory bank\" at milestones.");
  lines.push("");

  // Compression
  lines.push("## Compression");
  lines.push("");
  lines.push("Communication can be compressed in four modes:");
  lines.push("");
  lines.push("| Mode | Use case |");
  lines.push("|------|----------|");
  lines.push("| Normal | Default — full grammar, remove hedging only |");
  lines.push("| Compact | Daily status — sentence fragments, no greetings |");
  lines.push("| Caveman Lite | Quick updates — strip articles/conjunctions |");
  lines.push("| Handoff | Session end — key=value format |");
  lines.push("");
  lines.push("Code, paths, commands, errors, and schema are never compressed in any mode.");
  lines.push("");

  // Release flow
  lines.push("## Release flow");
  lines.push("");
  lines.push("1. Verify build (`tsc --noEmit`, `vite build`)");
  lines.push("2. Run tests (`vitest run`)");
  lines.push("3. Update documentation (Memory Bank, README, roadmap)");
  lines.push("4. Validate export (ZIP contains all expected files)");
  lines.push("5. Tag release with semver version");
  lines.push("6. Update release notes");
  lines.push("");

  // Quality expectations
  lines.push("## Quality expectations");
  lines.push("");
  lines.push("- Zero TypeScript errors");
  lines.push("- All tests pass");
  lines.push("- No placeholder content in generated output");
  lines.push("- Contextual fallbacks instead of bare \"TODO\" markers");
  lines.push("- Backward compatibility maintained");

  return lines.join("\n");
}
