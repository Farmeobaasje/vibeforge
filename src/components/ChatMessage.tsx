// ──────────────────────────────────────────────
// ChatMessage — individual chat bubble
// AI Software Architect messages (left, premium) vs user messages (right, compact)
// ──────────────────────────────────────────────

interface Props {
  role: "assistant" | "user";
  content: string;
  timestamp?: string;
}

export default function ChatMessage({ role, content, timestamp }: Props) {
  const isAssistant = role === "assistant";

  return (
    <div className={`flex items-start gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}>
      {/* Avatar */}
      <div
        className={`
          shrink-0 flex items-center justify-center font-bold
          ${isAssistant
            ? "w-9 h-9 rounded-xl bg-brand/10 text-brand-soft border border-brand/30 text-[10px]"
            : "w-7 h-7 rounded-full bg-elevated text-secondary border border-app text-xs"
          }
        `}
      >
        {isAssistant ? "AI" : "You"}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col ${isAssistant ? "" : "items-end"} max-w-[85%]`}>
        {/* AI identity label */}
        {isAssistant && (
          <span className="text-[10px] text-brand-soft font-medium mb-1 px-1">
            AI Software Architect
          </span>
        )}

        <div
          className={`
            px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap
            ${isAssistant
              ? "bg-elevated border border-app text-app rounded-2xl rounded-tl-sm shadow-app-sm"
              : "bg-brand/15 border border-brand/25 text-app rounded-2xl rounded-tr-sm"
            }
          `}
        >
          {content}
        </div>

        {/* Timestamp */}
        {timestamp && (
          <span className="text-[10px] text-muted mt-1 px-1">
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
