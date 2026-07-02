// ──────────────────────────────────────────────
// domainModelTypes — Domain Model types
//
// The Domain Model is a structured entity graph
// that replaces flat string arrays with typed
// entities and relationships.
//
// This sits between StructuredRequirements and
// ProjectDefinition as a semantic enrichment layer.
// ──────────────────────────────────────────────

/**
 * A domain entity with a name, description, and
 * optional attributes.
 */
export interface DomainEntity {
  name: string;
  description: string;
  attributes?: string[];
}

/**
 * A relationship between two domain entities.
 */
export interface EntityRelationship {
  from: string;
  to: string;
  type: string;
  description: string;
}

/**
 * The complete Domain Model for a project.
 */
export interface DomainModel {
  entities: DomainEntity[];
  relationships: EntityRelationship[];
}

/**
 * Empty domain model — safe fallback.
 */
export const emptyDomainModel: DomainModel = {
  entities: [],
  relationships: [],
};
