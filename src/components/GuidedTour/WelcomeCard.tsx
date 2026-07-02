// ──────────────────────────────────────────────
// WelcomeCard — First impression overlay
// Shown before demo starts
// ──────────────────────────────────────────────

import { useEffect, useState } from "react";

interface WelcomeCardProps {
  projectName: string;
  projectTagline: string;
  onStart: () => void;
  onExit: () => void;
}

export default function WelcomeCard({
  projectName,
  projectTagline: _projectTagline,
  onStart,
  onExit,
}: WelcomeCardProps) {
  const [isEntered, setIsEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsEntered(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`
          absolute inset-0 bg-black/60 backdrop-blur-sm
          transition-opacity duration-500
          ${isEntered ? "opacity-100" : "opacity-0"}
        `}
      />

      {/* Card */}
      <div
        className={`
          relative w-[480px] max-w-[90vw]
          rounded-2xl border border-brand/20
          bg-elevated shadow-app-lg shadow-brand-md
          transition-all duration-500 ease-out
          ${isEntered ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"}
        `}
      >
        {/* Brand accent bar */}
        <div className="h-1.5 bg-brand-gradient rounded-t-2xl" />

        <div className="p-8">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-brand-gradient border border-brand/30 flex items-center justify-center mb-5 shadow-brand-sm">
            <svg className="w-7 h-7 text-on-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-app mb-2">Guided Demo</h2>

          {/* Project badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-brand/10 text-brand border border-brand/30 mb-4">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            {projectName}
          </div>

          {/* Description */}
          <p className="text-sm text-secondary leading-relaxed mb-6">
            Imagine you've just hired a senior software architect.
            Instead of asking you for documents, the architect starts
            asking questions about your project — one at a time.
          </p>

          <p className="text-sm text-secondary leading-relaxed mb-6">
            That's exactly what you're about to see. Watch how{" "}
            <span className="text-app font-medium">{projectName}</span>{" "}
            is transformed from a rough idea into a complete, AI-ready
            software blueprint — automatically.
          </p>

          {/* Feature highlights */}
          <div className="space-y-2 mb-6">
            <div className="flex items-start gap-2.5">
              <svg className="w-4 h-4 text-brand shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs text-secondary">AI interviews your project step by step</span>
            </div>
            <div className="flex items-start gap-2.5">
              <svg className="w-4 h-4 text-brand shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs text-secondary">Live Project Definition builds on the right</span>
            </div>
            <div className="flex items-start gap-2.5">
              <svg className="w-4 h-4 text-brand shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs text-secondary">Full blueprint generated when complete</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onStart}
              className="btn-primary px-6 py-3 text-sm flex-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              Start walkthrough
            </button>
            <button
              onClick={onExit}
              className="btn-secondary px-4 py-3 text-sm"
            >
              Exit demo
            </button>
          </div>

          <p className="text-[10px] text-muted text-center mt-4">
            You can pause or exit the demo at any time
          </p>
        </div>
      </div>
    </div>
  );
}
