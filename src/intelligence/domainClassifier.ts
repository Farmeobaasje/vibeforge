// ──────────────────────────────────────────────
// domainClassifier — detects project domain and
// project type from raw text keywords.
//
// REFACTORED: Domain taxonomy is now imported
// from the Semantic Layer (domainTemplates.ts).
// This file is the single source of truth for
// project type and language detection only.
// ──────────────────────────────────────────────

import type { DomainInfo, ProjectType } from "./types";
import { detectDomainFromText, getDomainTemplate } from "../semantic/domainTemplates";

// ── Public API ─────────────────────────────────

/**
 * Detect the project domain from raw text.
 * Delegates to the Semantic Layer's unified taxonomy.
 * Returns a DomainInfo-compatible object.
 */
export function detectDomain(text: string): DomainInfo {
  const template = detectDomainFromText(text);
  return {
    name: template.name,
    keywords: template.keywords,
    taglineTemplate: template.taglineTemplate,
    componentTemplates: template.componentTemplates,
    dataFlowTemplate: template.dataFlowTemplate,
    roadmapPhases: template.roadmapPhases,
  };
}

/**
 * Detect project type from raw text.
 */
export function detectProjectType(text: string): ProjectType {
  const lower = text.toLowerCase();

  if (
    lower.includes("mobile") || lower.includes("app") ||
    lower.includes("ios") || lower.includes("android") ||
    lower.includes("phone") || lower.includes("tablet")
  ) {
    return "mobile";
  }
  if (
    lower.includes("api") || lower.includes("backend") ||
    lower.includes("microservice") || lower.includes("rest")
  ) {
    return "api";
  }
  if (
    lower.includes("desktop") || lower.includes("electron") ||
    lower.includes("native app")
  ) {
    return "desktop";
  }
  if (
    lower.includes("saas") || lower.includes("platform") ||
    lower.includes("dashboard") || lower.includes("portal")
  ) {
    return "saas";
  }
  return "website";
}

/**
 * Detect input language (Dutch or English).
 */
export function detectLanguage(text: string): "nl" | "en" {
  const lower = text.toLowerCase();

  // Dutch-specific patterns
  const dutchIndicators = [
    "ik wil", "ik heb", "het is", "de ", "het ", "een ",
    "wordt", "bouwen", "maken", "ontwikkelen", "genaamd",
    "voor", "met", "maar", "ook", "nog", "dan", "als",
    "zijn", "hebben", "moeten", "kunnen", "zullen",
    "huiseigenaar", "verhuurder", "loodgieter",
  ];

  let dutchScore = 0;
  for (const indicator of dutchIndicators) {
    // Check if the indicator appears as a whole word or at start
    const regex = new RegExp(`\\b${indicator}\\b`, "i");
    if (regex.test(lower)) {
      dutchScore++;
    }
  }

  return dutchScore >= 3 ? "nl" : "en";
}

/**
 * Get all registered domain names.
 * Delegates to the Semantic Layer.
 */
export function getDomainNames(): string[] {
  // Return all domain names from the unified taxonomy
  const names: string[] = [];
  const allDomains = [
    "marketplace", "restaurant", "crm", "fitness", "construction",
    "agency", "healthcare", "education", "ai-saas", "ai-saas/support-platform",
    "emulator", "plumbing", "project-management", "travel", "solar-energy",
    "website",
  ];
  for (const name of allDomains) {
    const template = getDomainTemplate(name);
    if (template.name !== "generic") {
      names.push(template.name);
    }
  }
  return names;
}
