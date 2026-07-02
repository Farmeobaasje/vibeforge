// ──────────────────────────────────────────────
// WizardHeader — app header with branding + step indicator
// ──────────────────────────────────────────────

import { useState, useCallback } from "react";
import type { WizardStep } from "../hooks/useWizard";
import StepIndicator from "./StepIndicator";

interface Props {
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
  lastSavedAt: Date | null;
  saveError: string | null;
  onOpenGeneralSettings?: () => void;
  onNewProject?: () => void;
}

export default function WizardHeader({ currentStep, onStepClick, lastSavedAt, saveError, onOpenGeneralSettings, onNewProject }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleNewProject = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleConfirm = useCallback(() => {
    setShowConfirm(false);
    onNewProject?.();
  }, [onNewProject]);

  const handleCancel = useCallback(() => {
    setShowConfirm(false);
  }, []);

  return (
    <header className="border-b border-app bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top row: branding + save status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Theme-aware brand icon — uses currentColor so it adapts to both themes */}
            <svg className="w-8 h-8 text-brand" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="currentColor" fillOpacity="0.15"/>
              <path d="M16 8L20 12L16 16L12 12L16 8Z" fill="currentColor"/>
              <path d="M20 12L24 16L20 20L16 16L20 12Z" fill="currentColor" fillOpacity="0.7"/>
              <path d="M12 12L16 16L12 20L8 16L12 12Z" fill="currentColor" fillOpacity="0.7"/>
              <path d="M16 16L20 20L16 24L12 20L16 16Z" fill="currentColor" fillOpacity="0.4"/>
            </svg>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-app">VibeForge</h1>
              <p className="text-xs text-muted hidden sm:block">
                From raw idea to AI-ready implementation plan.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastSavedAt && (
              <span className="text-xs text-muted">
                Saved {lastSavedAt.toLocaleTimeString()}
              </span>
            )}
            {saveError && (
              <span className="text-xs text-danger">{saveError}</span>
            )}
            {onNewProject && (
              <button
                onClick={handleNewProject}
                className="btn-ghost text-muted hover:text-danger"
                title="New Project (reset all data)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            {onOpenGeneralSettings && (
              <button
                onClick={onOpenGeneralSettings}
                className="btn-secondary text-xs gap-1.5 px-2.5 py-1.5"
                title="General Settings"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
            )}
          </div>
        </div>

        {/* Step indicator */}
        <StepIndicator currentStep={currentStep} onStepClick={onStepClick} />
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="absolute inset-0 bg-app/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card p-6 max-w-sm mx-4 shadow-app-lg">
            <h3 className="text-lg font-semibold text-app mb-2">New Project</h3>
            <p className="text-sm text-secondary mb-5">
              This will erase all current data — project definition, interview history,
              architecture analysis, and workspace state. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleCancel}
                className="btn-secondary text-sm px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="btn-danger text-sm px-4 py-2"
              >
                Start New Project
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
