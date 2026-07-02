// ──────────────────────────────────────────────
// deterministicGenerator — Epic 25.2
// Deterministic ProjectDefinition Generator
//
// Implements ProjectDefinitionGenerator using
// rule-based mapping (no LLM calls).
// Internally reuses requirementsToProjectDefinition()
// and enriches with ConversationMemory data +
// ArchitectureAnalysis.suggestedStack.
//
// REFACTORED: Uses the Semantic Extraction Layer
// (requirementsIntelligence) for name extraction.
// No duplicated extraction functions here.
// ──────────────────────────────────────────────

import type { ConversationMemory } from "../models/conversationMemory";
import type { ProjectRequirements } from "../models/projectRequirements";
import type { ArchitectureAnalysis } from "../models/architectureAnalysis";
import type {
  ProjectDefinition,
} from "../types/projectDefinition";
import { defaultProjectDefinition } from "../types/projectDefinition";
import { requirementsToProjectDefinition } from "../lib/requirementsToProjectDefinition";
import type {
  GeneratorInput,
  GeneratorResult,
  GeneratorConfig,
  GeneratorWarning,
  GeneratorMetadata,
  ProjectDefinitionGenerator,
} from "./generatorTypes";
import {
  DEFAULT_GENERATOR_CONFIG,
  GENERATOR_VERSION,
} from "./generatorTypes";
import type { CanonicalExtractionResult } from "../canonical/types";
import { extractProjectName } from "../intelligence/requirementsIntelligence";
import { extractCanonicalWithLlm } from "../canonical/llmExtractor";
import { loadAiAssistMode, loadActiveEndpointId, loadEndpoints } from "../ai/settings";

// ── Generator Version ─────────────────────────

const DETERMINISTIC_VERSION = `${GENERATOR_VERSION}-deterministic`;

// ── Stale defaults — treat these as empty ─────

const STALE_DEFAULTS = [
  "my project",
  "myproject",
  "new saas project",
  "new software project",
  "currently, saasav",
  "saasav",
  "a myproject application",
  "as a user, i want to use myproject",
];

function isStaleDefault(value: string): boolean {
  const lower = value.toLowerCase().trim();
  return STALE_DEFAULTS.some((d) => lower === d || lower.startsWith(d));
}

/**
 * Check if a string looks like a tech-stack listing.
 */
function isTechStackListing(text: string): boolean {
  const lower = text.toLowerCase();
  const techHeaders = /^(frontend|backend|database|infrastructure|tech stack|technologies|tools|frameworks|languages|testing|devops|deployment):/im;
  if (techHeaders.test(lower)) return true;

  const techKeywords = [
    "react", "vue", "angular", "svelte", "typescript", "javascript",
    "python", "java", "go", "rust", "node", "deno", "bun",
    "postgresql", "postgres", "mysql", "mongodb", "redis",
    "docker", "kubernetes", "aws", "azure", "gcp",
    "tailwind", "bootstrap", "graphql", "rest", "grpc",
  ];
  let matchCount = 0;
  for (const kw of techKeywords) {
    if (lower.includes(kw)) matchCount++;
    if (matchCount >= 3) return true;
  }
  return false;
}

/**
 * Clean a string to be suitable as a project name.
 */
function cleanProjectName(raw: string): string {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^(a |an |the |we should |i want to |let's |create |build |make |develop |ik wil |we gaan |laten we |we moeten |het is |dit is )/i, "");
  cleaned = cleaned.replace(/[.,;!?]+$/, "").trim();
  if (cleaned.length > 50) {
    const truncated = cleaned.slice(0, 50);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > 20) {
      cleaned = truncated.slice(0, lastSpace);
    } else {
      cleaned = truncated;
    }
  }
  return cleaned.trim();
}

/**
 * Known contamination patterns — reject names that look like
 * problem statements, tech stack listings, or tool names.
 */
const NAME_CONTAMINATION_PATTERNS = [
  /^teams gebruiken/i,
  /^frontend:/i,
  /^backend:/i,
  /^database:/i,
  /^moet /i,
  /^github/i,
  /^jira/i,
  /^slack/i,
  /^notion/i,
  /^react/i,
  /^typescript/i,
  /^node/i,
  /^python/i,
  /^docker/i,
  /^aws/i,
];

function isContaminatedName(value: string): boolean {
  const lower = value.toLowerCase().trim();
  return NAME_CONTAMINATION_PATTERNS.some((p) => p.test(lower));
}

// ── DeterministicGenerator ────────────────────

/**
 * Deterministic ProjectDefinition Generator.
 *
 * Uses rule-based mapping (no LLM) to produce a ProjectDefinition
 * from GeneratorInput. Internally delegates to
 * requirementsToProjectDefinition() and enriches with:
 *   - ConversationMemory-derived name/description
 *   - ArchitectureAnalysis.suggestedStack
 *   - Warnings for missing fields
 */
export class DeterministicGenerator implements ProjectDefinitionGenerator {
  /**
   * Generate a ProjectDefinition from workspace state.
   *
   * @param input  - All available context (memory, requirements, architecture)
   * @param config - Generator configuration (strategy must be "deterministic")
   * @returns A GeneratorResult with the generated ProjectDefinition
   */
  async generate(
    input: GeneratorInput,
    _config: GeneratorConfig,
  ): Promise<GeneratorResult> {
    const startedAt = new Date().toISOString();
    const warnings: GeneratorWarning[] = [];

    // ── Step 0: AI Assist — try LLM canonical extraction in hybrid mode ──
    let canonicalForBridge: CanonicalExtractionResult | undefined;
    const aiAssistMode = loadAiAssistMode();
    if (aiAssistMode === "hybrid") {
      const endpoints = loadEndpoints();
      const activeEndpointId = loadActiveEndpointId();
      const activeEndpoint = endpoints.find((e) => e.id === activeEndpointId);
      const providerId = activeEndpoint?.providerId;

      if (providerId) {
        // Build raw text from requirements for LLM extraction
        const rawText = [
          input.requirements.vision,
          ...input.requirements.solutionIdeas,
          ...input.requirements.targetUsers,
          ...input.requirements.goals,
          input.requirements.mvpScope,
        ]
          .filter(Boolean)
          .join("\n");

        if (rawText.trim()) {
          const canonicalResult = await extractCanonicalWithLlm(rawText, providerId, input.requirements.preferredTech);

          if (canonicalResult.result) {
            // Always pass the canonical result to the bridge, even if fallback was used.
            // The canonical result contains domainLabel, domainCategory, techStack, roadmap
            // from either LLM or deterministic extraction — both are better than the old path.
            canonicalForBridge = canonicalResult.result;

            if (!canonicalResult.usedFallback) {
              warnings.push({
                field: "ai-assist",
                severity: "info",
                message: `AI Assist (${providerId}) enriched the extraction — ${canonicalResult.result.overallConfidence || 0}% confidence`,
              });
            } else {
              warnings.push({
                field: "ai-assist",
                severity: "info",
                message: `AI Assist (${providerId}) fell back to deterministic: ${canonicalResult.error || "unknown"}`,
              });
            }
          }
        }
      }
    }

    // ── Step 1: Base definition via existing bridge ──
    // Pass canonical result if available — this enables LLM-first semantic extraction
    // for domainLabel, domainCategory, techStack, roadmap, and other fields.
    const base = requirementsToProjectDefinition(
      input.requirements,
      input.architecture,
      input.existing,
      canonicalForBridge,
    );


    // ── Step 2: Enrich with ConversationMemory ──
    const enriched = this.#enrichFromMemory(
      base,
      input.memory,
      input.requirements,
      warnings,
      canonicalForBridge,
    );

    // ── Step 3: Enrich architecture from analysis ──
    this.#enrichArchitecture(enriched, input.architecture, warnings, canonicalForBridge);

    // ── Acceptance check: domainLabel must not change in Step 2 or Step 3 ──
    if (canonicalForBridge?.identity?.domainLabel) {
      const finalDomainLabel = enriched.architecture?.domain?.domainLabel;
      if (finalDomainLabel && finalDomainLabel !== canonicalForBridge.identity.domainLabel) {
        // Revert domainLabel to canonical value — enrichment must not overwrite it
        const d = enriched.architecture.domain;
        enriched.architecture = {
          ...enriched.architecture,
          domain: {
            id: d?.id || canonicalForBridge.identity.domain.id,
            category: d?.category || "software",
            templateId: d?.templateId || canonicalForBridge.identity.domain.id,
            confidence: d?.confidence ?? 0,
            ...d,
            domainLabel: canonicalForBridge.identity.domainLabel,
          },
        };
        warnings.push({
          field: "architecture.domain.domainLabel",
          severity: "warning",
          message: `domainLabel was changed by enrichment — reverted to canonical value: "${canonicalForBridge.identity.domainLabel}"`,
          suggestion: "Verify the domain label is correct in the Review step.",
        });
      }
    }

    // ── Step 4: Validate & collect warnings ──
    const validationWarnings = this.validate(enriched);
    warnings.push(...validationWarnings);

    // ── Step 5: Build metadata ──
    const completedAt = new Date().toISOString();
    const metadata: GeneratorMetadata = {
      startedAt,
      completedAt,
      durationMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
      strategy: aiAssistMode === "hybrid" ? "hybrid" : "deterministic",
      generatorVersion: DETERMINISTIC_VERSION,
    };

    return {
      projectDefinition: enriched,
      documents: [],
      metadata,
      warnings: warnings.map((w) => w.message),
      success: true,
    };
  }

  /**
   * Validate a ProjectDefinition for completeness.
   * Returns warnings for missing or incomplete fields.
   */
  validate(pd: ProjectDefinition): GeneratorWarning[] {
    const warnings: GeneratorWarning[] = [];

    // ── Project ──
    if (!pd.project.name || pd.project.name === defaultProjectDefinition.project.name || isStaleDefault(pd.project.name)) {
      warnings.push({
        field: "project.name",
        severity: "warning",
        message: 'Project name is missing or using default — consider setting a descriptive name.',
        suggestion: 'Use a name that reflects the project purpose (e.g. "TaskFlow API").',
      });
    }
    if (!pd.project.tagline || pd.project.tagline === defaultProjectDefinition.project.tagline) {
      warnings.push({
        field: "project.tagline",
        severity: "info",
        message: 'Project tagline is missing or using default — consider adding a one-liner.',
      });
    }
    if (!pd.project.description) {
      warnings.push({
        field: "project.description",
        severity: "info",
        message: 'Project description is empty — consider adding a brief overview.',
      });
    }

    // ── Product ──
    if (!pd.product.problemStatement) {
      warnings.push({
        field: "product.problemStatement",
        severity: "info",
        message: 'Problem statement is empty — define the problem your project solves.',
      });
    }
    if (!pd.product.solution) {
      warnings.push({
        field: "product.solution",
        severity: "info",
        message: 'Solution description is empty — describe how your project solves the problem.',
      });
    }
    if (pd.product.targetUsers.length === 0) {
      warnings.push({
        field: "product.targetUsers",
        severity: "info",
        message: 'No target users defined — specify who this project is for.',
      });
    }
    if (!pd.product.mvpScope) {
      warnings.push({
        field: "product.mvpScope",
        severity: "info",
        message: 'MVP scope is empty — define what the minimum viable product includes.',
      });
    }

    // ── Tech ──
    if (pd.tech.languages.length === 0 && pd.tech.frameworks.length === 0) {
      warnings.push({
        field: "tech",
        severity: "info",
        message: 'No languages or frameworks specified — the tech stack is incomplete.',
      });
    }

    // ── Architecture ──
    if (!pd.architecture.pattern) {
      warnings.push({
        field: "architecture.pattern",
        severity: "info",
        message: 'Architecture pattern is not specified — consider defining one.',
      });
    }

    // ── Roadmap ──
    if (pd.roadmap.phases.length === 0) {
      warnings.push({
        field: "roadmap.phases",
        severity: "info",
        message: 'No roadmap phases defined — add phases to guide implementation.',
      });
    }

    return warnings;
  }

  /**
   * Get the current generator version.
   */
  getVersion(): string {
    return DETERMINISTIC_VERSION;
  }

  // ── Private helpers ─────────────────────────

  /**
   * Enrich the ProjectDefinition with data from ConversationMemory.
   *
   * Strategy:
   *   1. If the project name is still the default or stale, try to derive from memory
   *   2. If description is empty, use vision from requirements or memory summary
   *   3. Use interview answers to fill product fields where possible
   */
  #enrichFromMemory(
    pd: ProjectDefinition,
    memory: ConversationMemory,
    requirements: ProjectRequirements,
    warnings: GeneratorWarning[],
    canonical?: CanonicalExtractionResult,
  ): ProjectDefinition {
    const result = { ...pd };
    result.project = { ...result.project };
    result.product = { ...result.product };

    // ── Project name ──
    // If still default, stale, or empty, derive from memory or requirements
    if (
      !result.project.name ||
      result.project.name === defaultProjectDefinition.project.name ||
      isStaleDefault(result.project.name)
    ) {
      const derived = this.#deriveNameFromMemory(memory, requirements);
      if (derived) {
        result.project.name = derived;
      } else {
        result.project.name = "New Software Project";
        warnings.push({
          field: "project.name",
          severity: "warning",
          message: 'Could not derive project name from interview data — using "New Software Project".',
          suggestion: 'Edit the project name in the Review step.',
        });
      }
    }

    // ── Description ──
    // Skip enrichment if canonical domain/tagline is present — LLM knows best
    const hasCanonicalDomain = canonical?.identity?.domainLabel && canonical.identity.domainLabel !== canonical.identity.domain.id;
    if (!hasCanonicalDomain) {
      if (!result.project.description || isStaleDefault(result.project.description)) {
        const desc = this.#deriveDescriptionFromMemory(memory, requirements);
        if (desc) {
          result.project.description = desc;
        }
      }
    }

    // ── Tagline ──
    // Skip enrichment if canonical tagline is present — canonical wins
    const hasCanonicalTagline = canonical?.identity?.tagline && canonical.identity.tagline !== `${canonical.identity.projectName} — ${canonical.identity.projectType}`;
    if (!hasCanonicalTagline) {
      if (
        !result.project.tagline ||
        result.project.tagline === defaultProjectDefinition.project.tagline ||
        isStaleDefault(result.project.tagline)
      ) {
        const tagline = this.#deriveTaglineFromMemory(requirements);
        if (tagline) {
          result.project.tagline = tagline;
        }
      }
    }

    // ── Product: user stories from decisions/assumptions ──
    if (result.product.userStories.length === 0) {
      const stories = this.#deriveUserStoriesFromMemory(memory);
      if (stories.length > 0) {
        result.product.userStories = stories;
      }
    }

    return result;
  }

  /**
   * Derive a project name from ConversationMemory.
   *
   * STRICT priority — project.name may ONLY come from:
   *   1. Explicit name patterns in user messages (genaamd/called/named)
   *   2. Interview question answer about project name (topic "project-name")
   *   3. requirements.projectName
   *   4. null (caller handles fallback to "New Software Project")
   *
   * NEVER from: vision, problems, solutionIdeas, tech stack, etc.
   */
  #deriveNameFromMemory(
    memory: ConversationMemory,
    requirements: ProjectRequirements,
  ): string | null {
    // 1. Scan ALL user messages for explicit name patterns using intelligence layer
    for (const msg of memory.messages) {
      if (msg.role === "user" && msg.content.trim().length > 0) {
        const explicit = extractProjectName(msg.content);
        if (explicit && !isStaleDefault(explicit) && !isContaminatedName(explicit)) {
          return explicit;
        }
      }
    }

    // 2. Look for an interview question with topic "project-name"
    const nameQuestion = memory.questions.find(
      (q) =>
        q.answer &&
        q.answer.trim().length > 0 &&
        !q.skipped &&
        q.topic === "project-name",
    );
    if (nameQuestion?.answer?.trim()) {
      const name = nameQuestion.answer.trim();
      const firstLine = name.split("\n")[0].trim();
      if (firstLine.length > 0 && firstLine.length <= 60 && !isStaleDefault(firstLine) && !isContaminatedName(firstLine)) {
        return firstLine;
      }
    }

    // 3. Try requirements.projectName
    if (requirements.projectName.trim() && !isStaleDefault(requirements.projectName)) {
      const cleaned = cleanProjectName(requirements.projectName);
      if (cleaned && !isContaminatedName(cleaned)) return cleaned;
    }

    // 4. No vision fallback — never guess from vision/problem/solution/tech
    return null;
  }

  /**
   * Derive a description from ConversationMemory.
   * Must be clean prose, 2-3 sentences max.
   * Must NOT contain internal labels like "vision:", "target-users:", etc.
   * Never uses tech stack, integrations, constraints, risks, or AI workflow.
   */
  #deriveDescriptionFromMemory(
    memory: ConversationMemory,
    requirements: ProjectRequirements,
  ): string | null {
    // 1. Use vision from requirements (if not tech stack) — clean prose
    const vision = requirements.vision.trim();
    if (vision && !isTechStackListing(vision)) {
      return vision.replace(/ +/g, " ").trim();
    }

    // 2. Build clean prose from solution + target users + goals
    //    Never use "Problem:", "Goals:", "Solution:" labels
    const parts: string[] = [];
    if (requirements.solutionIdeas.length > 0) {
      parts.push(requirements.solutionIdeas.join(". "));
    }
    if (requirements.targetUsers.length > 0) {
      parts.push("The target audience includes " + requirements.targetUsers.join(", ") + ".");
    }
    if (requirements.goals.length > 0) {
      parts.push(requirements.goals.join(". "));
    }
    if (parts.length > 0) {
      return parts
        .join(" ")
        .replace(/ +/g, " ")
        .replace(/ ,/g, ",")
        .replace(/ \./g, ".")
        .replace(/\baI\b/g, "AI")
        .trim();
    }

    // 3. Fallback: use last user message (if not tech stack)
    const userMessages = memory.messages.filter((m) => m.role === "user");
    if (userMessages.length > 0) {
      const last = userMessages[userMessages.length - 1].content.trim();
      if (last.length > 0 && !isTechStackListing(last)) {
        return last.length > 500 ? last.slice(0, 500) + "…" : last;
      }
    }

    return null;
  }

  /**
   * Derive a tagline from ConversationMemory.
   * Never uses problems, tech stack, integrations, constraints, risks, or AI workflow.
   *
   * Priority:
   *   1. Synthesize from solution + target users (project-specific, avoids duplication with description)
   *   2. First sentence of vision (concise summary)
   *   3. First goal
   *   4. Fallback: "AI-ready software project"
   *
   * Rules:
   *   - Max 80 characters
   *   - No ellipsis — truncate cleanly at word boundary
   *   - Domain-specific pattern: "<solution> for <target>" (English)
   */
  #deriveTaglineFromMemory(
    requirements: ProjectRequirements,
  ): string | null {
    const MAX_TAGLINE_LENGTH = 80;

    /**
     * Truncate a string at a word boundary without ellipsis.
     */
    const truncateClean = (text: string): string => {
      if (text.length <= MAX_TAGLINE_LENGTH) return text;
      const truncated = text.slice(0, MAX_TAGLINE_LENGTH);
      const lastSpace = truncated.lastIndexOf(" ");
      if (lastSpace > MAX_TAGLINE_LENGTH * 0.5) {
        return truncated.slice(0, lastSpace).trim();
      }
      return truncated.trim();
    };

    // 1. Synthesize from solution + target users (most project-specific)
    //    Pattern: "<solution> for <target>" (English)
    if (requirements.solutionIdeas.length > 0 && requirements.targetUsers.length > 0) {
      const solution = requirements.solutionIdeas[0].trim();
      const users = requirements.targetUsers[0].trim();
      const tagline = [solution, "for", users]
        .join(" ")
        .replace(/ +/g, " ")
        .replace(/ ,/g, ",")
        .replace(/ \./g, ".")
        .replace(/\baI\b/g, "AI")
        .trim();
      if (tagline.length > 0) {
        return truncateClean(tagline);
      }
    }

    // 2. Use first solution idea
    if (requirements.solutionIdeas.length > 0) {
      const s = requirements.solutionIdeas[0].trim();
      if (s.length > 0) {
        return truncateClean(s);
      }
    }

    // 3. Use first sentence of vision (if not tech stack)
    const vision = requirements.vision.trim();
    if (vision && !isTechStackListing(vision)) {
      const firstSentence = vision.split(/[.!?]/)[0].trim();
      if (firstSentence.length > 0) {
        return truncateClean(firstSentence);
      }
    }

    // 4. Use first goal
    if (requirements.goals.length > 0) {
      const g = requirements.goals[0].trim();
      if (g.length > 0) {
        return truncateClean(g);
      }
    }

    // 5. Fallback — never use problems/tech/constraints as tagline
    return "AI-ready software project";
  }


  /**
   * Derive user stories from memory decisions and assumptions.
   *
   * Rules:
   *   - Max 5 stories
   *   - Clean capitalisation: only lowercase the first character
   *   - Fix "aI" → "AI" in output
   *   - Skip empty descriptions
   */
  #deriveUserStoriesFromMemory(memory: ConversationMemory): string[] {
    const stories: string[] = [];

    for (const decision of memory.decisions) {
      if (stories.length >= 5) break;
      const desc = decision.description?.trim();
      if (desc) {
        const story = `As a user, I want ${desc.charAt(0).toLowerCase()}${desc.slice(1)}`;
        stories.push(story.replace(/\baI\b/g, "AI"));
      }
    }

    for (const assumption of memory.assumptions) {
      if (stories.length >= 5) break;
      const desc = assumption.description?.trim();
      if (desc) {
        const story = `As a user, I want ${desc.charAt(0).toLowerCase()}${desc.slice(1)}`;
        stories.push(story.replace(/\baI\b/g, "AI"));
      }
    }

    return stories;
  }

  /**
   * Enrich architecture section from ArchitectureAnalysis.
   */
  #enrichArchitecture(
    pd: ProjectDefinition,
    analysis: ArchitectureAnalysis | undefined,
    _warnings: GeneratorWarning[],
    canonical?: CanonicalExtractionResult,
  ): void {
    if (!analysis) return;

    // ── Canonical guard ──
    // If canonical architecture fields are present, never overwrite them.
    // Only fill fields that are truly empty.
    const hasCanonicalPattern = canonical?.architecture?.pattern && canonical.architecture.pattern !== pd.architecture.pattern;
    const hasCanonicalDataFlow = canonical?.architecture?.dataFlow && canonical.architecture.dataFlow !== pd.architecture.dataFlow;
    const hasCanonicalComponentTree = canonical?.architecture?.componentTree && canonical.architecture.componentTree !== pd.architecture.componentTree;

    // Architecture pattern from analysis
    if (analysis.suggestedArchitecture && !pd.architecture.pattern && !hasCanonicalPattern) {
      pd.architecture = {
        ...pd.architecture,
        pattern: analysis.suggestedArchitecture,
      };
    }

    // Data flow from technical analysis
    if (analysis.technicalAnalysis?.dataModel && !pd.architecture.dataFlow && !hasCanonicalDataFlow) {
      pd.architecture = {
        ...pd.architecture,
        dataFlow: analysis.technicalAnalysis.dataModel,
      };
    }

    // Component tree hint from functional analysis
    if (
      analysis.functionalAnalysis?.coreFeatures.length > 0 &&
      !pd.architecture.componentTree &&
      !hasCanonicalComponentTree
    ) {
      pd.architecture = {
        ...pd.architecture,
        componentTree: analysis.functionalAnalysis.coreFeatures
          .map((f) => `- ${f}`)
          .join("\n"),
      };
    }

    // Directory structure hint from suggested stack
    if (analysis.suggestedStack?.frontend && !pd.architecture.directoryStructure) {
      const stack = analysis.suggestedStack;
      const parts: string[] = ["src/"];
      if (stack.frontend) parts.push(`  components/    # ${stack.frontend}`);
      if (stack.backend) parts.push(`  api/           # ${stack.backend}`);
      if (stack.database) parts.push(`  db/            # ${stack.database}`);
      if (stack.testing) parts.push(`  tests/         # ${stack.testing}`);
      pd.architecture = {
        ...pd.architecture,
        directoryStructure: parts.join("\n"),
      };
    }
  }
}

// ── Convenience wrapper ───────────────────────

/**
 * Convenience wrapper around DeterministicGenerator.
 *
 * One-shot generation with sensible defaults.
 *
 * @param input  - Generator input (memory, requirements, architecture)
 * @param config - Optional config overrides
 * @returns A GeneratorResult
 */
export async function deterministicGenerate(
  input: GeneratorInput,
  config?: Partial<GeneratorConfig>,
): Promise<GeneratorResult> {
  const generator = new DeterministicGenerator();
  const resolvedConfig: GeneratorConfig = {
    ...DEFAULT_GENERATOR_CONFIG,
    ...config,
    strategy: "deterministic",
  };
  return generator.generate(input, resolvedConfig);
}
