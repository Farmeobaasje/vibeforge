// ──────────────────────────────────────────────
// GeneralSettings — Compact settings modal
// Segmented theme control + About section.
// ──────────────────────────────────────────────

import { useState, useCallback, useEffect, useRef } from "react";
import { loadTheme, saveTheme, applyTheme, type Theme } from "../lib/themeSettings";
import { version } from "../../package.json";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export default function GeneralSettings({ isOpen, onClose }: Props) {
  const [selectedTheme, setSelectedTheme] = useState<Theme>(() => loadTheme());
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleThemeChange = useCallback((theme: Theme) => {
    setSelectedTheme(theme);
    saveTheme(theme);
    applyTheme(theme);
  }, []);

  // ESC key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trapping
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    dialog.addEventListener("keydown", handleTab);
    first.focus();
    return () => dialog.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="General Settings"
        className="bg-surface border border-app rounded-xl shadow-2xl w-full max-w-sm animate-modalEntry motion-reduce:animate-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-app">
          <h2 className="text-base font-semibold text-app">General Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 text-muted hover:text-secondary hover:bg-elevated rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-5 space-y-6">
          {/* Appearance — Segmented Control */}
          <section>
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
              Appearance
            </h3>
            <div className="flex rounded-lg bg-surface p-0.5 gap-0.5 border border-app" role="radiogroup" aria-label="Theme selection">
              {THEME_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  role="radio"
                  aria-checked={selectedTheme === value}
                  onClick={() => handleThemeChange(value)}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    selectedTheme === value
                      ? "bg-elevated text-app shadow-app-sm"
                      : "text-muted hover:text-secondary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* About */}
          <section>
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
              About
            </h3>
            <div className="space-y-1">
              <InfoRow label="Version" value={`v${version}`} />
              <InfoRow label="Mode" value="Local" />
              <InfoRow label="Storage" value="localStorage" />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3.5 border-t border-app">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-brand-gradient text-white text-sm font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Info Row ──────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-surface rounded-lg border border-app">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-app font-mono">{value}</span>
    </div>
  );
}
