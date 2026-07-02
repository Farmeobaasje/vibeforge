// ──────────────────────────────────────────────
// TourStep — Individual guided tour step card
// Replaces CoachBubble with premium onboarding UX
// ──────────────────────────────────────────────

import { useEffect, useState } from "react";
import type { TourPosition } from "./types";

interface TourStepProps {
  /** Step number (1-based) */
  stepNumber: number;
  /** Total steps in tour */
  totalSteps: number;
  /** Short title */
  title: string;
  /** Main body text */
  message: string;
  /** Where the card appears */
  position: TourPosition;
  /** Label for the action button */
  actionLabel: string;
  /** Called when user clicks the action button */
  onAction: () => void;
  /** Called when user clicks skip/dismiss */
  onSkip?: () => void;
}

export default function TourStep({
  stepNumber,
  totalSteps,
  title,
  message,
  position,
  actionLabel,
  onAction,
  onSkip,
}: TourStepProps) {
  const [isEntered, setIsEntered] = useState(false);

  useEffect(() => {
    // Trigger entrance animation on mount
    const t = setTimeout(() => setIsEntered(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Position-based styling
  const positionStyles: Record<TourPosition, string> = {
    center: "fixed inset-0 z-[60] flex items-center justify-center",
    left: "fixed left-6 top-1/2 -translate-y-1/2 z-[60]",
    right: "fixed right-6 top-1/2 -translate-y-1/2 z-[60]",
    bottom: "fixed bottom-8 left-1/2 -translate-x-1/2 z-[60]",
  };

  // Arrow/connector for anchored positions
  const renderConnector = () => {
    switch (position) {
      case "left":
        return (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
            <div className="w-4 h-0.5 bg-brand/50" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-brand/50 rotate-45" />
          </div>
        );
      case "right":
        return (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full">
            <div className="w-4 h-0.5 bg-brand/50" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 border-b-2 border-l-2 border-brand/50 -rotate-45" />
          </div>
        );
      case "bottom":
        return (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full">
            <div className="w-0.5 h-4 bg-brand/50 mx-auto" />
            <div className="w-2 h-2 border-l-2 border-b-2 border-brand/50 -rotate-45 mx-auto" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`
        ${positionStyles[position]}
        pointer-events-none
        transition-all duration-300 ease-out
        ${isEntered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
    >
      {/* Connector line/arrow for anchored positions */}
      {position !== "center" && renderConnector()}

      {/* Card */}
      <div
        className={`
          pointer-events-auto
          w-[380px]
          rounded-2xl border border-brand/30
          bg-elevated shadow-app-lg
          overflow-hidden
          ${position === "center" ? "shadow-brand-md" : ""}
        `}
      >
        {/* Step indicator bar */}
        <div className="h-1 bg-app overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-500 ease-out"
            style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Step badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand/10 text-brand border border-brand/30">
              STEP {stepNumber} OF {totalSteps}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-app mb-2">{title}</h3>

          {/* Message */}
          <p className="text-sm text-secondary leading-relaxed mb-5 whitespace-pre-line">
            {message}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={onAction}
              className="btn-primary text-xs px-4 py-2"
            >
              {actionLabel}
            </button>

            {onSkip && (
              <button
                onClick={onSkip}
                className="btn-ghost text-xs text-muted hover:text-secondary px-2 py-1"
              >
                Skip tour
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
