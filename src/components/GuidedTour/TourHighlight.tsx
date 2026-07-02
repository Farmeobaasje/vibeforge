// ──────────────────────────────────────────────
// TourHighlight — Dims UI, highlights target panel
// Like Cursor/Linear onboarding overlays
// ──────────────────────────────────────────────

import type { TourHighlightTarget } from "./types";

interface TourHighlightProps {
  /** Which panel to highlight (null = full dim overlay) */
  target: TourHighlightTarget;
  /** Whether the highlight is active */
  visible: boolean;
}

export default function TourHighlight({ target, visible }: TourHighlightProps) {
  if (!visible) return null;

  return (
    <>
      {/* Full-screen dim overlay */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]" />

      {/* Panel-specific highlights (un-dim the target area) */}
      {target === "chat" && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Center area (chat) is un-dimmed via a cutout */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
          <div className="absolute left-[240px] right-[280px] top-[53px] bottom-[53px] bg-transparent">
            {/* Glow border around chat */}
            <div className="absolute inset-0 rounded-none border-2 border-brand/40 shadow-[0_0_30px_rgba(79,57,246,0.15)] pointer-events-none" />
          </div>
        </div>
      )}

      {target === "progress-panel" && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
          <div className="absolute left-0 top-[53px] bottom-[53px] w-[240px] bg-transparent">
            <div className="absolute inset-0 border-2 border-brand/40 shadow-[0_0_30px_rgba(79,57,246,0.15)] pointer-events-none" />
          </div>
        </div>
      )}

      {target === "understanding-panel" && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
          <div className="absolute right-0 top-[53px] bottom-[53px] w-[280px] bg-transparent">
            <div className="absolute inset-0 border-2 border-brand/40 shadow-[0_0_30px_rgba(79,57,246,0.15)] pointer-events-none" />
          </div>
        </div>
      )}
    </>
  );
}
