// ──────────────────────────────────────────────
// Demo types — Replayable Wizard Session
// ──────────────────────────────────────────────

import type { TourStep } from "../components/GuidedTour/types";

export interface DemoScenario {
  id: string;
  name: string;
  metadata: {
    tagline: string;
    category: string;
  };
  project: {
    prompt: string;
    name: string;
    tagline: string;
  };
  interview: DemoInterviewStep[];
  /** Legacy tooltips — kept for backward compatibility */
  tooltips: DemoStepTooltip[];
  /** Guided Tour steps for premium onboarding experience */
  tourSteps?: TourStep[];
}

export interface DemoInterviewStep {
  /** Matches interviewTopics id (e.g. "vision", "target-users") */
  topic: string;
  /** Scripted AI question text */
  question: string;
  /** Scripted user answer text */
  answer: string;
  /** Delay in ms before the answer appears (after question finishes typing) */
  delay: number;
  /** Typing speed in ms per character (0 = instant) */
  typingSpeed?: number;
}

export interface DemoStepTooltip {
  /** After which interview step index this tooltip appears */
  afterStep: number;
  /** Tooltip text */
  text: string;
  /** Auto-dismiss delay in ms */
  duration: number;
}

export type SessionMode = "live" | "demo";

export interface DemoPlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentStepIndex: number;
}
