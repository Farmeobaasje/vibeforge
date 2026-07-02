// ──────────────────────────────────────────────
// LandingPage — Step 1: premium landing page
// Minimal UI. Maximum trust. Premium feel.
// "I give my idea → AI builds a complete software project."
// ──────────────────────────────────────────────

import { useState, useCallback, useMemo } from "react";
import { EXAMPLE_PROJECTS, type ExampleProject } from "../fixtures/exampleProjects";
import JsonImportModal from "./JsonImportModal";
import { parseProjectDefinitionJson } from "../lib/projectDefinitionParser";
import { loadEndpoints, loadActiveEndpointId, getApiKeyForEndpoint } from "../ai/settings";
import type { ProjectDefinition } from "../types/projectDefinition";

interface Props {
  onSetProjectDefinition: (data: ProjectDefinition) => void;
  onStartProjectDiscovery: (rawIdea: string) => void;
  onContinue: () => void;
  onOpenGeneralSettings?: () => void;
  onOpenAISettings?: () => void;
  onStartDemo?: (projectId: string) => void;
}

// ── Data ─────────────────────────────────────

const YOUR_AI_WORKSPACE = [
  {
    icon: "📘",
    title: "Project Definition",
    subtitle: "Single source of truth",
  },
  {
    icon: "🏗",
    title: "Architecture",
    subtitle: "Stack & structure",
  },
  {
    icon: "📄",
    title: "Documentation",
    subtitle: "README, PRD, SPEC",
  },
  {
    icon: "🤖",
    title: "AI Workspace",
    subtitle: "Rules, Memory, Prompts",
  },
  {
    icon: "🚀",
    title: "Bootstrap Package",
    subtitle: "Ready for Cline, Cursor, Claude",
  },
];

const TRUST_PILLS = [
  { label: "LOCAL", tooltip: "Everything runs in your browser" },
  { label: "OFFLINE", tooltip: "No internet required after load" },
  { label: "AI", tooltip: "AI-assisted project discovery" },
  { label: "EXPORTABLE", tooltip: "Download or copy anytime" },
];

// ── Architect Status types ────────────────────

type ArchitectRuntimeStatus = "ready" | "offline" | "configuration-required" | "no-model-selected";

interface ArchitectStatus {
  modelName: string;
  providerLabel: string;
  status: ArchitectRuntimeStatus;
  statusLabel: string;
  hasActiveEndpoint: boolean;
}

// ── Helpers ──────────────────────────────────

/** Friendly model name overrides for known model IDs */
const MODEL_DISPLAY: Record<string, string> = {
  "gpt-4o": "GPT-4o",
  "claude-sonnet-4-20250514": "Claude Sonnet 4",
  "gemini-2.5-pro": "Gemini 2.5 Pro",
  "deepseek-chat": "DeepSeek V3",
  "deepseek-reasoner": "DeepSeek R1",
  "qwen-coder": "Qwen Coder",
  "llama3.2": "Llama 3",
  "llama-4": "Llama 4",
  "mistral-large-latest": "Mistral Large",
  "openrouter/auto": "OpenRouter Auto",
  "openrouter/best": "OpenRouter Best",
  "openrouter/cheapest": "OpenRouter Cheapest",
  "openrouter/fastest": "OpenRouter Fastest",
  "mock": "Mock Architect",
  "local-model": "Local Model",
};

/** Friendly provider label overrides */
const PROVIDER_LABEL: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  deepseek: "DeepSeek",
  openrouter: "OpenRouter",
  qwen: "Qwen",
  meta: "Meta",
  mistral: "Mistral",
  local: "Local Runtime",
  mock: "Development Mode",
};

function getArchitectStatus(): ArchitectStatus {
  const endpoints = loadEndpoints();
  const activeId = loadActiveEndpointId();
  const active = endpoints.find((ep) => ep.id === activeId);

  if (!active) {
    return {
      modelName: "—",
      providerLabel: "—",
      status: "no-model-selected",
      statusLabel: "No Model Selected",
      hasActiveEndpoint: false,
    };
  }

  if (!active.enabled) {
    return {
      modelName: MODEL_DISPLAY[active.model] ?? active.model,
      providerLabel: PROVIDER_LABEL[active.providerId] ?? active.providerId,
      status: "offline",
      statusLabel: "Offline",
      hasActiveEndpoint: true,
    };
  }

  if (active.requiresApiKey && getApiKeyForEndpoint(active) === null) {
    return {
      modelName: MODEL_DISPLAY[active.model] ?? active.model,
      providerLabel: PROVIDER_LABEL[active.providerId] ?? active.providerId,
      status: "configuration-required",
      statusLabel: "Configuration Required",
      hasActiveEndpoint: true,
    };
  }

  return {
    modelName: MODEL_DISPLAY[active.model] ?? active.model,
    providerLabel: PROVIDER_LABEL[active.providerId] ?? active.providerId,
    status: "ready",
    statusLabel: "Ready",
    hasActiveEndpoint: true,
  };
}

/** Status display config — icon + color per status */
const STATUS_DISPLAY: Record<ArchitectRuntimeStatus, { dot: string; color: string }> = {
  ready: { dot: "🟢", color: "text-app" },
  offline: { dot: "🔴", color: "text-app" },
  "configuration-required": { dot: "🟡", color: "text-app" },
  "no-model-selected": { dot: "⚪", color: "text-muted" },
};

/** CTA label and behavior based on status */
function getCtaLabel(status: ArchitectRuntimeStatus): string {
  switch (status) {
    case "ready":
      return "Start Project Discovery";
    case "configuration-required":
      return "Configure AI & Start";
    case "offline":
      return "Configure AI";
    case "no-model-selected":
      return "Select AI Model";
  }
}

// ── Component ────────────────────────────────

export default function LandingPage({ onSetProjectDefinition, onStartProjectDiscovery, onContinue, onOpenGeneralSettings, onOpenAISettings, onStartDemo }: Props) {
  const [rawIdea, setRawIdea] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Read architect status from localStorage (live on each render)
  const architectStatus = useMemo(() => getArchitectStatus(), []);

  const handleStartDiscovery = useCallback(() => {
    if (!rawIdea.trim()) {
      setError("Describe your project first.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    onStartProjectDiscovery(rawIdea.trim());
  }, [rawIdea, onStartProjectDiscovery]);

  const handleExampleClick = useCallback((project: ExampleProject) => {
    setRawIdea(project.prompt);
    setError(null);
    const textarea = document.getElementById("landing-textarea");
    textarea?.focus();
  }, []);

  const handleJsonImport = useCallback((rawJson: string) => {
    const result = parseProjectDefinitionJson(rawJson);
    if (result.success) {
      onSetProjectDefinition(result.data);
      setImportFeedback({ type: "success", message: "Project Definition imported successfully!" });
      setTimeout(() => {
        setImportFeedback(null);
        onContinue();
      }, 800);
    } else {
      setImportFeedback({ type: "error", message: result.error || "Failed to parse JSON." });
      setTimeout(() => setImportFeedback(null), 3000);
    }
  }, [onSetProjectDefinition, onContinue]);

  const statusDisplay = STATUS_DISPLAY[architectStatus.status];
  const ctaLabel = getCtaLabel(architectStatus.status);
  const isReady = architectStatus.status === "ready";

  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-3xl mx-auto px-6">
        {/* Top row: brand mark left / Settings right */}
        <div className="flex items-center justify-between pt-6 pb-2">
          <img
            src="/src/assets/brand/mark-white.svg"
            alt="VibeForge"
            className="w-8 h-8"
          />
          {onOpenGeneralSettings && (
            <button
              onClick={onOpenGeneralSettings}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium text-muted hover:text-app bg-surface hover:bg-elevated border border-app hover:border-app rounded-xl transition-all duration-200 shadow-app-sm"
              title="General Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          )}
        </div>

        {/* ════════════════════════════════════════
            HERO
            ════════════════════════════════════════ */}
        <section className="pt-24 sm:pt-32 pb-12 sm:pb-14 text-center">
          <div className="mb-8 flex justify-center">
            <picture>
              <source srcSet="/src/assets/brand/lockup-dark.svg" media="(prefers-color-scheme: dark)" />
              <img
                src="/src/assets/brand/lockup-light.svg"
                alt="VibeForge — IDEA → FORGED SOFTWARE"
                className="h-20 sm:h-24 w-auto"
              />
            </picture>
          </div>
          <p className="text-lg sm:text-xl text-secondary max-w-2xl mx-auto leading-relaxed mb-3">
            IDEA → FORGED SOFTWARE
          </p>
          <p className="text-sm text-muted max-w-xl mx-auto">
            The AI operating system for software projects.
            From rough idea to structured blueprint — without leaving your browser.
          </p>
        </section>

        {/* ════════════════════════════════════════
            AI ARCHITECT STATUS
            ════════════════════════════════════════ */}
        <section className="pb-10 sm:pb-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-surface border border-app rounded-2xl p-6 shadow-app-sm">
              {/* Title row */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-app flex items-center gap-2">
                    <span>🤖</span> AI Software Architect
                  </h2>
                  <p className="text-sm text-muted mt-0.5">
                    {architectStatus.status === "no-model-selected"
                      ? "No AI model has been configured yet."
                      : "Ready to interview your project."}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-divider mb-4" />

              {/* Status fields */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Model</span>
                  <span className="text-app font-medium">{architectStatus.modelName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Provider</span>
                  <span className="text-app font-medium">{architectStatus.providerLabel}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Status</span>
                  <span className={`font-medium flex items-center gap-1.5 ${statusDisplay.color}`}>
                    <span>{statusDisplay.dot}</span>
                    {architectStatus.statusLabel}
                  </span>
                </div>
              </div>

              {/* Configure button */}
              {onOpenAISettings && (
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={onOpenAISettings}
                    className="text-sm font-medium text-brand hover:text-brand-soft transition-colors flex items-center gap-1.5"
                  >
                    Configure →
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            IDEA INPUT
            ════════════════════════════════════════ */}
        <section className="pb-12 sm:pb-16">
          <div className="max-w-2xl mx-auto">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-app mb-1">
                Describe your project
              </h2>
              <p className="text-sm text-muted">
                Paste your idea, notes, research, or requirements.
                The AI will interview you and build a structured Project Definition.
              </p>
            </div>

            {/* Editor-style textarea */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-brand-gradient rounded-2xl opacity-0 group-focus-within:opacity-20 transition-opacity duration-500 blur-sm" />
              <div className="relative">
                <textarea
                  id="landing-textarea"
                  value={rawIdea}
                  onChange={(e) => { setRawIdea(e.target.value); setError(null); }}
                  className="w-full h-52 bg-surface border border-app rounded-2xl p-6 text-sm text-app placeholder-muted
                    focus:outline-none focus:border-brand focus:ring-0
                    resize-none transition-all duration-300
                    shadow-app-sm"
                  placeholder={`What are you building?

Example:
"I want to build a CLI tool that converts markdown files to Notion pages. It should support nested headings, code blocks, and image uploads. Built with Node.js and TypeScript."`}
                />
              </div>
            </div>

            {/* Hint */}
            <p className="text-xs text-muted mt-3 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start typing or pick an example below
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════
            CTA + TRUST
            ════════════════════════════════════════ */}
        <section className="pb-16 sm:pb-20">
          <div className="max-w-2xl mx-auto text-center">
            {/* Status warning above CTA */}
            {!isReady && (
              <p className="text-xs text-warning/80 mb-3 flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {architectStatus.status === "no-model-selected"
                  ? "No AI model selected — select one above first"
                  : architectStatus.status === "configuration-required"
                    ? "AI model needs configuration — configure above first"
                    : "AI model is offline — configure above first"}
              </p>
            )}

            <button
              onClick={handleStartDiscovery}
              className="w-full px-8 py-5 text-lg font-semibold rounded-2xl transition-all duration-200
                bg-brand-gradient text-white
                shadow-app-glow hover:shadow-app-glow
                active:scale-[0.98] hover:-translate-y-0.5
                flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {ctaLabel}
            </button>

            {/* Subtle hint */}
            <p className="text-xs text-muted mt-3">
              The AI will ask a few questions to understand your project.
            </p>

            {/* Error */}
            {error && (
              <p className="text-xs text-danger text-center mt-3">{error}</p>
            )}

            {/* Trust pills */}
            <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
              {TRUST_PILLS.map((pill) => (
                <span
                  key={pill.label}
                  title={pill.tooltip}
                  className="inline-flex items-center px-3 py-1 text-[10px] font-semibold tracking-widest
                    text-muted bg-surface border border-app rounded-full
                    hover:border-app hover:text-secondary transition-colors duration-200 cursor-default"
                >
                  {pill.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            YOUR AI WORKSPACE
            ════════════════════════════════════════ */}
        <section className="pb-16 sm:pb-20">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-widest text-center mb-8">
            Your AI Workspace
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-w-4xl mx-auto">
            {YOUR_AI_WORKSPACE.map((item) => (
              <div
                key={item.title}
                className="group bg-surface border border-app rounded-2xl p-5
                  hover:border-app hover:bg-elevated
                  transition-all duration-300 hover:-translate-y-0.5 shadow-app-sm"
              >
                <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                <h3 className="text-sm font-semibold text-app mb-0.5">{item.title}</h3>
                <p className="text-xs text-muted">{item.subtitle}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════
            EXAMPLES
            ════════════════════════════════════════ */}
        <section className="pb-16 sm:pb-20">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-widest text-center mb-8">
            Try an example
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {EXAMPLE_PROJECTS.map((project) => (
              <div
                key={project.id}
                className="group bg-surface border border-app rounded-2xl p-6
                  hover:border-brand hover:bg-elevated
                  hover:shadow-app-md
                  hover:-translate-y-1
                  transition-all duration-300"
              >
                <button
                  onClick={() => handleExampleClick(project)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-app group-hover:text-brand transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-muted mt-0.5">{project.tagline}</p>
                    </div>
                    <span className="text-[10px] font-semibold tracking-widest text-muted uppercase px-2.5 py-1 rounded-full bg-surface border border-app shrink-0 ml-3">
                      {project.category}
                    </span>
                  </div>
                  {/* Progress bar visual */}
                  <div className="h-1.5 rounded-full bg-surface border border-divider overflow-hidden">
                    <div className="h-full w-3/5 rounded-full bg-brand-gradient" />
                  </div>
                </button>

                {/* Demo button — only for BioBatch Sentinel (has a demo scenario) */}
                {onStartDemo && project.id === "biobatch-sentinel" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartDemo(project.id);
                    }}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold
                      bg-brand/10 text-brand border border-brand/30 rounded-xl
                      hover:bg-brand/20 hover:border-brand/50
                      transition-all duration-200"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Guided Demo
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════
            IMPORT
            ════════════════════════════════════════ */}
        <section className="pb-20 sm:pb-28 text-center border-t border-divider pt-10">
          <p className="text-sm text-muted mb-4">
            Already have a Project Definition?
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-medium text-muted
              hover:text-app bg-surface hover:bg-elevated
              border border-app hover:border-app
              rounded-2xl transition-all duration-200 hover:-translate-y-0.5 shadow-app-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Import JSON →
          </button>

          {/* Import feedback */}
          {importFeedback && (
            <div className={`mt-5 p-3 rounded-xl text-sm inline-block ${
              importFeedback.type === "success"
                ? "bg-success/10 border border-success/30 text-success"
                : "bg-danger/10 border border-danger/30 text-danger"
            }`}>
              {importFeedback.message}
            </div>
          )}
        </section>

      </div>

      {/* JSON Import Modal */}
      <JsonImportModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setImportFeedback(null);
        }}
        onImport={handleJsonImport}
      />
    </div>
  );
}
