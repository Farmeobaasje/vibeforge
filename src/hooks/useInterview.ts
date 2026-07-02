// ──────────────────────────────────────────────
// useInterview — Epic 23.5B/C
// Bridges the static Interview Workspace UI with
// the real Conversation Engine + Interview Agent.
//
// Owns the full interview lifecycle:
//   startInterview → sendAnswer / skipTopic → done
//
// Derives all UI state (messages, topics, understanding,
// confidence, progress) from the engine.
// ──────────────────────────────────────────────

import { useState, useCallback, useRef } from "react";
import { createOrchestrator, type Orchestrator } from "../orchestrator";
import {
  startNewInterview,
  processUserAnswer,
  processUserAnswerDemo,
  skipTopic,
  type InterviewSessionConfig,
  type InterviewSessionResult,
} from "../ai/interview";
import { useConversationMemory } from "./useConversationMemory";
import { useProjectRequirements } from "./useProjectRequirements";
import { buildRequirements, getRequiredTopicIds, topicLabel, type InterviewState } from "../orchestrator";
import { loadActiveEndpointId, loadEndpoints, getApiKeyForEndpoint } from "../ai/settings";
import type { ChatMessageData } from "../components/ChatArea";
import type { TopicProgress } from "../components/ProgressPanel";
import type { UnderstandingData } from "../components/UnderstandingPanel";
import type { TypingContext } from "../components/TypingIndicator";
import { getProviderColor } from "../ai/provider-config";
import { createEmptyConversationMemory } from "../models/conversationMemory";


// ── Types ─────────────────────────────────────

export interface UseInterviewReturn {
  /** Chat messages for the ChatArea */
  messages: ChatMessageData[];
  /** Topic progress for the ProgressPanel */
  topics: TopicProgress[];
  /** Current understanding data for the UnderstandingPanel */
  understanding: UnderstandingData;
  /** Overall confidence percentage (0-100) */
  overallConfidence: number;
  /** The currently active topic */
  activeTopic: string | null;
  /** Whether the AI is currently generating a response */
  isLoading: boolean;
  /** Whether the interview is complete */
  interviewComplete: boolean;
  /** Error message if something went wrong, or null */
  error: string | null;
  /** Whether the interview has been started */
  hasStarted: boolean;
  /** Typing indicator context label */
  typingContext: TypingContext | null;
  /** Active endpoint display info */
  activeEndpoint: { label: string; model: string; providerColor: string } | null;

  /** Start a new interview session */
  startInterview: () => Promise<void>;
  /** Send a user answer to the current question */
  sendAnswer: (answer: string, nextQuestionText?: string) => Promise<void>;
  /** Skip the current topic */
  skipCurrentTopic: () => Promise<void>;
  /** Reset the entire interview */
  resetInterview: () => void;
}

// ── Error types ───────────────────────────────

export type InterviewErrorType =
  | "no-endpoint"
  | "endpoint-disabled"
  | "api-key-missing"
  | "provider-failed"
  | "unknown";

export interface InterviewErrorInfo {
  type: InterviewErrorType;
  message: string;
}

/**
 * Parse an error message to determine the error type.
 */
export function parseInterviewError(errorMessage: string): InterviewErrorInfo {
  const lower = errorMessage.toLowerCase();

  if (lower.includes("no active ai endpoint") || lower.includes("no endpoint")) {
    return { type: "no-endpoint", message: errorMessage };
  }
  if (lower.includes("disabled")) {
    return { type: "endpoint-disabled", message: errorMessage };
  }
  if (lower.includes("api key") || lower.includes("no api key")) {
    return { type: "api-key-missing", message: errorMessage };
  }
  if (
    lower.includes("failed") ||
    lower.includes("error") ||
    lower.includes("timeout") ||
    lower.includes("network") ||
    lower.includes("llm call failed")
  ) {
    return { type: "provider-failed", message: errorMessage };
  }

  return { type: "unknown", message: errorMessage };
}

// ── Constants ─────────────────────────────────
// Derived from the central INTERVIEW_TOPICS registry
// Uses getRequiredTopicIds() to exclude optional topics (e.g. project-name)

const DEFAULT_TOPIC_ORDER = getRequiredTopicIds();

// ── Helpers ───────────────────────────────────

/**
 * Map a completion score (0-100) to a topic confidence (0-100).
 * Uses the total completion as a proxy for per-topic confidence.
 */
function completionToTopicConfidence(completionTotal: number): number {
  return Math.round(completionTotal);
}

/**
 * Build TopicProgress[] from the engine state and completion.
 */
function buildTopicProgress(
  askedTopics: string[],
  _remainingTopics: string[],
  completionTotal: number,
  currentTopic: string | null,
): TopicProgress[] {
  const allTopics = [...DEFAULT_TOPIC_ORDER];
  const confidence = completionToTopicConfidence(completionTotal);

  return allTopics.map((topic) => {
    const discussed = askedTopics.includes(topic);
    const isActive = topic === currentTopic;
    // Distribute confidence: discussed topics get a share, active gets partial
    let topicConfidence = 0;
    if (discussed && !isActive) {
      // Completed topics get a proportional share
      const idx = askedTopics.indexOf(topic);
      topicConfidence = Math.min(100, Math.round((confidence / Math.max(1, askedTopics.length)) * (idx + 1)));
    } else if (isActive) {
      // Active topic gets partial credit
      topicConfidence = Math.min(50, Math.round(confidence * 0.3));
    }

    return {
      topic,
      label: topicLabel(topic),
      discussed,
      confidence: topicConfidence,
    };
  });
}

/**
 * Build UnderstandingData from a RequirementsBuildResult.
 */
function buildUnderstanding(
  requirementsResult: ReturnType<typeof buildRequirements>,
): UnderstandingData {
  const u = requirementsResult.update;
  return {
    vision: u.vision || undefined,
    targetUsers: u.targetUsers?.length ? u.targetUsers : undefined,
    problem: u.problems?.length ? u.problems[0] : undefined,
    solution: u.solutionIdeas?.length ? u.solutionIdeas[0] : undefined,
    techStack: u.preferredTech?.length ? u.preferredTech : undefined,
    constraints: u.constraints?.length ? u.constraints : undefined,
    assumptions: requirementsResult.missingFields.map(
      (mf) => `Need to clarify: ${mf.reason}`,
    ),
    nextObjective:
      requirementsResult.openQuestions.length > 0
        ? requirementsResult.openQuestions[0].question
        : undefined,
  };
}

/**
 * Build ChatMessageData[] from ConversationMemory messages.
 */
function buildMessages(
  memoryMessages: Array<{ id: string; role: "user" | "assistant"; content: string; createdAt: string }>,
): ChatMessageData[] {
  return memoryMessages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
  }));
}

/**
 * Get active endpoint display info.
 */
function getActiveEndpointInfo(): { label: string; model: string; providerColor: string } | null {
  try {
    const activeId = loadActiveEndpointId();
    if (!activeId) return null;

    const endpoints = loadEndpoints();
    const active = endpoints.find((e) => e.id === activeId);
    if (!active) return null;

    // Derive provider color from the endpoint's providerId
    const providerColor = getProviderColor(active.providerId as any);

    return {
      label: active.label,
      model: active.model,
      providerColor,
    };
  } catch {
    return null;
  }
}

// ── Hook ──────────────────────────────────────

export function useInterview(initialContext?: string, demoMode?: boolean): UseInterviewReturn {
  // ── Sub-hooks ─────────────────────────────
  const {
    memory,
    replaceMemory,
    resetMemory,
  } = useConversationMemory();

  const {
    setVision,
    setProjectName,
    setGoals,
    setTargetUsers,
    setProblems,
    setSolutionIdeas,
    setMvpScope,
    setIntegrations,
    setConstraints,
    setPreferredTech,
    setAiWorkflowTarget,
    setRisks,
    setUnknowns,
    setConfidence: setRequirementsConfidence,
    resetRequirements,
  } = useProjectRequirements();

  // ── Local state ───────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [askedTopics, setAskedTopics] = useState<string[]>([]);
  const [remainingTopics, setRemainingTopics] = useState<string[]>([...DEFAULT_TOPIC_ORDER]);
  const [completionTotal, setCompletionTotal] = useState(0);
  const [typingContext, setTypingContext] = useState<TypingContext | null>(null);

  // Keep a ref to the latest session result for topic tracking
  const lastResultRef = useRef<InterviewSessionResult | null>(null);

  // Keep a ref to the latest engine state for state persistence across calls.
  // This is the key fix: the ConversationEngine state must survive between
  // processUserAnswer / skipTopic calls so askedTopics grows monotonically.
  const engineStateRef = useRef<InterviewState | null>(null);

  // Active endpoint info (computed fresh on each render so it reflects AI Settings changes)
  const activeEndpoint = getActiveEndpointInfo();

  // ── Orchestrator (fresh on each call) ────
  // Always create a new orchestrator so AI Settings changes are reflected immediately.
  // The orchestrator reads fresh endpoints/keys from localStorage on each call.
  const getOrchestrator = useCallback((): Orchestrator => {
    return createOrchestrator();
  }, []);

  /**
   * Validate that we have a working endpoint + API key before starting.
   */
  const validateConfig = useCallback((): string | null => {
    const activeId = loadActiveEndpointId();
    if (import.meta.env.DEV) {
      console.log(`[useInterview] validateConfig: activeId="${activeId}"`);
    }
    if (!activeId) {
      return "No active AI endpoint configured. Open AI Settings and select an endpoint.";
    }

    const orchestrator = getOrchestrator();
    const endpoints = orchestrator.getEndpoints();
    const active = endpoints.find((e) => e.id === activeId);

    if (!active) {
      if (import.meta.env.DEV) {
        console.log(`[useInterview] validateConfig: endpoint "${activeId}" NOT FOUND (${endpoints.length} endpoints)`);
      }
      return `Active endpoint "${activeId}" not found. Open AI Settings to configure it.`;
    }

    if (import.meta.env.DEV) {
      console.log(`[useInterview] validateConfig: found "${active.label}", providerId="${active.providerId}", enabled=${active.enabled}`);
    }

    if (!active.enabled) {
      return `Endpoint "${active.label}" is disabled. Enable it in AI Settings.`;
    }

    // Check if the endpoint requires an API key
    // Use the unified helper: tries providerId first, then endpoint.id
    const requiresKey = activeId !== "mock";
    if (requiresKey) {
      const key = getApiKeyForEndpoint(active);
      if (import.meta.env.DEV) {
        console.log(`[useInterview] validateConfig: hasApiKey=${!!key}`);
      }
      if (!key) {
        return `No API key configured for "${active.label}". Add your key in AI Settings.`;
      }
    }

    return null; // All good
  }, [getOrchestrator]);

  /**
   * Apply a RequirementsUpdate to the ProjectRequirements hook.
   */
  const applyRequirementsUpdate = useCallback(
    (update: ReturnType<typeof buildRequirements>) => {
      const u = update.update;
      if (u.vision !== undefined) setVision(u.vision);
      if (u.projectName !== undefined) setProjectName(u.projectName);
      if (u.goals !== undefined) setGoals(u.goals);
      if (u.targetUsers !== undefined) setTargetUsers(u.targetUsers);
      if (u.problems !== undefined) setProblems(u.problems);
      if (u.solutionIdeas !== undefined) setSolutionIdeas(u.solutionIdeas);
      if (u.mvpScope !== undefined) setMvpScope(u.mvpScope);
      if (u.integrations !== undefined) setIntegrations(u.integrations);
      if (u.constraints !== undefined) setConstraints(u.constraints);
      if (u.preferredTech !== undefined) setPreferredTech(u.preferredTech);
      if (u.aiWorkflowTarget !== undefined) setAiWorkflowTarget(u.aiWorkflowTarget);
      if (u.risks !== undefined) setRisks(u.risks);
      if (u.unknowns !== undefined) setUnknowns(u.unknowns);
      if (u.confidence !== undefined) setRequirementsConfidence(u.confidence);
    },
    [
      setVision, setProjectName, setGoals, setTargetUsers, setProblems,
      setSolutionIdeas, setMvpScope, setIntegrations, setConstraints,
      setPreferredTech, setAiWorkflowTarget, setRisks, setUnknowns,
      setRequirementsConfidence,
    ],
  );

  /**
   * Process a session result: update memory, topics, understanding, etc.
   */
  const processResult = useCallback(
    (result: InterviewSessionResult) => {
      // Store for topic tracking
      lastResultRef.current = result;

      // Update completion
      setCompletionTotal(result.completion.total);

      // Update topic tracking from engine state
      setAskedTopics(result.state.askedTopics);
      setRemainingTopics(result.state.remainingTopics);
      setActiveTopic(result.state.currentTopic);

      // Update interview complete flag
      setInterviewComplete(result.done);

      // Apply requirements update
      applyRequirementsUpdate(result.requirements);

      // Clear loading and error
      setIsLoading(false);
      setError(null);
      setTypingContext(null);
    },
    [applyRequirementsUpdate],
  );

  /**
   * Handle an error during interview operations.
   */
  const handleError = useCallback(
    (err: unknown, context: string) => {
      const message =
        err instanceof Error ? err.message : String(err);
      setError(`${context}: ${message}`);
      setIsLoading(false);
      setTypingContext(null);
    },
    [],
  );

  // ── Public API ─────────────────────────────

  /**
   * Start a new interview session.
   * Validates config, creates fresh memory, asks the first question.
   * If initialContext is provided, seeds the conversation with the user's raw idea.
   */
  const startInterview = useCallback(async () => {
    // Validate config first (skip in demo mode)
    if (!demoMode) {
      const configError = validateConfig();
      if (configError) {
        setError(configError);
        return;
      }
    }

    setIsLoading(true);
    setTypingContext("preparing");
    setError(null);
    setHasStarted(true);
    setInterviewComplete(false);
    setCompletionTotal(0);
    setAskedTopics([]);
    setRemainingTopics([...DEFAULT_TOPIC_ORDER]);
    setActiveTopic(null);

    try {
      const orchestrator = getOrchestrator();
      const config: InterviewSessionConfig = {
        orchestrator,
      };

      // If we have initial context, seed a temporary memory with the user's raw idea
      // so the Interview Agent knows what the user typed and can ask a relevant question.
      // Pass it to startNewInterview so the session includes it in its cloned memory.
      let seedMemory = undefined;
      if (initialContext) {
        seedMemory = createEmptyConversationMemory();
        seedMemory.messages.push({
          id: crypto.randomUUID(),
          role: "user",
          content: initialContext,
          createdAt: new Date().toISOString(),
        });
      }

      // Clear any previous engine state — new interview starts fresh
      engineStateRef.current = null;

      const result = await startNewInterview(config, seedMemory);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        setTypingContext(null);
        return;
      }

      // Persist the engine state for subsequent calls
      engineStateRef.current = result.state;

      // Replace the entire hook memory with the authoritative session result.
      // result.memory contains both the user seed message (if any) and the
      // assistant's first question, plus the questions[] entry.
      replaceMemory(result.memory);

      processResult(result);
    } catch (err) {
      handleError(err, "Failed to start interview");
    }
  }, [validateConfig, getOrchestrator, replaceMemory, processResult, handleError, initialContext, demoMode]);

  /**
   * Send a user answer to the current question.
   */
  const sendAnswer = useCallback(
    async (answer: string, nextQuestionText?: string) => {
      if (isLoading || interviewComplete) return;

      const lastResult = lastResultRef.current;
      if (!lastResult) {
        setError("No active interview session. Start the interview first.");
        return;
      }

      setIsLoading(true);
      setTypingContext("analyzing");
      setError(null);

      try {
        const orchestrator = getOrchestrator();
        const config: InterviewSessionConfig = {
          orchestrator,
        };

        const topic = lastResult.topic ?? "vision";

        // In demo mode, use the lightweight demo path (no LLM calls)
        if (demoMode) {
          const result = await processUserAnswerDemo(
            memory,
            topic,
            answer,
            engineStateRef.current ?? undefined,
            nextQuestionText,
          );

          if (result.error) {
            setError(result.error);
            setIsLoading(false);
            setTypingContext(null);
            return;
          }

          engineStateRef.current = result.state;
          if (!result.done) {
            setTypingContext(result.isFollowUp ? "follow-up" : "next-topic");
          }
          replaceMemory(result.memory);
          processResult(result);
          return;
        }

        // Normal path: Pass the hook's current memory to processUserAnswer.
        // The session clones it internally, records the user answer,
        // updates the matching question, generates the next LLM question,
        // and returns the complete updated memory in result.memory.
        //
        // Also pass the persisted engine state so the ConversationEngine
        // doesn't start fresh on every call — this is the key fix for
        // the interview completion loop bug.
        const result = await processUserAnswer(
          memory,
          config,
          topic,
          answer,
          engineStateRef.current ?? undefined,
        );

        if (result.error) {
          setError(result.error);
          setIsLoading(false);
          setTypingContext(null);
          return;
        }

        // Persist the updated engine state for the next call
        engineStateRef.current = result.state;

        // Update typing context based on whether next question is a follow-up
        if (!result.done) {
          setTypingContext(result.isFollowUp ? "follow-up" : "next-topic");
        }

        // Replace the entire hook memory with the authoritative session result.
        // This syncs the answered question, the new assistant question, and the
        // new questions[] entry in one atomic operation — no manual addMessage/
        // addQuestion/updateQuestionAnswer needed.
        replaceMemory(result.memory);

        processResult(result);
      } catch (err) {
        handleError(err, "Failed to process answer");
      }
    },
    [isLoading, interviewComplete, memory, replaceMemory, getOrchestrator, processResult, handleError, demoMode],
  );

  /**
   * Skip the current topic and move to the next question.
   */
  const skipCurrentTopic = useCallback(async () => {
    if (isLoading || interviewComplete) return;

    const lastResult = lastResultRef.current;
    if (!lastResult) {
      setError("No active interview session. Start the interview first.");
      return;
    }

    setIsLoading(true);
    setTypingContext("next-topic");
    setError(null);

    try {
      const orchestrator = getOrchestrator();
      const config: InterviewSessionConfig = {
        orchestrator,
      };

      const result = await skipTopic(
        memory,
        config,
        engineStateRef.current ?? undefined,
      );

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        setTypingContext(null);
        return;
      }

      // Persist the updated engine state for the next call
      engineStateRef.current = result.state;

      // Replace the entire hook memory with the authoritative session result.
      replaceMemory(result.memory);

      processResult(result);
    } catch (err) {
      handleError(err, "Failed to skip topic");
    }
  }, [isLoading, interviewComplete, memory, replaceMemory, getOrchestrator, processResult, handleError]);

  /**
   * Reset the entire interview: memory, requirements, local state.
   */
  const resetInterview = useCallback(() => {
    resetMemory();
    resetRequirements();
    setIsLoading(false);
    setError(null);
    setHasStarted(false);
    setInterviewComplete(false);
    setActiveTopic(null);
    setAskedTopics([]);
    setRemainingTopics([...DEFAULT_TOPIC_ORDER]);
    setCompletionTotal(0);
    setTypingContext(null);
    lastResultRef.current = null;
    engineStateRef.current = null;
  }, [resetMemory, resetRequirements]);

  // ── Derived state ──────────────────────────

  const messages = buildMessages(memory.messages);
  const topics = buildTopicProgress(askedTopics, remainingTopics, completionTotal, activeTopic);

  // Build understanding from the latest requirements result
  // We derive it from the current memory using buildRequirements
  const currentRequirementsResult = buildRequirements(memory);
  const understanding = buildUnderstanding(currentRequirementsResult);

  const overallConfidence = completionTotal;

  return {
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
  };
}

