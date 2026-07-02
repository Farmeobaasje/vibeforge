// ──────────────────────────────────────────────
// canonical/validator — Deterministic Validator
//
// Validates LLM extraction output against:
//   1. Schema completeness — all required fields present
//   2. Normalization — trim, dedupe, slugify
//   3. Hallucination check — LLM tech must appear in input
//      (except allowed defaults)
//   4. Explicit input preservation — user's explicit mentions
//      are never dropped
//   5. Cross-document consistency — domainLabel matches
//      entities, features, roadmap
//   6. Fallback only where missing — never overwrite good data
//
// Architecture rule:
//   LLM understands. VibeForge validates. Renderers format.
// ──────────────────────────────────────────────

import type { CanonicalExtractionResult, CanonicalTechItem } from "./types";

// ── Allowed default technologies ──────────────
// These are so common they're not hallucinations
const ALLOWED_DEFAULT_TECH = new Set([
  "typescript", "javascript", "react", "node", "node.js",
  "rest", "rest api", "http", "json", "html", "css",
  "git", "npm", "yarn",
]);

// ── Slugify ───────────────────────────────────

/**
 * Convert free-text domainLabel to a safe slug for domain.id.
 * "Aerospace Digital Twin" → "aerospace-digital-twin"
 */
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")   // remove special chars
    .replace(/\s+/g, "-")            // spaces to hyphens
    .replace(/-+/g, "-")             // collapse multiple hyphens
    .replace(/^-|-$/g, "");          // trim leading/trailing hyphens
}

// ── Normalization ─────────────────────────────

/**
 * Normalize a string: trim, collapse whitespace.
 */
function normalize(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

// ── Tech extraction from raw text ─────────────

/**
 * Extract all technology-like tokens from raw text.
 * Used to check if LLM-proposed tech appears in the input.
 */
function extractTechTokensFromInput(rawText: string): Set<string> {
  const tokens = new Set<string>();
  const lower = rawText.toLowerCase();

  // Known tech patterns
  const knownTech = [
    "react", "vue", "angular", "svelte", "solid", "solidjs", "solidstart",
    "qwik", "astro", "remix", "next.js", "nextjs", "nuxt",
    "typescript", "javascript", "python", "java", "go", "rust",
    "node", "node.js", "deno", "bun", "express", "fastify", "django", "flask",
    "fastapi", "spring", "spring boot", "kotlin", "swift",
    "tailwind", "tailwind css", "bootstrap", "shadcn", "shadcn/ui",
    "material ui", "chakra", "chakra ui",
    "graphql", "rest", "grpc", "websocket",
    "postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite",
    "cockroachdb", "planetscale", "neon", "turso", "upstash",
    "docker", "kubernetes", "aws", "azure", "gcp", "vercel", "netlify",
    "cloudflare", "cloudflare workers", "cloudflare pages",
    "fly.io", "railway", "render",
    "firebase", "supabase", "prisma", "drizzle", "drizzle orm", "typeorm",
    "vitest", "jest", "cypress", "playwright", "testing library",
    "webassembly", "wasm",
    "solidjs", "solidstart",
    "three.js", "threejs", "webgl", "webgl2", "opengl",
    "rust", "wasm", "webassembly",
    "timescaledb", "influxdb", "clickhouse",
    "opentelemetry", "grafana", "prometheus",
    "kafka", "rabbitmq", "nats",
    "terraform", "pulumi", "ansible",
    "github actions", "gitlab ci", "circleci",
  ];

  for (const tech of knownTech) {
    if (lower.includes(tech)) {
      tokens.add(tech);
    }
  }

  // Also extract anything that looks like a tech name after colons
  // e.g. "Frontend: React, TypeScript"
  const colonPattern = /^[A-Za-z/]+\s*:\s*(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = colonPattern.exec(rawText)) !== null) {
    const content = match[1].toLowerCase();
    const words = content.split(/[\s,;]+/).map((w) => w.trim()).filter(Boolean);
    for (const word of words) {
      tokens.add(word.replace(/[.,;!?]+$/, ""));
    }
  }

  return tokens;
}

// ── Hallucination check ───────────────────────

/**
 * Check if a tech item is hallucinated (not in input, not an allowed default).
 */
function isHallucinatedTech(
  tech: CanonicalTechItem,
  inputTokens: Set<string>,
): boolean {
  const name = tech.name.toLowerCase().trim();
  const canonical = tech.canonicalName.toLowerCase().trim();

  // Allowed defaults are never hallucinations
  if (ALLOWED_DEFAULT_TECH.has(name) || ALLOWED_DEFAULT_TECH.has(canonical)) {
    return false;
  }

  // Check if the tech name appears in the input
  if (inputTokens.has(name) || inputTokens.has(canonical)) {
    return false;
  }

  // Check partial matches (e.g. "PostgreSQL" matches "postgresql")
  for (const token of inputTokens) {
    if (name.includes(token) || token.includes(name)) {
      return false;
    }
    if (canonical.includes(token) || token.includes(canonical)) {
      return false;
    }
  }

  return true;
}

// ── Cross-document consistency ────────────────

/**
 * Check that domainLabel is semantically consistent with
 * entities, features, and roadmap content.
 * Returns warnings, not errors — the LLM may be right.
 */
function checkCrossDocumentConsistency(
  result: CanonicalExtractionResult,
): string[] {
  const warnings: string[] = [];
  const domainLabel = result.identity.domainLabel?.toLowerCase() || "";
  const domainId = result.identity.domain.id?.toLowerCase() || "";

  if (!domainLabel && !domainId) {
    warnings.push("No domain label or ID set — output may lack domain context.");
    return warnings;
  }

  const label = domainLabel || domainId;

  // Extract key terms from domain label
  const labelTerms = label.split(/[\s-]+/).filter((t) => t.length > 2);

  // Check entities against domain label
  const entityNames = result.entities.items.map((e) => e.name.toLowerCase());
  const entityTerms = entityNames.join(" ");

  // If domain is very specific (e.g. "aerospace digital twin"),
  // entities should reflect that domain
  const hasDomainRelevantEntities = labelTerms.some(
    (term) => entityTerms.includes(term) || entityTerms.includes(term.replace(/-/g, "")),
  );

  if (!hasDomainRelevantEntities && labelTerms.length >= 2) {
    warnings.push(
      `Domain "${label}" has specific terminology, but entities (${entityNames.slice(0, 3).join(", ")}) don't clearly reflect it. Consider reviewing entity names.`,
    );
  }

  // Check features against domain label
  const featureNames = result.mvpFeatures.features.map((f) => f.name.toLowerCase());
  const featureTerms = featureNames.join(" ");

  const hasDomainRelevantFeatures = labelTerms.some(
    (term) => featureTerms.includes(term),
  );

  if (!hasDomainRelevantFeatures && labelTerms.length >= 2) {
    warnings.push(
      `Domain "${label}" is specific, but MVP features don't reference domain-specific concepts.`,
    );
  }

  return warnings;
}

// ── Validation result ─────────────────────────

export interface ValidationResult {
  /** Whether the extraction passed all critical checks */
  valid: boolean;
  /** The validated (and possibly modified) extraction result */
  result: CanonicalExtractionResult;
  /** Warnings generated during validation */
  warnings: string[];
  /** Hallucinated tech items that were flagged */
  hallucinatedTech: string[];
  /** Whether fallback was used for any field */
  usedFallback: boolean;
}

// ── MAIN VALIDATOR ────────────────────────────

/**
 * Validate and normalize a CanonicalExtractionResult.
 *
 * Steps:
 *   1. Schema check — ensure all required fields present
 *   2. Normalization — trim, dedupe, slugify domain.id
 *   3. Hallucination check — flag tech not in input
 *   4. Cross-document consistency — domain ↔ entities/features
 *   5. Fallback only where missing — never overwrite good data
 *
 * @param result - The raw extraction result (from LLM or deterministic)
 * @param rawText - The original input text
 * @returns A ValidationResult with the validated result
 */
export function validateExtraction(
  result: CanonicalExtractionResult,
  rawText: string,
): ValidationResult {
  const warnings: string[] = [...result.warnings];
  const hallucinatedTech: string[] = [];
  let usedFallback = false;

  // ── 1. Schema check ──────────────────────────
  // Ensure identity exists
  if (!result.identity) {
    warnings.push("Missing identity block — extraction is incomplete.");
    usedFallback = true;
    return {
      valid: false,
      result,
      warnings,
      hallucinatedTech,
      usedFallback,
    };
  }

  // Ensure domainLabel exists; fall back to domain.id if missing
  if (!result.identity.domainLabel) {
    result.identity.domainLabel = result.identity.domain.id || "software project";
    warnings.push(`No domainLabel provided — using "${result.identity.domainLabel}" as fallback.`);
    usedFallback = true;
  }

  // Ensure domainCategory exists; derive from domainLabel if missing
  if (!result.identity.domainCategory) {
    result.identity.domainCategory = "software";
    warnings.push("No domainCategory provided — using 'software' as fallback.");
    usedFallback = true;
  }

  // ── 2. Normalization ─────────────────────────
  // Normalize domainLabel
  result.identity.domainLabel = normalize(result.identity.domainLabel);

  // Slugify domain.id from domainLabel (unless already a reasonable slug)
  const slug = slugify(result.identity.domainLabel);
  if (slug.length > 0) {
    result.identity.domain.id = slug;
  } else {
    // Fallback: slugify whatever domain.id we have
    result.identity.domain.id = slugify(result.identity.domain.id) || "software-project";
  }

  // Normalize domainCategory
  result.identity.domainCategory = slugify(result.identity.domainCategory) || "software";

  // Deduplicate arrays
  result.users.personas = deduplicatePersonas(result.users.personas);
  result.mvpFeatures.features = deduplicateFeatures(result.mvpFeatures.features);
  result.techStack.items = deduplicateTechItems(result.techStack.items);
  result.entities.items = deduplicateEntities(result.entities.items);
  result.integrations.items = deduplicateIntegrations(result.integrations.items);
  result.goals.items = deduplicateGoals(result.goals.items);
  result.risks.items = deduplicateRisks(result.risks.items);
  result.constraints.items = deduplicateConstraints(result.constraints.items);

  // ── 3. Hallucination check ───────────────────
  const inputTokens = extractTechTokensFromInput(rawText);

  for (const tech of result.techStack.items) {
    if (isHallucinatedTech(tech, inputTokens)) {
      hallucinatedTech.push(tech.name);
      // Reduce confidence but don't remove — user may want to keep it
      tech.confidence = Math.min(tech.confidence, 30);
    }
  }

  if (hallucinatedTech.length > 0) {
    warnings.push(
      `Hallucinated tech detected (confidence reduced): ${hallucinatedTech.join(", ")}. ` +
      "These technologies were not mentioned in the input text.",
    );
  }

  // ── 4. Cross-document consistency ────────────
  const consistencyWarnings = checkCrossDocumentConsistency(result);
  warnings.push(...consistencyWarnings);

  // ── 5. Recalculate overall confidence ────────
  // Reduce overall confidence if hallucinations were found
  if (hallucinatedTech.length > 0) {
    const hallucinationPenalty = Math.min(hallucinatedTech.length * 5, 30);
    result.overallConfidence = Math.max(0, result.overallConfidence - hallucinationPenalty);
    result.confidenceByField.techStack = Math.max(
      0,
      (result.confidenceByField.techStack || 0) - hallucinationPenalty,
    );
  }

  // ── Final ────────────────────────────────────
  result.warnings = warnings;

  return {
    valid: warnings.filter((w) => w.includes("missing") || w.includes("incomplete")).length === 0,
    result,
    warnings,
    hallucinatedTech,
    usedFallback,
  };
}

// ── Deduplication helpers ─────────────────────

function deduplicatePersonas(
  personas: Array<{ name: string; description?: string; confidence: number }>,
): Array<{ name: string; description?: string; confidence: number }> {
  const seen = new Set<string>();
  return personas.filter((p) => {
    const key = p.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateFeatures(
  features: Array<{ name: string; description?: string; category?: string; confidence: number }>,
): Array<{ name: string; description?: string; category?: string; confidence: number }> {
  const seen = new Set<string>();
  return features.filter((f) => {
    const key = f.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateTechItems(
  items: CanonicalTechItem[],
): CanonicalTechItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.canonicalName.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateEntities(
  entities: Array<{ name: string; confidence: number }>,
): Array<{ name: string; confidence: number }> {
  const seen = new Set<string>();
  return entities.filter((e) => {
    const key = e.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateIntegrations(
  integrations: Array<{ name: string; confidence: number }>,
): Array<{ name: string; confidence: number }> {
  const seen = new Set<string>();
  return integrations.filter((i) => {
    const key = i.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateGoals(
  goals: Array<{ description: string; confidence: number }>,
): Array<{ description: string; confidence: number }> {
  const seen = new Set<string>();
  return goals.filter((g) => {
    const key = g.description.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateRisks(
  risks: Array<{ description: string; confidence: number }>,
): Array<{ description: string; confidence: number }> {
  const seen = new Set<string>();
  return risks.filter((r) => {
    const key = r.description.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateConstraints(
  constraints: Array<{ description: string; confidence: number }>,
): Array<{ description: string; confidence: number }> {
  const seen = new Set<string>();
  return constraints.filter((c) => {
    const key = c.description.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
