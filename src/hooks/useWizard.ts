// ──────────────────────────────────────────────
// useWizard — 6-step wizard state management
// Describe → Interview → Architecture Review → Summary → Generate → Export
// ──────────────────────────────────────────────

import { useState, useCallback } from "react";
import type { SessionMode, DemoScenario, DemoPlaybackState } from "../demo/types";

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export const WIZARD_LABELS: Record<WizardStep, string> = {
  1: "Describe",
  2: "Interview",
  3: "Architecture Insights",
  4: "Project Overview",
  5: "Generate",
  6: "Export",
};

export const WIZARD_DESCRIPTIONS: Record<WizardStep, string> = {
  1: "Describe your project idea",
  2: "AI-powered interview",
  3: "Architecture insights",
  4: "Review your project overview",
  5: "Generate AI-ready project files",
  6: "Export your project",
};

interface UseWizardReturn {
  currentStep: WizardStep;
  goTo: (step: WizardStep) => void;
  goNext: () => void;
  goBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoNext: boolean;
  setCanGoNext: (can: boolean) => void;
  // Session mode
  sessionMode: SessionMode;
  startDemo: (scenario: DemoScenario) => void;
  stopDemo: () => void;
  pauseDemo: () => void;
  resumeDemo: () => void;
  isPlaying: boolean;
  isPaused: boolean;
  activeDemo: DemoScenario | null;
  demoPlayback: DemoPlaybackState;
  setDemoPlayback: (state: DemoPlaybackState) => void;
}

export function useWizard(): UseWizardReturn {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [canGoNext, setCanGoNext] = useState(true);
  const [sessionMode, setSessionMode] = useState<SessionMode>("live");
  const [activeDemo, setActiveDemo] = useState<DemoScenario | null>(null);
  const [demoPlayback, setDemoPlayback] = useState<DemoPlaybackState>({
    isPlaying: false,
    isPaused: false,
    currentStepIndex: 0,
  });

  const goTo = useCallback((step: WizardStep) => {
    setCurrentStep(step);
  }, []);

  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(6, (prev + 1) as WizardStep) as WizardStep);
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(1, (prev - 1) as WizardStep) as WizardStep);
  }, []);

  const startDemo = useCallback((scenario: DemoScenario) => {
    setSessionMode("demo");
    setActiveDemo(scenario);
    setDemoPlayback({
      isPlaying: true,
      isPaused: false,
      currentStepIndex: 0,
    });
    setCurrentStep(2);
  }, []);

  const stopDemo = useCallback(() => {
    setSessionMode("live");
    setActiveDemo(null);
    setDemoPlayback({
      isPlaying: false,
      isPaused: false,
      currentStepIndex: 0,
    });
    setCurrentStep(1);
  }, []);

  const pauseDemo = useCallback(() => {
    setDemoPlayback((prev) => ({ ...prev, isPaused: true }));
  }, []);

  const resumeDemo = useCallback(() => {
    setDemoPlayback((prev) => ({ ...prev, isPaused: false }));
  }, []);

  return {
    currentStep,
    goTo,
    goNext,
    goBack,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === 6,
    canGoNext,
    setCanGoNext,
    // Session mode
    sessionMode,
    startDemo,
    stopDemo,
    pauseDemo,
    resumeDemo,
    isPlaying: demoPlayback.isPlaying,
    isPaused: demoPlayback.isPaused,
    activeDemo,
    demoPlayback,
    setDemoPlayback,
  };
}
