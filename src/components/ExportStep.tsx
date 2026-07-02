// ──────────────────────────────────────────────
// ExportStep — Step 4: Export your project
// Card-based export with Copy, Download, ZIP actions
// ──────────────────────────────────────────────

import { useMemo, useState, useCallback } from "react";
import type { ProjectDefinition } from "../types/projectDefinition";
import { generatePreviewFiles } from "../lib/previewFactory";
import { copyToClipboard } from "../lib/clipboard";
import { downloadJson } from "../lib/download";
import { exportProjectZip } from "../lib/zipExporter";

interface Props {
  projectDefinition: ProjectDefinition;
  onBack: () => void;
  onStartOver: () => void;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ExportStep({ projectDefinition, onBack, onStartOver }: Props) {
  const [copyFeedback, setCopyFeedback] = useState<"idle" | "success" | "error">("idle");
  const [jsonFeedback, setJsonFeedback] = useState<"idle" | "success" | "error">("idle");
  const [zipLoading, setZipLoading] = useState(false);
  const [zipFeedback, setZipFeedback] = useState<"idle" | "success" | "error">("idle");

  const generatedFiles = useMemo(
    () => generatePreviewFiles(projectDefinition),
    [projectDefinition]
  );

  // Bootstrap prompt is generated inside generatePreviewFiles (which builds the
  // RenderModel correctly). Extract it from the generated files list.
  const bootstrapPrompt = useMemo(() => {
    const bootstrapFile = generatedFiles.find((f) => f.path === "bootstrap-prompt.md");
    return bootstrapFile?.content ?? "";
  }, [generatedFiles]);

  const handleCopyBootstrap = useCallback(async () => {
    const ok = await copyToClipboard(bootstrapPrompt);
    setCopyFeedback(ok ? "success" : "error");
    setTimeout(() => setCopyFeedback("idle"), 2500);
  }, [bootstrapPrompt]);

  const handleDownloadJson = useCallback(() => {
    const name = projectDefinition.project.name || "";
    const slug = slugify(name);
    const filename = slug ? `${slug}.project-definition.json` : "project-definition.json";
    const ok = downloadJson(filename, projectDefinition);
    setJsonFeedback(ok ? "success" : "error");
    setTimeout(() => setJsonFeedback("idle"), 2500);
  }, [projectDefinition]);

  const handleDownloadZip = useCallback(async () => {
    setZipLoading(true);
    setZipFeedback("idle");
    const ok = await exportProjectZip(projectDefinition, generatedFiles, bootstrapPrompt);
    setZipLoading(false);
    setZipFeedback(ok ? "success" : "error");
    setTimeout(() => setZipFeedback("idle"), 2500);
  }, [projectDefinition, generatedFiles, bootstrapPrompt]);

  const projectName = projectDefinition.project.name || "your project";

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-app">Export your project</h2>
        <p className="text-sm text-muted mt-1">
          Your project definition for <span className="text-brand-soft font-medium">{projectName}</span> is ready. Choose how to export it.
        </p>
      </div>

      {/* Export cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Bootstrap Prompt */}
        <div className="bg-surface/50 border border-app rounded-xl p-6 flex flex-col hover:border-brand/30 transition-colors group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-lg">
              🛠
            </div>
            <div>
              <h3 className="text-sm font-semibold text-app">Bootstrap Prompt</h3>
              <p className="text-xs text-muted">For Cline / Cursor / Claude Code</p>
            </div>
          </div>
          <p className="text-xs text-muted mb-5 flex-1">
            One-click copy of the complete Cline bootstrap prompt. Paste into Cline to start building.
          </p>
          <button
            onClick={handleCopyBootstrap}
            className={`
              w-full px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200
              flex items-center justify-center gap-2
              ${copyFeedback === "success"
                ? "bg-success/10 text-success border border-success/30"
                : copyFeedback === "error"
                  ? "bg-danger/10 text-danger border border-danger/30"
                  : "btn-primary"
              }
            `}
          >
            {copyFeedback === "success" ? (
              <>✓ Copied!</>
            ) : copyFeedback === "error" ? (
              <>✗ Copy failed</>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>

        {/* Card 2: Project JSON */}
        <div className="bg-surface/50 border border-app rounded-xl p-6 flex flex-col hover:border-brand/30 transition-colors group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center text-lg">
              📄
            </div>
            <div>
              <h3 className="text-sm font-semibold text-app">Project JSON</h3>
              <p className="text-xs text-muted">Single source of truth</p>
            </div>
          </div>
          <p className="text-xs text-muted mb-5 flex-1">
            Download the complete Project Definition as JSON. Re-import later to continue editing.
          </p>
          <button
            onClick={handleDownloadJson}
            className={`
              w-full px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200
              flex items-center justify-center gap-2
              ${jsonFeedback === "success"
                ? "bg-success/10 text-success border border-success/30"
                : jsonFeedback === "error"
                  ? "bg-danger/10 text-danger border border-danger/30"
                  : "btn-secondary"
              }
            `}
          >
            {jsonFeedback === "success" ? (
              <>✓ Downloaded!</>
            ) : jsonFeedback === "error" ? (
              <>✗ Download failed</>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </>
            )}
          </button>
        </div>

        {/* Card 3: Complete ZIP */}
        <div className="bg-surface/50 border border-app rounded-xl p-6 flex flex-col hover:border-brand/30 transition-colors group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center text-lg">
              📦
            </div>
            <div>
              <h3 className="text-sm font-semibold text-app">Complete Project</h3>
              <p className="text-xs text-muted">All files + rules + memory</p>
            </div>
          </div>
          <p className="text-xs text-muted mb-5 flex-1">
            Download everything as ZIP: generated files, Cline rules, Memory Bank, and bootstrap prompt.
          </p>
          <button
            onClick={handleDownloadZip}
            disabled={zipLoading}
            className={`
              w-full px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200
              flex items-center justify-center gap-2
              ${zipLoading
                ? "bg-elevated text-muted border border-app cursor-wait"
                : zipFeedback === "success"
                  ? "bg-success/10 text-success border border-success/30"
                  : zipFeedback === "error"
                    ? "bg-danger/10 text-danger border border-danger/30"
                    : "btn-secondary"
              }
            `}
          >
            {zipLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Zipping...
              </>
            ) : zipFeedback === "success" ? (
              <>✓ Downloaded!</>
            ) : zipFeedback === "error" ? (
              <>✗ ZIP failed</>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Download ZIP
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success message */}
      <div className="mt-8 p-5 bg-success/10 border border-success/30 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-success">Your project is ready!</h3>
            <p className="text-xs text-success/70 mt-1">
              Copy the Bootstrap Prompt and paste it into Cline to start building <span className="text-success font-medium">{projectName}</span>.
              All generated files are included in the ZIP download.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="btn-secondary text-sm px-5 py-2.5 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Generate
        </button>
        <button
          onClick={onStartOver}
          className="btn-secondary text-sm px-5 py-2.5 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Start Over
        </button>
      </div>
    </div>
  );
}
