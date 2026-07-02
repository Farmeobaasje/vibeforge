// ──────────────────────────────────────────────
// DebugPanel — Pipeline trace visualizer
//
// Shows the full extraction pipeline trace:
//   Raw Input → LLM JSON → Validated canonical
//   → ProjectDefinition domain → RenderModel domain
//   → Export warnings
//
// Only visible when debug mode is enabled.
// ──────────────────────────────────────────────

import { useState, useMemo } from "react";
import type { ProjectDefinition } from "../types/projectDefinition";
import type { CanonicalExtractionResult } from "../canonical/types";
import { detectDomainFromText } from "../semantic/domainTemplates";

// ── Types ─────────────────────────────────────

export interface PipelineTrace {
  /** Raw input text that was extracted */
  rawInput: string;
  /** Raw LLM JSON response (before validation) */
  llmRawJson: string | null;
  /** Validated canonical result (after validateCanonicalResult) */
  validatedCanonical: CanonicalExtractionResult | null;
  /** ProjectDefinition domain after canonicalToProjectDefinition */
  projectDefinitionDomain: {
    id: string;
    domainLabel: string;
    domainCategory: string;
    templateId: string;
    confidence: number;
    source: string;
  } | null;
  /** Warnings accumulated through the pipeline */
  warnings: string[];
  /** Whether deterministic fallback was used */
  usedFallback: boolean;
  /** Source of extraction */
  source: "llm" | "deterministic" | "fallback";
}


interface Props {
  /** Current project definition */
  projectDefinition: ProjectDefinition;
  /** Optional pipeline trace data */
  trace?: PipelineTrace | null;
}

// ── Component ─────────────────────────────────

export default function DebugPanel({ projectDefinition, trace }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // Derive debug info from projectDefinition even without trace
  const derivedInfo = useMemo(() => {
    const domain = projectDefinition.architecture?.domain;
    const identity = projectDefinition.identity;
    const confidence = projectDefinition.confidence;

    return {
      source: identity?.source ?? "unknown",
      fieldSources: identity?.fieldSources ?? {},
      domainId: domain?.id ?? "not set",
      domainLabel: domain?.domainLabel ?? "not set",
      domainCategory: domain?.domainCategory ?? "not set",
      templateId: domain?.templateId ?? "not set",
      domainConfidence: domain?.confidence ?? 0,
      domainSource: domain?.source ?? "unknown",
      overallConfidence: confidence?.overall ?? 0,
      confidenceByField: confidence?.byField ?? {},
      techLanguages: projectDefinition.tech?.languages ?? [],
      techFrameworks: projectDefinition.tech?.frameworks ?? [],
      techTools: projectDefinition.tech?.tools ?? [],
      roadmapPhases: projectDefinition.roadmap?.phases?.map((p) => p.title) ?? [],
      warnings: projectDefinition.quality?.validationRules?.filter((r) => r.startsWith("⚠️")) ?? [],
    };
  }, [projectDefinition]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 text-xs font-mono rounded-lg border border-gray-700 transition-colors"
        title="Open Debug Panel"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 pb-8 px-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-full overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <span className="text-lg">🐛</span>
            <h2 className="text-lg font-semibold text-gray-100">Pipeline Debug</h2>
            <span className={`px-2 py-0.5 text-xs font-mono rounded-full ${
              derivedInfo.source === "llm"
                ? "bg-green-900/50 text-green-400 border border-green-700"
                : derivedInfo.source === "deterministic"
                  ? "bg-yellow-900/50 text-yellow-400 border border-yellow-700"
                  : "bg-red-900/50 text-red-400 border border-red-700"
            }`}>
              {derivedInfo.source}
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* ── Pipeline Overview ── */}
          <Section title="Pipeline Overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard label="Source" value={derivedInfo.source} />
              <MetricCard label="Overall Confidence" value={`${derivedInfo.overallConfidence}%`} />
              <MetricCard label="Domain Confidence" value={`${derivedInfo.domainConfidence}%`} />
              <MetricCard label="Template ID" value={derivedInfo.templateId || "(none)"} />
            </div>
          </Section>

          {/* ── Domain Identity ── */}
          <Section title="Domain Identity">
            <table className="w-full text-xs font-mono">
              <tbody>
                <DebugRow label="domain.id" value={derivedInfo.domainId} />
                <DebugRow label="domainLabel" value={derivedInfo.domainLabel} />
                <DebugRow label="domainCategory" value={derivedInfo.domainCategory} />
                <DebugRow label="templateId" value={derivedInfo.templateId || "(empty — LLM-first)"} />
                <DebugRow label="domain.source" value={derivedInfo.domainSource} />
                <DebugRow label="domain.confidence" value={`${derivedInfo.domainConfidence}%`} />
              </tbody>
            </table>
          </Section>

          {/* ── Domain Extraction Inspection ── */}
          <Section title="Domain Extraction Inspection">
            <p className="text-xs text-gray-500 mb-3 font-mono">
              Three-stage trace: RAW LLM → Deterministic fallback → Final ProjectDefinition
            </p>

            {/* Stage 1: RAW LLM JSON */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 text-xs font-bold flex items-center justify-center border border-blue-700">1</span>
                <h4 className="text-xs font-semibold text-blue-400 font-mono">RAW LLM JSON (no post-processing)</h4>
                {trace?.llmRawJson ? (
                  <span className="text-[10px] text-green-500 font-mono">✓ available</span>
                ) : (
                  <span className="text-[10px] text-yellow-500 font-mono">not captured — add PipelineTrace to DebugPanel</span>
                )}
              </div>
              {trace?.llmRawJson ? (
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap bg-blue-950/30 p-3 rounded-lg border border-blue-900/50 max-h-48 overflow-y-auto">
                  {trace.llmRawJson}
                </pre>
              ) : (
                <div className="text-xs text-gray-500 font-mono bg-gray-950 p-3 rounded-lg border border-gray-800">
                  No RAW LLM JSON captured. Pass PipelineTrace with llmRawJson to see the unprocessed LLM output.
                </div>
              )}
            </div>

            {/* Stage 2: Deterministic Fallback */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-yellow-900/50 text-yellow-400 text-xs font-bold flex items-center justify-center border border-yellow-700">2</span>
                <h4 className="text-xs font-semibold text-yellow-400 font-mono">Deterministic Fallback Domain</h4>
                <span className="text-[10px] text-gray-500 font-mono">(what keyword matching would choose)</span>
              </div>
              <DomainFallbackDisplay projectDefinition={projectDefinition} />
            </div>

            {/* Stage 3: Final ProjectDefinition Domain */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-green-900/50 text-green-400 text-xs font-bold flex items-center justify-center border border-green-700">3</span>
                <h4 className="text-xs font-semibold text-green-400 font-mono">Final ProjectDefinition Domain</h4>
                <span className={`text-[10px] font-mono ${
                  derivedInfo.domainSource === "llm" ? "text-green-500" : "text-yellow-500"
                }`}>
                  source: {derivedInfo.domainSource}
                </span>
              </div>
              <table className="w-full text-xs font-mono">
                <tbody>
                  <DebugRow label="domain.id" value={derivedInfo.domainId} />
                  <DebugRow label="domainLabel" value={derivedInfo.domainLabel} />
                  <DebugRow label="domainCategory" value={derivedInfo.domainCategory} />
                  <DebugRow label="templateId" value={derivedInfo.templateId || "(empty — LLM-first)"} />
                  <DebugRow label="source" value={derivedInfo.domainSource} />
                  <DebugRow label="confidence" value={`${derivedInfo.domainConfidence}%`} />
                </tbody>
              </table>
            </div>

            {/* Source Decision Summary */}
            <div className="mt-4 pt-3 border-t border-gray-800">
              <h4 className="text-xs font-semibold text-gray-400 font-mono mb-2">Source Decision</h4>
              <div className={`px-3 py-2 rounded-lg text-xs font-mono border ${
                derivedInfo.domainSource === "llm"
                  ? "bg-green-950/30 border-green-800 text-green-400"
                  : derivedInfo.domainSource === "deterministic"
                    ? "bg-yellow-950/30 border-yellow-800 text-yellow-400"
                    : "bg-red-950/30 border-red-800 text-red-400"
              }`}>
                {derivedInfo.domainSource === "llm"
                  ? "✓ LLM domain won — either confidence > 70 or deterministic fallback was a broad template"
                  : derivedInfo.domainSource === "deterministic"
                    ? "⚠ Deterministic fallback won — LLM confidence was too low or LLM returned no domainLabel"
                    : "✗ Unknown source — check pipeline configuration"
                }
              </div>
            </div>
          </Section>

          {/* ── Field Sources ── */}

          <Section title="Field Sources (per-field extraction source)">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(derivedInfo.fieldSources).map(([field, source]) => (
                <div key={field} className="flex items-center gap-2 px-3 py-1.5 bg-gray-950 rounded-lg border border-gray-800">
                  <span className="text-gray-400">{field}:</span>
                  <span className={`font-mono text-xs ${
                    source === "llm" ? "text-green-400" :
                    source === "deterministic" ? "text-yellow-400" :
                    "text-red-400"
                  }`}>
                    {source}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Confidence Scores ── */}
          <Section title="Confidence Scores">
            <div className="space-y-2">
              {Object.entries(derivedInfo.confidenceByField).map(([field, score]) => (
                <div key={field} className="flex items-center gap-3">
                  <span className="text-gray-400 w-28 text-xs font-mono">{field}</span>
                  <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        score >= 70 ? "bg-green-600" :
                        score >= 40 ? "bg-yellow-600" :
                        "bg-red-600"
                      }`}
                      style={{ width: `${Math.min(100, score)}%` }}
                    />
                  </div>
                  <span className="text-gray-400 w-10 text-right text-xs font-mono">{score}%</span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Tech Stack ── */}
          <Section title="Tech Stack">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-xs text-gray-500 font-mono mb-1">Languages</h4>
                <div className="flex flex-wrap gap-1">
                  {derivedInfo.techLanguages.length > 0
                    ? derivedInfo.techLanguages.map((t) => <TechBadge key={t} label={t} />)
                    : <span className="text-xs text-red-400">(empty)</span>
                  }
                </div>
              </div>
              <div>
                <h4 className="text-xs text-gray-500 font-mono mb-1">Frameworks</h4>
                <div className="flex flex-wrap gap-1">
                  {derivedInfo.techFrameworks.length > 0
                    ? derivedInfo.techFrameworks.map((t) => <TechBadge key={t} label={t} />)
                    : <span className="text-xs text-red-400">(empty)</span>
                  }
                </div>
              </div>
              <div>
                <h4 className="text-xs text-gray-500 font-mono mb-1">Tools</h4>
                <div className="flex flex-wrap gap-1">
                  {derivedInfo.techTools.length > 0
                    ? derivedInfo.techTools.map((t) => <TechBadge key={t} label={t} />)
                    : <span className="text-xs text-red-400">(empty)</span>
                  }
                </div>
              </div>
            </div>
          </Section>

          {/* ── Roadmap ── */}
          <Section title="Roadmap Phases">
            {derivedInfo.roadmapPhases.length > 0 ? (
              <ol className="list-decimal list-inside space-y-1">
                {derivedInfo.roadmapPhases.map((phase, i) => (
                  <li key={i} className="text-xs text-gray-300 font-mono">{phase}</li>
                ))}
              </ol>
            ) : (
              <span className="text-xs text-yellow-400">(no phases — template roadmap was not used)</span>
            )}
          </Section>

          {/* ── Warnings ── */}
          {derivedInfo.warnings.length > 0 && (
            <Section title="Warnings">
              <ul className="space-y-1">
                {derivedInfo.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-yellow-400 font-mono">{w}</li>
                ))}
              </ul>
            </Section>
          )}

          {/* ── Raw Pipeline Trace ── */}
          {trace && (
            <>
              {trace.llmRawJson && (
                <Section title="Raw LLM JSON Response">
                  <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap bg-gray-950 p-3 rounded-lg border border-gray-800 max-h-64 overflow-y-auto">
                    {trace.llmRawJson}
                  </pre>
                </Section>
              )}
              {trace.validatedCanonical && (
                <Section title="Validated Canonical Result">
                  <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap bg-gray-950 p-3 rounded-lg border border-gray-800 max-h-64 overflow-y-auto">
                    {JSON.stringify(trace.validatedCanonical, null, 2)}
                  </pre>
                </Section>
              )}
            </>
          )}

          {/* ── Full ProjectDefinition JSON ── */}
          <Section title="Full ProjectDefinition JSON">
            <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap bg-gray-950 p-3 rounded-lg border border-gray-800 max-h-64 overflow-y-auto">
              {JSON.stringify(projectDefinition, null, 2)}
            </pre>
          </Section>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-950 rounded-lg border border-gray-800 p-3">
      <p className="text-xs text-gray-500 font-mono mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-200 font-mono">{value}</p>
    </div>
  );
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-gray-800 last:border-0">
      <td className="py-1.5 pr-4 text-gray-500 whitespace-nowrap">{label}</td>
      <td className="py-1.5 text-gray-300 break-all">{value}</td>
    </tr>
  );
}

function TechBadge({ label }: { label: string }) {
  return (
    <span className="px-2 py-0.5 text-xs font-mono bg-gray-800 text-gray-300 rounded-full border border-gray-700">
      {label}
    </span>
  );
}

/**
 * Shows what the deterministic keyword-based domain detection would choose
 * from the project definition's raw text (if available) or from the domain info.
 */
function DomainFallbackDisplay({ projectDefinition }: { projectDefinition: ProjectDefinition }) {
  const fallbackInfo = useMemo(() => {
    // Try to get raw text from the project definition
    const rawText = projectDefinition.project.name
      || projectDefinition.architecture.domain?.domainLabel
      || ""

    if (!rawText) {
      return {
        hasText: false as const,
        message: "No raw text available to run deterministic detection",
      };
    }

    const template = detectDomainFromText(rawText);
    return {
      hasText: true as const,
      templateName: template.name,
      taglinePreview: template.taglineTemplate("__test__").replace(/__test__\s*[—–-]\s*/, "").trim(),
      keywordCount: template.keywords.length,
      strongKeywords: template.strongKeywords ?? [],
      weakKeywords: template.weakKeywords ?? [],
    };
  }, [projectDefinition]);

  if (!fallbackInfo.hasText) {
    return (
      <div className="text-xs text-gray-500 font-mono bg-gray-950 p-3 rounded-lg border border-gray-800">
        {fallbackInfo.message}
      </div>
    );
  }

  return (
    <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
      <table className="w-full text-xs font-mono">
        <tbody>
          <DebugRow label="Matched template" value={fallbackInfo.templateName} />
          <DebugRow label="Tagline preview" value={fallbackInfo.taglinePreview} />
          <DebugRow label="Keyword count" value={`${fallbackInfo.keywordCount} regular + ${fallbackInfo.strongKeywords.length} strong + ${fallbackInfo.weakKeywords.length} weak`} />
          {fallbackInfo.strongKeywords.length > 0 && (
            <DebugRow label="Strong keywords" value={fallbackInfo.strongKeywords.join(", ")} />
          )}
          {fallbackInfo.weakKeywords.length > 0 && (
            <DebugRow label="Weak keywords" value={fallbackInfo.weakKeywords.join(", ")} />
          )}
        </tbody>
      </table>
    </div>
  );
}

