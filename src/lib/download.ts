// ──────────────────────────────────────────────
// download.ts — browser download utility
// Phase 5.2: triggers a file download in the
// browser using a Blob and temporary anchor link.
// ──────────────────────────────────────────────

/**
 * Trigger a browser download for the given text content.
 *
 * Creates a Blob, generates an object URL, clicks a temporary
 * <a> element, and cleans up afterwards.
 *
 * @param filename  The name the downloaded file should have
 * @param content   The text content to write into the file
 * @param mimeType  Optional MIME type (default: text/markdown)
 * @returns         true if the download was triggered, false on error
 */
export function downloadText(
  filename: string,
  content: string,
  mimeType = "text/markdown;charset=utf-8"
): boolean {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

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

/**
 * Trigger a browser download for JSON data.
 *
 * Stringifies the data with 2-space indentation and triggers
 * a download with the correct MIME type.
 *
 * @param filename  The name the downloaded file should have
 * @param data      The data to serialise as JSON
 * @returns         true if the download was triggered, false on error
 */
export function downloadJson(filename: string, data: unknown): boolean {
  try {
    const json = JSON.stringify(data, null, 2);
    return downloadText(filename, json, "application/json;charset=utf-8");
  } catch {
    return false;
  }
}
