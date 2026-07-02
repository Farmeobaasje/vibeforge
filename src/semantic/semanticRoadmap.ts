// ──────────────────────────────────────────────
// semanticRoadmap — Domain-aware roadmap generation
//
// Generates domain-specific roadmap phases with
// MVP features integrated. Uses domain templates
// for phase structure and task content.
// ──────────────────────────────────────────────

import type { Phase } from "../types/projectDefinition";
import type { DomainTemplate } from "./domainTemplates";

/**
 * Generate a domain-specific roadmap with MVP features integrated.
 *
 * Uses domain template phases as the base structure, then adds
 * MVP feature implementation tasks if they're not already covered.
 *
 * @param domainTemplate - The detected domain template
 * @param mvpFeatures - Array of MVP feature descriptions
 * @returns Array of Phase objects
 */
export function generateSemanticRoadmap(
  domainTemplate: DomainTemplate,
  mvpFeatures: string[],
): Phase[] {
  const phases: Phase[] = [];
  let phaseCounter = 0;
  let taskCounter = 0;

  const nextPhaseId = (): string => {
    phaseCounter++;
    return `phase-${phaseCounter}`;
  };

  const nextTaskId = (): string => {
    taskCounter++;
    return `task-${taskCounter}`;
  };

  // Use domain-specific roadmap phases
  for (const phase of domainTemplate.roadmapPhases) {
    const tasks = phase.tasks.map((taskTitle) => ({
      id: nextTaskId(),
      title: taskTitle,
      status: "pending" as const,
    }));

    phases.push({
      id: nextPhaseId(),
      title: phase.title,
      tasks,
    });
  }

  // If we have MVP features and the last phase doesn't mention them,
  // add a phase for feature implementation
  if (mvpFeatures.length > 0) {
    const hasFeaturePhase = phases.some((p) =>
      p.title.toLowerCase().includes("mvp") ||
      p.title.toLowerCase().includes("feature") ||
      p.title.toLowerCase().includes("core")
    );
    if (!hasFeaturePhase) {
      phases.push({
        id: nextPhaseId(),
        title: "MVP Feature Implementation",
        tasks: mvpFeatures.slice(0, 5).map((feature) => ({
          id: nextTaskId(),
          title: `Implement ${feature}`,
          status: "pending" as const,
        })),
      });
    }
  }

  return phases;
}
