// ──────────────────────────────────────────────
// interviewStateMachine — pure-logic state
// machine for the conversation interview
// ──────────────────────────────────────────────

import type { ConfidenceLevel } from "../models/conversationMemory";
import { getAllTopicIds } from "./interviewTopics";

// ── Types ─────────────────────────────────────

/** The phase the interview is currently in. */
export type InterviewPhase = "exploring" | "deepening" | "confirming" | "complete";

/** A single state transition record. */
export interface StateTransition {
  from: InterviewPhase;
  to: InterviewPhase;
  reason: string;
  at: string; // ISO timestamp
}

/** The full state of the interview at any point. */
export interface InterviewState {
  /** Current interview phase */
  phase: InterviewPhase;
  /** The topic currently being discussed, or null */
  currentTopic: string | null;
  /** Topics that have been asked about */
  askedTopics: string[];
  /** Topics still remaining to cover */
  remainingTopics: string[];
  /** Overall confidence (0-1) */
  confidence: number;
  /** Completion percentage (0-100) */
  completion: number;
  /** History of phase transitions */
  history: StateTransition[];
}

// ── Default topics in priority order ──────────
// Derived from the central INTERVIEW_TOPICS registry

export const DEFAULT_TOPIC_ORDER: string[] = getAllTopicIds();

// ── Factory ───────────────────────────────────

/**
 * Create a fresh InterviewState with all topics remaining.
 */
export function createInitialInterviewState(
  topics?: string[],
): InterviewState {
  const ordered = topics ?? DEFAULT_TOPIC_ORDER;
  return {
    phase: "exploring",
    currentTopic: null,
    askedTopics: [],
    remainingTopics: [...ordered],
    confidence: 0,
    completion: 0,
    history: [],
  };
}

// ── Actions ───────────────────────────────────

export type InterviewAction =
  | { type: "START_TOPIC"; topic: string }
  | { type: "ANSWER_TOPIC"; topic: string }
  | { type: "SKIP_TOPIC"; topic: string }
  | { type: "SET_CONFIDENCE"; value: number }
  | { type: "SET_COMPLETION"; value: number }
  | { type: "ADD_TOPIC"; topic: string }
  | { type: "REMOVE_TOPIC"; topic: string }
  | { type: "RESET" };

// ── Phase transition rules ────────────────────

function determinePhase(state: InterviewState): InterviewPhase {
  const asked = state.askedTopics.length;
  const remaining = state.remainingTopics.length;
  const total = asked + remaining;

  if (total === 0) return "complete";

  const askedRatio = total > 0 ? asked / total : 0;

  // If we've asked most questions, move to confirming
  if (askedRatio >= 0.8 && state.confidence >= 0.6) return "confirming";

  // If we've asked some and have moderate confidence, deepen
  if (askedRatio >= 0.3 && state.confidence >= 0.3) return "deepening";

  // Otherwise still exploring
  return "exploring";
}

// ── Reducer ───────────────────────────────────

/**
 * Pure reducer: given a state and an action, returns the next state.
 * Does NOT mutate the input state.
 */
export function interviewReducer(
  state: InterviewState,
  action: InterviewAction,
): InterviewState {
  switch (action.type) {
    case "START_TOPIC": {
      const topic = action.topic;
      if (state.askedTopics.includes(topic)) {
        if (import.meta.env.DEV) {
          console.log("[DEBUG interviewReducer] START_TOPIC — already asked, no-op:", { topic });
        }
        return state;
      }

      const next: InterviewState = {
        ...state,
        currentTopic: topic,
        askedTopics: [...state.askedTopics, topic],
        remainingTopics: state.remainingTopics.filter((t) => t !== topic),
      };

      // Re-evaluate phase after starting a topic
      const newPhase = determinePhase(next);
      if (newPhase !== state.phase) {
        next.phase = newPhase;
        next.history = [
          ...state.history,
          {
            from: state.phase,
            to: newPhase,
            reason: `Started topic "${topic}"`,
            at: new Date().toISOString(),
          },
        ];
      }

      if (import.meta.env.DEV) {
        console.log("[DEBUG interviewReducer] START_TOPIC:", {
          topic,
          askedTopics: next.askedTopics,
          askedTopicsCount: next.askedTopics.length,
          remainingTopics: next.remainingTopics,
          remainingTopicsCount: next.remainingTopics.length,
          currentTopic: next.currentTopic,
          phase: next.phase,
        });
      }

      return next;
    }

    case "ANSWER_TOPIC": {
      const topic = action.topic;
      // Topic must have been started
      if (!state.askedTopics.includes(topic)) {
        if (import.meta.env.DEV) {
          console.log("[DEBUG interviewReducer] ANSWER_TOPIC — topic not in askedTopics, no-op:", { topic, askedTopics: state.askedTopics });
        }
        return state;
      }

      const next: InterviewState = {
        ...state,
        currentTopic: null,
        remainingTopics: state.remainingTopics.filter((t) => t !== topic),
      };

      // Re-evaluate phase after answering
      const newPhase = determinePhase(next);
      if (newPhase !== state.phase) {
        next.phase = newPhase;
        next.history = [
          ...state.history,
          {
            from: state.phase,
            to: newPhase,
            reason: `Answered topic "${topic}"`,
            at: new Date().toISOString(),
          },
        ];
      }

      if (import.meta.env.DEV) {
        console.log("[DEBUG interviewReducer] ANSWER_TOPIC:", {
          topic,
          askedTopics: next.askedTopics,
          askedTopicsCount: next.askedTopics.length,
          remainingTopics: next.remainingTopics,
          remainingTopicsCount: next.remainingTopics.length,
          currentTopic: next.currentTopic,
          phase: next.phase,
        });
      }

      return next;
    }

    case "SKIP_TOPIC": {
      const topic = action.topic;
      if (!state.askedTopics.includes(topic)) return state;

      const next: InterviewState = {
        ...state,
        currentTopic: null,
        remainingTopics: state.remainingTopics.filter((t) => t !== topic),
      };

      const newPhase = determinePhase(next);
      if (newPhase !== state.phase) {
        next.phase = newPhase;
        next.history = [
          ...state.history,
          {
            from: state.phase,
            to: newPhase,
            reason: `Skipped topic "${topic}"`,
            at: new Date().toISOString(),
          },
        ];
      }

      return next;
    }

    case "SET_CONFIDENCE": {
      const clamped = Math.max(0, Math.min(1, action.value));
      const next: InterviewState = {
        ...state,
        confidence: clamped,
      };

      const newPhase = determinePhase(next);
      if (newPhase !== state.phase) {
        next.phase = newPhase;
        next.history = [
          ...state.history,
          {
            from: state.phase,
            to: newPhase,
            reason: `Confidence changed to ${clamped.toFixed(2)}`,
            at: new Date().toISOString(),
          },
        ];
      }

      return next;
    }

    case "SET_COMPLETION": {
      const clamped = Math.max(0, Math.min(100, action.value));
      return { ...state, completion: clamped };
    }

    case "ADD_TOPIC": {
      const topic = action.topic;
      if (
        state.askedTopics.includes(topic) ||
        state.remainingTopics.includes(topic)
      ) {
        return state;
      }
      return {
        ...state,
        remainingTopics: [...state.remainingTopics, topic],
      };
    }

    case "REMOVE_TOPIC": {
      const removeTopic = action.topic;
      return {
        ...state,
        askedTopics: state.askedTopics.filter((t) => t !== removeTopic),
        remainingTopics: state.remainingTopics.filter((t) => t !== removeTopic),
      };
    }

    case "RESET": {
      return createInitialInterviewState([
        ...state.askedTopics,
        ...state.remainingTopics,
      ]);
    }

    default:
      return state;
  }
}

// ── Helpers ───────────────────────────────────

/**
 * Get the next unasked topic from the remaining list.
 * Returns null if all topics have been asked.
 */
export function getNextTopic(state: InterviewState): string | null {
  if (state.remainingTopics.length === 0) return null;
  return state.remainingTopics[0];
}

/**
 * Map a numeric confidence (0-1) to a ConfidenceLevel string.
 */
export function confidenceToLevel(value: number): ConfidenceLevel {
  if (value >= 0.9) return "confirmed";
  if (value >= 0.7) return "high";
  if (value >= 0.4) return "medium";
  return "low";
}

/**
 * Map a ConfidenceLevel string to a numeric value (0-1).
 */
export function levelToConfidence(level: ConfidenceLevel): number {
  switch (level) {
    case "confirmed":
      return 1;
    case "high":
      return 0.8;
    case "medium":
      return 0.5;
    case "low":
      return 0.2;
  }
}
