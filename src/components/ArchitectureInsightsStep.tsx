// ──────────────────────────────────────────────
// ArchitectureInsightsStep — Step 3: AI Architecture Insights
//
// Design Principle:
// "One screen first. Details on demand."
//
// Niveau 1: Executive dashboard — alles past op 1 scherm.
// Niveau 2: Accordions — details alleen zichtbaar als gebruiker klikt.
//
// This is a presentation-layer redesign only.
// NO changes to hooks, models, storage, or AI orchestration.
// ──────────────────────────────────────────────

import { useCallback, useMemo, useState } from "react";
import { useArchitectTrigger } from "../hooks/useArchitectTrigger";
import type {
  ArchitectRisk,
  Recommendation,
  Tradeoff,
} from "../models/architectureAnalysis";
import {
  deriveStrengths,
  deriveValidationItems,
  deriveReadiness,
  deriveQualitativeConfidence,
  groupRefinements,
  complexityLabel,
  readinessDisplay,
  confidenceDisplay,
} from "../lib/architectureInsights";
import ProjectStrengths from "./ProjectStrengths";
import DeveloperTools from "./DeveloperTools";

interface Props {
  onBack: () => void;
  onContinue: () => void;
}

// ── Helpers ──────────────────────────────────

function priorityBadge(priority: string): { label: string; color: string } {
  switch (priority) {
    case "essential": return { label: "Immediate", color: "bg-danger/10 text-danger border-danger/30" };
    case "recommended": return { label: "Recommended", color: "bg-info/10 text-info border-info/30" };
    case "optional": return { label: "Future", color: "bg-elevated text-muted border-app" };
    default: return { label: priority, color: "bg-elevated text-muted border-app" };
  }
}

function effortBadge(effort: string): { label: string; color: string } {
  switch (effort) {
    case "high": return { label: "Significant effort", color: "bg-warning/10 text-warning" };
    case "medium": return { label: "Moderate effort", color: "bg-warning/10 text-warning" };
    case "low": return { label: "Minimal effort", color: "bg-success/10 text-success" };
    default: return { label: effort, color: "bg-elevated text-muted" };
  }
}

function statusBadge(status: string): { label: string; color: string } {
  switch (status) {
    case "open": return { label: "Pending", color: "bg-warning/10 text-warning" };
    case "mitigated": return { label: "Mitigated", color: "bg-success/10 text-success" };
    case "accepted": return { label: "Accepted", color: "bg-info/10 text-info" };
    default: return { label: status, color: "bg-elevated text-muted" };
  }
}

// ── CollapsibleSection — generic accordion ────

function CollapsibleSection({
  title,
  icon,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-surface/50 border border-app rounded-xl mb-3 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-surface/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-base">{icon}</span>}
          <h3 className="text-sm font-semibold text-app">{title}</h3>
          {badge && (
            <span className="badge">{badge}</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 animate-slideIn">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Dashboard sub-components ─────────────────

function DashboardArchitecture({ architecture }: { architecture: string }) {
  if (!architecture || architecture.trim().length === 0) return null;
  const lines = architecture.trim().split("\n");
  const firstLine = lines[0].replace(/^[#*\-•]\s*/, "").trim();
  const rest = lines.slice(1).join("\n").trim();

  return (
    <div className="bg-brand/10 border border-brand/30 rounded-xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md bg-brand/10 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-brand-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-app">Architecture</h3>
      </div>
      <p className="text-lg font-bold text-brand-soft">{firstLine}</p>
      {rest && (
        <p className="text-xs text-muted mt-1 line-clamp-2">{rest}</p>
      )}
    </div>
  );
}

function DashboardRecommendation({ summary }: { summary: string }) {
  if (!summary || summary.length === 0) return null;
  // Take first 1-2 sentences for the dashboard
  const short = summary.split(/\.\s+/).slice(0, 2).join(". ") + (summary.split(/\.\s+/).length > 2 ? "." : "");

  return (
    <div className="bg-surface/50 border border-app rounded-xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">💡</span>
        <h3 className="text-sm font-semibold text-app">AI Recommendation</h3>
      </div>
      <p className="text-sm text-secondary leading-relaxed">{short}</p>
    </div>
  );
}

function DashboardTechStack({ stack }: { stack: { frontend?: string; backend?: string; database?: string; infrastructure?: string; ai?: string; testing?: string; monitoring?: string } }) {
  const items: { label: string; value: string }[] = [];
  if (stack.frontend) items.push({ label: "Frontend", value: stack.frontend });
  if (stack.backend) items.push({ label: "Backend", value: stack.backend });
  if (stack.database) items.push({ label: "Database", value: stack.database });
  if (stack.infrastructure) items.push({ label: "Infrastructure", value: stack.infrastructure });
  if (stack.ai) items.push({ label: "AI / ML", value: stack.ai });
  if (stack.testing) items.push({ label: "Testing", value: stack.testing });
  if (stack.monitoring) items.push({ label: "Monitoring", value: stack.monitoring });

  if (items.length === 0) return null;

  return (
    <div className="bg-surface/50 border border-app rounded-xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🛠️</span>
        <h3 className="text-sm font-semibold text-app">Technology</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1.5 text-xs text-secondary bg-elevated/60 border border-muted px-2.5 py-1 rounded-lg">
            <span className="text-[10px] font-semibold text-muted uppercase">{item.label}:</span>
            <span>{item.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function DashboardPlanning({
  complexity,
  timeline,
  featureCount,
}: {
  complexity: string;
  timeline?: string;
  featureCount?: number;
}) {
  return (
    <div className="bg-surface/50 border border-app rounded-xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">📊</span>
        <h3 className="text-sm font-semibold text-app">Planning</h3>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div>
          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Complexity</span>
          <p className="text-secondary font-medium mt-0.5">{complexity}</p>
        </div>
        {timeline && (
          <div>
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Timeline</span>
            <p className="text-secondary font-medium mt-0.5">{timeline}</p>
          </div>
        )}
        {featureCount !== undefined && featureCount > 0 && (
          <div>
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Core Features</span>
            <p className="text-secondary font-medium mt-0.5">{featureCount} identified</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Accordion content components ─────────────

function AccordionArchitectureDetails({ architecture }: { architecture: string }) {
  if (!architecture || architecture.trim().length === 0) return <p className="text-sm text-muted italic">No architecture details available.</p>;
  return (
    <div className="text-sm text-secondary leading-relaxed whitespace-pre-wrap bg-elevated/20 rounded-lg p-4 border border-app/50">
      {architecture}
    </div>
  );
}

function AccordionRecommendations({ recommendations }: { recommendations: Recommendation[] }) {
  if (recommendations.length === 0) return <p className="text-sm text-muted italic">No recommendations at this time.</p>;
  return (
    <div className="space-y-3">
      {recommendations.map((rec: Recommendation) => (
        <div key={rec.id} className="bg-elevated/40 border border-app/50 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${priorityBadge(rec.priority).color}`}>{priorityBadge(rec.priority).label}</span>
                <span className="text-xs text-muted uppercase tracking-wider">{rec.category}</span>
              </div>
              <p className="text-sm text-app">{rec.description}</p>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${effortBadge(rec.effort).color}`}>{effortBadge(rec.effort).label}</span>
          </div>
          {rec.rationale && <p className="text-xs text-muted mt-2 pt-2 border-t border-divider"><span className="text-muted font-medium">Why: </span>{rec.rationale}</p>}
        </div>
      ))}
    </div>
  );
}

function AccordionTradeoffs({ tradeoffs }: { tradeoffs: Tradeoff[] }) {
  if (tradeoffs.length === 0) return <p className="text-sm text-muted italic">No trade-offs documented.</p>;
  return (
    <div className="space-y-3">
      {tradeoffs.map((tradeoff: Tradeoff) => (
        <div key={tradeoff.id} className="bg-elevated/40 border border-app/50 rounded-lg p-4">
          <p className="text-sm font-medium text-app mb-3">{tradeoff.decision}</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className={`p-2.5 rounded-lg border text-xs ${tradeoff.chosen === "a" ? "bg-brand/10 border-brand/30 text-brand-soft" : "bg-elevated/60 border-app/30 text-secondary"}`}>
              <div className="flex items-center gap-1.5 mb-1">
                {tradeoff.chosen === "a" && <svg className="w-3.5 h-3.5 text-brand-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                <span className="font-medium">Option A</span>
              </div>
              <p>{tradeoff.optionA}</p>
            </div>
            <div className={`p-2.5 rounded-lg border text-xs ${tradeoff.chosen === "b" ? "bg-brand/10 border-brand/30 text-brand-soft" : "bg-elevated/60 border-app/30 text-secondary"}`}>
              <div className="flex items-center gap-1.5 mb-1">
                {tradeoff.chosen === "b" && <svg className="w-3.5 h-3.5 text-brand-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                <span className="font-medium">Option B</span>
              </div>
              <p>{tradeoff.optionB}</p>
            </div>
          </div>
          {tradeoff.rationale && <p className="text-xs text-muted pt-2 border-t border-divider"><span className="text-muted font-medium">Rationale: </span>{tradeoff.rationale}</p>}
        </div>
      ))}
    </div>
  );
}

function AccordionDecisionsAndRisks({
  designDecisions,
  architecturalRisks,
}: {
  designDecisions: ArchitectRisk[];
  architecturalRisks: ArchitectRisk[];
}) {
  if (designDecisions.length === 0 && architecturalRisks.length === 0) {
    return <p className="text-sm text-muted italic">No pending decisions or risks identified.</p>;
  }

  return (
    <div className="space-y-4">
      {designDecisions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Design Decisions</h4>
          <div className="space-y-2">
            {designDecisions.map((risk: ArchitectRisk) => (
              <div key={risk.id} className="bg-elevated/40 border border-app/50 rounded-lg p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-medium text-muted uppercase tracking-wider">{risk.category}</span>
                    <p className="text-sm text-secondary mt-0.5">{risk.description}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusBadge(risk.status).color}`}>{statusBadge(risk.status).label}</span>
                </div>
                {risk.mitigation && <p className="text-xs text-muted mt-2 pt-2 border-t border-divider"><span className="text-muted font-medium">Consideration: </span>{risk.mitigation}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {architecturalRisks.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Architectural Risks</h4>
          <div className="space-y-2">
            {architecturalRisks.map((risk: ArchitectRisk) => (
              <div key={risk.id} className="bg-elevated/40 border border-app/50 rounded-lg p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-medium text-muted uppercase tracking-wider">{risk.category}</span>
                    <p className="text-sm text-secondary mt-0.5">{risk.description}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusBadge(risk.status).color}`}>{statusBadge(risk.status).label}</span>
                </div>
                {risk.mitigation && <p className="text-xs text-muted mt-2 pt-2 border-t border-divider"><span className="text-muted font-medium">Mitigation: </span>{risk.mitigation}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AccordionQuestions({ unknowns }: { unknowns: string[] }) {
  if (unknowns.length === 0) return <p className="text-sm text-muted italic">No open questions.</p>;
  return (
    <ul className="space-y-2">
      {unknowns.map((unknown: string, i: number) => (
        <li key={i} className="flex items-start gap-2 text-sm text-secondary">
          <span className="text-brand mt-0.5 shrink-0">•</span>
          <span>{unknown}</span>
        </li>
      ))}
    </ul>
  );
}

function AccordionTechnicalDetails({ technicalAnalysis }: { technicalAnalysis: { architecturePattern?: string; dataModel?: string; apiDesign?: string; security?: string; performance?: string; deployment?: string } }) {
  const hasContent = technicalAnalysis.architecturePattern ||
    technicalAnalysis.dataModel || technicalAnalysis.apiDesign ||
    technicalAnalysis.security || technicalAnalysis.performance || technicalAnalysis.deployment;

  if (!hasContent) return <p className="text-sm text-muted italic">No technical details available.</p>;

  return (
    <div>
      {technicalAnalysis.architecturePattern && <TechDetail title="Architecture Pattern" text={technicalAnalysis.architecturePattern} />}
      {technicalAnalysis.dataModel && <TechDetail title="Data Model" text={technicalAnalysis.dataModel} pre />}
      {technicalAnalysis.apiDesign && <TechDetail title="API Design" text={technicalAnalysis.apiDesign} pre />}
      {technicalAnalysis.security && <TechDetail title="Security" text={technicalAnalysis.security} pre />}
      {technicalAnalysis.performance && <TechDetail title="Performance" text={technicalAnalysis.performance} pre />}
      {technicalAnalysis.deployment && <TechDetail title="Deployment" text={technicalAnalysis.deployment} pre />}
    </div>
  );
}

// ── Main Component ───────────────────────────

export default function ArchitectureInsightsStep({ onBack, onContinue }: Props) {
  const {
    runAnalysis,
    analysisError: architectError,
    analysisStatus,
    analysis,
  } = useArchitectTrigger();

  const handleRunAnalysis = useCallback(() => {
    runAnalysis();
  }, [runAnalysis]);

  const handleReRunAnalysis = useCallback(() => {
    runAnalysis();
  }, [runAnalysis]);

  const hasAnalysis = useMemo(() => {
    return analysis.executiveSummary.length > 0 || analysis.overallScore > 0;
  }, [analysis]);

  // ── Derived presentation data ──────────────

  const strengths = useMemo(() => deriveStrengths(analysis), [analysis]);
  const validationItems = useMemo(() => deriveValidationItems(analysis), [analysis]);
  const readiness = useMemo(() => deriveReadiness(analysis), [analysis]);
  const qualitativeConfidence = useMemo(() => deriveQualitativeConfidence(analysis), [analysis]);
  const { designDecisions, architecturalRisks } = useMemo(() => groupRefinements(analysis.risks), [analysis.risks]);

  const readinessInfo = useMemo(() => readinessDisplay(readiness), [readiness]);
  const confidenceInfo = useMemo(() => confidenceDisplay(qualitativeConfidence), [qualitativeConfidence]);

  const totalDecisionsAndRisks = designDecisions.length + architecturalRisks.length;

  // ── Render states ──────────────────────────

  if (analysisStatus === "analyzing") {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-app">AI Architecture Insights</h2>
          <p className="text-sm text-muted mt-1">AI Software Architect is analyzing your project...</p>
        </div>
        <div className="bg-surface/50 border border-app rounded-xl p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-6">
            <svg className="w-16 h-16 text-brand-soft animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-secondary text-sm">Running architecture analysis...</p>
          <p className="text-muted text-xs mt-2">This may take a moment depending on your AI provider.</p>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button onClick={onBack} className="btn-secondary text-sm px-5 py-2.5 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Interview
          </button>
        </div>
      </div>
    );
  }

  if (analysisStatus === "error") {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-app">AI Architecture Insights</h2>
          <p className="text-sm text-muted mt-1">Something went wrong</p>
        </div>
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-danger/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <p className="text-danger font-medium mb-2">Architecture Analysis Failed</p>
          <p className="text-danger/80 text-sm mb-6 max-w-md mx-auto">
            {architectError || "An unknown error occurred during analysis. Please try again."}
          </p>
          <button onClick={handleRunAnalysis} className="px-6 py-2.5 bg-danger/10 hover:bg-danger/20 text-danger text-sm font-semibold rounded-lg transition-colors border border-danger/30 flex items-center gap-2 mx-auto">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Retry Analysis
          </button>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button onClick={onBack} className="btn-secondary text-sm px-5 py-2.5 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Interview
          </button>
        </div>
      </div>
    );
  }

  if (!hasAnalysis) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-app">AI Architecture Insights</h2>
          <p className="text-sm text-muted mt-1">Run an AI architecture analysis to get recommendations about your project's structure, stack, and implementation approach.</p>
        </div>
        <div className="bg-surface/50 border border-app rounded-xl p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-brand-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-app mb-2">No Architecture Analysis Yet</h3>
          <p className="text-sm text-muted mb-6 max-w-md mx-auto leading-relaxed">Run the AI Software Architect to analyze your project and get recommendations on architecture, technology stack, trade-offs, and more.</p>
          <button onClick={handleRunAnalysis} className="btn-primary px-6 py-3 text-sm mx-auto flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            Run Architecture Analysis
          </button>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button onClick={onBack} className="btn-secondary text-sm px-5 py-2.5 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Interview
          </button>
        </div>
      </div>
    );
  }

  // ── Analysis Results ───────────────────────

  const {
    executiveSummary,
    recommendations,
    tradeoffs,
    unknowns,
    suggestedStack,
    suggestedArchitecture,
    estimatedComplexity,
    estimatedTimeline,
    functionalAnalysis,
    technicalAnalysis,
  } = analysis;

  return (
    <div className="max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-brand-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-app">AI Architecture Insights</h2>
        </div>
        <p className="text-sm text-muted ml-11">AI Software Architect recommendations for your project before implementation.</p>
      </div>

      {/* ── Status badges ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${readinessInfo.bg} ${readinessInfo.color}`}>
          <span>Readiness:</span> <span>{readinessInfo.label}</span>
        </span>
        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1.5 rounded-full border ${confidenceInfo.bg} ${confidenceInfo.color}`}>
          {confidenceInfo.label}
        </span>
        <span className="text-xs text-muted">{validationItems.filter(v => v.passed).length}/{validationItems.length} checks passed</span>
      </div>

      {/* ── NIVEAU 1: DASHBOARD ── */}
      {/* Architecture */}
      <DashboardArchitecture architecture={suggestedArchitecture} />

      {/* AI Recommendation (executive summary, ingekort) */}
      <DashboardRecommendation summary={executiveSummary} />

      {/* Technology Stack */}
      <DashboardTechStack stack={suggestedStack} />

      {/* Planning (compact) */}
      <DashboardPlanning
        complexity={complexityLabel(estimatedComplexity)}
        timeline={estimatedTimeline}
        featureCount={functionalAnalysis?.coreFeatures?.length}
      />

      {/* Project Strengths — alleen als er >2 zijn */}
      {strengths.length > 2 && <ProjectStrengths strengths={strengths} />}

      {/* ── NIVEAU 2: ACCORDIONS (allemaal dicht) ── */}

      {/* Architecture Details */}
      <CollapsibleSection title="Architecture Details" icon="🏗️">
        <AccordionArchitectureDetails architecture={suggestedArchitecture} />
      </CollapsibleSection>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <CollapsibleSection title="Recommendations" icon="💡" badge={`${recommendations.length}`}>
          <AccordionRecommendations recommendations={recommendations} />
        </CollapsibleSection>
      )}

      {/* Trade-offs */}
      {tradeoffs.length > 0 && (
        <CollapsibleSection title="Trade-offs" icon="⚖️" badge={`${tradeoffs.length}`}>
          <AccordionTradeoffs tradeoffs={tradeoffs} />
        </CollapsibleSection>
      )}

      {/* Decisions & Risks */}
      {totalDecisionsAndRisks > 0 && (
        <CollapsibleSection title="Decisions & Risks" icon="🔧" badge={`${totalDecisionsAndRisks}`}>
          <AccordionDecisionsAndRisks
            designDecisions={designDecisions}
            architecturalRisks={architecturalRisks}
          />
        </CollapsibleSection>
      )}

      {/* Questions Before Implementation */}
      {unknowns.length > 0 && (
        <CollapsibleSection title="Questions" icon="❓" badge={`${unknowns.length}`}>
          <AccordionQuestions unknowns={unknowns} />
        </CollapsibleSection>
      )}

      {/* Technical Details */}
      <CollapsibleSection title="Technical Details" icon="⚙️">
        <AccordionTechnicalDetails technicalAnalysis={technicalAnalysis} />
      </CollapsibleSection>

      {/* Developer Mode (was DeveloperTools) */}
      <DeveloperTools analysis={analysis} />

      {/* ── Actions ── */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-surface/40 border border-app rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-brand-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <p className="text-sm text-secondary font-medium">Ready to proceed?</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleReRunAnalysis} className="btn-secondary text-sm px-5 py-2.5 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            Re-run Analysis
          </button>
          <button onClick={onContinue} className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2">
            Continue to Project Overview
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button onClick={onBack} className="btn-secondary text-sm px-5 py-2.5 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Interview
        </button>
      </div>
    </div>
  );
}


function TechDetail({ title, text, pre }: { title: string; text: string; pre?: boolean }) {
  return (
    <div className="mb-3">
      <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">{title}</h4>
      {pre ? (
        <p className="text-sm text-secondary whitespace-pre-wrap">{text}</p>
      ) : (
        <p className="text-sm text-secondary">{text}</p>
      )}
    </div>
  );
}
