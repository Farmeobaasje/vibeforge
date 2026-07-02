// ──────────────────────────────────────────────
// zipExporter.ts — export all project files as ZIP
// Phase 5.4: bundles generated files, project
// definition JSON, and bootstrap prompt into a
// single downloadable ZIP archive.
// ──────────────────────────────────────────────

import JSZip from "jszip";
import type { ProjectDefinition, GeneratedFile } from "../types/projectDefinition";

/**
 * Slugify a string for use in filenames.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Export the full project as a ZIP download.
 *
 * Bundles:
 * - All GeneratedFile[] entries with their original paths
 * - project-definition.json
 * - bootstrap-prompt.md
 *
 * @param projectDefinition  The current ProjectDefinition
 * @param generatedFiles     Array of generated files to include
 * @param bootstrapPrompt    The Cline bootstrap prompt text
 * @returns                  true if the download was triggered, false on error
 */
export async function exportProjectZip(
  projectDefinition: ProjectDefinition,
  generatedFiles: GeneratedFile[],
  bootstrapPrompt: string
): Promise<boolean> {
  try {
    const zip = new JSZip();

    // ── Generated files with original paths ──
    for (const file of generatedFiles) {
      zip.file(file.path, file.content);
    }

    // ── Project Definition JSON ──
    const jsonContent = JSON.stringify(projectDefinition, null, 2);
    zip.file("project-definition.json", jsonContent);

    // ── Bootstrap prompt ──
    zip.file("bootstrap-prompt.md", bootstrapPrompt);

    // ── Generate ZIP blob and trigger download ──
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);

    const projectName = projectDefinition.project.name || "";
    const slug = slugify(projectName);
    const filename = slug ? `${slug}-bootstrap.zip` : "project-bootstrap.zip";

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";

    document.body.appendChild(anchor);
    anchor.click();

    // Clean up
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    return true;
  } catch {
    return false;
  }
}
