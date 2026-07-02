// ──────────────────────────────────────────────
// requirementsIntelligence — Semantic Extraction
// Layer core module.
//
// Converts raw conversational text into
// StructuredRequirements — a normalised,
// validated, scored intermediate representation.
//
// This is the SINGLE source of extraction logic.
// All heuristic extraction lives here, not in
// requirementsToProjectDefinition or elsewhere.
// ──────────────────────────────────────────────

import type { Phase } from "../types/projectDefinition";
import type {
  StructuredRequirements,
  FieldConfidence,
  InputLanguage,
} from "./types";
import {
  detectProjectType,
  detectLanguage,
} from "./domainClassifier";
import { normalizeArray } from "../lib/normalize";
import {
  generateSemanticTagline,
  generateSemanticRoadmap,
  deriveSemanticComponentTree,
  deriveSemanticDataFlow,
  deriveArchitecturePattern,
  buildDomainModel,
  calculateSemanticConfidence,
  validateSemanticOutput,
  detectDomainFromText,
} from "../semantic/index";

// ──────────────────────────────────────────────
// 1. PROJECT NAME EXTRACTION
// ──────────────────────────────────────────────

/**
 * Dutch words that should NEVER be accepted as a project name.
 */
const DUTCH_REJECT_WORDS = new Set([
  "afgeronde", "nieuwe", "goede", "mooie", "simpele", "complexe",
  "volledige", "gedeelde", "beperkte", "open", "veilige", "slimme",
  "snelle", "flexibele", "schaalbare", "modulaire", "intelligente",
  "geïntegreerde", "toekomstige", "lopende", "volgende", "vorige",
  "bestaande", "eigen", "andere", "verschillende", "meerdere",
  "enkele", "bepaalde", "dergelijke", "zogenaamde",
  "professionele", "moderne", "efficiënte", "gebruiksvriendelijke",
  "toegankelijke", "betrouwbare", "duurzame", "schaalbare",
  "interactieve", "dynamische", "statische", "responsive",
  "complete", "integrale", "optimale", "juiste",
  "platform", "website", "systeem", "applicatie", "tool", "app",
  "dashboard", "portal", "hub", "service", "omgeving",
]);

function isDutchRejectWord(word: string): boolean {
  return DUTCH_REJECT_WORDS.has(word.toLowerCase().trim());
}

/**
 * Known contamination patterns — reject names that look like
 * problem statements, tech stack listings, or tool names.
 */
const CONTAMINATION_PATTERNS = [
  /^teams gebruiken/i,
  /^frontend:/i, /^backend:/i, /^database:/i,
  /^moet /i,
  /^github/i, /^jira/i, /^slack/i, /^notion/i,
  /^react/i, /^typescript/i, /^node/i, /^python/i,
  /^docker/i, /^aws/i,
];

function isContaminatedName(value: string): boolean {
  const lower = value.toLowerCase().trim();
  return CONTAMINATION_PATTERNS.some((p) => p.test(lower));
}

/**
 * Extract project name from raw text using ALL known patterns.
 *
 * Patterns (in priority order):
 *   1. Quoted names: "AquaFix Plumbing"
 *   2. "Ik wil X bouwen/maken/ontwikkelen" (Dutch)
 *   3. "I want to build/create/make/develop X" (English) — including comma after name
 *   4. "project heet X" / "project naam is X" (Dutch)
 *   5. "de naam is X" / "de naam wordt X" (Dutch)
 *   6. "genaamd X" (Dutch)
 *   7. "called X" / "named X" (English)
 *   8. "X wordt een ..." (Dutch)
 *   9. "X is een ..." (Dutch)
 *  10. "X helpt ..." (Dutch)
 *  11. "Build X" / "Create X" / "Develop X" (English, sentence start)
 *  12. "We are building X" / "We are creating X" / "We are developing X" (English, plural)
 *  13. "We zijn X aan het bouwen" / "We gaan X bouwen" (Dutch, plural)
 */
export function extractProjectName(text: string): string | null {
  if (!text || text.trim().length === 0) return null;

  // ── Pattern 1: Quoted name (highest confidence) ──
  // Double quotes only — single quotes cause false matches with contractions like "it's"
  const dqMatch = text.match(/["""]([A-Za-z0-9_\-\s]{2,60}?)["""]/);
  if (dqMatch) {
    const name = dqMatch[1].trim();
    if (name.length >= 2 && !isDutchRejectWord(name) && !isContaminatedName(name)) return name;
  }
  // Single-quoted names: require word boundary before the opening quote
  const sqMatch = text.match(/(?<=\s|^|,)[']([A-Za-z0-9_\-\s]{2,60}?)['](?=\s|[.,;!?]|$)/);
  if (sqMatch) {
    const name = sqMatch[1].trim();
    if (name.length >= 2 && !isDutchRejectWord(name) && !isContaminatedName(name)) return name;
  }

  // ── Pattern 2: "Ik wil X bouwen/maken/ontwikkelen" (Dutch) ──
  // Skip leading "een" / "de" / "het" articles
  // Capitalize each word in the extracted name
  const ikWilMatch = text.match(/ik\s+wil\s+(?:een\s+|de\s+|het\s+)?([A-Za-z][A-Za-z0-9_\-\s]{1,50}?)\s+(?:bouwen|maken|ontwikkelen|creëren|realiseren|starten|lanceren|opzetten)/i);
  if (ikWilMatch) {
    const name = ikWilMatch[1].trim();
    // Capitalize each word
    const capitalized = name.replace(/\b[a-z]/g, (c) => c.toUpperCase());
    if (capitalized.length >= 2 && !isDutchRejectWord(capitalized) && !isContaminatedName(capitalized)) return capitalized;
  }

  // ── Pattern 3: "I want to build/create/make/develop X" (English) ──
  // This is the CRITICAL pattern that was failing for "AquaFix Plumbing, a website..."
  // The key fix: allow comma, period, or end-of-string after the name
  const iWantMatch = text.match(/i\s+want\s+to\s+(?:build|create|make|develop|start|launch|set\s+up)\s+([A-Z][A-Za-z0-9_\-\s]{1,50}?)(?:[.,;!?]|\s+(?:for|to|that|which|with|a|an|the|and|or|but|because|so|where|is|was|will|can|should|would|works|offers|makes|provides|uses|gives|lets|helps|focus|aims)|$)/i);
  if (iWantMatch) {
    const name = iWantMatch[1].trim();
    if (name.length >= 2 && !isDutchRejectWord(name) && !isContaminatedName(name)) return name;
  }

  // ── Pattern 4: "project heet X" / "project naam is X" (Dutch) ──
  const heetMatch = text.match(/(?:project|platform|app|tool|systeem|website|applicatie)\s+(?:heet|naam\s+is|noemt|genaamd)\s+([A-Z][A-Za-z0-9_\-\s]{1,50}?)(?:[.,;!?]|\s+(?:en|of|maar|want|dus|die|dat|met|voor|om|een|de|het|is|wordt|heeft|moet|kan|zal)|$)/i);
  if (heetMatch) {
    const name = heetMatch[1].trim();
    if (name.length >= 2 && !isDutchRejectWord(name) && !isContaminatedName(name)) return name;
  }

  // ── Pattern 5: "de naam is X" / "de naam wordt X" (Dutch) ──
  const naamMatch = text.match(/(?:de\s+)?naam\s+(?:is|wordt|lijkt|zou\s+zijn)\s+([A-Z][A-Za-z0-9_\-\s]{1,50}?)(?:[.,;!?]|\s+(?:en|of|maar|want|dus|die|dat|met|voor|om|een|de|het|is|wordt|heeft|moet|kan|zal)|$)/i);
  if (naamMatch) {
    const name = naamMatch[1].trim();
    if (name.length >= 2 && !isDutchRejectWord(name) && !isContaminatedName(name)) return name;
  }

  // ── Pattern 6: "genaamd X" (Dutch) ──
  const genaamdMatch = text.match(/genaamd\s+([A-Z][A-Za-z0-9_\-\s]{1,40}?)(?:[.,;!?]|\s+(?:voor|om|die|dat|met|een|de|het|en|of|maar|want|dus|zodat|waarbij|waar|is|wordt|heeft|moet|kan|zal|gaat|zou|werkt|biedt|maakt|ondersteunt|gebruikt|levert|geeft|laat|zorgt|richt)|$)/i);
  if (genaamdMatch) {
    const name = genaamdMatch[1].trim();
    if (name.length >= 2 && !isDutchRejectWord(name) && !isContaminatedName(name)) return name;
  }

  // ── Pattern 7: "called X" or "named X" (English) ──
  const calledMatch = text.match(/(?:called|named)\s+([A-Z][A-Za-z0-9_\-\s]{1,40}?)(?:[.,;!?]|\s+(?:for|to|that|which|with|a|an|the|and|or|but|because|so|where|is|was|will|can|should|would|works|offers|makes|provides|uses|gives|lets|helps|focus|aims)|$)/i);
  if (calledMatch) {
    const name = calledMatch[1].trim();
    if (name.length >= 2 && !isDutchRejectWord(name) && !isContaminatedName(name)) return name;
  }

  // ── Pattern 8: "X wordt een ..." (Dutch) ──
  const wordtMatch = text.match(/([A-Z][A-Za-z0-9_\-\s]{1,40}?)\s+wordt\s+een\s+/i);
  if (wordtMatch) {
    const name = wordtMatch[1].trim();
    if (/^(het|de|een|dit|dat|we|ze|hij|zij|onze|jullie|hun|mijn|uw|geen|alle|beide|elke|ieder|verschillende|sommige|dergelijke|gebruikers|platform|website|systeem|applicatie|tool|app)(?:\s|$)/i.test(name)) return null;
    if (isDutchRejectWord(name)) return null;
    if (name.length < 3) return null;
    if (!isContaminatedName(name)) return name;
  }

  // ── Pattern 9: "X is een ..." (Dutch) ──
  const isEenMatch = text.match(/([A-Z][A-Za-z0-9_\-\s]{1,40}?)\s+is\s+een\s+/i);
  if (isEenMatch) {
    const name = isEenMatch[1].trim();
    if (/^(het|de|een|dit|dat|we|ze|hij|zij|onze|jullie|hun|mijn|uw|geen|alle|beide|elke|ieder|verschillende|sommige|dergelijke|gebruikers|platform|website|systeem|applicatie|tool|app)(?:\s|$)/i.test(name)) return null;
    if (isDutchRejectWord(name)) return null;
    if (name.length < 3) return null;
    if (!isContaminatedName(name)) return name;
  }

  // ── Pattern 10: "X helpt ..." (Dutch) ──
  const helptMatch = text.match(/([A-Z][A-Za-z0-9_\-\s]{1,30}?)\s+helpt\s+/i);
  if (helptMatch) {
    const name = helptMatch[1].trim();
    if (/[,.]/.test(name)) return null;
    if (/^(het|de|een|dit|dat|we|ze|hij|zij|onze|jullie|hun|mijn|uw|geen|alle|beide|elke|ieder|verschillende|sommige|dergelijke|gebruikers|platform|website|systeem|applicatie|tool|app)(?:\s|$)/i.test(name)) return null;
    if (isDutchRejectWord(name)) return null;
    if (name.length < 3 || name.length > 30) return null;
    if (!isContaminatedName(name)) return name;
  }

  // ── Pattern 11: "Build X" / "Create X" / "Develop X" at sentence start ──
  const buildMatch = text.match(/^(?:build|create|make|develop)\s+([A-Z][A-Za-z0-9_\-\s]{1,50}?)(?:[.,;!?]|\s+(?:for|to|that|which|with|a|an|the|and|or|but|because|so|where|is|was|will|can|should|would)|$)/i);
  if (buildMatch) {
    const name = buildMatch[1].trim();
    if (name.length >= 2 && !isDutchRejectWord(name) && !isContaminatedName(name)) return name;
  }

  // ── Pattern 12: "We are building X" / "We are creating X" / "We are developing X" (English, plural) ──
  const weAreMatch = text.match(/we\s+are\s+(?:building|creating|developing|making|establishing|starting|launching|setting\s+up)\s+([A-Z][A-Za-z0-9_\-\s]{1,50}?)(?:[.,;!?]|\s+(?:for|to|that|which|with|a|an|the|and|or|but|because|so|where|is|was|will|can|should|would|works|offers|makes|provides|uses|gives|lets|helps|focus|aims)|$)/i);
  if (weAreMatch) {
    const name = weAreMatch[1].trim();
    if (name.length >= 2 && !isDutchRejectWord(name) && !isContaminatedName(name)) return name;
  }

  // ── Pattern 13: "We zijn X aan het bouwen" / "We gaan X bouwen" (Dutch, plural) ──
  const weZijnMatch = text.match(/we\s+zijn\s+([A-Za-z][A-Za-z0-9_\-\s]{1,50}?)\s+aan\s+het\s+(?:bouwen|maken|ontwikkelen|creëren|realiseren|starten|lanceren|opzetten)/i);
  if (weZijnMatch) {
    const name = weZijnMatch[1].trim();
    const capitalized = name.replace(/\b[a-z]/g, (c) => c.toUpperCase());
    if (capitalized.length >= 2 && !isDutchRejectWord(capitalized) && !isContaminatedName(capitalized)) return capitalized;
  }

  // ── Pattern 14: "We gaan X bouwen" (Dutch) ──
  const weGaanMatch = text.match(/we\s+gaan\s+([A-Za-z][A-Za-z0-9_\-\s]{1,50}?)\s+(?:bouwen|maken|ontwikkelen|creëren|realiseren|starten|lanceren|opzetten)/i);
  if (weGaanMatch) {
    const name = weGaanMatch[1].trim();
    const capitalized = name.replace(/\b[a-z]/g, (c) => c.toUpperCase());
    if (capitalized.length >= 2 && !isDutchRejectWord(capitalized) && !isContaminatedName(capitalized)) return capitalized;
  }

  return null;
}

// ──────────────────────────────────────────────
// 2. TARGET USERS EXTRACTION
// ──────────────────────────────────────────────

/**
 * Extract target users from conversational text.
 * Handles comma-separated lists, "en/and" conjunctions, bullet lists.
 */
export function extractTargetUsers(text: string): string[] {
  if (!text || text.trim().length === 0) return [];

  // First, try to find the target users section
  // Common patterns: "primary users are X", "target users are X", "gebruikers zijn X"
  const sectionMatch = text.match(
    /(?:primary\s+users|target\s+users|target\s+audience|users\s+are|gebruikers\s+zijn|doelgroep\s+is|doelgroep\s+zijn)(?:\s+are|\s+is|\s+include|\s*:|-\s*)?\s+(.+?)(?:\.(?:\s+[A-Z]|$)|$)/i
  );

  if (!sectionMatch) return [];

  const targetText = sectionMatch[1];

  // Split on commas, "en", "and", bullets, newlines
  const items = targetText
    .split(/\s*[,;•\n]\s*|\s+(?:en|and)\s+/i)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    // Remove trailing punctuation from each item
    .map((item) => item.replace(/[.,;!?]+$/, "").trim())
    // Remove items that are too long (likely not a persona)
    .filter((item) => item.length < 80)
    // Remove items that are clearly not personas
    .filter((item) => !/^(?:the\s+|a\s+|an\s+|het\s+|een\s+|de\s+)?(?:website|platform|system|tool|app|project|solution|product)\s+/i.test(item));

  // Capitalize first letter of each item
  return normalizeArray(
    items.map((item) => item.charAt(0).toUpperCase() + item.slice(1))
  );
}

// ──────────────────────────────────────────────
// 3. MVP FEATURES EXTRACTION
// ──────────────────────────────────────────────

/**
 * Extract MVP features from conversational text.
 * Handles comma-separated lists, bullet lists, numbered lists,
 * "en/and" conjunctions, and cleans up "and " prefixes.
 */
export function extractMvpFeatures(text: string): string[] {
  if (!text || text.trim().length === 0) return [];

  // Try to find the features section
  // Common patterns: "bevatten X, Y, Z", "include X, Y, Z", "moet X, Y, Z bevatten"
  const sectionMatch = text.match(
    /(?:bevatten|bevat\b|includes?\b|have\b|has\b|moet\s+.*?bevatten|bestaat\s+uit|bestaan\s+uit|features?\s*(?::|are|include|-\s*)|pages?\s*(?::|are|include|-\s*)|sections?\s*(?::|are|include|-\s*)|should\s+include|site\s+should\s+include)(.+?)(?:\.\s+[A-Z]|\.\s*$|$)/i
  );


  if (!sectionMatch) return [];

  const featureText = sectionMatch[1];

  // Split on commas, bullets, numbered items, newlines, "en", "and"
  const items = featureText
    .split(/\s*[,;•\n]\s*|\s+\d+\.\s+|\s+(?:en|and)\s+/i)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    // Remove "and " prefix (leftover after split)
    .map((item) => item.replace(/^and\s+/i, "").trim())
    .map((item) => item.replace(/^en\s+/i, "").trim())
    // Remove trailing punctuation
    .map((item) => item.replace(/[.,;!?]+$/, "").trim())
    // Remove items that are too long (likely descriptions, not features)
    .filter((item) => item.length < 100)
    // Remove items that are clearly not features
    .filter((item) => !/^(?:the\s+|a\s+|an\s+)?(?:website|platform|system|tool|app|project)\s+(?:should|will|must|would|can|needs\s+to)/i.test(item))
    // Capitalize first letter of each feature
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1));

  return normalizeArray(items);

}

// ──────────────────────────────────────────────
// 4. TAGLINE GENERATION
// ──────────────────────────────────────────────

/**
 * Generate a short, professional tagline.
 * Uses domain templates. Never truncates descriptions.
 *
 * Rules:
 *   - Max 80 characters
 *   - No ellipsis — truncate cleanly at word boundary
 *   - Domain-specific template preferred
 */
export function generateTagline(
  projectName: string,
  _domainName: string,
  domainTaglineTemplate: (name: string) => string,
  language: InputLanguage,
): string {
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

  // Use domain-specific template
  const tagline = domainTaglineTemplate(projectName);

  // If domain template produced something, use it
  if (tagline && tagline.length > 0) {
    return truncateClean(tagline);
  }

  // Fallback: language-appropriate generic tagline
  if (language === "nl") {
    return truncateClean(`${projectName} — een professioneel softwareproject`);
  }

  return truncateClean(`${projectName} — AI-ready software project`);
}


// ──────────────────────────────────────────────
// 5. ARCHITECTURE DERIVATION
// ──────────────────────────────────────────────

/**
 * Derive component tree from MVP features and domain templates.
 * NEVER returns "Undefined" or "Unknown".
 */
export function deriveComponentTree(
  mvpFeatures: string[],
  domainComponentTemplates: string[],
): string {
  if (mvpFeatures.length > 0) {
    // Generate component tree from features
    const treeLines: string[] = [];
    treeLines.push("App");

    // Use domain templates as base
    for (const component of domainComponentTemplates) {
      treeLines.push(`├── ${component}`);
    }

    // Add feature-derived components
    for (const feature of mvpFeatures) {
      const cleaned = feature.replace(/[^a-zA-Z0-9\s]/g, "").trim();
      const words = cleaned.split(/\s+/).filter((w) => w.length > 0);
      if (words.length > 0) {
        const componentName = words
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join("");
        treeLines.push(`├── ${componentName}`);
      }
    }

    return treeLines.join("\n");
  }

  // Fallback: use domain templates only
  if (domainComponentTemplates.length > 0) {
    const treeLines = ["App"];
    for (const component of domainComponentTemplates) {
      treeLines.push(`├── ${component}`);
    }
    return treeLines.join("\n");
  }

  // Ultimate fallback — never "Undefined"
  return "App\n├── HomePage\n├── DashboardPage\n├── SettingsPage";
}

/**
 * Derive data flow description from domain template.
 * NEVER returns "Unknown".
 */
export function deriveDataFlow(domainDataFlowTemplate: string): string {
  if (domainDataFlowTemplate && domainDataFlowTemplate.length > 0) {
    return domainDataFlowTemplate;
  }
  return "User interacts with application → frontend sends requests to API → API processes and validates → data stored in database → response returned to frontend → UI updates accordingly";
}

// ──────────────────────────────────────────────
// 6. ROADMAP DERIVATION
// ──────────────────────────────────────────────

/**
 * Derive domain-specific roadmap phases.
 * English-only. Feature-based. No Dutch labels.
 */
export function deriveRoadmap(
  domainRoadmapPhases: Array<{ title: string; tasks: string[] }>,
  mvpFeatures: string[],
): Phase[] {
  const phases: Phase[] = [];
  let phaseCounter = 0;
  let taskCounter = 0;

  const nextPhaseId = (): string => {
    phaseCounter++;
    return `phase-${phaseCounter}`;
  };

  const nextTaskId = (): string => {
    taskCounter++;
    return `task-${taskCounter}`;
  };

  // Use domain-specific roadmap phases
  for (const phase of domainRoadmapPhases) {
    const tasks = phase.tasks.map((taskTitle) => ({
      id: nextTaskId(),
      title: taskTitle,
      status: "pending" as const,
    }));

    phases.push({
      id: nextPhaseId(),
      title: phase.title,
      tasks,
    });
  }

  // If we have MVP features and the last phase doesn't mention them,
  // add a phase for feature implementation
  if (mvpFeatures.length > 0) {
    const hasFeaturePhase = phases.some((p) =>
      p.title.toLowerCase().includes("mvp") ||
      p.title.toLowerCase().includes("feature") ||
      p.title.toLowerCase().includes("core")
    );
    if (!hasFeaturePhase) {
      phases.push({
        id: nextPhaseId(),
        title: "MVP Feature Implementation",
        tasks: mvpFeatures.slice(0, 5).map((feature) => ({
          id: nextTaskId(),
          title: `Implement ${feature}`,
          status: "pending" as const,
        })),
      });
    }
  }

  return phases;
}

// ──────────────────────────────────────────────
// 7. CONFIDENCE SCORING
// ──────────────────────────────────────────────

/**
 * Score the completeness of extracted requirements.
 * Returns per-field scores (0-100) and an overall score.
 */
export function scoreCompleteness(
  extracted: Partial<StructuredRequirements>,
): { confidence: number; confidenceByField: FieldConfidence; warnings: string[] } {
  const warnings: string[] = [];

  // Per-field scoring
  const projectNameScore = extracted.projectName && extracted.projectName !== "New Software Project"
    ? 100 : 0;

  const usersScore = extracted.targetUsers && extracted.targetUsers.length > 0
    ? Math.min(100, extracted.targetUsers.length * 25) : 0;

  const mvpScore = extracted.mvpFeatures && extracted.mvpFeatures.length > 0
    ? Math.min(100, extracted.mvpFeatures.length * 10) : 0;

  const roadmapScore = extracted.roadmap && extracted.roadmap.length > 0
    ? 80 : 0;

  const architectureScore =
    (extracted.componentTree && extracted.componentTree.length > 0 ? 40 : 0) +
    (extracted.dataFlow && extracted.dataFlow.length > 0 ? 30 : 0) +
    (extracted.domain && extracted.domain !== "generic" ? 30 : 0);

  const confidenceByField: FieldConfidence = {
    projectName: projectNameScore,
    users: usersScore,
    mvp: mvpScore,
    roadmap: roadmapScore,
    architecture: architectureScore,
  };

  // Generate warnings for low-scoring fields
  if (projectNameScore === 0) {
    warnings.push("Project name could not be extracted — using fallback.");
  }
  if (usersScore === 0) {
    warnings.push("No target users extracted — consider specifying who this project is for.");
  }
  if (mvpScore === 0) {
    warnings.push("No MVP features extracted — consider defining the minimum viable product.");
  }
  if (roadmapScore === 0) {
    warnings.push("No roadmap phases derived — using generic fallback.");
  }
  if (architectureScore < 50) {
    warnings.push("Architecture derivation is incomplete — review and refine.");
  }

  // Overall confidence: weighted average
  const weights = {
    projectName: 0.25,
    users: 0.15,
    mvp: 0.25,
    roadmap: 0.20,
    architecture: 0.15,
  };

  const overall =
    projectNameScore * weights.projectName +
    usersScore * weights.users +
    mvpScore * weights.mvp +
    roadmapScore * weights.roadmap +
    architectureScore * weights.architecture;

  return {
    confidence: Math.round(overall),
    confidenceByField,
    warnings,
  };
}

// ──────────────────────────────────────────────
// 8. MAIN ORCHESTRATOR
// ──────────────────────────────────────────────

/**
 * Main entry point: convert raw conversational text
 * into a complete StructuredRequirements.
 *
 * This is the core of the Semantic Extraction Layer.
 * All extraction logic is centralized here.
 *
 * @param rawText - Raw conversational input from the user
 * @param existingProjectName - Optional pre-extracted project name (from interview)
 * @returns A complete StructuredRequirements object
 */
export function extractRequirements(
  rawText: string,
  existingProjectName?: string,
): StructuredRequirements {
  const text = rawText.trim();
  const warnings: string[] = [];

  // ── 1. Detect project type, language ──
  const projectType = detectProjectType(text);
  const language = detectLanguage(text);

  // ── 2. Extract project name ──
  let projectName = existingProjectName?.trim() || "";
  if (!projectName) {
    const extracted = extractProjectName(text);
    projectName = extracted || "New Software Project";
  }
  if (projectName === "New Software Project") {
    warnings.push("Could not extract project name from input.");
  }

  // ── 3. Extract target users ──
  const targetUsers = extractTargetUsers(text);
  if (targetUsers.length === 0) {
    warnings.push("Could not extract target users from input.");
  }

  // ── 4. Extract MVP features ──
  const mvpFeatures = extractMvpFeatures(text);
  if (mvpFeatures.length === 0) {
    warnings.push("Could not extract MVP features from input.");
  }

  // ── 5. Extract preferred tech (needed for semantic generation) ──
  const preferredTech = extractPreferredTech(text);

  // ── 6. Detect domain template for semantic generation ──
  const domainTemplate = detectDomainFromText(text);

  // ── 7. Generate tagline (semantic) ──
  const tagline = generateSemanticTagline(projectName, domainTemplate);

  // ── 8. Derive architecture (semantic) ──
  const componentTree = deriveSemanticComponentTree(domainTemplate, mvpFeatures);
  const dataFlow = deriveSemanticDataFlow(domainTemplate);
  const architecturePattern = deriveArchitecturePattern(domainTemplate);

  // ── 9. Derive roadmap (semantic) ──
  const roadmap = generateSemanticRoadmap(domainTemplate, mvpFeatures);

  // ── 10. Build domain model ──
  const domainModel = buildDomainModel(domainTemplate);

  // ── 11. Run semantic validation ──
  const validation = validateSemanticOutput(
    domainModel,
    domainTemplate,
    domainTemplate.roadmapPhases,
    componentTree,
    dataFlow,
    mvpFeatures,
    preferredTech,
  );
  warnings.push(...validation.warnings);

  // ── 12. Score completeness (semantic) ──
  const semanticConfidence = calculateSemanticConfidence(
    tagline,
    domainTemplate.roadmapPhases,
    architecturePattern,
    domainModel,
    dataFlow,
    componentTree,
    preferredTech,
    domainTemplate,
  );
  const confidence = semanticConfidence.overall;
  const confidenceByField: FieldConfidence = {
    projectName: projectName !== "New Software Project" ? 100 : 0,
    users: targetUsers.length > 0 ? Math.min(100, targetUsers.length * 25) : 0,
    mvp: mvpFeatures.length > 0 ? Math.min(100, mvpFeatures.length * 10) : 0,
    roadmap: roadmap.length > 0 ? 80 : 0,
    architecture: (componentTree ? 40 : 0) + (dataFlow ? 30 : 0) + (domainTemplate.name !== "generic" ? 30 : 0),
  };

  // ── 13. Build description ──
  const description = text.length > 500 ? text.slice(0, 500) + "…" : text;

  // ── 14. Extract integrations ──
  const integrations = extractIntegrations(text);

  // ── 15. Extract constraints ──
  const constraints = extractConstraints(text);

  // ── 16. Extract goals ──
  const goals = extractGoals(text);

  // ── 17. Extract risks ──
  const risks = extractRisks(text);

  // ── 18. Extract entities ──
  const entities = extractEntities(text, domainTemplate.name);

  // ── 19. Extract services ──
  const services = [...mvpFeatures];

  return {
    projectName,
    tagline,
    description,
    targetUsers,
    goals,
    mvpFeatures,
    integrations,
    constraints,
    risks,
    entities,
    services,
    preferredTech,
    domain: domainTemplate.name,
    projectType,
    language,
    componentTree,
    dataFlow,
    roadmap,
    confidence,
    confidenceByField,
    warnings,
  };
}

// ──────────────────────────────────────────────
// 9. SUPPLEMENTARY EXTRACTORS
// ──────────────────────────────────────────────

/**
 * Extract integrations from text.
 */
function extractIntegrations(text: string): string[] {
  const knownIntegrations = [
    "github", "jira", "slack", "notion", "google maps", "google analytics",
    "stripe", "paypal", "hubspot", "salesforce", "mailchimp", "sendgrid",
    "twilio", "resend", "clerk", "auth0", "firebase", "aws", "azure",
    "postgresql", "mongodb", "redis", "openai", "anthropic",
  ];

  const found: string[] = [];
  const lower = text.toLowerCase();

  for (const integration of knownIntegrations) {
    if (lower.includes(integration)) {
      // Capitalize properly
      found.push(
        integration
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      );
    }
  }

  return normalizeArray(found);
}

/**
 * Extract constraints from text.
 */
function extractConstraints(text: string): string[] {
  const constraints: string[] = [];
  const lower = text.toLowerCase();

  // Common constraint patterns
  const constraintPatterns = [
    { pattern: /lokaal\s+(draaiend|zonder|geen)/i, label: "Local-only (no backend)" },
    { pattern: /offline\s+(support|access|available|beschikbaar)/i, label: "Offline support required" },
    { pattern: /mobile.first|mobile-first/i, label: "Mobile-first design" },
    { pattern: /responsive/i, label: "Responsive design required" },
    { pattern: /gdpr|privacy|avg/i, label: "GDPR/Privacy compliance required" },
    { pattern: /multi.tenant|multi tenant/i, label: "Multi-tenant architecture" },
    { pattern: /real.time|realtime/i, label: "Real-time updates required" },
    { pattern: /oauth|sso|single.sign.on/i, label: "OAuth/SSO authentication" },
  ];

  for (const cp of constraintPatterns) {
    if (cp.pattern.test(lower)) {
      constraints.push(cp.label);
    }
  }

  return normalizeArray(constraints);
}

/**
 * Extract goals from text.
 */
function extractGoals(text: string): string[] {
  const goals: string[] = [];

  // Look for goal-indicating phrases
  const goalSections = text.split(/[.!?]+/);

  for (const sentence of goalSections) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    // Check if sentence indicates a goal
    const isGoal =
      /(?:should|will|must|need to|aims? to|goal is to|purpose is to|doel is|moet|gaat|zorgt|biedt|maakt|levert|helpt|ondersteunt)/i.test(trimmed) &&
      trimmed.length > 10 &&
      trimmed.length < 200;

    if (isGoal) {
      goals.push(trimmed.charAt(0).toUpperCase() + trimmed.slice(1));
    }
  }

  return normalizeArray(goals);
}

/**
 * Extract risks from text.
 */
function extractRisks(text: string): string[] {
  const risks: string[] = [];
  const lower = text.toLowerCase();

  // Look for risk-indicating phrases
  const riskIndicators = [
    /risk/i, /challenge/i, /concern/i, /problem/i, /issue/i,
    /risico/i, /uitdaging/i, /zorg/i, /probleem/i,
  ];

  const hasRiskIndication = riskIndicators.some((r) => r.test(lower));

  if (hasRiskIndication) {
    const sentences = text.split(/[.!?]+/);
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      if (riskIndicators.some((r) => r.test(trimmed))) {
        risks.push(trimmed.charAt(0).toUpperCase() + trimmed.slice(1));
      }
    }
  }

  return normalizeArray(risks);
}

/**
 * Extract entities/data models from text and domain.
 */
function extractEntities(_text: string, domain: string): string[] {
  // Domain-specific entity suggestions
  const domainEntities: Record<string, string[]> = {
    plumbing: ["Customer", "Quote", "Service", "Review", "Appointment", "Invoice"],
    fitness: ["User", "Workout", "Exercise", "Progress", "Goal", "Subscription"],
    "project-management": ["Task", "Project", "User", "Team", "Integration", "Sprint"],
    crm: ["Contact", "Deal", "Activity", "Pipeline", "Report", "User"],
    travel: ["Trip", "Destination", "Itinerary", "Budget", "User", "Activity"],
    restaurant: ["Reservation", "Order", "MenuItem", "Table", "Customer", "Payment"],
    "solar-energy": ["Customer", "Quote", "Project", "Panel", "Installation", "Invoice"],
  };

  return domainEntities[domain] || ["User", "Project", "Task", "Settings"];
}

/**
 * Tech section headers that should be stripped before matching.
 * These are labels like "Frontend:", "Backend:", "Database:" that users
 * often use to organize their tech stack listings.
 */
const TECH_SECTION_HEADERS = [
  /^frontend\s*[:;]/im,
  /^backend\s*[:;]/im,
  /^database\s*[:;]/im,
  /^infrastructure\s*[:;]/im,
  /^deployment\s*[:;]/im,
  /^integrations?\s*[:;]/im,
  /^tech\s+stack\s*[:;]/im,
  /^technologies?\s*[:;]/im,
  /^tools?\s*[:;]/im,
  /^frameworks?\s*[:;]/im,
  /^languages?\s*[:;]/im,
  /^testing\s*[:;]/im,
  /^devops\s*[:;]/im,
  /^ci\/cd\s*[:;]/im,
  /^monitoring\s*[:;]/im,
  /^security\s*[:;]/im,
  /^authentication\s*[:;]/im,
  /^auth\s*[:;]/im,
  /^payments?\s*[:;]/im,
  /^storage\s*[:;]/im,
  /^hosting\s*[:;]/im,
  /^orchestration\s*[:;]/im,
  /^message(?:ing| queue)\s*[:;]/im,
  /^analytics\s*[:;]/im,
  /^search\s*[:;]/im,
  /^email\s*[:;]/im,
  /^sms\s*[:;]/im,
];

/**
 * Extract preferred tech stack from text.
 *
 * Handles colon-delimited tech listings like:
 *   "Frontend: React, TypeScript\nBackend: Node.js, Express\nDatabase: PostgreSQL"
 *
 * Strips section headers before matching to prevent labels like "Frontend:"
 * from leaking into the tech arrays.
 *
 * Uses the canonical stack's known tech list for consistent categorization.
 */
function extractPreferredTech(text: string): string[] {
  const knownTech = [
    "react", "vue", "angular", "svelte", "next.js", "nuxt",
    "typescript", "javascript", "python", "java", "go", "rust",
    "node", "deno", "bun", "express", "fastify", "django", "flask",
    "fastapi", "spring", "spring boot", "kotlin", "swift",
    "tailwind", "bootstrap", "shadcn", "material ui", "chakra",
    "graphql", "rest", "grpc", "websocket",
    "postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite",
    "docker", "kubernetes", "aws", "azure", "gcp", "vercel", "netlify",
    "firebase", "supabase", "prisma", "drizzle", "typeorm",
    "vitest", "jest", "cypress", "playwright", "testing library",
  ];

  const found: string[] = [];
  const seen = new Set<string>();

  // Step 1: Strip tech section headers from the text
  // This prevents labels like "Frontend:", "Backend:", "Database:"
  // from being matched as partial tech names or leaking into output
  let cleanText = text;
  for (const header of TECH_SECTION_HEADERS) {
    cleanText = cleanText.replace(header, "");
  }

  const lower = cleanText.toLowerCase();

  // Step 2: Match against known tech list
  for (const tech of knownTech) {
    if (lower.includes(tech)) {
      const canonical = tech
        .split(/[\s-]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      const seenKey = canonical.toLowerCase();
      if (!seen.has(seenKey)) {
        seen.add(seenKey);
        found.push(canonical);
      }
    }
  }

  // Step 3: Also try to parse colon-delimited sections for better extraction
  // Pattern: "SectionName: item1, item2, item3"
  const colonSectionPattern = /^[A-Za-z/]+\s*:\s*(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = colonSectionPattern.exec(text)) !== null) {
    const sectionContent = match[1].trim();
    // Split on commas, "en", "and", bullets
    const items = sectionContent
      .split(/\s*[,;•\n]\s*|\s+(?:en|and)\s+/i)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => item.replace(/[.,;!?]+$/, "").trim());

    for (const item of items) {
      const itemLower = item.toLowerCase();
      // Check if this item matches a known tech
      for (const tech of knownTech) {
        if (itemLower === tech || itemLower.startsWith(tech + " ") || itemLower.endsWith(" " + tech)) {
          const canonical = tech
            .split(/[\s-]+/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          const seenKey = canonical.toLowerCase();
          if (!seen.has(seenKey)) {
            seen.add(seenKey);
            found.push(canonical);
          }
          break;
        }
      }
    }
  }

  return normalizeArray(found);
}
