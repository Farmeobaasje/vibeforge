// ──────────────────────────────────────────────
// canonicalStack — Strict tech stack mapping
//
// THIS IS THE SINGLE CANONICAL SOURCE for tech
// stack categorization. No renderer, no other
// module may re-categorize tech items.
//
// Maps user-specified tech to canonical names.
// NEVER hallucinates tech the user didn't specify.
// If user says React/Vite/Tailwind, output must
// never contain Next.js, Nuxt, or other unmentioned
// technologies.
// ──────────────────────────────────────────────

// ── Categorized Tech Stack (7 buckets) ────────

export interface CategorizedTechStack {
  frontend: string[];
  backend: string[];
  database: string[];
  infrastructure: string[];
  deployment: string[];
  integrations: string[];
  /** Items that don't fit any known bucket — preserved, never dropped */
  uncategorized: string[];
}

/**
 * Default empty categorized tech stack.
 */
export const emptyCategorizedTechStack: CategorizedTechStack = {
  frontend: [],
  backend: [],
  database: [],
  infrastructure: [],
  deployment: [],
  integrations: [],
  uncategorized: [],
};

// ── Canonical name mapping ────────────────────

const TECH_CANONICAL_NAMES: Record<string, string> = {
  // Languages
  "typescript": "TypeScript",
  "javascript": "JavaScript",
  "python": "Python",
  "rust": "Rust",
  "go": "Go",
  "java": "Java",
  "kotlin": "Kotlin",
  "swift": "Swift",
  "c#": "C#",
  "csharp": "C#",
  "c++": "C++",
  "ruby": "Ruby",
  "php": "PHP",
  "scala": "Scala",
  "elixir": "Elixir",
  "clojure": "Clojure",
  "haskell": "Haskell",
  "dart": "Dart",
  "lua": "Lua",

  // Frontend Frameworks
  "react": "React",
  "vue": "Vue",
  "angular": "Angular",
  "svelte": "Svelte",
  "next.js": "Next.js",
  "nextjs": "Next.js",
  "nuxt": "Nuxt",
  "tailwind": "Tailwind CSS",
  "tailwind css": "Tailwind CSS",
  "bootstrap": "Bootstrap",
  "shadcn": "shadcn/ui",
  "shadcn/ui": "shadcn/ui",
  "material ui": "Material UI",
  "material-ui": "Material UI",
  "chakra": "Chakra UI",
  "chakra ui": "Chakra UI",

  // Backend Frameworks
  "node": "Node.js",
  "node.js": "Node.js",
  "deno": "Deno",
  "bun": "Bun",
  "express": "Express",
  "fastify": "Fastify",
  "django": "Django",
  "flask": "Flask",
  "fastapi": "FastAPI",
  "spring": "Spring",
  "spring boot": "Spring Boot",
  "rails": "Ruby on Rails",
  "laravel": "Laravel",
  "asp.net": "ASP.NET",
  "blazor": "Blazor",
  "nestjs": "NestJS",
  "nest.js": "NestJS",
  "nest": "NestJS",

  // Database / ORM
  "postgresql": "PostgreSQL",
  "postgres": "PostgreSQL",
  "mysql": "MySQL",
  "mongodb": "MongoDB",
  "redis": "Redis",
  "sqlite": "SQLite",
  "prisma": "Prisma",
  "typeorm": "TypeORM",
  "drizzle": "Drizzle ORM",
  "drizzle orm": "Drizzle ORM",

  // API / Protocol
  "graphql": "GraphQL",
  "apollo": "Apollo",
  "trpc": "tRPC",
  "rest": "REST",
  "grpc": "gRPC",
  "websocket": "WebSocket",

  // Infrastructure
  "docker": "Docker",
  "kubernetes": "Kubernetes",
  "aws": "AWS",
  "azure": "Azure",
  "gcp": "GCP",
  "vercel": "Vercel",
  "netlify": "Netlify",
  "firebase": "Firebase",
  "supabase": "Supabase",

  // Testing
  "vitest": "Vitest",
  "jest": "Jest",
  "cypress": "Cypress",
  "playwright": "Playwright",
  "testing library": "Testing Library",

  // Auth / AI / Storage / Payments / Communication
  "clerk": "Clerk",
  "auth0": "Auth0",
  "openai": "OpenAI",
  "openai-compatible": "OpenAI-compatible",
  "openai compatible": "OpenAI-compatible",
  "anthropic": "Anthropic",
  "supabase storage": "Supabase Storage",
  "supabase-storage": "Supabase Storage",
  "stripe": "Stripe",
  "paypal": "PayPal",
  "twilio": "Twilio",
  "sendgrid": "SendGrid",
  "resend": "Resend",

  // Tools
  "vite": "Vite",
  "webpack": "Webpack",
  "esbuild": "esbuild",
  "turbo": "Turborepo",
  "nx": "Nx",
  "pnpm": "pnpm",
  "yarn": "Yarn",
  "npm": "npm",
  "github actions": "GitHub Actions",
  "ci/cd": "CI/CD",
  "terraform": "Terraform",
  "ansible": "Ansible",
  "helm": "Helm",
};

// ── Bucket classification sets ────────────────

const KNOWN_LANGUAGES = new Set([
  "typescript", "javascript", "python", "rust", "go", "java", "kotlin",
  "swift", "c#", "csharp", "c++", "ruby", "php", "scala", "elixir",
  "clojure", "haskell", "dart", "lua",
]);

const KNOWN_FRONTEND = new Set([
  "react", "vue", "angular", "svelte", "next.js", "nextjs", "nuxt",
  "tailwind", "tailwind css", "bootstrap", "shadcn", "shadcn/ui",
  "material ui", "material-ui", "chakra", "chakra ui",
  "vite",
]);

const KNOWN_BACKEND = new Set([
  "node", "node.js", "deno", "bun",
  "express", "fastify", "django", "flask", "fastapi",
  "spring", "spring boot", "rails", "laravel",
  "asp.net", "blazor", "nestjs", "nest.js", "nest",
]);

const KNOWN_DATABASE = new Set([
  "postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite",
  "prisma", "typeorm", "drizzle", "drizzle orm",
]);

const KNOWN_INFRASTRUCTURE = new Set([
  "docker", "kubernetes", "aws", "azure", "gcp",
  "vercel", "netlify", "firebase", "supabase",
]);

const KNOWN_DEPLOYMENT = new Set([
  "github actions", "ci/cd", "terraform", "ansible", "helm",
]);

const KNOWN_INTEGRATIONS = new Set([
  "stripe", "paypal", "twilio", "sendgrid", "resend",
  "clerk", "auth0",
  "openai", "openai-compatible", "openai compatible", "anthropic",
  "graphql", "apollo", "trpc", "rest", "grpc", "websocket",
  "supabase storage", "supabase-storage",
]);

// ── Public API ─────────────────────────────────

/**
 * Get the canonical name for a tech item.
 * Returns the original if no canonical mapping exists.
 */
export function getCanonicalName(tech: string): string {
  const lower = tech.toLowerCase().trim();
  return TECH_CANONICAL_NAMES[lower] || tech.trim();
}

/**
 * Check if a tech item is a known language.
 */
export function isKnownLanguage(tech: string): boolean {
  return KNOWN_LANGUAGES.has(tech.toLowerCase().trim());
}

/**
 * Categorize a list of tech items into the 6-bucket canonical stack.
 * Uses canonical names for deduplication and consistent display.
 * NEVER adds tech the user didn't specify.
 *
 * Also returns flat arrays (languages, frameworks, tools) for backward
 * compatibility with ProjectDefinition.tech.
 *
 * @param preferredTech - Array of tech strings from user input
 * @returns Categorized tech stack + flat arrays
 */
export function categorizeTechStack(preferredTech: string[]): {
  /** 6-bucket categorized stack — THE canonical categorization */
  categorized: CategorizedTechStack;
  /** Flat languages array (backward compat) */
  languages: string[];
  /** Flat frameworks array (backward compat) */
  frameworks: string[];
  /** Flat tools array (backward compat) */
  tools: string[];
} {
  const categorized: CategorizedTechStack = {
    frontend: [],
    backend: [],
    database: [],
    infrastructure: [],
    deployment: [],
    integrations: [],
    uncategorized: [],
  };

  const languages: string[] = [];
  const frameworks: string[] = [];
  const tools: string[] = [];

  const seen = {
    frontend: new Set<string>(),
    backend: new Set<string>(),
    database: new Set<string>(),
    infrastructure: new Set<string>(),
    deployment: new Set<string>(),
    integrations: new Set<string>(),
    uncategorized: new Set<string>(),
    languages: new Set<string>(),
    frameworks: new Set<string>(),
    tools: new Set<string>(),
  };

  for (const tech of preferredTech) {
    const lower = tech.toLowerCase().trim();
    if (!lower) continue;

    const canonical = getCanonicalName(tech);
    const seenKey = canonical.toLowerCase();

    // Classify into 7 buckets (6 known + uncategorized)
    if (KNOWN_LANGUAGES.has(lower)) {
      if (!seen.languages.has(seenKey)) {
        seen.languages.add(seenKey);
        languages.push(canonical);
      }
    } else if (KNOWN_FRONTEND.has(lower)) {
      if (!seen.frontend.has(seenKey)) {
        seen.frontend.add(seenKey);
        categorized.frontend.push(canonical);
      }
      if (!seen.frameworks.has(seenKey)) {
        seen.frameworks.add(seenKey);
        frameworks.push(canonical);
      }
    } else if (KNOWN_BACKEND.has(lower)) {
      if (!seen.backend.has(seenKey)) {
        seen.backend.add(seenKey);
        categorized.backend.push(canonical);
      }
      if (!seen.frameworks.has(seenKey)) {
        seen.frameworks.add(seenKey);
        frameworks.push(canonical);
      }
    } else if (KNOWN_DATABASE.has(lower)) {
      if (!seen.database.has(seenKey)) {
        seen.database.add(seenKey);
        categorized.database.push(canonical);
      }
      if (!seen.frameworks.has(seenKey)) {
        seen.frameworks.add(seenKey);
        frameworks.push(canonical);
      }
    } else if (KNOWN_INFRASTRUCTURE.has(lower)) {
      if (!seen.infrastructure.has(seenKey)) {
        seen.infrastructure.add(seenKey);
        categorized.infrastructure.push(canonical);
      }
      if (!seen.tools.has(seenKey)) {
        seen.tools.add(seenKey);
        tools.push(canonical);
      }
    } else if (KNOWN_DEPLOYMENT.has(lower)) {
      if (!seen.deployment.has(seenKey)) {
        seen.deployment.add(seenKey);
        categorized.deployment.push(canonical);
      }
      if (!seen.tools.has(seenKey)) {
        seen.tools.add(seenKey);
        tools.push(canonical);
      }
    } else if (KNOWN_INTEGRATIONS.has(lower)) {
      if (!seen.integrations.has(seenKey)) {
        seen.integrations.add(seenKey);
        categorized.integrations.push(canonical);
      }
      if (!seen.tools.has(seenKey)) {
        seen.tools.add(seenKey);
        tools.push(canonical);
      }
    } else {
      // Unknown → uncategorized bucket (preserved, never dropped)
      if (!seen.uncategorized.has(seenKey)) {
        seen.uncategorized.add(seenKey);
        categorized.uncategorized.push(canonical);
      }
      // Also add to tools for backward compatibility
      if (!seen.tools.has(seenKey)) {
        seen.tools.add(seenKey);
        tools.push(canonical);
      }
    }
  }

  return { categorized, languages, frameworks, tools };
}
