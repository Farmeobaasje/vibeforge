// ──────────────────────────────────────────────
// themeSettings — General Settings theme persistence
// Stores user theme preference in localStorage.
// ──────────────────────────────────────────────

export type ThemePreference = "system" | "dark" | "light";
export type ResolvedTheme = "dark" | "light";

// Backward-compatible aliases
export type Theme = ThemePreference;

const THEME_KEY = "vibeforge-theme";

/**
 * Load the saved theme preference from localStorage.
 * Falls back to "system" if nothing is saved.
 */
export function loadThemePreference(): ThemePreference {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === "system" || raw === "dark" || raw === "light") return raw;
  } catch {
    // localStorage unavailable — fall through to default
  }
  return "system";
}

/** Backward-compatible alias */
export const loadTheme = loadThemePreference;

/**
 * Save the theme preference to localStorage.
 */
export function saveThemePreference(theme: ThemePreference): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // fail silently
  }
}

/** Backward-compatible alias */
export const saveTheme = saveThemePreference;

/**
 * Resolve a theme preference to an actual dark/light value.
 * "system" resolves based on prefers-color-scheme.
 */
export function resolveTheme(theme: ThemePreference): ResolvedTheme {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

/**
 * Apply the given theme to the document.
 * Sets `data-theme` and `data-theme-preference` on `<html>`.
 * Returns the resolved theme value.
 */
export function applyTheme(theme: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(theme);

  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.setAttribute("data-theme-preference", theme);

  return resolved;
}

/**
 * Listen for system color scheme changes and re-apply "system" theme.
 * Call once on app init. Returns an unsubscribe function.
 */
export function listenForSystemThemeChanges(): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    const current = loadThemePreference();
    if (current === "system") applyTheme("system");
  };
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
