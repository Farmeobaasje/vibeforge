// ──────────────────────────────────────────────
// ArchitectureAnalysis — AI Architect data model
// ──────────────────────────────────────────────

// ── Sub-types ─────────────────────────────────

export interface FunctionalAnalysis {
  /** Core features the system must support */
  coreFeatures: string[];
  /** Key user flows / journeys */
  userFlows: string[];
  /** Identified edge cases */
  edgeCases: string[];
  /** Scalability concerns or requirements */
  scalabilityConcerns: string[];
}

export interface TechnicalAnalysis {
  /** Recommended architecture pattern (e.g. "Feature-Sliced", "Clean Architecture") */
  architecturePattern: string;
  /** Data model notes */
  dataModel: string;
  /** API design notes */
  apiDesign: string;
  /** Security considerations */
  security: string;
  /** Performance considerations */
  performance: string;
  /** Deployment strategy */
  deployment: string;
}

export type RiskImpact = "low" | "medium" | "high" | "critical";
export type RiskLikelihood = "low" | "medium" | "high";
export type RiskStatus = "open" | "mitigated" | "accepted";

export interface ArchitectRisk {
  id: string;
  /** Risk category (e.g. "security", "scalability", "complexity") */
  category: string;
  /** Description of the risk */
  description: string;
  /** Potential impact if the risk materialises */
  impact: RiskImpact;
  /** Likelihood of the risk occurring */
  likelihood: RiskLikelihood;
  /** Suggested mitigation strategy */
  mitigation: string;
  /** Current status of this risk */
  status: RiskStatus;
}

export type RecommendationPriority = "essential" | "recommended" | "optional";
export type EffortLevel = "low" | "medium" | "high";

export interface Recommendation {
  id: string;
  /** Recommendation category (e.g. "stack", "architecture", "process") */
  category: string;
  /** Priority level */
  priority: RecommendationPriority;
  /** What the architect recommends */
  description: string;
  /** Why this recommendation is made */
  rationale: string;
  /** Estimated effort to implement */
  effort: EffortLevel;
}

export interface Tradeoff {
  id: string;
  /** What decision this trade-off is about */
  decision: string;
  /** First option considered */
  optionA: string;
  /** Second option considered */
  optionB: string;
  /** Which option was chosen */
  chosen: "a" | "b" | "neither";
  /** Why this choice was made */
  rationale: string;
}

export interface SuggestedStack {
  /** Frontend framework / libraries */
  frontend: string;
  /** Backend framework / runtime */
  backend: string;
  /** Database / data store */
  database: string;
  /** Infrastructure / hosting */
  infrastructure: string;
  /** AI / ML tools or services */
  ai: string;
  /** Testing framework / approach */
  testing: string;
  /** Monitoring / observability */
  monitoring: string;
}

export type ComplexityLevel = "low" | "medium" | "high" | "very-high";

// ── Main model ────────────────────────────────

export interface ArchitectureAnalysis {
  /** Unique identifier */
  id: string;
  /** When the analysis was first created */
  createdAt: string; // ISO timestamp
  /** When the analysis was last updated */
  updatedAt: string; // ISO timestamp

  // ── Executive Summary ──

  /** High-level summary of the architectural assessment */
  executiveSummary: string;
  /** Overall quality / readiness score (0-100) */
  overallScore: number;

  // ── Analysis ──

  /** Functional analysis of the project */
  functionalAnalysis: FunctionalAnalysis;
  /** Technical analysis of the project */
  technicalAnalysis: TechnicalAnalysis;

  // ── Risks ──

  /** Identified architectural risks */
  risks: ArchitectRisk[];

  // ── Recommendations ──

  /** Recommendations from the architect */
  recommendations: Recommendation[];

  // ── Trade-offs ──

  /** Documented trade-offs */
  tradeoffs: Tradeoff[];

  // ── Unknowns ──

  /** Open questions / unknowns that need resolution */
  unknowns: string[];

  // ── Suggested Stack ──

  /** Recommended technology stack */
  suggestedStack: SuggestedStack;

  // ── Suggested Architecture ──

  /** High-level architecture description */
  suggestedArchitecture: string;

  // ── Complexity & Timeline ──

  /** Estimated complexity of the project */
  estimatedComplexity: ComplexityLevel;
  /** Estimated timeline (free-text, e.g. "2-3 months") */
  estimatedTimeline: string;
  /** Confidence in this analysis (0-100) */
  confidence: number;
}

// ── Defaults ──────────────────────────────────

export function createEmptyFunctionalAnalysis(): FunctionalAnalysis {
  return {
    coreFeatures: [],
    userFlows: [],
    edgeCases: [],
    scalabilityConcerns: [],
  };
}

export function createEmptyTechnicalAnalysis(): TechnicalAnalysis {
  return {
    architecturePattern: "",
    dataModel: "",
    apiDesign: "",
    security: "",
    performance: "",
    deployment: "",
  };
}

export function createEmptySuggestedStack(): SuggestedStack {
  return {
    frontend: "",
    backend: "",
    database: "",
    infrastructure: "",
    ai: "",
    testing: "",
    monitoring: "",
  };
}

export function createEmptyArchitectureAnalysis(): ArchitectureAnalysis {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: now,
    updatedAt: now,
    executiveSummary: "",
    overallScore: 0,
    functionalAnalysis: createEmptyFunctionalAnalysis(),
    technicalAnalysis: createEmptyTechnicalAnalysis(),
    risks: [],
    recommendations: [],
    tradeoffs: [],
    unknowns: [],
    suggestedStack: createEmptySuggestedStack(),
    suggestedArchitecture: "",
    estimatedComplexity: "medium",
    estimatedTimeline: "",
    confidence: 0,
  };
}
