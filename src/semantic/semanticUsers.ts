// ──────────────────────────────────────────────
// semanticUsers — Persona extraction from text
//
// Extracts clean persona lists from conversational
// text. Handles comma-separated lists, "en/and"
// conjunctions, bullet lists, and section patterns.
//
// Returns clean persona strings (not full sentences).
// ──────────────────────────────────────────────

import { normalizeArray } from "../lib/normalize";

/**
 * Extract target users/personas from conversational text.
 *
 * Rules:
 *   - Returns clean persona strings (e.g. "Pet owners", "Veterinarians")
 *   - Never returns full sentences (e.g. "The primary users are pet owners")
 *   - Handles comma-separated lists, "en/and" conjunctions, bullet lists
 *   - Filters out non-persona content (tech stack, descriptions)
 *   - Capitalizes first letter of each persona
 *
 * @param text - Raw conversational text
 * @returns Array of clean persona strings
 */
export function extractSemanticUsers(text: string): string[] {
  if (!text || text.trim().length === 0) return [];

  // First, try to find the target users section
  const sectionMatch = text.match(
    /(?:primary\s+users|target\s+users|target\s+audience|users\s+are|gebruikers\s+zijn|doelgroep\s+is|doelgroep\s+zijn|voor\s+wie|bedoeld\s+voor)(?:\s+are|\s+is|\s+include|\s*:|-\s*)?\s+(.+?)(?:\.(?:\s+[A-Z]|$)|$)/i
  );

  if (!sectionMatch) return [];

  const targetText = sectionMatch[1];

  // Split on commas, "en", "and", bullets, newlines
  const items = targetText
    .split(/\s*[,;•\n]\s*|\s+(?:en|and)\s+/i)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    // Remove trailing punctuation from each item
    .map((item) => item.replace(/[.,;!?]+$/, "").trim())
    // Strip leading filler phrases like "and", "the primary users are", etc.
    .map((item) =>
      item
        .replace(/^(?:and\s+|the primary users are\s+|the target audience (?:includes|is)\s+|the main users are\s+|the end users are\s+|the intended users are\s+)/i, "")
        .trim()
    )
    .filter((item) => item.length > 0)
    // Remove items that are too long (likely not a persona)
    .filter((item) => item.length < 80)
    // Remove items that are clearly not personas
    .filter((item) => !/^(?:the\s+|a\s+|an\s+|het\s+|een\s+|de\s+)?(?:website|platform|system|tool|app|project|solution|product)\s+/i.test(item))
    // Remove items that are full sentences (contain verbs like "is", "are", "hebben", "zijn")
    .filter((item) => {
      const lower = item.toLowerCase();
      return !(/\b(?:is|are|was|were|hebben|zijn|moeten|kunnen|willen|worden|bieden|gebruiken|heeft|moet|kan|zal|wordt|biedt|gebruikt)\s/i.test(lower) && item.split(/\s+/).length > 4);
    });

  // Capitalize first letter of each item
  return normalizeArray(
    items.map((item) => item.charAt(0).toUpperCase() + item.slice(1))
  );
}
