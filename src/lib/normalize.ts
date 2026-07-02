// ──────────────────────────────────────────────
// normalize — centralized normalization pipeline
// Pure functions for normalizing array and string
// fields consistently across the codebase.
// ──────────────────────────────────────────────

/**
 * Normalize an array of strings:
 * - Trim whitespace from each item
 * - Remove empty strings
 * - Remove duplicates (case-insensitive, keeps first occurrence)
 * - Sort alphabetically
 */
export function normalizeArray(items: string[]): string[] {
  const seen = new Map<string, string>();
  const result: string[] = [];

  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, trimmed);
      result.push(trimmed);
    }
  }

  return result.sort((a, b) => a.localeCompare(b));
}

/**
 * Normalize a single string value:
 * - Trim whitespace
 * - Collapse multiple spaces
 * - Fix space-before-comma and space-before-period
 * - Correct "aI" → "AI"
 */
export function normalizeString(value: string): string {
  return value
    .trim()
    .replace(/ +/g, " ")
    .replace(/ ,/g, ",")
    .replace(/ \./g, ".")
    .replace(/\bai\b/gi, "AI");
}

/**
 * Normalize a multi-line string into an array of lines:
 * - Split on newlines
 * - Trim each line
 * - Remove empty lines
 * - Remove duplicates (case-insensitive)
 */
export function normalizeMultilineToArray(value: string): string[] {
  return normalizeArray(
    value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  );
}

/**
 * Normalize a comma-separated string into an array:
 * - Split on commas
 * - Trim each item
 * - Remove empty items
 * - Remove duplicates (case-insensitive)
 */
export function normalizeCommaSeparated(value: string): string[] {
  return normalizeArray(
    value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  );
}

/**
 * Normalize a field that could be either a string or string array:
 * - If string: split on newlines and commas, normalize
 * - If array: normalize directly
 * - If undefined/null: return empty array
 */
export function normalizeField(value: string | string[] | undefined | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return normalizeArray(value);
  // String: split on newlines first, then commas within each line
  return normalizeArray(
    value
      .split("\n")
      .flatMap((line) => line.split(","))
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  );
}

/**
 * Normalize a field that should preserve Dutch phrases (no comma splitting):
 * - If string: split on newlines and bullet points only
 * - If array: normalize directly
 * - If undefined/null: return empty array
 */
export function normalizeDutchField(value: string | string[] | undefined | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return normalizeArray(value);
  // Only split on newlines and bullet points — preserve commas in Dutch phrases
  return normalizeArray(
    value
      .split(/[•\n]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  );
}

/**
 * Merge two arrays, normalizing and deduplicating.
 * Items from `override` take precedence (appear first).
 */
export function mergeArrays(override: string[], fallback: string[]): string[] {
  const combined = [...override, ...fallback];
  return normalizeArray(combined);
}

/**
 * Pick the best non-empty string value.
 * Returns override if non-empty, otherwise fallback.
 */
export function pickBest(override: string, fallback: string): string {
  return override.trim() || fallback.trim();
}

/**
 * Normalize MVP features: clean "and " / "en " prefixes,
 * trailing punctuation, and deduplicate.
 */
export function normalizeMvpFeatures(items: string[]): string[] {
  return normalizeArray(
    items
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => item.replace(/^and\s+/i, "").trim())
      .map((item) => item.replace(/^en\s+/i, "").trim())
      .map((item) => item.replace(/[.,;!?]+$/, "").trim())
      .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
      .filter((item) => item.length < 100)
  );
}

/**
 * Normalize target users: capitalize first letter,
 * remove trailing punctuation, deduplicate.
 */
export function normalizeTargetUsers(items: string[]): string[] {
  return normalizeArray(
    items
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => item.replace(/[.,;!?]+$/, "").trim())
      .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
      .filter((item) => item.length < 80)
  );
}
