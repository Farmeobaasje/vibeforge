import { useState, useCallback, useMemo } from "react";
import type { ProjectDefinition } from "../types/projectDefinition";
import { parseProjectDefinitionJson } from "../lib/projectDefinitionParser";
import {
  diffProjectDefinitions,
  formatDiffValue,
  type ProjectDefinitionDiff,
  type DiffType,
} from "../lib/projectDefinitionDiff";
import JsonImportModal from "./JsonImportModal";

interface ProjectDefinitionDiffPanelProps {
  projectDefinition: ProjectDefinition;
}

export default function ProjectDefinitionDiffPanel({
  projectDefinition,
}: ProjectDefinitionDiffPanelProps) {
  const [snapshot, setSnapshot] = useState<ProjectDefinition | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleImportSnapshot = useCallback((rawJson: string) => {
    const result = parseProjectDefinitionJson(rawJson);
    if (result.success) {
      setSnapshot(result.data);
      setParseError(null);
    } else {
      setParseError(result.error);
    }
  }, []);

  const handleClearSnapshot = useCallback(() => {
    setSnapshot(null);
    setParseError(null);
  }, []);

  const diff: ProjectDefinitionDiff | null = useMemo(() => {
    if (!snapshot) return null;
    return diffProjectDefinitions(projectDefinition, snapshot);
  }, [projectDefinition, snapshot]);

  const hasDifferences = diff !== null && diff.totalChanges > 0;

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-100">
          Project Definition Diff
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Compare the current Project Definition with an imported JSON snapshot.
        </p>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <button
          onClick={() => setModalOpen(true)}
          className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-700"
        >
          <span className="flex items-center justify-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import snapshot to compare
          </span>
        </button>

        {snapshot && (
          <button
            onClick={handleClearSnapshot}
            className="w-full px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-700/50"
          >
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear comparison
            </span>
          </button>
        )}
      </div>

      {/* Parse error */}
      {parseError && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
          <p className="text-sm text-red-400 flex items-start gap-2">
            <svg
              className="w-4 h-4 mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {parseError}
          </p>
        </div>
      )}

      {/* Snapshot loaded — no differences */}
      {snapshot && !hasDifferences && (
        <div className="mt-4 p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
          <p className="text-sm text-green-300 flex items-start gap-2">
            <svg
              className="w-4 h-4 mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            No differences found — the snapshot matches the current Project
            Definition.
          </p>
        </div>
      )}

      {/* Diff results */}
      {hasDifferences && diff && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-gray-400">
            Found <span className="text-gray-200 font-medium">{diff.totalChanges}</span> difference
            {diff.totalChanges !== 1 ? "s" : ""} across{" "}
            {diff.sections.length} section{diff.sections.length !== 1 ? "s" : ""}.
          </p>

          {diff.sections.map((section) => (
            <SectionDiffCard key={section.section} section={section} />
          ))}
        </div>
      )}

      {/* Import Modal */}
      <JsonImportModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setParseError(null);
        }}
        onImport={handleImportSnapshot}
      />
    </div>
  );
}

// ── Section Diff Card ─────────────────────────

function SectionDiffCard({
  section,
}: {
  section: ProjectDefinitionDiff["sections"][number];
}) {
  const [expanded, setExpanded] = useState(true);

  const addedCount = section.fields.filter((f) => f.type === "added").length;
  const removedCount = section.fields.filter((f) => f.type === "removed").length;
  const changedCount = section.fields.filter((f) => f.type === "changed").length;

  return (
    <div className="bg-gray-950/50 border border-gray-800 rounded-lg overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-200">
            {section.label}
          </span>
          <div className="flex items-center gap-1.5">
            {addedCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-green-900/40 text-green-400 border border-green-700/40">
                +{addedCount}
              </span>
            )}
            {removedCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-red-900/40 text-red-400 border border-red-700/40">
                -{removedCount}
              </span>
            )}
            {changedCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-yellow-900/40 text-yellow-400 border border-yellow-700/40">
                ~{changedCount}
              </span>
            )}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Fields */}
      {expanded && (
        <div className="border-t border-gray-800 divide-y divide-gray-800/50">
          {section.fields.map((field) => (
            <FieldDiffRow key={field.fieldPath} field={field} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Field Diff Row ────────────────────────────

const DIFF_LABELS: Record<DiffType, { label: string; color: string }> = {
  added: { label: "Added", color: "text-green-400 bg-green-900/20 border-green-700/40" },
  removed: { label: "Removed", color: "text-red-400 bg-red-900/20 border-red-700/40" },
  changed: { label: "Changed", color: "text-yellow-400 bg-yellow-900/20 border-yellow-700/40" },
};

function FieldDiffRow({ field }: { field: ProjectDefinitionDiff["sections"][number]["fields"][number] }) {
  const info = DIFF_LABELS[field.type];
  const oldFormatted = formatDiffValue(field.oldValue);
  const newFormatted = formatDiffValue(field.newValue);

  return (
    <div className="px-4 py-3 space-y-2">
      {/* Field path + badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-gray-500">
          {field.fieldPath}
        </span>
        <span
          className={`px-1.5 py-0.5 text-xs font-medium rounded border ${info.color}`}
        >
          {info.label}
        </span>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {field.type !== "added" && (
          <div className="space-y-1">
            <span className="text-xs text-gray-500">Current</span>
            <pre className="text-xs text-gray-300 bg-gray-950 rounded p-2 border border-gray-800 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
              {oldFormatted || (
                <span className="text-gray-600 italic">(empty)</span>
              )}
            </pre>
          </div>
        )}
        {field.type !== "removed" && (
          <div className="space-y-1">
            <span className="text-xs text-gray-500">Snapshot</span>
            <pre className="text-xs text-gray-300 bg-gray-950 rounded p-2 border border-gray-800 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
              {newFormatted || (
                <span className="text-gray-600 italic">(empty)</span>
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
