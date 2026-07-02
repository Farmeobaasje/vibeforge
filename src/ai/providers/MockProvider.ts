// ──────────────────────────────────────────────
// MockProvider — Phase 6.2
// Offline mock die realistische ProjectDefinition
// JSON genereert uit ruwe tekst.
// ──────────────────────────────────────────────

import { type AIProvider } from "../AIProvider";

/**
 * Mock provider — genereert lokaal een realistische
 * ProjectDefinition JSON zonder API key.
 *
 * Bouwt een gestructureerd object op basis van
 * de ruwe input.
 */
export const MockProvider: AIProvider = {
  config: {
    id: "mock",
    label: "Mock (offline, no key needed)",
    requiresApiKey: false,
    capabilities: ["streaming"],
  },

  async listModels(): Promise<Array<{ id: string; name: string }>> {
    return [{ id: "mock", name: "Mock Model" }];
  },

  async testConnection(): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    return { success: true, message: "Mock provider is always available.", latencyMs: 0 };
  },

  async generate(rawIdea: string): Promise<string> {
    // Simuleer een korte denkpauze (300-800ms)
    const delay = 300 + Math.random() * 500;
    await new Promise((r) => setTimeout(r, delay));

    // Valideer input
    const trimmed = rawIdea.trim();
    if (!trimmed) {
      throw new Error("Input is empty. Please describe your project idea.");
    }

    // Bouw een realistische ProjectDefinition op basis van de input
    const lines = trimmed.split("\n").filter((l) => l.trim());
    const firstLine = lines[0].trim();

    // Genereer een projectnaam uit de eerste regel
    const projectName = extractProjectName(firstLine);

    return JSON.stringify(
      {
        project: {
          name: projectName,
          tagline: extractTagline(firstLine),
          version: "0.1.0",
          description: trimmed.length > 500 ? trimmed.slice(0, 500) + "..." : trimmed,
          status: "idea",
        },
        product: {
          targetUsers: extractTargetUsers(trimmed),
          problemStatement: extractProblem(trimmed),
          solution: `A ${projectName} application that addresses the described needs.`,
          userStories: extractUserStories(projectName, trimmed),
          mvpScope: "Core functionality as described in the project idea.",
        },
        tech: {
          languages: ["TypeScript"],
          frameworks: ["React", "Vite"],
          tools: ["Git", "VS Code"],
          dependencies: [],
          constraints: ["Must work as a local-first application"],
        },
        architecture: {
          pattern: "Component-based architecture",
          directoryStructure: "src/components/, src/lib/, src/types/, src/hooks/",
          componentTree: "App → Dashboard → [IdeaSection, JsonSection, ReviewSection, ExportSection]",
          dataFlow: "User input → State hook → localStorage → Generated output",
        },
        roadmap: {
          phases: [
            {
              id: "phase-1",
              title: "Foundation",
              tasks: [
                { id: "1.1", title: "Set up project scaffold", status: "pending" },
                { id: "1.2", title: "Implement core functionality", status: "pending" },
                { id: "1.3", title: "Add tests and documentation", status: "pending" },
              ],
            },
            {
              id: "phase-2",
              title: "Features",
              tasks: [
                { id: "2.1", title: "Implement main features", status: "pending" },
                { id: "2.2", title: "Polish UI and UX", status: "pending" },
              ],
            },
          ],
          activePhaseId: "phase-1",
        },
        memory: {
          files: [
            { path: "memory-bank/projectbrief.md", description: "Core requirements and goals", required: true },
            { path: "memory-bank/productContext.md", description: "Why this exists and how it should work", required: true },
            { path: "memory-bank/activeContext.md", description: "Current focus and recent changes", required: true },
            { path: "memory-bank/systemPatterns.md", description: "Architecture and technical decisions", required: true },
            { path: "memory-bank/techContext.md", description: "Technologies and setup", required: true },
            { path: "memory-bank/progress.md", description: "What works and what's left", required: true },
          ],
          updateCadence: "After every session and at milestones",
          patterns: [],
        },
        agents: {
          agents: [
            { role: "orchestrator", model: "gpt-4o", promptTemplate: "You are an orchestrator. Convert raw project ideas into a structured ProjectDefinition JSON." },
            { role: "plan", model: "claude-sonnet-4-20250514", promptTemplate: "You are a Cline Plan agent. Read the bootstrap prompt and present a file-by-file implementation plan." },
            { role: "act", model: "claude-sonnet-4-20250514", promptTemplate: "You are a Cline Act agent. Write the exact files specified in the plan." },
          ],
        },
        quality: {
          codeStyle: "TypeScript strict mode, functional components, descriptive variable names",
          testingStrategy: "Manual review in MVP; automated tests planned",
          validationRules: [
            "All inputs must be validated before processing",
            "Errors must show clear user-friendly messages",
            "Empty states must have useful fallbacks",
          ],
          fallbackBehavior: "Missing data shows helpful hints instead of crashing",
        },
        options: {
          compression: false,
          orchestratorModel: "gpt-4o",
          focusChain: true,
          extraDocs: [],
        },
      },
      null,
      2,
    );
  },
};

// ── Helpers ───────────────────────────────────

function extractProjectName(firstLine: string): string {
  // Probeer een projectnaam te extraheren uit "I want to build a/an X" of "Build a/an X"
  const buildMatch = firstLine.match(
    /(?:build|create|make|develop)\s+(?:a|an)\s+([A-Za-z0-9\s-]+?)(?:\s+(?:app|tool|cli|website|platform|dashboard|api|service|library|framework))?/i,
  );
  if (buildMatch) {
    const name = buildMatch[1].trim();
    if (name.length > 3 && name.length < 40) {
      return toPascalCase(name);
    }
  }

  // Fallback: gebruik eerste 2-3 woorden
  const words = firstLine.split(/\s+/).slice(0, 3);
  if (words.length >= 2) {
    return toPascalCase(words.join(" "));
  }

  return "MyProject";
}

function extractTagline(firstLine: string): string {
  if (firstLine.length <= 120) return firstLine;
  return firstLine.slice(0, 117) + "...";
}

function extractProblem(text: string): string {
  // Zoek naar probleemindicatoren
  const problemMatch = text.match(
    /(?:problem|issue|challenge|difficult|hard|pain|frustrat|manual|slow|error-prone)[^.]*\./i,
  );
  if (problemMatch) return problemMatch[0].trim();

  // Fallback: eerste zin
  const firstSentence = text.split(/[.!?]/)[0]?.trim();
  if (firstSentence) return `Currently, ${firstSentence.toLowerCase()}`;

  return "A need for a better solution has been identified.";
}

function extractTargetUsers(text: string): string[] {
  const userPatterns = [
    /(?:for|target|aimed at)\s+([A-Za-z\s,]+?)(?:\.|,|\n|who|that)/i,
    /(?:users?|developers?|designers?|teams?|companies?)\s+(?:who|that|want|need|can)/i,
  ];

  for (const pattern of userPatterns) {
    const match = text.match(pattern);
    if (match) {
      const users = match[1]
        ? match[1].split(/[,/]/).map((s) => s.trim()).filter(Boolean)
        : ["developers"];
      return users.length > 0 ? users : ["developers"];
    }
  }

  return ["developers"];
}

function extractUserStories(projectName: string, text: string): string[] {
  const stories: string[] = [];

  // Zoek naar "as a" patronen
  const asAMatches = text.matchAll(/[A-Za-z\s,]+as\s+a\s+[^.]*\./gi);
  for (const match of asAMatches) {
    const story = match[0].trim();
    if (story.length > 10 && story.length < 200) {
      stories.push(story);
    }
  }

  if (stories.length === 0) {
    stories.push(`As a user, I want to use ${projectName} to accomplish my goals.`);
    stories.push(`As a developer, I want ${projectName} to be easy to set up and configure.`);
  }

  return stories.slice(0, 5);
}

function toPascalCase(str: string): string {
  return str
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}
