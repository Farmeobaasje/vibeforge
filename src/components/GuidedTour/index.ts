// ──────────────────────────────────────────────
// GuidedTour — Barrel exports
// ──────────────────────────────────────────────

export { default as GuidedTourProvider } from "./GuidedTourProvider";
export { default as TourStep } from "./TourStep";
export { default as TourProgress } from "./TourProgress";
export { default as TourHighlight } from "./TourHighlight";
export { default as WelcomeCard } from "./WelcomeCard";
export { default as CompletionCard } from "./CompletionCard";
export type {
  TourStep as TourStepType,
  TourState,
  TourPosition,
  TourHighlightTarget,
  GuidedTourConfig,
} from "./types";
