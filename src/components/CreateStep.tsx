// ──────────────────────────────────────────────
// CreateStep — Step 1: Describe your project idea
// V2 flow: raw idea → Start AI Interview → Interview step
// Legacy: Generate ProjectDefinition JSON directly (under Advanced)
// ──────────────────────────────────────────────

import { useState, useCallback } from "react";
import { generateProjectDefinitionPrompt } from "../lib/aiPromptTemplate";
import { copyToClipboard } from "../lib/clipboard";
import { PROVIDER_CONFIGS, type ProviderId } from "../ai/AIProvider";
import { generateProjectDefinition } from "../ai/AIService";
import { parseProjectDefinitionJson } from "../lib/projectDefinitionParser";
import type { ProjectDefinition } from "../types/projectDefinition";
import JsonImportModal from "./JsonImportModal";
import ExecutionPipeline from "./ExecutionPipeline";
import {
  createInitialExecutionState,
  updateStepStatus,
  completeExecution,
  failExecution,
  type ExecutionState,
} from "../ai/execution/executionTypes";

interface Props {
  onSetProjectDefinition: (data: ProjectDefinition) => void;
  onContinue: () => void;
  /** Called when user clicks "Start AI Interview" — saves raw idea and navigates to Interview */
  onStartInterview: (rawIdea: string) => void;
}

type GenerateStatus = "idle" | "generating" | "success" | "error";

export default function CreateStep({ onSetProjectDefinition, onContinue, onStartInterview }: Props) {
  const [rawIdea, setRawIdea] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<"idle" | "success" | "error">("idle");
  const [providerId, setProviderId] = useState<ProviderId>("mock");
  const [apiKey, setApiKey] = useState("");
  const [generateStatus, setGenerateStatus] = useState<GenerateStatus>("idle");
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [executionState, setExecutionState] = useState<ExecutionState | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const selectedProvider = PROVIDER_CONFIGS.find((p) => p.id === providerId)!;

  const handleCopyPrompt = useCallback(async () => {
    const prompt = generateProjectDefinitionPrompt();
    const ok = await copyToClipboard(prompt);
    setCopyFeedback(ok ? "success" : "error");
    setTimeout(() => setCopyFeedback("idle"), 2500);
  }, []);

  const handleStartInterview = useCallback(() => {
    if (!rawIdea.trim()) {
      setGenerateError("Please enter a project idea first.");
      setTimeout(() => setGenerateError(null), 3000);
      return;
    }
    onStartInterview(rawIdea.trim());
  }, [rawIdea, onStartInterview]);

  const handleGenerate = useCallback(async () => {
    if (!rawIdea.trim()) {
      setGenerateError("Please enter a project idea first.");
      setGenerateStatus("error");
      setTimeout(() => { setGenerateStatus("idle"); setGenerateError(null); }, 3000);
      return;
    }

    setGenerateStatus("generating");
    setGenerateError(null);

    // Initialize execution pipeline
    const provider = selectedProvider;
    const execState = createInitialExecutionState(
      provider.label,
      providerId,
      provider.requiresApiKey ? undefined : "local",
    );
    setExecutionState(execState);

    // Step 1: Prepare
    setExecutionState((prev) => prev ? updateStepStatus(prev, "prepare", "active") : prev);
    await new Promise((r) => setTimeout(r, 100));
    setExecutionState((prev) => prev ? updateStepStatus(prev, "prepare", "completed") : prev);

    // Step 2: Connect
    setExecutionState((prev) => prev ? updateStepStatus(prev, "connect", "active") : prev);
    await new Promise((r) => setTimeout(r, 200));
    setExecutionState((prev) => prev ? updateStepStatus(prev, "connect", "completed") : prev);

    // Step 3: Generate
    setExecutionState((prev) => prev ? updateStepStatus(prev, "generate", "active") : prev);

    const result = await generateProjectDefinition(rawIdea, providerId, apiKey || undefined);

    if (result.success) {
      setExecutionState((prev) => prev ? updateStepStatus(prev, "generate", "completed") : prev);

      // Step 4: Validate
      setExecutionState((prev) => prev ? updateStepStatus(prev, "validate", "active") : prev);
      await new Promise((r) => setTimeout(r, 150));
      setExecutionState((prev) => prev ? updateStepStatus(prev, "validate", "completed") : prev);

      // Step 5: Build
      setExecutionState((prev) => prev ? updateStepStatus(prev, "build", "active") : prev);
      await new Promise((r) => setTimeout(r, 200));

      onSetProjectDefinition(result.data);
      setGenerateStatus("success");
      setExecutionState((prev) => prev ? completeExecution(prev) : prev);

      // Auto-advance to Summary (step 4)
      setTimeout(() => onContinue(), 800);
    } else {
      const errorMsg = result.error || "Generation failed.";
      setExecutionState((prev) => prev
        ? failExecution(updateStepStatus(prev, "generate", "error", errorMsg), errorMsg)
        : null,
      );
      setGenerateError(errorMsg);
      setGenerateStatus("error");
    }
  }, [rawIdea, providerId, apiKey, selectedProvider, onSetProjectDefinition, onContinue]);

  const handleClear = useCallback(() => {
    setRawIdea("");
    setGenerateStatus("idle");
    setGenerateError(null);
    setExecutionState(null);
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

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ── Left: Main input area ── */}
        <div className="lg:col-span-3 space-y-6">
          {/* Hero */}
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Describe your project</h2>
            <p className="text-sm text-gray-500 mt-1">
              Tell us about your idea — the more detail, the better the result.
            </p>
          </div>

          {/* Textarea */}
          <textarea
            value={rawIdea}
            onChange={(e) => setRawIdea(e.target.value)}
            className="w-full h-64 bg-gray-900 border border-gray-700 rounded-xl p-5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            placeholder={`What are you building?

Example:
"I want to build a CLI tool that converts markdown files to Notion pages. It should support nested headings, code blocks, and image uploads. Built with Node.js and TypeScript."`}
          />

          {/* ── Primary: Start AI Interview ── */}
          <div className="space-y-3">
            <button
              onClick={handleStartInterview}
              className="w-full px-6 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200
                bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20
                flex items-center justify-center gap-2.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Start AI Interview
            </button>

            <p className="text-xs text-gray-500 text-center">
              The AI will ask you questions to build a complete project definition.
            </p>

            {/* Error message */}
            {generateError && (
              <p className="text-xs text-red-400 text-center">{generateError}</p>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-gray-950 px-3 text-gray-600">or use an external LLM</span>
            </div>
          </div>

          {/* ── External LLM section (always visible) ── */}
          <div className="space-y-3 p-4 bg-gray-900/30 border border-gray-800 rounded-lg">
            <p className="text-xs text-gray-500">
              Copy the prompt, paste it into ChatGPT, Claude, or Gemini, then import the JSON response.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Copy AI prompt */}
              <button
                onClick={handleCopyPrompt}
                className="px-4 py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-sm font-medium rounded-lg transition-colors border border-indigo-500/30 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copyFeedback === "success"
                  ? "✓ Copied!"
                  : copyFeedback === "error"
                    ? "✗ Copy failed"
                    : "Copy AI prompt"}
              </button>

              {/* Import ProjectDefinition JSON */}
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-700 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Import ProjectDefinition JSON
              </button>
            </div>
          </div>

          {/* Import feedback */}
          {importFeedback && (
            <div className={`p-3 rounded-lg text-sm ${
              importFeedback.type === "success"
                ? "bg-green-900/20 border border-green-700/50 text-green-300"
                : "bg-red-900/20 border border-red-800/50 text-red-400"
            }`}>
              {importFeedback.message}
            </div>
          )}

          {/* ── Advanced toggle (legacy + debug) ── */}
          <div className="pt-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1.5"
            >
              <svg className={`w-3 h-3 transition-transform ${showAdvanced ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Advanced {showAdvanced ? "▲" : "▼"}
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-4 p-4 bg-gray-900/30 border border-gray-800 rounded-lg">
                {/* Legacy: Generate ProjectDefinition JSON directly */}
                <div>
                  <h4 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2">
                    Legacy: Generate ProjectDefinition JSON directly
                  </h4>
                  <p className="text-[11px] text-gray-500 mb-3">
                    Best for detailed prompts only. Sparse ideas should use <strong>Start AI Interview</strong>.
                  </p>

                  {/* Provider + API key */}
                  <div className="flex items-center gap-3 p-3 bg-gray-900/40 border border-gray-800 rounded-lg mb-3">
                    <label className="text-xs text-gray-500 shrink-0">AI Provider:</label>
                    <select
                      value={providerId}
                      onChange={(e) => setProviderId(e.target.value as ProviderId)}
                      className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {PROVIDER_CONFIGS.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                    {selectedProvider.requiresApiKey && (
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={selectedProvider.apiKeyPlaceholder || "API key"}
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    )}
                  </div>

                  {/* Generate button */}
                  <button
                    onClick={handleGenerate}
                    disabled={generateStatus === "generating"}
                    className={`
                      w-full px-4 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200
                      flex items-center justify-center gap-2
                      ${generateStatus === "generating"
                        ? "bg-amber-600/50 text-amber-300 cursor-not-allowed"
                        : generateStatus === "success"
                          ? "bg-green-600/20 text-green-400 border border-green-500/30"
                          : generateStatus === "error"
                            ? "bg-red-600/20 text-red-400 border border-red-500/30"
                            : "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20"
                      }
                    `}
                  >
                    {generateStatus === "generating" ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating...
                      </>
                    ) : generateStatus === "success" ? (
                      <>✓ Generated! Taking you to summary...</>
                    ) : generateStatus === "error" ? (
                      <>✗ Generation failed</>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate ProjectDefinition JSON
                      </>
                    )}
                  </button>

                  {/* Execution Pipeline (visible during generation) */}
                  {executionState && generateStatus === "generating" && (
                    <div className="mt-3">
                      <ExecutionPipeline state={executionState} />
                    </div>
                  )}

                  {/* Error message */}
                  {generateError && generateStatus !== "generating" && (
                    <p className="text-xs text-red-400 text-center mt-2">{generateError}</p>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-800" />

                {/* Debug options */}
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">Debugging and developer options.</p>
                  <button
                    onClick={handleClear}
                    className="w-full px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-500 hover:text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-800"
                  >
                    Clear & start over
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: How it works sidebar ── */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 sticky top-28">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              How it works
            </h3>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                <div>
                  <p className="text-sm text-gray-300 font-medium">Describe your idea</p>
                  <p className="text-xs text-gray-500 mt-0.5">Write your project idea in the text area — be as detailed as you like.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                <div>
                  <p className="text-sm text-gray-300 font-medium">AI Interview</p>
                  <p className="text-xs text-gray-500 mt-0.5">Click "Start AI Interview" to let the AI ask targeted questions about your project.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                <div>
                  <p className="text-sm text-gray-300 font-medium">Review summary</p>
                  <p className="text-xs text-gray-500 mt-0.5">See a beautiful overview of your project. Everything good? Continue.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">4</span>
                <div>
                  <p className="text-sm text-gray-300 font-medium">Generate files</p>
                  <p className="text-xs text-gray-500 mt-0.5">Get AI-ready files: README, PRD, SPEC, Memory Bank, Cline Rules, Bootstrap Prompt.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-green-600/20 text-green-400 text-xs font-bold flex items-center justify-center mt-0.5">5</span>
                <div>
                  <p className="text-sm text-gray-300 font-medium">Export & build</p>
                  <p className="text-xs text-gray-500 mt-0.5">Copy the Bootstrap Prompt, download files, or export everything as ZIP.</p>
                </div>
              </li>
            </ol>

            {/* Alternative flow */}
            <div className="mt-6 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500">
                <span className="text-indigo-400 font-medium">Alternative:</span> Copy the AI prompt, paste it into ChatGPT/Claude/Gemini, then import the JSON result using the buttons below.
              </p>
            </div>
          </div>
        </div>
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
