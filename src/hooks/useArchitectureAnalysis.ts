// ──────────────────────────────────────────────
// useArchitectureAnalysis — architecture state hook
// ──────────────────────────────────────────────

import { useState, useCallback, useRef } from "react";
import {
  type ArchitectureAnalysis,
  type FunctionalAnalysis,
  type TechnicalAnalysis,
  type ArchitectRisk,
  type Recommendation,
  type Tradeoff,
  type SuggestedStack,
  type RiskImpact,
  type RiskLikelihood,
  type RecommendationPriority,
  type EffortLevel,
  type ComplexityLevel,
  createEmptyArchitectureAnalysis,
} from "../models/architectureAnalysis";
import {
  loadArchitectureAnalysis,
  saveArchitectureAnalysis,
  clearArchitectureAnalysis,
} from "../lib/architectureAnalysisStorage";

export interface UseArchitectureAnalysisReturn {
  /** The current ArchitectureAnalysis */
  analysis: ArchitectureAnalysis;
  /** Timestamp of the last successful save, or null */
  lastSavedAt: Date | null;
  /** Error message from the last save attempt, or null */
  saveError: string | null;

  // ── Executive Summary ──
  setExecutiveSummary: (summary: string) => void;
  setOverallScore: (score: number) => void;

  // ── Analysis ──
  setFunctionalAnalysis: (analysis: FunctionalAnalysis) => void;
  setTechnicalAnalysis: (analysis: TechnicalAnalysis) => void;

  // ── Risks ──
  addRisk: (
    category: string,
    description: string,
    impact: RiskImpact,
    likelihood: RiskLikelihood,
    mitigation: string,
  ) => void;
  updateRisk: (riskId: string, updates: Partial<ArchitectRisk>) => void;
  removeRisk: (riskId: string) => void;

  // ── Recommendations ──
  addRecommendation: (
    category: string,
    priority: RecommendationPriority,
    description: string,
    rationale: string,
    effort: EffortLevel,
  ) => void;
  removeRecommendation: (recommendationId: string) => void;

  // ── Trade-offs ──
  addTradeoff: (
    decision: string,
    optionA: string,
    optionB: string,
    chosen: "a" | "b" | "neither",
    rationale: string,
  ) => void;
  removeTradeoff: (tradeoffId: string) => void;

  // ── Unknowns ──
  setUnknowns: (unknowns: string[]) => void;
  addUnknown: (unknown: string) => void;
  removeUnknown: (unknown: string) => void;

  // ── Suggested Stack ──
  setSuggestedStack: (stack: SuggestedStack) => void;

  // ── Suggested Architecture ──
  setSuggestedArchitecture: (architecture: string) => void;

  // ── Complexity & Timeline ──
  setEstimatedComplexity: (complexity: ComplexityLevel) => void;
  setEstimatedTimeline: (timeline: string) => void;
  setConfidence: (confidence: number) => void;

  // ── Bulk ──
  /** Replace the entire analysis (e.g. after loading from AI) */
  setAnalysis: (analysis: ArchitectureAnalysis) => void;
  /** Reset to empty analysis and clear localStorage */
  resetAnalysis: () => void;
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useArchitectureAnalysis(): UseArchitectureAnalysisReturn {
  const [analysis, setAnalysisState] = useState<ArchitectureAnalysis>(
    loadArchitectureAnalysis,
  );
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Keep a ref to the latest value so callbacks always have fresh data
  const ref = useRef(analysis);
  ref.current = analysis;

  const persist = useCallback((data: ArchitectureAnalysis) => {
    try {
      saveArchitectureAnalysis(data);
      setLastSavedAt(new Date());
      setSaveError(null);
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : "Failed to save architecture analysis",
      );
    }
  }, []);

  const setAnalysis = useCallback((data: ArchitectureAnalysis) => {
    const next = { ...data, updatedAt: new Date().toISOString() };
    persist(next);
    setAnalysisState(next);
  }, [persist]);

  // ── Executive Summary ──

  const setExecutiveSummary = useCallback(
    (summary: string) => {
      setAnalysisState((prev) => {
        const next = { ...prev, executiveSummary: summary };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setOverallScore = useCallback(
    (score: number) => {
      setAnalysisState((prev) => {
        const next = { ...prev, overallScore: Math.max(0, Math.min(100, score)) };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // ── Analysis ──

  const setFunctionalAnalysis = useCallback(
    (functionalAnalysis: FunctionalAnalysis) => {
      setAnalysisState((prev) => {
        const next = { ...prev, functionalAnalysis };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setTechnicalAnalysis = useCallback(
    (technicalAnalysis: TechnicalAnalysis) => {
      setAnalysisState((prev) => {
        const next = { ...prev, technicalAnalysis };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // ── Risks ──

  const addRisk = useCallback(
    (
      category: string,
      description: string,
      impact: RiskImpact,
      likelihood: RiskLikelihood,
      mitigation: string,
    ) => {
      setAnalysisState((prev) => {
        const risk: ArchitectRisk = {
          id: generateId(),
          category,
          description,
          impact,
          likelihood,
          mitigation,
          status: "open",
        };
        const next = { ...prev, risks: [...prev.risks, risk] };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const updateRisk = useCallback(
    (riskId: string, updates: Partial<ArchitectRisk>) => {
      setAnalysisState((prev) => {
        const next = {
          ...prev,
          risks: prev.risks.map((r) =>
            r.id === riskId ? { ...r, ...updates } : r,
          ),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const removeRisk = useCallback(
    (riskId: string) => {
      setAnalysisState((prev) => {
        const next = {
          ...prev,
          risks: prev.risks.filter((r) => r.id !== riskId),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // ── Recommendations ──

  const addRecommendation = useCallback(
    (
      category: string,
      priority: RecommendationPriority,
      description: string,
      rationale: string,
      effort: EffortLevel,
    ) => {
      setAnalysisState((prev) => {
        const rec: Recommendation = {
          id: generateId(),
          category,
          priority,
          description,
          rationale,
          effort,
        };
        const next = { ...prev, recommendations: [...prev.recommendations, rec] };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const removeRecommendation = useCallback(
    (recommendationId: string) => {
      setAnalysisState((prev) => {
        const next = {
          ...prev,
          recommendations: prev.recommendations.filter(
            (r) => r.id !== recommendationId,
          ),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // ── Trade-offs ──

  const addTradeoff = useCallback(
    (
      decision: string,
      optionA: string,
      optionB: string,
      chosen: "a" | "b" | "neither",
      rationale: string,
    ) => {
      setAnalysisState((prev) => {
        const tradeoff: Tradeoff = {
          id: generateId(),
          decision,
          optionA,
          optionB,
          chosen,
          rationale,
        };
        const next = { ...prev, tradeoffs: [...prev.tradeoffs, tradeoff] };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const removeTradeoff = useCallback(
    (tradeoffId: string) => {
      setAnalysisState((prev) => {
        const next = {
          ...prev,
          tradeoffs: prev.tradeoffs.filter((t) => t.id !== tradeoffId),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // ── Unknowns ──

  const setUnknowns = useCallback(
    (unknowns: string[]) => {
      setAnalysisState((prev) => {
        const next = { ...prev, unknowns };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const addUnknown = useCallback(
    (unknown: string) => {
      setAnalysisState((prev) => {
        if (prev.unknowns.includes(unknown)) return prev;
        const next = { ...prev, unknowns: [...prev.unknowns, unknown] };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const removeUnknown = useCallback(
    (unknown: string) => {
      setAnalysisState((prev) => {
        const next = {
          ...prev,
          unknowns: prev.unknowns.filter((u) => u !== unknown),
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // ── Suggested Stack ──

  const setSuggestedStack = useCallback(
    (suggestedStack: SuggestedStack) => {
      setAnalysisState((prev) => {
        const next = { ...prev, suggestedStack };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // ── Suggested Architecture ──

  const setSuggestedArchitecture = useCallback(
    (architecture: string) => {
      setAnalysisState((prev) => {
        const next = { ...prev, suggestedArchitecture: architecture };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // ── Complexity & Timeline ──

  const setEstimatedComplexity = useCallback(
    (complexity: ComplexityLevel) => {
      setAnalysisState((prev) => {
        const next = { ...prev, estimatedComplexity: complexity };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setEstimatedTimeline = useCallback(
    (timeline: string) => {
      setAnalysisState((prev) => {
        const next = { ...prev, estimatedTimeline: timeline };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setConfidence = useCallback(
    (confidence: number) => {
      setAnalysisState((prev) => {
        const next = { ...prev, confidence: Math.max(0, Math.min(100, confidence)) };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // ── Reset ──

  const resetAnalysis = useCallback(() => {
    const fresh = createEmptyArchitectureAnalysis();
    clearArchitectureAnalysis();
    setAnalysisState(fresh);
    setLastSavedAt(null);
    setSaveError(null);
  }, []);

  return {
    analysis,
    lastSavedAt,
    saveError,
    setExecutiveSummary,
    setOverallScore,
    setFunctionalAnalysis,
    setTechnicalAnalysis,
    addRisk,
    updateRisk,
    removeRisk,
    addRecommendation,
    removeRecommendation,
    addTradeoff,
    removeTradeoff,
    setUnknowns,
    addUnknown,
    removeUnknown,
    setSuggestedStack,
    setSuggestedArchitecture,
    setEstimatedComplexity,
    setEstimatedTimeline,
    setConfidence,
    setAnalysis,
    resetAnalysis,
  };
}
