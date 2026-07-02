// ──────────────────────────────────────────────
// ArchitectAgent — Epic 24.2
// Prompt templates for the AI Architect Agent.
//
// The Architect Agent uses these prompts to
// translate ProjectRequirements into a structured
// ArchitectureAnalysis. The system prompt puts
// the LLM in the role of a senior software
// architect who reviews requirements, detects
// risks, identifies trade-offs, flags missing
// info, and provides stack advice.
//
// Key design decisions:
// - The LLM should output valid JSON matching
//   the ArchitectureAnalysis schema
// - The LLM should be critical but constructive
// - Missing information should be flagged as
//   unknowns rather than assumed
// - Risks should be concrete and actionable
// ──────────────────────────────────────────────

import type { ProjectRequirements } from "../../models/projectRequirements";
import type { ConversationMemory } from "../../models/conversationMemory";
import type { ArchitectureAnalysis } from "../../models/architectureAnalysis";
import type { ProjectDefinition, Phase, Task } from "../../types/projectDefinition";

/**
 * System prompt for the Architect Agent.
 *
 * This prompt instructs the LLM to act as a
 * senior software architect who performs a
 * pre-build architectural review.
 */
export const SYSTEM_PROMPT = `You are a senior software architect reviewing a project before development begins.

Your role is to analyse the provided project requirements and produce a structured architectural assessment. Be critical but constructive — this is a pre-build review, not a sales pitch.

## Your responsibilities

1. **Requirements analysis** — Assess completeness, consistency, and feasibility of the requirements.
2. **Risk detection** — Identify concrete technical, architectural, timeline, and scalability risks. Be specific — "risk of vendor lock-in with X" not "some risks may exist".
3. **Trade-off identification** — Where there are multiple valid approaches, document the options and recommend one with rationale.
4. **Missing information** — Flag anything that is unclear, ambiguous, or absent. These become "unknowns" that need resolution before building.
5. **Stack advice** — Recommend a technology stack based on the requirements. Consider the project's domain, scale, team expertise, and constraints.
6. **Architecture recommendation** — Suggest a high-level architecture pattern and explain why it fits.

## Output format

You MUST respond with valid JSON only. No markdown, no code fences, no preamble, no explanation outside the JSON. The JSON must match this exact structure:

{
  "executiveSummary": "string — 2-3 sentence high-level summary",
  "overallScore": "number — 0-100 readiness/quality score",
  "functionalAnalysis": {
    "coreFeatures": ["string — list of core features the system must support"],
    "userFlows": ["string — key user journeys"],
    "edgeCases": ["string — important edge cases to handle"],
    "scalabilityConcerns": ["string — scalability requirements or concerns"]
  },
  "technicalAnalysis": {
    "architecturePattern": "string — recommended pattern (e.g. Feature-Sliced, Clean Architecture, etc.)",
    "dataModel": "string — data model notes",
    "apiDesign": "string — API design notes",
    "security": "string — security considerations",
    "performance": "string — performance considerations",
    "deployment": "string — deployment strategy"
  },
  "risks": [
    {
      "id": "string — unique id like risk-1",
      "category": "string — e.g. security, scalability, complexity",
      "description": "string — what the risk is",
      "impact": "low|medium|high|critical",
      "likelihood": "low|medium|high",
      "mitigation": "string — suggested mitigation",
      "status": "open|mitigated|accepted"
    }
  ],
  "recommendations": [
    {
      "id": "string — unique id like rec-1",
      "category": "string — e.g. stack, architecture, process",
      "priority": "essential|recommended|optional",
      "description": "string — what the architect recommends",
      "rationale": "string — why this recommendation is made",
      "effort": "low|medium|high"
    }
  ],
  "tradeoffs": [
    {
      "id": "string — unique id like tradeoff-1",
      "decision": "string — what decision this trade-off is about",
      "optionA": "string — first option",
      "optionB": "string — second option",
      "chosen": "a|b|neither",
      "rationale": "string — why this choice was made"
    }
  ],
  "unknowns": ["string — open questions that need resolution"],
  "suggestedStack": {
    "frontend": "string",
    "backend": "string",
    "database": "string",
    "infrastructure": "string",
    "ai": "string",
    "testing": "string",
    "monitoring": "string"
  },
  "suggestedArchitecture": "string — high-level architecture description",
  "estimatedComplexity": "low|medium|high|very-high",
  "estimatedTimeline": "string — free-text estimate e.g. 2-3 months",
  "confidence": "number — 0-100 confidence in this analysis"
}

## Rules

1. If requirements are sparse or incomplete, set a low overallScore, flag the gaps in unknowns, and still provide best-effort analysis. Do NOT refuse to analyse.
2. Be specific in risk descriptions — vague risks are not useful.
3. Every recommendation must have a clear rationale.
4. Trade-offs should reflect real architectural decisions, not trivial choices.
5. The estimatedComplexity and estimatedTimeline should reflect the full project, not just the MVP.
6. If you cannot determine a field, use a reasonable default or empty value — never omit required fields.`;

/**
 * Build a summary of the conversation history from memory.
 * Uses "ConversationSummary + Latest user message + Structured requirements" pattern.
 *
 * @param memory - The conversation memory
 * @param latestUserMessage - Optional latest raw user message for immediate context
 * @returns A formatted summary string, or empty if no memory provided
 */
export function buildConversationSummary(
  memory?: ConversationMemory,
  latestUserMessage?: string,
): string {
  if (!memory && !latestUserMessage) return "";

  const parts: string[] = [];

  // 1. Latest user message (most immediate context first)
  if (latestUserMessage?.trim()) {
    parts.push("## Latest User Message");
    parts.push(latestUserMessage.trim());
    parts.push("");
  }

  if (!memory) return parts.join("\n");

  // 2. Answered questions (structured summary)
  const answeredQuestions = memory.questions.filter(
    (q) => q.answer && q.answer.trim().length > 0 && !q.skipped,
  );

  if (answeredQuestions.length > 0) {
    parts.push("## Answered Questions");
    answeredQuestions.forEach((q) => {
      parts.push(`Q (${q.topic}): ${q.question}`);
      parts.push(`A: ${q.answer}`);
      parts.push("");
    });
  }

  // 3. Decisions
  if (memory.decisions.length > 0) {
    parts.push("## Decisions Made");
    memory.decisions.forEach((d) => {
      parts.push(`- ${d.description} (rationale: ${d.rationale})`);
    });
    parts.push("");
  }

  // 4. Validated assumptions
  if (memory.assumptions.length > 0) {
    const validated = memory.assumptions.filter((a) => a.validated);
    if (validated.length > 0) {
      parts.push("## Validated Assumptions");
      validated.forEach((a) => {
        parts.push(`- ${a.description}`);
      });
      parts.push("");
    }
  }

  // 5. Rejected ideas
  if (memory.rejectedIdeas.length > 0) {
    parts.push("## Rejected Ideas");
    memory.rejectedIdeas.forEach((idea) => {
      parts.push(`- ${idea}`);
    });
    parts.push("");
  }

  return parts.join("\n");
}

/**
 * Build a user message that wraps the project requirements
 * (and optional context) for the architect LLM call.
 *
 * Context ordering (primary → supporting):
 * 1. Resolved ProjectDefinition context (richest, most complete view)
 * 2. Raw requirements / interview context (supporting detail)
 * 3. Conversation memory (nuance from discovery)
 *
 * The architect should use the ProjectDefinition as the primary source
 * of truth, and raw requirements only for additional nuance. Empty raw
 * fields must NOT override populated ProjectDefinition fields.
 *
 * @param requirements - The project requirements to analyse
 * @param memory - Optional conversation memory for context
 * @param existingAnalysis - Optional existing analysis for re-analysis
 * @param latestUserMessage - Optional latest raw user message for immediate context
 * @param enrichedDefinition - Optional enriched ProjectDefinition for richer context
 * @returns A user message string for the LLM
 */
export function buildArchitectPrompt(
  requirements: ProjectRequirements,
  memory?: ConversationMemory,
  existingAnalysis?: ArchitectureAnalysis,
  latestUserMessage?: string,
  enrichedDefinition?: ProjectDefinition,
): string {
  const sections: string[] = [];

  // ── 1. Enriched Project Definition (primary context — richest view) ──
  if (enrichedDefinition) {
    sections.push("## Resolved Project Definition");
    sections.push("");
    sections.push("The following is the resolved project definition — the single source of truth. It was derived from raw requirements and represents the most complete and structured view of the project. Use this as your PRIMARY context for analysis.");
    sections.push("");
    sections.push(`Project Name: ${enrichedDefinition.project.name}`);
    sections.push(`Tagline: ${enrichedDefinition.project.tagline}`);
    sections.push(`Description: ${enrichedDefinition.project.description}`);
    sections.push(`Status: ${enrichedDefinition.project.status}`);
    sections.push(`Repository State: ${enrichedDefinition.project.repositoryState}`);
    sections.push("");
    sections.push("### Problem & Solution");
    sections.push(`Problem: ${enrichedDefinition.product.problemStatement || "(not specified)"}`);
    sections.push(`Solution: ${enrichedDefinition.product.solution || "(not specified)"}`);
    sections.push("");
    sections.push("### Target Users");
    if (enrichedDefinition.product.targetUsers.length > 0) {
      enrichedDefinition.product.targetUsers.forEach((user: string) => {
        sections.push(`- ${user}`);
      });
    } else {
      sections.push("(not specified)");
    }
    sections.push("");
    sections.push("### MVP Features");
    if (enrichedDefinition.product.mvpFeatures.length > 0) {
      enrichedDefinition.product.mvpFeatures.forEach((feature: string, i: number) => {
        sections.push(`${i + 1}. ${feature}`);
      });
    } else {
      sections.push("(none specified)");
    }
    sections.push("");
    sections.push("### Technology Stack");
    if (enrichedDefinition.tech.languages.length > 0) {
      sections.push(`Languages: ${enrichedDefinition.tech.languages.join(", ")}`);
    }
    if (enrichedDefinition.tech.frameworks.length > 0) {
      sections.push(`Frameworks: ${enrichedDefinition.tech.frameworks.join(", ")}`);
    }
    if (enrichedDefinition.tech.tools.length > 0) {
      sections.push(`Tools: ${enrichedDefinition.tech.tools.join(", ")}`);
    }
    if (enrichedDefinition.tech.dependencies.length > 0) {
      sections.push(`Dependencies: ${enrichedDefinition.tech.dependencies.join(", ")}`);
    }
    if (enrichedDefinition.tech.constraints.length > 0) {
      sections.push(`Constraints: ${enrichedDefinition.tech.constraints.join(", ")}`);
    }
    sections.push("");
    sections.push("### Architecture");
    sections.push(`Pattern: ${enrichedDefinition.architecture.pattern || "(not specified)"}`);
    if (enrichedDefinition.architecture.componentTree) {
      sections.push("");
      sections.push("Component Tree:");
      const treeLines = enrichedDefinition.architecture.componentTree.split("\n");
      treeLines.forEach((line: string) => {
        sections.push(line);
      });
    }
    if (enrichedDefinition.architecture.dataFlow) {
      sections.push("");
      sections.push(`Data Flow: ${enrichedDefinition.architecture.dataFlow}`);
    }
    sections.push("");
    sections.push("### Roadmap Phases");
    if (enrichedDefinition.roadmap.phases.length > 0) {
      enrichedDefinition.roadmap.phases.forEach((phase: Phase) => {
        sections.push(`- **${phase.title}**: ${phase.tasks.length} tasks`);
        if (phase.tasks.length > 0) {
          phase.tasks.forEach((task: Task) => {
            sections.push(`  - ${task.title}`);
          });
        }
      });
    } else {
      sections.push("(none specified)");
    }
    sections.push("");
    sections.push("### User Stories");
    if (enrichedDefinition.product.userStories.length > 0) {
      enrichedDefinition.product.userStories.forEach((story: string) => {
        sections.push(`- ${story}`);
      });
    } else {
      sections.push("(none specified)");
    }
    sections.push("");
  }

  // ── 2. Raw Project Requirements (supporting context — for nuance only) ──
  sections.push("## Raw Project Requirements");
  sections.push("");
  sections.push("The following are the raw, unprocessed requirements from the discovery interview. Use these for additional nuance, but the Resolved Project Definition above is the authoritative source.");
  sections.push("");
  sections.push(`Project Name: ${requirements.projectName || "(not provided)"}`);
  sections.push(`Vision: ${requirements.vision || "(not provided)"}`);
  sections.push(`Goals: ${requirements.goals.length > 0 ? requirements.goals.join(", ") : "(none specified)"}`);
  sections.push(`Target Users: ${requirements.targetUsers.length > 0 ? requirements.targetUsers.join(", ") : "(not specified)"}`);
  sections.push(`Problems: ${requirements.problems.length > 0 ? requirements.problems.join(", ") : "(not specified)"}`);
  sections.push(`Solution Ideas: ${requirements.solutionIdeas.length > 0 ? requirements.solutionIdeas.join(", ") : "(none)"}`);
  sections.push(`MVP Scope: ${requirements.mvpScope || "(not defined)"}`);
  sections.push(`Integrations: ${requirements.integrations.length > 0 ? requirements.integrations.join(", ") : "(none)"}`);
  sections.push(`Constraints: ${requirements.constraints.length > 0 ? requirements.constraints.join(", ") : "(none)"}`);
  sections.push(`Preferred Tech: ${requirements.preferredTech.length > 0 ? requirements.preferredTech.join(", ") : "(none specified)"}`);
  sections.push(`AI Workflow Target: ${requirements.aiWorkflowTarget || "(not specified)"}`);
  sections.push(`Repository State: ${requirements.repositoryState}`);
  sections.push(`Identified Risks: ${requirements.risks.length > 0 ? requirements.risks.join(", ") : "(none)"}`);
  sections.push(`Unknowns: ${requirements.unknowns.length > 0 ? requirements.unknowns.join(", ") : "(none)"}`);
  sections.push(`Confidence: ${requirements.confidence}`);
  sections.push("");

  // ── 3. Conversation context (nuance from discovery interview) ──
  const conversationSummary = buildConversationSummary(memory, latestUserMessage);
  if (conversationSummary) {
    sections.push("## Conversation Context");
    sections.push("");
    sections.push("The following information was gathered during a discovery interview. Use it for additional nuance and context:");
    sections.push(conversationSummary);
    sections.push("");
  }

  // ── Existing analysis (if re-analysing) ──
  if (existingAnalysis) {
    sections.push("## Existing Architecture Analysis");
    sections.push("");
    sections.push("An existing analysis was provided. Review it and produce an updated analysis:");
    sections.push(`- Previous overall score: ${existingAnalysis.overallScore}`);
    sections.push(`- Previous complexity estimate: ${existingAnalysis.estimatedComplexity}`);
    sections.push(`- Previous timeline estimate: ${existingAnalysis.estimatedTimeline}`);
    sections.push(`- Previous unknowns: ${existingAnalysis.unknowns.length > 0 ? existingAnalysis.unknowns.join("; ") : "(none)"}`);
    sections.push("");
    sections.push("Update the analysis based on any new or changed information. Keep what is still valid, revise what has changed, and add new findings.");
    sections.push("");
  }

  // ── Instruction ──
  sections.push("## Instructions");
  sections.push("");
  sections.push("Analyse the above project information and produce a complete architectural assessment.");
  sections.push("Respond with valid JSON only, matching the schema described in the system prompt.");
  sections.push("");
  sections.push("**IMPORTANT**: The Resolved Project Definition is the PRIMARY source of truth. If it contains populated fields (target users, MVP features, tech stack, problem/solution), use those. Do NOT treat the project as having sparse requirements just because the Raw Project Requirements section shows fallback text — the resolved definition may have derived values even when raw fields appear empty.");
  sections.push("");

  return sections.join("\n");
}
