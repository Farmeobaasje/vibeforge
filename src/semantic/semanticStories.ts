// ──────────────────────────────────────────────
// semanticStories — Professional user story generation
//
// Generates "As a {persona}, I want {action} so that
// {benefit}" format user stories from goals and
// target users.
//
// Rules:
//   - Uses clean persona names (not full sentences)
//   - "As a {persona}, I want {action} so that {benefit}"
//   - Max 5 stories
//   - Fixes "aI" → "AI" in output
// ──────────────────────────────────────────────

/**
 * Generate professional user stories from goals and target users.
 *
 * Rules:
 *   - Uses first target user as persona (clean, not a sentence)
 *   - "As a {persona}, I want {action} so that {benefit}"
 *   - Max 5 stories
 *   - Skips goals that already start with "As a"
 *   - Fixes "aI" → "AI" in output
 *
 * @param goals - Array of goal strings from requirements
 * @param targetUsers - Array of clean persona strings
 * @returns Array of professional user stories
 */
export function generateSemanticStories(
  goals: string[],
  targetUsers: string[],
): string[] {
  const stories: string[] = [];

  // Use first target user as persona, fall back to "user"
  const persona = targetUsers.length > 0
    ? targetUsers[0].trim().toLowerCase()
    : "user";

  for (const goal of goals) {
    if (stories.length >= 5) break;

    const trimmed = goal.trim();
    if (!trimmed) continue;

    // Skip if already a user story
    if (/^as a\b/i.test(trimmed)) {
      stories.push(trimmed.replace(/\baI\b/g, "AI"));
      continue;
    }

    // Try to split goal into action + benefit
    // Look for "so that", "zodat", "om te", "to", "for"
    const benefitMatch = trimmed.match(
      /(.+?)\s+(?:so\s+that|zodat|om\s+te|to\s+|for\s+)(.+)/i
    );

    if (benefitMatch) {
      const action = benefitMatch[1].trim();
      const benefit = benefitMatch[2].trim();
      const story = `As a ${persona}, I want to ${action.charAt(0).toLowerCase()}${action.slice(1)} so that ${benefit.charAt(0).toLowerCase()}${benefit.slice(1)}`;
      stories.push(story.replace(/\baI\b/g, "AI"));
    } else {
      // Normal goal → user story without benefit clause
      const story = `As a ${persona}, I want to ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
      stories.push(story.replace(/\baI\b/g, "AI"));
    }
  }

  return stories;
}
