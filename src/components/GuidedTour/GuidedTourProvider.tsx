// ──────────────────────────────────────────────
// GuidedTourProvider — State machine orchestrator
// Manages tour steps, welcome/completion cards,
// pause/resume, and highlight targets
// ──────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from "react";
import type { TourStep, TourHighlightTarget, TourState } from "./types";
import TourStepCard from "./TourStep";
import TourProgress from "./TourProgress";
import TourHighlight from "./TourHighlight";
import WelcomeCard from "./WelcomeCard";
import CompletionCard from "./CompletionCard";

interface GuidedTourProviderProps {
  /** Tour steps configuration */
  steps: TourStep[];
  /** Project name for welcome/completion cards */
  projectName: string;
  /** Project tagline for welcome card */
  projectTagline: string;
  /** Number of interview topics (for completion card) */
  topicCount: number;
  /** Current demo step index (0-based) */
  currentDemoStepIndex: number;
  /** Whether demo is currently playing */
  isDemoPlaying: boolean;
  /** Whether demo is paused */
  isDemoPaused: boolean;
  /** Whether the interview is complete */
  isInterviewComplete: boolean;
  /** Whether demo mode is active */
  isDemo: boolean;
  /** Callback to pause demo playback */
  onPauseDemo: () => void;
  /** Callback to resume demo playback */
  onResumeDemo: () => void;
  /** Callback to exit demo */
  onExitDemo: () => void;
  /** Callback to continue to summary */
  onContinue: () => void;
  /** Children (the actual demo UI) */
  children: React.ReactNode;
}

export default function GuidedTourProvider({
  steps,
  projectName,
  projectTagline,
  topicCount,
  currentDemoStepIndex,
  isDemoPlaying,
  isDemoPaused,
  isInterviewComplete,
  isDemo,
  onPauseDemo,
  onResumeDemo,
  onExitDemo,
  onContinue,
  children,
}: GuidedTourProviderProps) {
  const [tourState, setTourState] = useState<TourState>({
    isActive: true,
    currentStepIndex: 0,
    showWelcome: true,
    showCompletion: false,
    isPaused: false,
  });

  // Track which steps have been shown to prevent re-triggering
  const shownStepsRef = useRef<Set<number>>(new Set());
  // Track whether we've already triggered completion
  const completionShownRef = useRef(false);

  // Current tour step (if any is active)
  const currentStep: TourStep | null =
    tourState.isActive && !tourState.showWelcome && !tourState.showCompletion
      ? steps[tourState.currentStepIndex] ?? null
      : null;

  // Highlight target based on current step
  const highlightTarget: TourHighlightTarget = currentStep?.highlightTarget ?? null;

  // ── Step trigger logic ──────────────────────
  // Checks if a tour step should appear based on demo step index
  useEffect(() => {
    if (!isDemo || !tourState.isActive || tourState.showWelcome || tourState.showCompletion) return;
    if (!isDemoPlaying || isDemoPaused) return;
    if (isInterviewComplete) return;

    // Find a step that triggers at this demo step and hasn't been shown yet
    const pendingStepIndex = steps.findIndex(
      (s, i) => s.triggerAfterStep === currentDemoStepIndex && !shownStepsRef.current.has(i)
    );

    if (pendingStepIndex === -1) return;

    // Mark as shown
    shownStepsRef.current.add(pendingStepIndex);

    // Pause demo and show the step
    onPauseDemo();
    setTourState((prev) => ({
      ...prev,
      currentStepIndex: pendingStepIndex,
      isPaused: true,
    }));
  }, [isDemo, isDemoPlaying, isDemoPaused, isInterviewComplete, currentDemoStepIndex, steps, tourState.isActive, tourState.showWelcome, tourState.showCompletion, onPauseDemo]);

  // ── Completion trigger ──────────────────────
  useEffect(() => {
    if (!isDemo || !isInterviewComplete || completionShownRef.current) return;
    if (!tourState.isActive) return;

    completionShownRef.current = true;
    setTourState((prev) => ({
      ...prev,
      showCompletion: true,
      isPaused: true,
    }));
  }, [isDemo, isInterviewComplete, tourState.isActive]);

  // ── Handlers ────────────────────────────────

  const handleWelcomeStart = useCallback(() => {
    setTourState((prev) => ({
      ...prev,
      showWelcome: false,
    }));
    // Demo will auto-start via the existing InterviewStep logic
  }, []);

  const handleWelcomeExit = useCallback(() => {
    onExitDemo();
  }, [onExitDemo]);

  const handleStepAction = useCallback(() => {
    // Resume demo playback
    onResumeDemo();
    setTourState((prev) => ({
      ...prev,
      isPaused: false,
    }));
  }, [onResumeDemo]);

  const handleSkipTour = useCallback(() => {
    setTourState((prev) => ({
      ...prev,
      isActive: false,
      showWelcome: false,
      showCompletion: false,
      isPaused: false,
    }));
    // Resume demo if it was paused
    if (isDemoPaused) {
      onResumeDemo();
    }
  }, [isDemoPaused, onResumeDemo]);

  const handleCompletionContinue = useCallback(() => {
    onContinue();
  }, [onContinue]);

  const handleCompletionExit = useCallback(() => {
    onExitDemo();
  }, [onExitDemo]);

  // ── Render ──────────────────────────────────

  return (
    <>
      {/* Tour progress indicator (top-left, always visible during active tour) */}
      {isDemo && tourState.isActive && !tourState.showWelcome && !tourState.showCompletion && (
        <div className="fixed top-3 left-3 z-[65]">
          <TourProgress
            currentStep={tourState.currentStepIndex + 1}
            totalSteps={steps.length}
            stepTitles={steps.map((s) => s.title)}
          />
        </div>
      )}

      {/* Welcome card */}
      {isDemo && tourState.showWelcome && (
        <WelcomeCard
          projectName={projectName}
          projectTagline={projectTagline}
          onStart={handleWelcomeStart}
          onExit={handleWelcomeExit}
        />
      )}

      {/* Completion card */}
      {isDemo && tourState.showCompletion && (
        <CompletionCard
          projectName={projectName}
          topicCount={topicCount}
          onContinue={handleCompletionContinue}
          onExit={handleCompletionExit}
        />
      )}

      {/* Tour step card */}
      {currentStep && (
        <TourStepCard
          stepNumber={currentStep.stepNumber}
          totalSteps={currentStep.totalSteps}
          title={currentStep.title}
          message={currentStep.message}
          position={currentStep.position}
          actionLabel={currentStep.actionLabel}
          onAction={handleStepAction}
          onSkip={handleSkipTour}
        />
      )}

      {/* UI highlight overlay */}
      {currentStep && (
        <TourHighlight
          target={highlightTarget}
          visible={true}
        />
      )}

      {/* Main content (the demo UI) */}
      {children}
    </>
  );
}
