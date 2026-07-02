// ──────────────────────────────────────────────
// GenerateStep — Step 3: Generate AI-ready project files
// Shows generated files with preview + copy bootstrap prompt
// ──────────────────────────────────────────────

import { useMemo, useState, useCallback } from "react";
import type { ProjectDefinition, GeneratedFile } from "../types/projectDefinition";
import { generatePreviewFiles } from "../lib/previewFactory";
import { copyToClipboard } from "../lib/clipboard";

interface Props {
  projectDefinition: ProjectDefinition;
  onBack: () => void;
  onContinue: () => void;
}

const FILE_ICONS: Record<string, string> = {
  "README.md": "📄",
  "PRD.md": "📋",
  "SPEC.md": "🏗",
  "roadmap.md": "🗺",
  "memory-bank": "🧠",
  ".clinerules": "⚙️",
};

function getFileIcon(path: string): string {
  for (const [key, icon] of Object.entries(FILE_ICONS)) {
    if (path.includes(key)) return icon;
  }
  return "📄";
}

function getFileCategory(path: string): string {
  if (path.startsWith(".clinerules")) return "Cline Rules";
  if (path.startsWith("memory-bank")) return "Memory Bank";
  if (path === "README.md") return "Documentation";
  if (path === "PRD.md") return "Documentation";
  if (path === "SPEC.md") return "Documentation";
  if (path === "roadmap.md") return "Documentation";
  return "Other";
}

export default function GenerateStep({ projectDefinition, onBack, onContinue }: Props) {
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [copyFeedback, setCopyFeedback] = useState<"idle" | "success" | "error">("idle");

  const previewFiles = useMemo(
    () => generatePreviewFiles(projectDefinition),
    [projectDefinition]
  );

  // Bootstrap prompt is generated inside generatePreviewFiles (which builds the
  // RenderModel correctly). Extract it from the preview files list.
  const bootstrapPrompt = useMemo(() => {
    const bootstrapFile = previewFiles.find((f) => f.path === "bootstrap-prompt.md");
    return bootstrapFile?.content ?? "";
  }, [previewFiles]);

  // Group files by category
  const groupedFiles = useMemo(() => {
    const groups: Record<string, GeneratedFile[]> = {};
    for (const file of previewFiles) {
      const cat = getFileCategory(file.path);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(file);
    }
    return groups;
  }, [previewFiles]);

  const currentFile = useMemo(() => {
    if (previewFiles.length === 0) return null;
    const match = previewFiles.find((f) => f.path === selectedPath);
    if (match) return match;
    const first = previewFiles[0];
    if (first) setSelectedPath(first.path);
    return first ?? null;
  }, [previewFiles, selectedPath]);

  const handleCopyBootstrap = useCallback(async () => {
    const ok = await copyToClipboard(bootstrapPrompt);
    setCopyFeedback(ok ? "success" : "error");
    setTimeout(() => setCopyFeedback("idle"), 2500);
  }, [bootstrapPrompt]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-app">Your AI-ready project files</h2>
        <p className="text-sm text-muted mt-1">
          Preview all generated files. Copy the Bootstrap Prompt to start building with Cline.
        </p>
      </div>

      {/* Bootstrap Prompt — prominent copy card */}
      <div className="bg-brand-gradient border border-brand/30 rounded-xl p-5 mb-6 shadow-brand-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-on-brand flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Cline Bootstrap Prompt
            </h3>
            <p className="text-xs text-on-brand/70 mt-1">
              Copy this prompt and paste it into Cline to start building your project.
            </p>
          </div>
          <button
            onClick={handleCopyBootstrap}
            className={`
              shrink-0 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200
              flex items-center gap-2
              ${copyFeedback === "success"
                ? "bg-success/10 text-success border border-success/30"
                : copyFeedback === "error"
                  ? "bg-danger/10 text-danger border border-danger/30"
                  : "bg-white/20 hover:bg-white/30 text-white shadow-app-sm backdrop-blur-sm"
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
                Copy Bootstrap Prompt
              </>
            )}
          </button>
        </div>
        {/* Preview snippet */}
        <div className="mt-3 p-3 bg-black/30 rounded-lg border border-white/10 max-h-24 overflow-y-auto">
          <pre className="text-xs text-white/60 font-mono whitespace-pre-wrap">
            {bootstrapPrompt.slice(0, 500)}
            {bootstrapPrompt.length > 500 ? "..." : ""}
          </pre>
        </div>
      </div>

      {/* File browser */}
      {previewFiles.length === 0 ? (
        <div className="bg-surface/50 border border-app rounded-xl p-12 text-center">
          <p className="text-muted text-sm">No files to preview. Start by defining your project.</p>
        </div>
      ) : (
        <div className="bg-surface/50 border border-app rounded-xl overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {/* File list — left sidebar */}
            <div className="sm:w-64 border-b sm:border-b-0 sm:border-r border-app bg-elevated/30">
              <nav className="py-2 max-h-96 sm:max-h-[32rem] overflow-y-auto scrollbar-thin">
                {Object.entries(groupedFiles).map(([category, files]) => (
                  <div key={category}>
                    <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                      {category}
                    </div>
                    {files.map((file) => {
                      const isActive = file.path === currentFile?.path;
                      return (
                        <button
                          key={file.path}
                          onClick={() => setSelectedPath(file.path)}
                          className={`
                            w-full text-left px-4 py-2 text-xs font-mono transition-colors flex items-center gap-2
                            ${isActive
                              ? "bg-brand/10 text-brand-soft border-l-2 border-brand"
                              : "text-secondary hover:text-app hover:bg-surface/30 border-l-2 border-transparent"
                            }
                          `}
                        >
                          <span className="shrink-0">{getFileIcon(file.path)}</span>
                          <span className="block truncate" title={file.path}>
                            {file.path}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>

            {/* Preview — right pane */}
            <div className="flex-1 flex flex-col min-w-0">
              {currentFile ? (
                <>
                  <div className="px-4 py-2 bg-elevated/30 border-b border-app flex items-center gap-2">
                    <span className="text-xs font-mono text-brand-soft truncate flex items-center gap-1.5">
                      <span>{getFileIcon(currentFile.path)}</span>
                      {currentFile.path}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted bg-elevated px-1.5 py-0.5 rounded">
                      {currentFile.language}
                    </span>
                  </div>
                  <pre className="flex-1 p-4 text-xs font-mono text-app whitespace-pre-wrap overflow-auto max-h-[28rem] leading-relaxed">
                    {currentFile.content || (
                      <span className="text-muted italic">(empty)</span>
                    )}
                  </pre>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-muted text-sm">
                  Select a file to preview
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="btn-secondary text-sm px-5 py-2.5 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Summary
        </button>
        <button
          onClick={onContinue}
          className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2"
        >
          Continue to Export
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
