// ──────────────────────────────────────────────
// clipboard — Phase 5.1
// Utility om tekst naar het klembord te kopiëren
// met fallback/error handling.
// ──────────────────────────────────────────────

/**
 * Kopieer een string naar het klembord.
 * Returnt `true` bij succes, `false` bij fout.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback voor niet-HTTPS context of andere clipboard fouten
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}
