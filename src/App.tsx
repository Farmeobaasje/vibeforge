// ──────────────────────────────────────────────
// App — VibeForge 6-step wizard
// Describe → Interview → Architecture Review → Summary → Generate → Export
// ──────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import { useProjectDefinition } from "./hooks/useProjectDefinition";
import { useProjectRequirements } from "./hooks/useProjectRequirements";
import { useWizard } from "./hooks/useWizard";
import { deterministicGenerate } from "./generator";
import { loadConversationMemory } from "./lib/conversationMemoryStorage";
import { loadProjectRequirements } from "./lib/projectRequirementsStorage";
import { loadArchitectureAnalysis } from "./lib/architectureAnalysisStorage";
import { createEmptyArchitectureAnalysis } from "./models/architectureAnalysis";
import { clearAllStorage } from "./lib/storage";
import { clearConversationMemory } from "./lib/conversationMemoryStorage";
import { clearProjectRequirements } from "./lib/projectRequirementsStorage";
import { clearArchitectureAnalysis } from "./lib/architectureAnalysisStorage";
import { clearWorkspace } from "./lib/workspaceStorage";
import { loadTheme, applyTheme, listenForSystemThemeChanges } from "./lib/themeSettings";
import WizardHeader from "./components/WizardHeader";
import LandingPage from "./components/LandingPage";
import InterviewStep from "./components/InterviewStep";
import ArchitectureInsightsStep from "./components/ArchitectureInsightsStep";
import SummaryStep from "./components/SummaryStep";
import GenerateStep from "./components/GenerateStep";
import ExportStep from "./components/ExportStep";
import AISettings from "./components/AISettings";
import GeneralSettings from "./components/GeneralSettings";
import { BIOBATCH_SENTINEL_DEMO } from "./demo/biobatchSentinel";

export default function App() {
  const {
    projectDefinition,
    lastSavedAt,
    saveError,
    updateProjectDefinition,
    setProjectDefinition,
    resetProjectDefinition,
  } = useProjectDefinition();

  const { resetRequirements } = useProjectRequirements();

  const wizard = useWizard();
  const [showAISettings, setShowAISettings] = useState(false);
  const [showGeneralSettings, setShowGeneralSettings] = useState(false);
  const [rawIdea, setRawIdea] = useState<string>("");
  const [settingsTab, setSettingsTab] = useState<"endpoints" | "api-keys">("endpoints");
  const [settingsFocusEndpoint, setSettingsFocusEndpoint] = useState<string | undefined>(undefined);

  // ── Theme init ──────────────────────────────
  // Apply saved theme on mount and listen for system changes.
  useEffect(() => {
    const theme = loadTheme();
    applyTheme(theme);
    return listenForSystemThemeChanges();
  }, []);

  // ── Generator sync: ConversationMemory + ProjectRequirements + ArchitectureAnalysis → ProjectDefinition ──
  //
  // IMPORTANT: In the normal interview flow, we do NOT pass `existing` to the generator.
  // This ensures the generator starts from `defaultProjectDefinition` and only fills
  // fields that have actual data from the current session. Passing `existing` would
  // cause stale data from previous sessions (e.g. TeamFlow AI) to leak through.
  //
  // Only pass `existing` when doing explicit "Advanced Editing" or "Update Project" workflows.

  const syncWithGenerator = useCallback(
    async (includeAnalysis: boolean = false) => {
      // Read BOTH memory and requirements from localStorage to guarantee
      // we always have the latest data, regardless of React's render cycle.
      // This prevents stale closure issues where requirements in the hook
      // might not yet reflect the most recent interview answers.
      const memory = loadConversationMemory();
      const req = loadProjectRequirements();
      const analysis = includeAnalysis ? loadArchitectureAnalysis() : createEmptyArchitectureAnalysis();

      const result = await deterministicGenerate({
        memory,
        requirements: req,
        architecture: analysis,
        // NOTE: `existing` is intentionally omitted — see comment above
      });

      updateProjectDefinition(result.projectDefinition);

      if (result.warnings.length > 0) {
        console.info("[Generator] Warnings:", result.warnings);
      }
    },
    [updateProjectDefinition],
  );

  /**
   * Full workspace reset — wipes ALL state and starts fresh.
   * This is the only way to guarantee no stale data leaks between projects.
   */
  const handleStartOver = useCallback(() => {
    // 1. Wipe all localStorage keys
    clearAllStorage();
    clearConversationMemory();
    clearProjectRequirements();
    clearArchitectureAnalysis();
    clearWorkspace();

    // 2. Reset all in-memory state
    resetProjectDefinition();
    resetRequirements();

    // 3. Reset local UI state
    setRawIdea("");

    // 4. Go back to Describe step
    wizard.goTo(1);
  }, [resetProjectDefinition, resetRequirements, wizard]);

  const handleStartInterview = useCallback((idea: string) => {
    setRawIdea(idea);
    wizard.goTo(2);
  }, [wizard]);

  const handleOpenSettings = useCallback((tab?: "endpoints" | "api-keys", focusEndpointId?: string) => {
    setSettingsTab(tab ?? "endpoints");
    setSettingsFocusEndpoint(focusEndpointId);
    setShowAISettings(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowAISettings(false);
    setSettingsFocusEndpoint(undefined);
  }, []);

  const handleOpenGeneralSettings = useCallback(() => {
    setShowGeneralSettings(true);
  }, []);

  const handleCloseGeneralSettings = useCallback(() => {
    setShowGeneralSettings(false);
  }, []);

  // ── Demo mode ───────────────────────────────

  const handleStartDemo = useCallback((projectId: string) => {
    if (projectId === "biobatch-sentinel") {
      wizard.startDemo(BIOBATCH_SENTINEL_DEMO);
    }
  }, [wizard]);

  // ── Step transition handlers with deterministic generator sync ──

  const handleInterviewContinue = useCallback(async () => {
    // Sync without architecture analysis before going to Architecture Review
    await syncWithGenerator(false);
    wizard.goNext();
  }, [syncWithGenerator, wizard]);

  const handleArchitectureContinue = useCallback(async () => {
    // Sync with architecture analysis before going to Summary
    await syncWithGenerator(true);
    wizard.goNext();
  }, [syncWithGenerator, wizard]);

  return (
    <div className="min-h-screen bg-app text-app">
      {/* Header with step indicator — hidden on landing page (step 1) */}
      {wizard.currentStep > 1 && (
        <WizardHeader
          currentStep={wizard.currentStep}
          onStepClick={wizard.goTo}
          lastSavedAt={lastSavedAt}
          saveError={saveError}
          onOpenGeneralSettings={handleOpenGeneralSettings}
          onNewProject={handleStartOver}
        />
      )}

      {/* General Settings modal */}
      <GeneralSettings
        isOpen={showGeneralSettings}
        onClose={handleCloseGeneralSettings}
      />

      {/* AI Settings modal */}
      <AISettings
        isOpen={showAISettings}
        onClose={handleCloseSettings}
        initialTab={settingsTab}
        focusEndpointId={settingsFocusEndpoint}
      />

      {/* Main content area — no padding on step 1 (landing page has its own) */}
      <main className={wizard.currentStep === 1 ? "" : "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6"}>
        {/* Step 1: Landing page */}
        {wizard.currentStep === 1 && (
          <LandingPage
            onSetProjectDefinition={setProjectDefinition}
            onStartProjectDiscovery={handleStartInterview}
            onContinue={wizard.goNext}
            onOpenGeneralSettings={handleOpenGeneralSettings}
            onOpenAISettings={() => handleOpenSettings()}
            onStartDemo={handleStartDemo}
          />
        )}

        {/* Step 2: Interview */}
        {wizard.currentStep === 2 && (
          <InterviewStep
            initialContext={rawIdea}
            onBack={wizard.goBack}
            onSkipToSummary={() => wizard.goTo(4)}
            onContinue={handleInterviewContinue}
            onOpenSettings={(tab, endpointId) => handleOpenSettings(tab, endpointId)}
            sessionMode={wizard.sessionMode}
            activeDemo={wizard.activeDemo}
            demoPlayback={wizard.demoPlayback}
            setDemoPlayback={wizard.setDemoPlayback}
            onStopDemo={wizard.stopDemo}
            onPauseDemo={wizard.pauseDemo}
            onResumeDemo={wizard.resumeDemo}
          />
        )}

        {/* Step 3: Architecture Insights */}
        {wizard.currentStep === 3 && (
          <ArchitectureInsightsStep
            onBack={wizard.goBack}
            onContinue={handleArchitectureContinue}
          />
        )}

        {/* Step 4: Summary */}
        {wizard.currentStep === 4 && (
          <SummaryStep
            projectDefinition={projectDefinition}
            onUpdate={updateProjectDefinition}
            onBack={wizard.goBack}
            onContinue={wizard.goNext}
          />
        )}

        {/* Step 5: Generate */}
        {wizard.currentStep === 5 && (
          <GenerateStep
            projectDefinition={projectDefinition}
            onBack={wizard.goBack}
            onContinue={wizard.goNext}
          />
        )}

        {/* Step 6: Export */}
        {wizard.currentStep === 6 && (
          <ExportStep
            projectDefinition={projectDefinition}
            onBack={wizard.goBack}
            onStartOver={handleStartOver}
          />
        )}
      </main>
    </div>
  );
}
