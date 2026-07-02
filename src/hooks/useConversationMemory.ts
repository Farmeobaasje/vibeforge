// ──────────────────────────────────────────────
// useConversationMemory — conversation state hook
// ──────────────────────────────────────────────

import { useState, useCallback, useRef } from "react";
import {
  type ConversationMemory,
  type ChatMessage,
  type InterviewQuestion,
  type Assumption,
  type Decision,
  type ConfidenceLevel,
  createEmptyConversationMemory,
} from "../models/conversationMemory";
import {
  loadConversationMemory,
  saveConversationMemory,
  clearConversationMemory,
} from "../lib/conversationMemoryStorage";

export interface UseConversationMemoryReturn {
  /** The current ConversationMemory */
  memory: ConversationMemory;
  /** Timestamp of the last successful save, or null */
  lastSavedAt: Date | null;
  /** Error message from the last save attempt, or null */
  saveError: string | null;
  /** Add a chat message (user or assistant) */
  addMessage: (role: "user" | "assistant", content: string) => void;
  /** Add an interview question with answer */
  addQuestion: (
    topic: string,
    question: string,
    answer: string,
    confidence?: ConfidenceLevel
  ) => void;
  /** Skip a question without answering */
  skipQuestion: (questionId: string) => void;
  /** Update the answer and confidence for an existing question */
  updateQuestionAnswer: (
    questionId: string,
    answer: string,
    confidence?: ConfidenceLevel
  ) => void;
  /** Add an assumption */
  addAssumption: (
    description: string,
    confidence?: ConfidenceLevel
  ) => void;
  /** Mark an assumption as validated */
  validateAssumption: (assumptionId: string) => void;
  /** Add a decision */
  addDecision: (
    description: string,
    rationale: string,
    alternatives?: string[]
  ) => void;
  /** Add a rejected idea */
  addRejectedIdea: (idea: string) => void;
  /** Add an open question (topic to explore later) */
  addOpenQuestion: (topic: string) => void;
  /** Remove an open question */
  removeOpenQuestion: (topic: string) => void;
  /** Set overall confidence level */
  setConfidence: (level: ConfidenceLevel) => void;
  /** Replace the entire memory with a new state (persists immediately) */
  replaceMemory: (nextMemory: ConversationMemory) => void;
  /** Reset to empty memory and clear localStorage */
  resetMemory: () => void;
}


function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useConversationMemory(): UseConversationMemoryReturn {
  const [memory, setMemory] = useState<ConversationMemory>(
    loadConversationMemory
  );
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Keep a ref to the latest value so callbacks always have fresh data
  const ref = useRef(memory);
  ref.current = memory;

  const persist = useCallback((data: ConversationMemory) => {
    try {
      saveConversationMemory(data);
      setLastSavedAt(new Date());
      setSaveError(null);
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : "Failed to save conversation"
      );
    }
  }, []);

  const addMessage = useCallback(
    (role: "user" | "assistant", content: string) => {
      setMemory((prev) => {
        const msg: ChatMessage = {
          id: generateId(),
          role,
          content,
          createdAt: new Date().toISOString(),
        };
        const next = { ...prev, messages: [...prev.messages, msg] };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const addQuestion = useCallback(
    (
      topic: string,
      question: string,
      answer: string,
      confidence: ConfidenceLevel = "medium"
    ) => {
      const now = new Date().toISOString();
      setMemory((prev) => {
        const q: InterviewQuestion = {
          id: generateId(),
          topic,
          question,
          answer,
          confidence,
          skipped: false,
          createdAt: now,
          answeredAt: now,
        };
        const next = { ...prev, questions: [...prev.questions, q] };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const skipQuestion = useCallback(
    (questionId: string) => {
      setMemory((prev) => {
        const next = {
          ...prev,
          questions: prev.questions.map((q) =>
            q.id === questionId ? { ...q, skipped: true, answeredAt: new Date().toISOString() } : q
          ),
        };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const updateQuestionAnswer = useCallback(
    (questionId: string, answer: string, confidence?: ConfidenceLevel) => {
      setMemory((prev) => {
        const next = {
          ...prev,
          questions: prev.questions.map((q) =>
            q.id === questionId
              ? { ...q, answer, ...(confidence ? { confidence } : {}), answeredAt: new Date().toISOString() }
              : q
          ),
        };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const addAssumption = useCallback(
    (description: string, confidence: ConfidenceLevel = "medium") => {
      setMemory((prev) => {
        const a: Assumption = {
          id: generateId(),
          description,
          confidence,
          validated: false,
          createdAt: new Date().toISOString(),
        };
        const next = { ...prev, assumptions: [...prev.assumptions, a] };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const validateAssumption = useCallback(
    (assumptionId: string) => {
      setMemory((prev) => {
        const next = {
          ...prev,
          assumptions: prev.assumptions.map((a) =>
            a.id === assumptionId ? { ...a, validated: true } : a
          ),
        };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const addDecision = useCallback(
    (description: string, rationale: string, alternatives: string[] = []) => {
      setMemory((prev) => {
        const d: Decision = {
          id: generateId(),
          description,
          rationale,
          alternatives,
          createdAt: new Date().toISOString(),
        };
        const next = { ...prev, decisions: [...prev.decisions, d] };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const addRejectedIdea = useCallback(
    (idea: string) => {
      setMemory((prev) => {
        const next = { ...prev, rejectedIdeas: [...prev.rejectedIdeas, idea] };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const addOpenQuestion = useCallback(
    (topic: string) => {
      setMemory((prev) => {
        if (prev.openQuestions.includes(topic)) return prev;
        const next = { ...prev, openQuestions: [...prev.openQuestions, topic] };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const removeOpenQuestion = useCallback(
    (topic: string) => {
      setMemory((prev) => {
        const next = {
          ...prev,
          openQuestions: prev.openQuestions.filter((t) => t !== topic),
        };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const setConfidence = useCallback(
    (level: ConfidenceLevel) => {
      setMemory((prev) => {
        const next = { ...prev, confidence: level };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const resetMemory = useCallback(() => {
    const fresh = createEmptyConversationMemory();
    clearConversationMemory();
    setMemory(fresh);
    setLastSavedAt(null);
    setSaveError(null);
  }, []);

  /**
   * Replace the entire memory with a new state.
   * This is the preferred way to sync authoritative memory from interviewSession
   * back into the hook, ensuring messages, questions, and all other fields
   * are consistent. Persists immediately to localStorage.
   */
  const replaceMemory = useCallback(
    (nextMemory: ConversationMemory) => {
      // Ensure updatedAt is set so the stored copy is fresh
      nextMemory.updatedAt = new Date().toISOString();
      setMemory(nextMemory);
      persist(nextMemory);
    },
    [persist]
  );

  return {
    memory,
    lastSavedAt,
    saveError,
    addMessage,
    addQuestion,
    skipQuestion,
    updateQuestionAnswer,
    addAssumption,
    validateAssumption,
    addDecision,
    addRejectedIdea,
    addOpenQuestion,
    removeOpenQuestion,
    setConfidence,
    replaceMemory,
    resetMemory,
  };

}
