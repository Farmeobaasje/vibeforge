// ──────────────────────────────────────────────
// deterministicExtractor — Fallback extraction
//
// FALLBACK extraction path. Used when LLM is
// unavailable or produces low-quality output.
//
// Consolidates all previous regex-based extraction
// (requirementsIntelligence.ts + semanticUsers.ts)
// into a single deterministic extractor that
// returns CanonicalExtractionResult.
//
// This is the SAFE default — always works, no
// API keys needed, no network calls.
// ──────────────────────────────────────────────

import type {
  CanonicalExtractionResult,
  CanonicalPersona,
  CanonicalFeature,
  CanonicalTechItem,
  CanonicalDomain,
  CanonicalIdentity,
  CanonicalRoadmapPhase,
  ExtractionSource,
} from "./types";
import { normalizeArray } from "../lib/normalize";
import {
  detectDomainFromText,
  generateSemanticRoadmap,
  deriveSemanticComponentTree,
  deriveSemanticDataFlow,
  deriveArchitecturePattern,
} from "../semantic/index";

// ── Constants ─────────────────────────────────

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

const CONTAMINATION_PATTERNS = [
  /^teams gebruiken/i,
  /^frontend:/i, /^backend:/i, /^database:/i,
  /^moet /i,
  /^github/i, /^jira/i, /^slack/i, /^notion/i,
  /^react/i, /^typescript/i, /^node/i, /^python/i,
  /^docker/i, /^aws/i,
];

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

const KNOWN_TECH = [
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
];

const KNOWN_INTEGRATIONS = [
  "github", "jira", "slack", "notion", "google maps", "google analytics",
  "stripe", "paypal", "hubspot", "salesforce", "mailchimp", "sendgrid",
  "twilio", "resend", "clerk", "auth0", "firebase", "aws", "azure",
  "postgresql", "mongodb", "redis", "openai", "anthropic",
];

// ── Helpers ───────────────────────────────────

/**
 * Generate a human-readable domain label from a DomainTemplate.
 *
 * Extracts the descriptive part of the tagline template, stripping
 * the project name interpolation. This replaces the old behavior of
 * using domain.id (e.g., "ai-saas/support-platform") as the label,
 * which caused template-like output in generated projects.
 *
 * For the generic template, returns "Software Platform" — a professional
 * fallback that doesn't imply any specific domain.
 *
 * Examples:
 *   generic → "Software Platform"
 *   "Online marketplace connecting buyers and sellers — ${name}"
 *     → "Online marketplace connecting buyers and sellers"
 *   "AI-powered support platform — ${name} helps support teams..."
 *     → "AI-powered support platform"
 *   "${name} — professional plumbing website for local service businesses"
 *     → "Professional plumbing website for local service businesses"
 *   "AI-powered project management platform for software teams"
 *     → "AI-powered project management platform for software teams"
 */
function domainTemplateToLabel(template: { taglineTemplate: (name: string) => string; name: string }): string {
  // Generic template → professional fallback label
  if (template.name === "generic") {
    return "Software Platform";
  }

  const PLACEHOLDER = "__PLACEHOLDER__";
  const tagline = template.taglineTemplate(PLACEHOLDER);

  // Pattern 1: "<description> — <name><rest>" — extract everything before " — <name>"
  // e.g., "Online marketplace connecting buyers and sellers — __PLACEHOLDER__"
  // e.g., "AI-powered support platform — __PLACEHOLDER__ helps support teams resolve tickets faster"
  const patternA = tagline.match(new RegExp(`^(.+?)\\s*[—–-]\\s*${PLACEHOLDER}(?:\\s|$|\\.)`));
  if (patternA) {
    return patternA[1].trim();
  }

  // Pattern 2: "<name> — <description>" — extract everything after "<name> — "
  // e.g., "__PLACEHOLDER__ — professional plumbing website for local service businesses"
  const patternB = tagline.match(new RegExp(`^${PLACEHOLDER}\\s*[—–-]\\s*(.+)$`));
  if (patternB) {
    const label = patternB[1].trim();
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  // Pattern 3: No name interpolation — use the full tagline
  if (!tagline.includes(PLACEHOLDER)) {
    return tagline;
  }

  // Pattern 4: Fallback — remove placeholder and clean up
  const cleaned = tagline.replace(new RegExp(PLACEHOLDER, "g"), "").replace(/\s*[—–-]\s*/g, " ").trim();
  if (cleaned.length > 0) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Last resort: human-readable version of the template name
  return template.name
    .split(/[/\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function isDutchRejectWord(word: string): boolean {
  return DUTCH_REJECT_WORDS.has(word.toLowerCase().trim());
}

function isContaminatedName(value: string): boolean {
  const lower = value.toLowerCase().trim();
  return CONTAMINATION_PATTERNS.some((p) => p.test(lower));
}

// ── 1. Project Name Extraction ────────────────

function extractProjectName(text: string): string | null {
  if (!text || text.trim().length === 0) return null;

  // Pattern 1: Quoted name (highest confidence)
  const dqMatch = text.match(/["""]([A-Za-z0-9_\-\s]{2,60}?)["""]/);
  if (dqMatch) {
    const name = dqMatch[1].trim();
    if (name.length >= 2 && !isDutchRejectWord(name) && !isContaminatedName(name)) return name;
  }
  const sqMatch = text.match(/(?<=\s|^|,)[']([A-Za-z0-9_\-\s]{2,60}?)['](?=\s|[.,;!?]|$)/);
  if (sqMatch) {
    const name = sqMatch[1].trim();
    if (name.length >= 2 && !isDutchRejectWord(name) && !isContaminatedName(name)) return name;
  }

  // Pattern 2: "Ik wil X bouwen/maken/ontwikkelen" (Dutch)
  const ikWilMatch = text.match(/ik\s+wil\s+(?:een\s+|de\s+|het\s+)?([A-Za-z][A-Za-z0-9_\-\s]{1,50}?)\s+(?:bouwen|maken|ontwikkelen|creëren|realiseren|starten|lanceren|opzetten)/i);
  if (ikWilMatch) {
    const name = ikWilMatch[1].trim();
    const capitalized = name.replace(/\b[a-z]/g, (c) => c.toUpperCase());
    if (capitalized.length >= 2 && !isDutchRejectWord(capitalized) && !isContaminatedName(capitalized)) return capitalized;
  }

  // Pattern 3: "I want to build/create/make/develop X" (English)
  const iWantMatch = text.match(/i\s+want\s+to\s+(?:build|create|make|develop|start|launch|set\s+up)\s+([A-Z][A-Za-z0-9_\-\s]{1,50}?)(?:[.,;!?]|\s+(?:for|to|that|which|with|a|an|the|and|or|but|because|so|where|is|was|will|can|should|would|works|offers|makes|provides|uses|gives|lets|helps|focus|aims)|$)/i);
  if (iWantMatch) {
    const name = iWantMatch[1].trim();
    if (name.length >= 2 && !isDutchRejectWord(name) && !isContaminatedName(name)) return name;
  }

  // Pattern 4: "project heet X" / "project naam is X" (Dutch)
  const heetMatch = text.match(/(?:project|platform|app|tool|systeem|website|applicatie)\s+(?:heet|naam\s+is|noemt|genaamd)\s+([A-Z][A-Za-z0-9_\-\s]{1,50}?)(?:[.,;!?]|\s+(?:en|of|maar|want|dus|die|dat|met|voor|om|een|de|het|is|wordt|heeft|moet|kan|zal)|$)/i);
  if (heetMatch) {
    const name = heetMatch[1].trim();
    if (name.length >= 2 && !isDutchRejectWord(name) && !isContaminatedName(name)) return name;
  }

  // Pattern 5: "de naam is X" / "de naam wordt X" (Dutch)
  const naamMatch = text.match(/(?:de\s+)?naam\s+(?:is|wordt|lijkt|zou\s+zijn)\s+([A-Z][A-Za-z0-9_\-\s]{1,50}?)(?:[.,;!?]|\s+(?:en|of|maar|want|dus|die|dat|met|voor|om|een|de|het|is|wordt|heeft|moet|kan|zal)|$)/i);
  if (naamMatch) {
    const name = naamMatch[1].trim();
    if (name.length >= 2 && !isDutchRejectWord(name) && !isContaminatedName(name)) return name;
  }

  // Pattern 6: "genaamd X" (Dutch)
  const genaamdMatch = text.match(/genaamd\s+([A-Z][A-Za-z0-9_\-\s]{1,40}?)(?:[.,;!?]|\s+(?:voor|om|die|dat|met|een|de|het|en|of|maar|want|dus|zodat|waarbij|waar|is|wordt|heeft|moet|kan|zal|gaat|zou|werkt|biedt|maakt|ondersteunt|gebruikt|levert|geeft|laat|zorgt|richt)|$)/i);
  if (genaamdMatch) {
    const name = genaamdMatch[1].trim();
    if (name.length >= 2 && !isDutchRejectWord(name) && !isContaminatedName(name)) return name;
  }

  // Pattern 7: "called X" or "named X" (English)
  const calledMatch = text.match(/(?:called|named)\s+([A-Z][A-Za-z0-9_\-\s]{1,40}?)(?:[.,;!?]|\s+(?:for|to|that|which|with|a|an|the|and|or|but|because|so|where|is|was|will|can|should|would|works|offers|makes|provides|uses|gives|lets|helps|focus|aims)|$)/i);
  if (calledMatch) {
    const name = calledMatch[1].trim();
    if (name.length >= 2 && !isDutchRejectWord(name) && !isContaminatedName(name)) return name;
  }

  // Pattern 8: "X wordt een ..." (Dutch)
  const wordtMatch = text.match(/([A-Z][A-Za-z0-9_\-\s]{1,40}?)\s+wordt\s+een\s+/i);
  if (wordtMatch) {
    const name = wordtMatch[1].trim();
    if (/^(het|de|een|dit|dat|we|ze|hij|zij|onze|jullie|hun|mijn|uw|geen|alle|beide|elke|ieder|verschillende|sommige|dergelijke|gebruikers|platform|website|systeem|applicatie|tool|app)(?:\s|$)/i.test(name)) return null;
    if (isDutchRejectWord(name)) return null;
    if (name.length < 3) return null;
    if (!isContaminatedName(name)) return name;
  }

  // Pattern 9: "X is een ..." (Dutch)
  const isEenMatch = text.match(/([A-Z][A-Za-z0-9_\-\s]{1,40}?)\s+is\s+een\s+/i);
  if (isEenMatch) {
    const name = isEenMatch[1].trim();
    if (/^(het|de|een|dit|dat|we|ze|hij|zij|onze|jullie|hun|mijn|uw|geen|alle|beide|elke|ieder|verschillende|sommige|dergelijke|gebruikers|platform|website|systeem|applicatie|tool|app)(?:\s|$)/i.test(name)) return null;
    if (isDutchRejectWord(name)) return null;
    if (name.length < 3) return null;
    if (!isContaminatedName(name)) return name;
  }

  // Pattern 10: "X helpt ..." (Dutch)
  const helptMatch = text.match(/([A-Z][A-Za-z0-9_\-\s]{1,30}?)\s+helpt\s+/i);
  if (helptMatch) {
    const name = helptMatch[1].trim();
    if (/[,.]/.test(name)) return null;
    if (/^(het|de|een|dit|dat|we|ze|hij|zij|onze|jullie|hun|mijn|uw|geen|alle|beide|elke|ieder|verschillende|sommige|dergelijke|gebruikers|platform|website|systeem|applicatie|tool|app)(?:\s|$)/i.test(name)) return null;
    if (isDutchRejectWord(name)) return null;
    if (name.length < 3 || name.length > 30) return null;
    if (!isContaminatedName(name)) return name;
  }

  // Pattern 11: "Build X" / "Create X" / "Develop X" at sentence start
  const buildMatch = text.match(/^(?:build|create|make|develop)\s+([A-Z][A-Za-z0-9_\-\s]{1,50}?)(?:[.,;!?]|\s+(?:for|to|that|which|with|a|an|the|and|or|but|because|so|where|is|was|will|can|should|would)|$)/i);
  if (buildMatch) {
    const name = buildMatch[1].trim();
    if (name.length >= 2 && !isDutchRejectWord(name) && !isContaminatedName(name)) return name;
  }

  // Pattern 12: "We are building X" (English, plural)
  const weAreMatch = text.match(/we\s+are\s+(?:building|creating|developing|making|establishing|starting|launching|setting\s+up)\s+([A-Z][A-Za-z0-9_\-\s]{1,50}?)(?:[.,;!?]|\s+(?:for|to|that|which|with|a|an|the|and|or|but|because|so|where|is|was|will|can|should|would|works|offers|makes|provides|uses|gives|lets|helps|focus|aims)|$)/i);
  if (weAreMatch) {
    const name = weAreMatch[1].trim();
    if (name.length >= 2 && !isDutchRejectWord(name) && !isContaminatedName(name)) return name;
  }

  // Pattern 13: "We zijn X aan het bouwen" (Dutch, plural)
  const weZijnMatch = text.match(/we\s+zijn\s+([A-Za-z][A-Za-z0-9_\-\s]{1,50}?)\s+aan\s+het\s+(?:bouwen|maken|ontwikkelen|creëren|realiseren|starten|lanceren|opzetten)/i);
  if (weZijnMatch) {
    const name = weZijnMatch[1].trim();
    const capitalized = name.replace(/\b[a-z]/g, (c) => c.toUpperCase());
    if (capitalized.length >= 2 && !isDutchRejectWord(capitalized) && !isContaminatedName(capitalized)) return capitalized;
  }

  // Pattern 14: "We gaan X bouwen" (Dutch)
  const weGaanMatch = text.match(/we\s+gaan\s+([A-Za-z][A-Za-z0-9_\-\s]{1,50}?)\s+(?:bouwen|maken|ontwikkelen|creëren|realiseren|starten|lanceren|opzetten)/i);
  if (weGaanMatch) {
    const name = weGaanMatch[1].trim();
    const capitalized = name.replace(/\b[a-z]/g, (c) => c.toUpperCase());
    if (capitalized.length >= 2 && !isDutchRejectWord(capitalized) && !isContaminatedName(capitalized)) return capitalized;
  }

  return null;
}

// ── 2. Target Users Extraction ────────────────

function extractTargetUsers(text: string): string[] {
  if (!text || text.trim().length === 0) return [];

  const sectionMatch = text.match(
    /(?:primary\s+users|target\s+users|target\s+audience|users\s+are|gebruikers\s+zijn|doelgroep\s+is|doelgroep\s+zijn|voor\s+wie|bedoeld\s+voor)(?:\s+are|\s+is|\s+include|\s*:|-\s*)?\s+(.+?)(?:\.(?:\s+[A-Z]|$)|$)/i
  );

  if (!sectionMatch) return [];

  const targetText = sectionMatch[1];

  const items = targetText
    .split(/\s*[,;•\n]\s*|\s+(?:en|and)\s+/i)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => item.replace(/[.,;!?]+$/, "").trim())
    .map((item) =>
      item
        .replace(/^(?:and\s+|the primary users are\s+|the target audience (?:includes|is)\s+|the main users are\s+|the end users are\s+|the intended users are\s+)/i, "")
        .trim()
    )
    .filter((item) => item.length > 0)
    .filter((item) => item.length < 80)
    .filter((item) => !/^(?:the\s+|a\s+|an\s+|het\s+|een\s+|de\s+)?(?:website|platform|system|tool|app|project|solution|product)\s+/i.test(item))
    .filter((item) => {
      const lower = item.toLowerCase();
      return !(/\b(?:is|are|was|were|hebben|zijn|moeten|kunnen|willen|worden|bieden|gebruiken|heeft|moet|kan|zal|wordt|biedt|gebruikt)\s/i.test(lower) && item.split(/\s+/).length > 4);
    });

  return normalizeArray(
    items.map((item) => item.charAt(0).toUpperCase() + item.slice(1))
  );
}

// ── 3. MVP Features Extraction ────────────────

function extractMvpFeatures(text: string): string[] {
  if (!text || text.trim().length === 0) return [];

  const sectionMatch = text.match(
    /(?:bevatten|bevat\b|includes?\b|have\b|has\b|moet\s+.*?bevatten|bestaat\s+uit|bestaan\s+uit|features?\s*(?::|are|include|-\s*)|pages?\s*(?::|are|include|-\s*)|sections?\s*(?::|are|include|-\s*)|should\s+include|site\s+should\s+include)(.+?)(?:\.\s+[A-Z]|\.\s*$|$)/i
  );

  if (!sectionMatch) return [];

  const featureText = sectionMatch[1];

  const items = featureText
    .split(/\s*[,;•\n]\s*|\s+\d+\.\s+|\s+(?:en|and)\s+/i)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => item.replace(/^and\s+/i, "").trim())
    .map((item) => item.replace(/^en\s+/i, "").trim())
    .map((item) => item.replace(/[.,;!?]+$/, "").trim())
    .filter((item) => item.length < 100)
    .filter((item) => !/^(?:the\s+|a\s+|an\s+)?(?:website|platform|system|tool|app|project)\s+(?:should|will|must|would|can|needs\s+to)/i.test(item))
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1));

  return normalizeArray(items);
}

// ── 4. Tech Stack Extraction ──────────────────

function extractTechStack(text: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();

  let cleanText = text;
  for (const header of TECH_SECTION_HEADERS) {
    cleanText = cleanText.replace(header, "");
  }

  const lower = cleanText.toLowerCase();

  for (const tech of KNOWN_TECH) {
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

  // Also try colon-delimited sections
  const colonSectionPattern = /^[A-Za-z/]+\s*:\s*(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = colonSectionPattern.exec(text)) !== null) {
    const sectionContent = match[1].trim();
    const items = sectionContent
      .split(/\s*[,;•\n]\s*|\s+(?:en|and)\s+/i)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => item.replace(/[.,;!?]+$/, "").trim());

    for (const item of items) {
      const itemLower = item.toLowerCase();
      for (const tech of KNOWN_TECH) {
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

// ── 5. Integrations Extraction ────────────────

function extractIntegrations(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();

  for (const integration of KNOWN_INTEGRATIONS) {
    if (lower.includes(integration)) {
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

// ── 6. Constraints Extraction ─────────────────

function extractConstraints(text: string): string[] {
  const constraints: string[] = [];
  const lower = text.toLowerCase();

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

// ── 7. Goals Extraction ───────────────────────

function extractGoals(text: string): string[] {
  const goals: string[] = [];
  const goalSections = text.split(/[.!?]+/);

  for (const sentence of goalSections) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

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

// ── 8. Risks Extraction ───────────────────────

function extractRisks(text: string): string[] {
  const risks: string[] = [];
  const lower = text.toLowerCase();

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

// ── 9. Entities Extraction ────────────────────

function extractEntities(domain: string): string[] {
  const domainEntities: Record<string, string[]> = {
    plumbing: ["Customer", "Quote", "Service", "Review", "Appointment", "Invoice"],
    fitness: ["User", "Workout", "Exercise", "Progress", "Goal", "Subscription"],
    "project-management": ["Task", "Project", "User", "Team", "Integration", "Sprint"],
    crm: ["Contact", "Deal", "Activity", "Pipeline", "Report", "User"],
    travel: ["Trip", "Destination", "Itinerary", "Budget", "User", "Activity"],
    restaurant: ["Reservation", "Order", "MenuItem", "Table", "Customer", "Payment"],
    "solar-energy": ["Customer", "Quote", "Project", "Panel", "Installation", "Invoice"],
    emulator: ["Rom", "EmulatorCore", "SaveState", "Game", "ControllerConfig"],
    marketplace: ["User", "Product", "Order", "Review", "Category"],
    healthcare: ["Patient", "Appointment", "MedicalRecord", "Prescription", "Doctor"],
    education: ["Student", "Course", "Module", "Quiz", "Certificate"],
    construction: ["Project", "Task", "Material", "TeamMember", "Document"],
    agency: ["Client", "Project", "TimeEntry", "Invoice", "TeamMember"],
    "ai-saas": ["User", "Model", "Prompt", "Result", "UsageRecord"],
    website: ["Page", "BlogPost", "ContactInquiry", "PortfolioItem"],
  };

  return domainEntities[domain] || ["User", "Organization"];
}

// ── 10. Domain Detection ──────────────────────

function detectDomain(text: string): CanonicalDomain {
  const domainTemplate = detectDomainFromText(text);

  // Build multi-domain scores from keyword matching
  const scores: Record<string, number> = {};
  scores[domainTemplate.name] = domainTemplate.name === "generic" ? 0 : 0.75;

  return {
    id: domainTemplate.name,
    scores,
    evidence: domainTemplate.name === "generic"
      ? ["No clear domain detected from text"]
      : [`Domain "${domainTemplate.name}" matched via keyword analysis`],
    confidence: domainTemplate.name === "generic" ? 0 : 75,
    source: "deterministic",
  };
}

// ── 11. Category Mapping ──────────────────────

function mapDomainToCategory(domainId: string): string {
  const categoryMap: Record<string, string> = {
    "ai-saas/support-platform": "ai_saas",
    "ai-saas": "ai_saas",
    emulator: "gaming",
    marketplace: "ecommerce",
    restaurant: "hospitality",
    healthcare: "medical",
    education: "education",
    fitness: "health",
    construction: "construction",
    agency: "services",
    crm: "sales",
    website: "web",
    plumbing: "services",
    "project-management": "software",
    travel: "travel",
    "solar-energy": "energy",
  };
  return categoryMap[domainId] || "software";
}

// ── 12. Tech Item Categorization ──────────────

function categorizeTechItem(tech: string): CanonicalTechItem["category"] {
  const lower = tech.toLowerCase();

  const languageSet = new Set(["typescript", "javascript", "python", "rust", "go", "java", "kotlin", "swift", "c#", "c++", "ruby", "php", "scala", "elixir", "clojure", "haskell", "dart", "lua", "webassembly"]);
  const frontendSet = new Set(["react", "vue", "angular", "svelte", "solid", "solidjs", "solidstart", "qwik", "astro", "remix", "next.js", "nextjs", "nuxt", "tailwind", "tailwind css", "bootstrap", "shadcn", "material ui", "chakra", "vite"]);
  const backendSet = new Set(["node", "node.js", "deno", "bun", "express", "fastify", "django", "flask", "fastapi", "spring", "spring boot", "rails", "laravel", "asp.net", "blazor", "nestjs"]);
  const databaseSet = new Set(["postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite", "cockroachdb", "planetscale", "neon", "turso", "upstash", "prisma", "typeorm", "drizzle"]);
  const infraSet = new Set(["docker", "kubernetes", "aws", "azure", "gcp", "cloudflare", "cloudflare workers", "cloudflare pages", "fly.io", "railway", "render"]);
  const deploySet = new Set(["vercel", "netlify", "github actions", "ci/cd", "terraform", "ansible", "helm"]);
  const integrationSet = new Set(["stripe", "paypal", "twilio", "sendgrid", "resend", "clerk", "auth0", "openai", "anthropic", "firebase", "supabase", "graphql", "apollo", "trpc", "rest", "grpc", "websocket"]);

  if (languageSet.has(lower)) return "language";
  if (frontendSet.has(lower)) return "frontend";
  if (backendSet.has(lower)) return "backend";
  if (databaseSet.has(lower)) return "database";
  if (infraSet.has(lower)) return "infrastructure";
  if (deploySet.has(lower)) return "deployment";
  if (integrationSet.has(lower)) return "integration";
  return "tool";
}

// ── MAIN ENTRY POINT ──────────────────────────

/**
 * Extract canonical project information using deterministic
 * (regex-based) extraction.
 *
 * This is the FALLBACK path. Always works, no API keys needed.
 *
 * @param rawText - The raw conversational text
 * @param preferredTech - Optional array of explicitly mentioned tech from ProjectRequirements
 * @returns A complete CanonicalExtractionResult
 */
export function extractDeterministic(
  rawText: string,
  preferredTech?: string[],
): CanonicalExtractionResult {
  const text = rawText.trim();
  const warnings: string[] = [];
  const source: ExtractionSource = "deterministic";

  // 1. Extract project name
  const projectName = extractProjectName(text) || "New Software Project";
  if (projectName === "New Software Project") {
    warnings.push("Could not extract project name from input.");
  }

  // 2. Detect domain
  const domain = detectDomain(text);

  // 3. Extract target users
  const userStrings = extractTargetUsers(text);
  if (userStrings.length === 0) {
    warnings.push("Could not extract target users from input.");
  }

  // 4. Extract MVP features
  const featureStrings = extractMvpFeatures(text);
  if (featureStrings.length === 0) {
    warnings.push("Could not extract MVP features from input.");
  }

  // 5. Extract tech stack from raw text
  const techStrings = extractTechStack(text);

  // 5b. Merge with preferredTech if provided (from ProjectRequirements)
  // This ensures explicitly mentioned tech is never lost, even if the
  // raw text scanner misses it (e.g., TimescaleDB, Grafana, Prometheus)
  if (preferredTech && preferredTech.length > 0) {
    const seen = new Set(techStrings.map((t) => t.toLowerCase()));
    for (const tech of preferredTech) {
      const lower = tech.toLowerCase().trim();
      if (!lower) continue;
      if (!seen.has(lower)) {
        seen.add(lower);
        // Capitalize properly
        const canonical = lower
          .split(/[\s-]+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        techStrings.push(canonical);
      }
    }
  }

  // 6. Extract integrations
  const integrationStrings = extractIntegrations(text);

  // 7. Extract constraints
  const constraintStrings = extractConstraints(text);

  // 8. Extract goals
  const goalStrings = extractGoals(text);

  // 9. Extract risks
  const riskStrings = extractRisks(text);

  // 10. Extract entities
  const entityStrings = extractEntities(domain.id);

  // 11. Build domain template for semantic generation
  const domainTemplate = detectDomainFromText(text);

  // 12. Derive architecture
  const componentTree = deriveSemanticComponentTree(domainTemplate, featureStrings);
  const dataFlow = deriveSemanticDataFlow(domainTemplate);
  const architecturePattern = deriveArchitecturePattern(domainTemplate);

  // 13. Derive roadmap
  const roadmapPhases = generateSemanticRoadmap(domainTemplate, featureStrings);

  // ── Build canonical objects ─────────────────

  const personas: CanonicalPersona[] = userStrings.map((name) => ({
    name,
    confidence: 75,
  }));

  const features: CanonicalFeature[] = featureStrings.map((name) => ({
    name,
    confidence: 70,
  }));

  const techItems: CanonicalTechItem[] = techStrings.map((name) => ({
    name,
    category: categorizeTechItem(name),
    canonicalName: name,
    confidence: 80,
  }));

  const roadmapPhasesCanonical: CanonicalRoadmapPhase[] = roadmapPhases.map((phase) => ({
    title: phase.title,
    tasks: phase.tasks.map((t) => t.title),
    confidence: 70,
  }));

  // ── Build identity ──────────────────────────
  // v0.6: Generate a descriptive domainLabel from the domain template.
  // Previously used domain.id (template ID like "ai-saas/support-platform")
  // which caused template-like output in generated projects.
  // Now generates a human-readable label from the domain template's name.
  //
  // v0.8: Generic-first fallback.
  // When domain is generic (no template matched), templateId is set to empty
  // string so downstream never thinks a real template was chosen.
  const domainLabel = domainTemplateToLabel(domainTemplate);
  const isGeneric = domain.id === "generic";

  const identity: CanonicalIdentity = {
    projectName,
    domainLabel,
    domainCategory: mapDomainToCategory(domain.id),
    domain,
    projectType: "website",
    category: mapDomainToCategory(domain.id),
    templateId: isGeneric ? "" : domain.id,
    confidence: domain.confidence,
    source,
  };

  // ── Calculate confidence ────────────────────

  const confidenceByField: Record<string, number> = {
    identity: domain.confidence,
    users: personas.length > 0 ? Math.min(100, personas.length * 25) : 0,
    mvpFeatures: features.length > 0 ? Math.min(100, features.length * 10) : 0,
    techStack: techItems.length > 0 ? Math.min(100, techItems.length * 15) : 0,
    architecture: (componentTree ? 40 : 0) + (dataFlow ? 30 : 0) + (domain.id !== "generic" ? 30 : 0),
    roadmap: roadmapPhasesCanonical.length > 0 ? 80 : 0,
  };

  const overallConfidence = Math.round(
    (confidenceByField.identity * 0.20 +
      confidenceByField.users * 0.15 +
      confidenceByField.mvpFeatures * 0.20 +
      confidenceByField.techStack * 0.10 +
      confidenceByField.architecture * 0.15 +
      confidenceByField.roadmap * 0.20)
  );

  return {
    identity,
    users: {
      personas,
      source,
      confidence: confidenceByField.users,
    },
    mvpFeatures: {
      features,
      source,
      confidence: confidenceByField.mvpFeatures,
    },
    techStack: {
      items: techItems,
      source,
      confidence: confidenceByField.techStack,
    },
    architecture: {
      pattern: architecturePattern,
      componentTree,
      dataFlow,
      confidence: confidenceByField.architecture,
      source,
    },
    roadmap: {
      phases: roadmapPhasesCanonical,
      source,
      confidence: confidenceByField.roadmap,
    },
    integrations: {
      items: integrationStrings.map((name) => ({ name, confidence: 80 })),
      source,
      confidence: integrationStrings.length > 0 ? 80 : 0,
    },
    constraints: {
      items: constraintStrings.map((description) => ({ description, confidence: 80 })),
      source,
      confidence: constraintStrings.length > 0 ? 80 : 0,
    },
    goals: {
      items: goalStrings.map((description) => ({ description, confidence: 70 })),
      source,
      confidence: goalStrings.length > 0 ? 70 : 0,
    },
    risks: {
      items: riskStrings.map((description) => ({ description, confidence: 70 })),
      source,
      confidence: riskStrings.length > 0 ? 70 : 0,
    },
    entities: {
      items: entityStrings.map((name) => ({ name, confidence: 75 })),
      source,
      confidence: entityStrings.length > 0 ? 75 : 0,
    },
    overallConfidence,
    confidenceByField,
    warnings,
    source,
  };
}
