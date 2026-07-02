// ──────────────────────────────────────────────
// GeneratedFilesPreview — live preview component
// Phase 3.3: shows generated file previews with
// file list navigation and syntax-friendly display
// ──────────────────────────────────────────────

import { useMemo } from "react";
import { generatePreviewFiles } from "../lib/previewFactory";
import type { ProjectDefinition } from "../types/projectDefinition";


interface Props {
  projectDefinition: ProjectDefinition;
  selectedPath: string;
  onSelectPath: (path: string) => void;
}

export default function GeneratedFilesPreview({ projectDefinition, selectedPath, onSelectPath }: Props) {
  const files = useMemo(
    () => generatePreviewFiles(projectDefinition),
    [projectDefinition]
  );

  // Derive current file; reset selection if it no longer exists
  const currentFile = useMemo(() => {
    if (files.length === 0) return null;
    const match = files.find((f) => f.path === selectedPath);
    if (match) return match;
    // Selection out of sync — reset to first file
    const first = files[0];
    // Use setTimeout to avoid setState during render
    setTimeout(() => onSelectPath(first.path), 0);
    return first;
  }, [files, selectedPath, onSelectPath]);


  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-gray-100">
          Generated Files Preview
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Live preview of all files that will be generated from the current
          Project Definition
        </p>
      </div>

      {files.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm">
          No files to preview. Start by defining your project.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row">
          {/* File list — left sidebar */}
          <div className="sm:w-56 border-b sm:border-b-0 sm:border-r border-gray-800 bg-gray-950/50">
            <nav className="py-2 max-h-80 sm:max-h-[32rem] overflow-y-auto">
              {files.map((file) => {
                const isActive = file.path === currentFile?.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => onSelectPath(file.path)}

                    className={`w-full text-left px-4 py-2 text-xs font-mono transition-colors ${
                      isActive
                        ? "bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border-l-2 border-transparent"
                    }`}
                  >
                    <span className="block truncate" title={file.path}>
                      {file.path}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Preview — right pane */}
          <div className="flex-1 flex flex-col min-w-0">
            {currentFile ? (
              <>
                {/* File header */}
                <div className="px-4 py-2 bg-gray-950/30 border-b border-gray-800 flex items-center gap-2">
                  <span className="text-xs font-mono text-indigo-400 truncate">
                    {currentFile.path}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">
                    {currentFile.language}
                  </span>
                </div>

                {/* Content */}
                <pre className="flex-1 p-4 text-xs font-mono text-gray-300 whitespace-pre-wrap overflow-auto max-h-[28rem] leading-relaxed">
                  {currentFile.content || (
                    <span className="text-gray-500 italic">(empty)</span>
                  )}
                </pre>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-gray-500 text-sm">
                Select a file to preview
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
