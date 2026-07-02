// ──────────────────────────────────────────────
// ChatArea — main chat interface for the Interview workspace
// Scrollable message list + input field + send/skip buttons
// Topic-aware placeholder adapts to current topic
// ──────────────────────────────────────────────

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import ChatMessage from "./ChatMessage";
import TypingIndicator, { type TypingContext } from "./TypingIndicator";
import { topicQuestion } from "../orchestrator";

export interface ChatMessageData {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
}

interface Props {
  /** List of messages to display */
  messages: ChatMessageData[];
  /** Whether the AI is currently generating a response */
  isLoading: boolean;
  /** Called when the user submits an answer */
  onSend: (message: string) => void;
  /** Called when the user wants to skip the current topic */
  onSkip?: () => void;
  /** Whether the skip button should be shown */
  canSkip?: boolean;
  /** Placeholder text for the input field */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Typing indicator context label */
  typingContext?: TypingContext | null;
  /** Demo mode: text being typed by the demo playback engine */
  demoAnswer?: string;
  /** Current active topic for placeholder adaptation */
  activeTopic?: string | null;
}

function derivePlaceholder(activeTopic: string | null | undefined, fallback: string): string {
  if (!activeTopic) return fallback;
  const question = topicQuestion(activeTopic);
  if (question) return question;
  return fallback;
}

export default function ChatArea({
  messages,
  isLoading,
  onSend,
  onSkip,
  canSkip = false,
  placeholder = "Type your answer here...",
  disabled = false,
  typingContext = null,
  activeTopic = null,
  demoAnswer,
}: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const resolvedPlaceholder = derivePlaceholder(activeTopic, placeholder);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled || isLoading) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-5 space-y-5 scrollbar-thin"
      >
        {messages.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted">Press "Start Interview" to begin the conversation.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="animate-fadeIn">
            <ChatMessage
              role={msg.role}
              content={msg.content}
              timestamp={new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            />
          </div>
        ))}

        {/* Demo mode: show the answer being typed in real-time */}
        {demoAnswer !== undefined && demoAnswer.length > 0 && (
          <div className="animate-fadeIn">
            <ChatMessage
              role="user"
              content={demoAnswer}
              timestamp={new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            />
          </div>
        )}

        {isLoading && <TypingIndicator label={typingContext ?? undefined} />}
      </div>

      {/* Input area */}
      <div className="border-t border-divider bg-panel px-6 py-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={resolvedPlaceholder}
              disabled={disabled || isLoading}
              rows={1}
              className="input resize-none min-h-[44px] pr-24"
            />
            <span className="absolute bottom-2 right-3 text-[10px] text-muted">
              Enter to send · Shift+Enter for new line
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Skip button */}
            {canSkip && onSkip && (
              <button
                onClick={onSkip}
                disabled={disabled || isLoading}
                className="btn-ghost p-3 border border-muted"
                title="Skip this topic"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || disabled || isLoading}
              className="btn-primary px-5 py-3"
            >
              <span>Send</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
