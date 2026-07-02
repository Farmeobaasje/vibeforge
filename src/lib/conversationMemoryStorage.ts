// ──────────────────────────────────────────────
// localStorage wrapper for ConversationMemory
// ──────────────────────────────────────────────

import {
  type ConversationMemory,
  createEmptyConversationMemory,
} from "../models/conversationMemory";

const STORAGE_KEY = "vibeforge-conversation-memory";

/**
 * Load a ConversationMemory from localStorage.
 * Returns an empty memory when nothing is stored or on error.
 */
export function loadConversationMemory(): ConversationMemory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyConversationMemory();

    const parsed = JSON.parse(raw);
    // Basic sanity check: must be an object with an `id` and `messages` array
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !parsed.id ||
      !Array.isArray(parsed.messages)
    ) {
      return createEmptyConversationMemory();
    }

    return parsed as ConversationMemory;
  } catch {
    return createEmptyConversationMemory();
  }
}

/**
 * Persist a ConversationMemory to localStorage.
 * Silently fails when storage is full or unavailable.
 */
export function saveConversationMemory(data: ConversationMemory): void {
  try {
    data.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

/**
 * Remove the stored ConversationMemory from localStorage.
 */
export function clearConversationMemory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // fail silently
  }
}
