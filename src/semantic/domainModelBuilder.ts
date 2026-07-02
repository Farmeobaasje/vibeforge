// ──────────────────────────────────────────────
// domainModelBuilder — Builds a Domain Model from
// domain templates and extracted entities.
//
// The Domain Model is a structured entity graph
// with typed entities and relationships, replacing
// flat string arrays.
// ──────────────────────────────────────────────

import type { DomainModel, DomainEntity, EntityRelationship } from "./domainModelTypes";
import { emptyDomainModel } from "./domainModelTypes";
import type { DomainTemplate } from "./domainTemplates";

/**
 * Build a Domain Model from a domain template.
 *
 * Uses the template's predefined entities and relationships
 * as the base, then merges in any additional entities
 * extracted from the input text.
 *
 * @param domainTemplate - The detected domain template
 * @param extractedEntityNames - Optional additional entity names from text extraction
 * @returns A complete DomainModel
 */
export function buildDomainModel(
  domainTemplate: DomainTemplate,
  extractedEntityNames?: string[],
): DomainModel {
  const entities: DomainEntity[] = [...domainTemplate.entities];
  const relationships: EntityRelationship[] = [...domainTemplate.relationships];

  // Add any extracted entities that aren't already in the template
  if (extractedEntityNames && extractedEntityNames.length > 0) {
    const existingNames = new Set(entities.map((e) => e.name.toLowerCase()));

    for (const name of extractedEntityNames) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      if (existingNames.has(trimmed.toLowerCase())) continue;

      entities.push({
        name: trimmed,
        description: `${trimmed} entity`,
      });
    }
  }

  return { entities, relationships };
}

/**
 * Get entity names from a Domain Model.
 */
export function getEntityNames(domainModel: DomainModel): string[] {
  return domainModel.entities.map((e) => e.name);
}

/**
 * Get relationship descriptions from a Domain Model.
 */
export function getRelationshipDescriptions(domainModel: DomainModel): string[] {
  return domainModel.relationships.map(
    (r) => `${r.from} ${r.type} ${r.to} — ${r.description}`
  );
}

export { emptyDomainModel };
