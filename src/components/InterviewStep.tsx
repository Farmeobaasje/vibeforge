// ──────────────────────────────────────────────
// InterviewStep — Step 2: AI Interview Workspace
// 3-column layout: Progress | Chat | Understanding
// Uses real useInterview hook (Epic 23.5B/C)
// Supports demo mode with scripted playback
// ──────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import ChatArea from "./ChatArea";
import ProgressPanel from "./ProgressPanel";
import UnderstandingPanel from "./UnderstandingPanel";
import { useInterview, parseInterviewError } from "../hooks/useInterview";
import { useArchitectTrigger } from "../hooks/useArchitectTrigger";
import type { ArchitectTriggerStatus } from "../hooks/useArchitectTrigger";
import type { SessionMode, DemoScenario, DemoPlaybackState } from "../demo/types";
import { GuidedTourProvider } from "./GuidedTour";


interface Props {
  /** Called when user wants to go back to Describe */
  onBack: () => void;
  /** Called when user wants to skip to Summary */
  onSkipToSummary: () => void;
  /** Called when interview is complete and user wants to continue */
  onContinue: () => void;
  /** Called to open AI Settings modal, optionally to a specific tab and endpoint */
  onOpenSettings?: (tab?: "endpoints" | "api-keys", focusEndpointId?: string) => void;
  /** Initial context from the Describe step (raw idea text) */
  initialContext?: string;
  // Demo mode props
  sessionMode?: SessionMode;
  activeDemo?: DemoScenario | null;
  demoPlayback?: DemoPlaybackState;
  setDemoPlayback?: (state: DemoPlaybackState) => void;
  onStopDemo?: () => void;
  onPauseDemo?: () => void;
  onResumeDemo?: () => void;
}

export default function InterviewStep({
  onBack,
  onSkipToSummary,
  onContinue,
  onOpenSettings,
  initialContext,
  sessionMode = "live",
  activeDemo = null,
  demoPlayback,
  setDemoPlayback,
  onStopDemo,
  onPauseDemo,
  onResumeDemo,
}: Props) {
  const isDemo = sessionMode === "demo" && activeDemo !== null;

  const {
    messages,
    topics,
    understanding,
    overallConfidence,
    activeTopic,
    isLoading,
    interviewComplete,
    error,
    hasStarted,
    typingContext,
    activeEndpoint,
    startInterview,
    sendAnswer,
    skipCurrentTopic,
    resetInterview,
  } = useInterview(initialContext, isDemo);

  const {
    runAnalysis,
    analysisError: architectError,
    analysisStatus,
  } = useArchitectTrigger();

  // ── Demo playback state ─────────────────────

  const [demoTypingText, setDemoTypingText] = useState("");
  const [demoStarted, setDemoStarted] = useState(false);
  const [_activeTooltip, setActiveTooltip] = useState<{ text: string; duration: number } | null>(null);
  const answerDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track which demo topics have been submitted (independent from live submittedTopics)
  const demoSubmittedTopicsRef = useRef<Set<string>>(new Set());
  // Prevent re-entry during typing animation
  const isTypingDemoAnswerRef = useRef(false);
  // Track mounted state for timer safety
  const mountedRef = useRef(true);

  // Clear all demo timers
  const clearDemoTimers = useCallback(() => {
    if (answerDelayTimerRef.current) {
      clearTimeout(answerDelayTimerRef.current);
      answerDelayTimerRef.current = null;
    }
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, []);

  // ── Auto-start interview in demo mode ───────

  useEffect(() => {
    if (isDemo && !demoStarted && !hasStarted && !isLoading) {
      setDemoStarted(true);
      startInterview();
    }
  }, [isDemo, demoStarted, hasStarted, isLoading, startInterview]);

  // ── Mounted ref ─────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Demo playback driver ────────────────────
  // Uses activeTopic (from ConversationEngine) as the sole trigger.
  // No question-text matching — in demo mode the engine state is authoritative.
  // Uses demoSubmittedTopicsRef for independent tracking (StrictMode safety).
  // Uses isTypingDemoAnswerRef to prevent re-entry during typing animation.
  // Direct submit via sendAnswer(step.answer, nextQuestionText).

  useEffect(() => {
    if (!isDemo || !activeDemo || !hasStarted) return;
    if (!demoPlayback?.isPlaying || demoPlayback.isPaused) return;
    if (interviewComplete) return;
    if (!activeTopic) return;

    // Find the script step matching the current activeTopic
    const steps = activeDemo.interview;
    const stepIndex = steps.findIndex((s) => s.topic === activeTopic);
    if (stepIndex === -1) return;

    // Prevent duplicate submissions for this topic (StrictMode safety)
    if (demoSubmittedTopicsRef.current.has(activeTopic)) return;

    // Prevent re-entry if already typing an answer
    if (isTypingDemoAnswerRef.current) return;

    // Mark this topic as submitted immediately to prevent re-entry
    demoSubmittedTopicsRef.current.add(activeTopic);
    isTypingDemoAnswerRef.current = true;

    const step = steps[stepIndex];

    // Start typing animation after the configured delay
    const delay = step.delay || 1500;
    answerDelayTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) {
        isTypingDemoAnswerRef.current = false;
        return;
      }

      const speed = step.typingSpeed || 25;
      let charIndex = 0;

      typingTimerRef.current = setInterval(() => {
        if (!mountedRef.current) {
          if (typingTimerRef.current) {
            clearInterval(typingTimerRef.current);
            typingTimerRef.current = null;
          }
          isTypingDemoAnswerRef.current = false;
          return;
        }

        if (charIndex < step.answer.length) {
          setDemoTypingText(step.answer.substring(0, charIndex + 1));
          charIndex++;
        } else {
          // Typing complete — clear interval
          if (typingTimerRef.current) {
            clearInterval(typingTimerRef.current);
            typingTimerRef.current = null;
          }
          isTypingDemoAnswerRef.current = false;

          // Find the next script step to pass its question as nextQuestionText
          const nextStep = steps[stepIndex + 1];
          const nextQuestionText = nextStep?.question;

          // Send the answer with the next scripted question text
          sendAnswer(step.answer, nextQuestionText);

          // Clear typing text after submit
          setDemoTypingText("");

          // Advance demo playback step index
          if (setDemoPlayback) {
            setDemoPlayback({
              ...demoPlayback,
              currentStepIndex: stepIndex + 1,
            });
          }

          // Show tooltip if available
          const tooltip = activeDemo.tooltips.find((t) => t.afterStep === stepIndex);
          if (tooltip) {
            setActiveTooltip({ text: tooltip.text, duration: tooltip.duration });
          }
        }
      }, speed);
    }, delay);

    // No cleanup in this effect — timers are managed by clearDemoTimers on unmount/exit
    // This prevents the timer-clearing-on-re-render bug (Bug #2)
  }, [isDemo, activeDemo, hasStarted, demoPlayback, activeTopic, interviewComplete, sendAnswer, setDemoPlayback]);


  // ── Cleanup on unmount ──────────────────────

  useEffect(() => {
    return () => {
      clearDemoTimers();
    };
  }, [clearDemoTimers]);

  // ── Handlers ────────────────────────────────

  const handleSend = useCallback(
    (message: string) => {
      if (isDemo) return; // Block manual input in demo mode
      sendAnswer(message);
    },
    [sendAnswer, isDemo],
  );

  const handleSkip = useCallback(() => {
    if (isDemo) return; // Block skip in demo mode
    skipCurrentTopic();
  }, [skipCurrentTopic, isDemo]);

  const handleReset = useCallback(() => {
    if (isDemo) return; // Block reset in demo mode
    if (window.confirm("This will clear all interview progress. Are you sure?")) {
      resetInterview();
    }
  }, [resetInterview, isDemo]);

  const handleSkipToSummary = useCallback(() => {
    if (isDemo) return; // Block skip in demo mode
    if (window.confirm("Are you sure? Skipping will use your current project description as-is.")) {
      onSkipToSummary();
    }
  }, [onSkipToSummary, isDemo]);

  const canSkip = !isLoading && !interviewComplete && hasStarted && !isDemo;
  const canContinue = interviewComplete;

  // ── Error handling ──────────────────────────

  const errorInfo = error ? parseInterviewError(error) : null;

  const renderErrorBanner = () => {
    if (!errorInfo) return null;

    const deriveEndpointId = (): string | undefined => {
      if (activeEndpoint) {
        return undefined;
      }
      return undefined;
    };

    const errorConfigs: Record<string, {
      icon: string;
      title: string;
      actionLabel: string;
      action: () => void;
      color: string;
    }> = {
      "no-endpoint": {
        icon: "🔌",
        title: "No AI Endpoint Configured",
        actionLabel: "Open AI Settings",
        action: () => onOpenSettings?.("api-keys"),
        color: "border-warning/30 bg-warning/10",
      },
      "endpoint-disabled": {
        icon: "⚠️",
        title: "Endpoint Disabled",
        actionLabel: "Open AI Settings",
        action: () => onOpenSettings?.("api-keys"),
        color: "border-warning/30 bg-warning/10",
      },
      "api-key-missing": {
        icon: "🔑",
        title: "API Key Required",
        actionLabel: "Open AI Settings",
        action: () => onOpenSettings?.("api-keys", deriveEndpointId()),
        color: "border-warning/30 bg-warning/10",
      },
      "provider-failed": {
        icon: "❌",
        title: "AI Provider Error",
        actionLabel: "Retry",
        action: () => startInterview(),
        color: "border-danger/30 bg-danger/10",
      },
      "unknown": {
        icon: "⚠️",
        title: "Interview Error",
        actionLabel: "Retry",
        action: () => startInterview(),
        color: "border-danger/30 bg-danger/10",
      },
    };

    const cfg = errorConfigs[errorInfo.type] ?? errorConfigs["unknown"];

    return (
      <div className={`mx-6 mt-3 px-4 py-3 ${cfg.color} border rounded-lg flex items-start gap-3`}>
        <span className="text-lg shrink-0 mt-0.5">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-danger font-medium">{cfg.title}</p>
          <p className="text-xs text-danger/80 mt-0.5">{errorInfo.message}</p>
        </div>
        <button
          onClick={cfg.action}
          className="px-3 py-1.5 bg-danger/10 hover:bg-danger/20 text-danger text-xs font-medium rounded-lg transition-colors border border-danger/30 shrink-0"
        >
          {cfg.actionLabel}
        </button>
      </div>
    );
  };

  // ── Welcome screen (before interview starts) ──

  if (!hasStarted && !isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)] min-h-[600px]">
        {/* ── Minimal Header ── */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-app bg-surface/80">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-brand-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-app">AI Software Architect</h2>
              <p className="text-[10px] text-muted">
                {isDemo ? "Guided Demo — sit back and watch" : "Press Start to begin the interview"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDemo && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand/10 text-brand border border-brand/30">
                ▶ DEMO
              </span>
            )}
            {activeEndpoint && (
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${activeEndpoint.providerColor}`}>
                🤖 {activeEndpoint.label}
              </span>
            )}
            <button
              onClick={() => onOpenSettings?.()}
              className="btn-ghost p-1.5"
              title="AI Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Error Banner (visible on welcome screen too) ── */}
        {renderErrorBanner()}

        {/* ── Welcome Content ── */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-brand-gradient border border-brand/30 flex items-center justify-center mx-auto mb-6 shadow-brand-md">
              <svg className="w-8 h-8 text-on-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-app mb-2">
              {isDemo ? "Guided Demo" : "AI Software Architect"}
            </h3>
            <p className="text-sm text-secondary mb-6 leading-relaxed">
              {isDemo
                ? "Watch the AI interview a project in real-time. You'll see how the conversation builds a complete Project Definition step by step."
                : "The AI will ask you questions about your project to build a complete Project Definition. Answer naturally — you can skip topics you're not sure about."
              }
            </p>

            {activeEndpoint && (
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-xs text-muted">Using:</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${activeEndpoint.providerColor}`}>
                  🤖 {activeEndpoint.label}
                </span>
              </div>
            )}

            <button
              onClick={startInterview}
              className="btn-primary px-6 py-3 text-sm mx-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {isDemo ? "Start Demo" : "Start Interview"}
            </button>
          </div>
        </div>

        {/* ── Footer Navigation ── */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-app bg-surface/60">
          <button
            onClick={isDemo ? onStopDemo : onBack}
            className="btn-secondary text-sm px-4 py-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {isDemo ? "Exit Demo" : "Back to Describe"}
          </button>

          <div className="flex items-center gap-3">
            {!isDemo && (
              <button
                onClick={handleSkipToSummary}
                className="btn-ghost text-xs px-3 py-1.5 border border-muted"
                title="Skip the interview and use your current project description as-is"
              >
                Skip to Summary
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Interview active / complete ──

  // Build the demo UI content
  const demoUI = (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[600px]">
      {/* ── Minimal Header ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-app bg-surface/80">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-brand-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-app">AI Software Architect</h2>
            <p className="text-[10px] text-muted">
              {isDemo
                ? "▶ Guided Demo in progress"
                : error
                  ? "Connection issue — check your AI settings"
                  : interviewComplete
                    ? "✅ Interview complete — review your project summary below"
                    : isLoading && !hasStarted
                      ? "Starting interview..."
                      : "Building your Project Definition"
              }
            </p>
          </div>

          {/* Provider badge */}
          {activeEndpoint && (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ml-2 ${activeEndpoint.providerColor}`}>
              🤖 {activeEndpoint.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Demo controls */}
          {isDemo && (
            <>
              {demoPlayback?.isPaused ? (
                <button
                  onClick={onResumeDemo}
                  className="btn-ghost text-[11px] px-2.5 py-1.5 border border-brand/30 text-brand"
                  title="Resume demo"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Resume
                </button>
              ) : (
                <button
                  onClick={onPauseDemo}
                  className="btn-ghost text-[11px] px-2.5 py-1.5 border border-muted"
                  title="Pause demo"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                  Pause
                </button>
              )}
              <button
                onClick={onStopDemo}
                className="btn-ghost text-[11px] px-2.5 py-1.5 border border-danger/30 text-danger hover:bg-danger/10"
                title="Exit demo"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Exit
              </button>
            </>
          )}

          {/* Reset button (live mode only) */}
          {hasStarted && !isDemo && (
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="btn-ghost text-[11px] px-2.5 py-1.5 border border-muted disabled:opacity-50 disabled:cursor-not-allowed"
              title="Reset interview progress"
            >
              Reset
            </button>
          )}
          <button
            onClick={() => onOpenSettings?.()}
            className="btn-ghost p-1.5"
            title="AI Settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {renderErrorBanner()}

      {/* ── 3-Column Workspace ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Progress Panel (~20%) */}
        <div className="w-[240px] border-r border-app bg-surface/30 shrink-0 overflow-hidden">
          <ProgressPanel
            topics={topics}
            overallConfidence={overallConfidence}
            activeTopic={activeTopic ?? undefined}
          />
        </div>

        {/* Center: Chat Area (~55-60%) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-app/20">
          <ChatArea
            messages={messages}
            isLoading={isLoading}
            onSend={handleSend}
            onSkip={handleSkip}
            canSkip={canSkip}
            disabled={interviewComplete || isDemo}
            typingContext={typingContext}
            demoAnswer={isDemo && demoTypingText.length > 0 ? demoTypingText : undefined}

            placeholder={
              isDemo
                ? "Demo in progress — answers are automated"
                : !hasStarted
                  ? "Starting interview..."
                  : interviewComplete
                    ? "Interview complete — continue to the Summary step"
                    : "Type your answer here..."
            }
          />
        </div>

        {/* Right: Understanding Panel (~25%) */}
        <div className="w-[280px] border-l border-app bg-surface/30 shrink-0 overflow-hidden">
          <UnderstandingPanel
            data={understanding}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* ── Footer Navigation ── */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-app bg-surface/60">
        <button
          onClick={isDemo ? onStopDemo : onBack}
          className="btn-secondary text-sm px-4 py-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {isDemo ? "Exit Demo" : "Back"}
        </button>

        {/* Center: Progress indicator */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs text-muted">Project Understanding</span>
          <div className="w-32 h-1.5 bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-all duration-700 ease-out"
              style={{ width: `${Math.round(overallConfidence)}%` }}
            />
          </div>
          <span className="text-xs text-muted tabular-nums font-medium">{Math.round(overallConfidence)}%</span>
        </div>

        <div className="flex items-center gap-2">
          {!isDemo && (
            <button
              onClick={handleSkipToSummary}
              className="btn-ghost text-xs px-3 py-1.5 border border-muted"
              title="Skip the interview and use your current project description as-is"
            >
              Skip
            </button>
          )}

          {/* Architect Analysis Trigger (only when interview is complete) */}
          {interviewComplete && (
            <ArchitectAnalysisButton
              status={analysisStatus}
              error={architectError}
              onRun={runAnalysis}
            />
          )}

          <button
            onClick={onContinue}
            disabled={!canContinue}
            className={`
              px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2
              ${canContinue
                ? "btn-primary"
                : "bg-elevated text-muted cursor-not-allowed"
              }
            `}
          >
            {canContinue ? (
              <>
                Continue
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            ) : (
              "Complete more topics to continue"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // In demo mode, wrap with GuidedTourProvider
  if (isDemo && activeDemo) {
    return (
      <GuidedTourProvider
        steps={activeDemo.tourSteps ?? []}
        projectName={activeDemo.project.name}
        projectTagline={activeDemo.project.tagline}
        topicCount={activeDemo.interview.length}
        currentDemoStepIndex={demoPlayback?.currentStepIndex ?? 0}
        isDemoPlaying={demoPlayback?.isPlaying ?? false}
        isDemoPaused={demoPlayback?.isPaused ?? false}
        isInterviewComplete={interviewComplete}
        isDemo={isDemo}
        onPauseDemo={onPauseDemo ?? (() => {})}
        onResumeDemo={onResumeDemo ?? (() => {})}
        onExitDemo={onStopDemo ?? (() => {})}
        onContinue={onContinue}
      >
        {demoUI}
      </GuidedTourProvider>
    );
  }

  // Live mode — render directly
  return demoUI;

}

// ── Architect Analysis Button ─────────────────

interface ArchitectAnalysisButtonProps {
  status: ArchitectTriggerStatus;
  error: string | null;
  onRun: () => void;
}

function ArchitectAnalysisButton({ status, error, onRun }: ArchitectAnalysisButtonProps) {
  switch (status) {
    case "idle":
      return (
        <button
          onClick={onRun}
          className="px-3 py-1.5 bg-warning/10 hover:bg-warning/20 text-warning text-xs font-medium rounded-lg transition-colors border border-warning/30 flex items-center gap-2"
          title="Run an AI architecture analysis based on the interview results"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Analyze
        </button>
      );

    case "analyzing":
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/10 text-brand-soft text-xs font-medium rounded-lg border border-brand/30">
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Analyzing...
        </span>
      );

    case "ready":
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success text-xs font-medium rounded-lg border border-success/30">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Ready
        </span>
      );

    case "error":
      return (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-danger/10 text-danger text-xs font-medium rounded-lg border border-danger/30" title={error ?? undefined}>
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Failed
          </span>
          <button
            onClick={onRun}
            className="btn-secondary text-xs px-2.5 py-1.5"
            title="Retry architecture analysis"
          >
            Retry
          </button>
        </div>
      );

    default:
      return null;
  }
}
