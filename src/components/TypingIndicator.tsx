// ──────────────────────────────────────────────
// TypingIndicator — "AI Software Architect is thinking..." animation
// Three bouncing dots with context-aware labels
// ──────────────────────────────────────────────

interface Props {
  /** Optional label text (default: "AI Software Architect is thinking") */
  label?: string;
}

const LABELS: Record<string, string> = {
  "follow-up": "Asking a follow-up question...",
  "next-topic": "Moving to the next topic...",
  "analyzing": "Analyzing your answer...",
  "preparing": "Preparing the first question...",
};

export type TypingContext = keyof typeof LABELS;

export default function TypingIndicator({ label = "AI Software Architect is thinking" }: Props) {
  const displayLabel = LABELS[label as TypingContext] ?? label;

  return (
    <div className="flex items-start gap-3">
      {/* Avatar */}
      <div className="shrink-0 w-9 h-9 rounded-xl bg-brand/10 text-brand-soft border border-brand/30 flex items-center justify-center text-[10px] font-bold">
        AI
      </div>

      {/* Indicator */}
      <div className="flex flex-col">
        <span className="text-[10px] text-brand-soft font-medium mb-1 px-1">
          AI Software Architect
        </span>
        <div className="bg-elevated border border-app rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-app-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-sm text-secondary">{displayLabel}</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:300ms]" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
