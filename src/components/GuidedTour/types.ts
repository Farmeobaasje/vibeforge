// ──────────────────────────────────────────────
// GuidedTour types — Premium product onboarding
// ──────────────────────────────────────────────

export type TourPosition = "center" | "left" | "right" | "bottom";

export type TourHighlightTarget = "chat" | "progress-panel" | "understanding-panel" | null;

export interface TourStep {
  /** Unique step identifier */
  id: string;
  /** Step number shown to user (1-based) */
  stepNumber: number;
  /** Total steps in this tour */
  totalSteps: number;
  /** Short title shown above the message */
  title: string;
  /** Main body text — explains WHY, not just WHAT */
  message: string;
  /** Where the card appears on screen */
  position: TourPosition;
  /** Which UI panel to highlight (null = no highlight / full overlay) */
  highlightTarget: TourHighlightTarget;
  /** After which interview step index this tour step triggers (before the answer) */
  triggerAfterStep: number;
  /** Label for the action button */
  actionLabel: string;
}

export interface TourState {
  /** Whether the tour is active */
  isActive: boolean;
  /** Current step index in the tour steps array */
  currentStepIndex: number;
  /** Whether the welcome card is showing */
  showWelcome: boolean;
  /** Whether the completion card is showing */
  showCompletion: boolean;
  /** Whether demo should be paused during current step */
  isPaused: boolean;
}

export interface GuidedTourConfig {
  /** All steps in this tour */
  steps: TourStep[];
  /** Whether to auto-start the tour when demo begins */
  autoStart: boolean;
}
