// ──────────────────────────────────────────────
// architectureInsights — presentation-layer helpers
// for Step 3: AI Architecture Insights
//
// These helpers derive UI-friendly data from the
// existing ArchitectureAnalysis model.
// NO model changes — presentation only.
// ──────────────────────────────────────────────

import type {
  ArchitectureAnalysis,
  ArchitectRisk,
  ComplexityLevel,
} from "../models/architectureAnalysis";

// ── Types ─────────────────────────────────────

export interface Strength {
  label: string;
  icon: string;
}

export type ReadinessLevel = "ready" | "minor-refinements" | "needs-work";

export interface ValidationItem {
  label: string;
  passed: boolean;
}

export interface RefinementGroup {
  designDecisions: ArchitectRisk[];
  architecturalRisks: ArchitectRisk[];
}

export type QualitativeConfidence = "high" | "medium" | "needs-info";

// ── Derive strengths ──────────────────────────
//
// Only generates strengths from actual data.
// If no meaningful strengths exist, returns empty array.
// NEVER fabricates positive observations.

export function deriveStrengths(analysis: ArchitectureAnalysis): Strength[] {
  const strengths: Strength[] = [];

  // Executive summary exists and is substantive
  if (analysis.executiveSummary.length > 50) {
    strengths.push({ label: "Project vision clearly articulated", icon: "🎯" });
  }

  // Architecture pattern identified
  if (analysis.suggestedArchitecture && analysis.suggestedArchitecture.length > 10) {
    strengths.push({ label: "Architecture pattern identified", icon: "🏗️" });
  }

  // Tech stack has recommendations
  const stack = analysis.suggestedStack;
  if (stack.frontend || stack.backend || stack.database) {
    strengths.push({ label: "Technology stack evaluated", icon: "⚙️" });
  }

  // Trade-offs documented
  if (analysis.tradeoffs.length > 0) {
    strengths.push({ label: "Architectural trade-offs documented", icon: "⚖️" });
  }

  // Core features identified
  if (analysis.functionalAnalysis.coreFeatures.length > 0) {
    strengths.push({ label: "Core features identified", icon: "📋" });
  }

  // User flows identified
  if (analysis.functionalAnalysis.userFlows.length > 0) {
    strengths.push({ label: "User flows mapped", icon: "🔄" });
  }

  // Security considerations
  if (analysis.technicalAnalysis.security && analysis.technicalAnalysis.security.length > 20) {
    strengths.push({ label: "Security considerations included", icon: "🔒" });
  }

  // Compliance mentioned in executive summary
  if (analysis.executiveSummary.toLowerCase().includes("compliance") ||
      analysis.executiveSummary.toLowerCase().includes("regulation")) {
    strengths.push({ label: "Compliance considerations included", icon: "✅" });
  }

  return strengths;
}

// ── Derive validation status ──────────────────

export function deriveValidationItems(analysis: ArchitectureAnalysis): ValidationItem[] {
  const items: ValidationItem[] = [];

  // Requirements consistency
  const hasRequirements = analysis.functionalAnalysis.coreFeatures.length > 0 ||
    analysis.functionalAnalysis.userFlows.length > 0;
  items.push({
    label: "Requirements are internally consistent",
    passed: hasRequirements,
  });

  // Stack matches goals
  const hasStack = !!(
    analysis.suggestedStack.frontend ||
    analysis.suggestedStack.backend ||
    analysis.suggestedStack.database
  );
  items.push({
    label: "Recommended stack aligns with project goals",
    passed: hasStack,
  });

  // No conflicting decisions
  const hasUnresolvedTradeoffs = analysis.tradeoffs.some((t) => t.chosen === "neither");
  items.push({
    label: "No conflicting architectural decisions detected",
    passed: !hasUnresolvedTradeoffs,
  });

  // Architecture defined
  const hasArchitecture = !!(analysis.suggestedArchitecture && analysis.suggestedArchitecture.length > 10);
  items.push({
    label: "Architecture pattern is defined",
    passed: hasArchitecture,
  });

  // Risks have mitigations
  const risksWithoutMitigation = analysis.risks.filter((r) => !r.mitigation);
  items.push({
    label: "Identified risks have mitigation strategies",
    passed: risksWithoutMitigation.length === 0,
  });

  return items;
}

// ── Derive readiness level ────────────────────

export function deriveReadiness(analysis: ArchitectureAnalysis): ReadinessLevel {
  const strengths = deriveStrengths(analysis);
  const validation = deriveValidationItems(analysis);
  const passedCount = validation.filter((v) => v.passed).length;
  const totalCount = validation.length;

  // If most validations pass and we have strengths, it's ready
  if (passedCount >= totalCount - 1 && strengths.length >= 2) {
    return "ready";
  }

  // If some validations pass, minor refinements
  if (passedCount >= Math.ceil(totalCount / 2)) {
    return "minor-refinements";
  }

  // Otherwise needs work
  return "needs-work";
}

// ── Qualitative confidence ────────────────────

export function deriveQualitativeConfidence(analysis: ArchitectureAnalysis): QualitativeConfidence {
  // Use the existing numerical confidence to derive qualitative
  const c = analysis.confidence;

  if (c >= 60) return "high";
  if (c >= 30) return "medium";
  return "needs-info";
}

// ── Group refinements ─────────────────────────
//
// Splits risks into two categories:
// - Design Decisions: missing choices (no stack, no auth, etc.)
// - Architectural Risks: actual technical risks

export function groupRefinements(risks: ArchitectRisk[]): RefinementGroup {
  const designDecisions: ArchitectRisk[] = [];
  const architecturalRisks: ArchitectRisk[] = [];

  // Keywords that suggest a missing design choice rather than a risk
  const designKeywords = [
    "no ", "missing ", "not defined", "not specified",
    "not selected", "not chosen", "undecided", "undefined",
    "no architecture", "no stack", "no framework",
    "no database", "no authentication", "no deployment",
    "no testing", "no monitoring", "no ci/cd",
    "needs to be defined", "needs to be decided",
    "has not been", "have not been",
  ];

  for (const risk of risks) {
    const text = `${risk.category} ${risk.description}`.toLowerCase();
    const isDesignDecision = designKeywords.some((kw) => text.includes(kw));

    if (isDesignDecision) {
      designDecisions.push(risk);
    } else {
      architecturalRisks.push(risk);
    }
  }

  return { designDecisions, architecturalRisks };
}

// ── Complexity label ──────────────────────────

export function complexityLabel(level: ComplexityLevel): string {
  switch (level) {
    case "very-high": return "Significant";
    case "high": return "High";
    case "medium": return "Moderate";
    case "low": return "Low";
    default: return level;
  }
}

// ── Readiness label and color ─────────────────

export function readinessDisplay(level: ReadinessLevel): { label: string; color: string; bg: string } {
  switch (level) {
    case "ready":
      return {
        label: "Ready for implementation",
        color: "text-green-400",
        bg: "bg-green-900/20 border-green-700/40",
      };
    case "minor-refinements":
      return {
        label: "Minor refinements recommended before implementation",
        color: "text-amber-400",
        bg: "bg-amber-900/20 border-amber-700/40",
      };
    case "needs-work":
      return {
        label: "Needs additional definition before implementation",
        color: "text-indigo-400",
        bg: "bg-indigo-900/20 border-indigo-700/40",
      };
  }
}

// ── Confidence display ────────────────────────

export function confidenceDisplay(level: QualitativeConfidence): { label: string; color: string; bg: string } {
  switch (level) {
    case "high":
      return {
        label: "High",
        color: "text-green-400",
        bg: "bg-green-900/20 border-green-700/40",
      };
    case "medium":
      return {
        label: "Medium",
        color: "text-amber-400",
        bg: "bg-amber-900/20 border-amber-700/40",
      };
    case "needs-info":
      return {
        label: "Needs additional information",
        color: "text-indigo-400",
        bg: "bg-indigo-900/20 border-indigo-700/40",
      };
  }
}
