/// <reference types="vitest/globals" />

// ──────────────────────────────────────────────
// Intelligence Layer — Unit Tests
// Tests for the Semantic Extraction Layer
// ──────────────────────────────────────────────

import { extractProjectName, extractTargetUsers, extractMvpFeatures, generateTagline, deriveComponentTree, deriveDataFlow, deriveRoadmap, scoreCompleteness, extractRequirements } from "../requirementsIntelligence";
import { detectDomain, detectProjectType, detectLanguage } from "../domainClassifier";
import { normalizeMvpFeatures, normalizeTargetUsers } from "../../lib/normalize";

// ── Project Name Extraction ────────────────────

describe("extractProjectName", () => {
  it("extracts quoted names", () => {
    expect(extractProjectName('The project is called "AquaFix Plumbing"')).toBe("AquaFix Plumbing");
    expect(extractProjectName("It's named 'FitFlow Studio'")).toBe("FitFlow Studio");
  });

  it("extracts 'I want to build X' pattern with comma after name", () => {
    const result = extractProjectName("I want to build AquaFix Plumbing, a website for plumbers");
    expect(result).toBe("AquaFix Plumbing");
  });

  it("extracts 'I want to build X' pattern with period after name", () => {
    const result = extractProjectName("I want to build TaskForge. It helps teams manage tasks.");
    expect(result).toBe("TaskForge");
  });

  it("extracts 'I want to create X' pattern", () => {
    const result = extractProjectName("I want to create SolarPro Lokaal for installers");
    expect(result).toBe("SolarPro Lokaal");
  });

  it("extracts 'Ik wil X bouwen' pattern (Dutch)", () => {
    const result = extractProjectName("Ik wil een loodgieters website bouwen");
    expect(result).toBe("Loodgieters Website");
  });

  it("extracts 'genaamd X' pattern (Dutch)", () => {
    const result = extractProjectName("Ik heb een project genaamd SolarPro Lokaal");
    expect(result).toBe("SolarPro Lokaal");
  });

  it("extracts 'called X' pattern (English)", () => {
    const result = extractProjectName("I have a project called FitFlow Studio");
    expect(result).toBe("FitFlow Studio");
  });

  it("extracts 'named X' pattern (English)", () => {
    const result = extractProjectName("A project named CRM Pro for small businesses");
    expect(result).toBe("CRM Pro");
  });

  it("extracts 'project heet X' pattern (Dutch)", () => {
    const result = extractProjectName("Het project heet RestaurantFlow");
    expect(result).toBe("RestaurantFlow");
  });

  it("extracts 'de naam is X' pattern (Dutch)", () => {
    const result = extractProjectName("De naam is Travel Planner");
    expect(result).toBe("Travel Planner");
  });

  it("returns null for empty input", () => {
    expect(extractProjectName("")).toBeNull();
    expect(extractProjectName("   ")).toBeNull();
  });

  it("rejects Dutch reject words as names", () => {
    expect(extractProjectName("Het wordt een platform")).toBeNull();
    expect(extractProjectName("Het is een website")).toBeNull();
  });

  it("rejects contaminated names (tech stack)", () => {
    expect(extractProjectName("React is een framework")).toBeNull();
  });
});

// ── Target Users Extraction ────────────────────

describe("extractTargetUsers", () => {
  it("extracts comma-separated users", () => {
    const result = extractTargetUsers("The primary users are homeowners, landlords, property managers");
    expect(result).toContain("Homeowners");
    expect(result).toContain("Landlords");
    expect(result).toContain("Property managers");
  });

  it("extracts users with 'en' conjunction (Dutch)", () => {
    const result = extractTargetUsers("De doelgroep is huiseigenaren en verhuurders");
    expect(result).toContain("Huiseigenaren");
    expect(result).toContain("Verhuurders");
  });

  it("extracts users with 'and' conjunction (English)", () => {
    const result = extractTargetUsers("Target users are personal trainers and fitness enthusiasts");
    expect(result).toContain("Personal trainers");
    expect(result).toContain("Fitness enthusiasts");
  });

  it("returns empty array for no user mentions", () => {
    expect(extractTargetUsers("This is a project about technology")).toEqual([]);
  });
});

// ── MVP Features Extraction ────────────────────

describe("extractMvpFeatures", () => {
  it("extracts comma-separated features", () => {
    const result = extractMvpFeatures("The app includes homepage, services page, contact form, and admin dashboard");
    expect(result).toContain("Homepage");
    expect(result).toContain("Services page");
    expect(result).toContain("Contact form");
    expect(result).toContain("Admin dashboard");
  });

  it("cleans 'and ' prefix from features", () => {
    const result = extractMvpFeatures("Features: homepage, services page, and admin dashboard");
    expect(result).toContain("Admin dashboard");
    expect(result).not.toContain("and admin dashboard");
  });

  it("cleans 'en ' prefix from features (Dutch)", () => {
    const result = extractMvpFeatures("Het bevat homepage, offerte pagina en klantbeheer");
    expect(result).toContain("Klantbeheer");
    expect(result).not.toContain("en klantbeheer");
  });

  it("removes trailing punctuation", () => {
    const result = extractMvpFeatures("Features: homepage, services page, contact form.");
    expect(result).toContain("Contact form");
  });

  it("returns empty array for no features", () => {
    expect(extractMvpFeatures("Just a simple project")).toEqual([]);
  });
});

// ── Tagline Generation ─────────────────────────

describe("generateTagline", () => {
  const plumbingTemplate = (name: string) =>
    `${name} — professional plumbing website for local service businesses`;

  it("uses domain template for tagline", () => {
    const result = generateTagline("AquaFix Plumbing", "plumbing", plumbingTemplate, "en");
    expect(result).toContain("AquaFix Plumbing");
    expect(result).toContain("website");
  });


  it("falls back to English generic tagline", () => {
    const genericTemplate = (name: string) => `AI-ready software project — ${name}`;
    const result = generateTagline("MyApp", "generic", genericTemplate, "en");
    expect(result).toContain("MyApp");
  });
});

// ── Component Tree Derivation ──────────────────

describe("deriveComponentTree", () => {
  it("generates tree from features and domain templates", () => {
    const result = deriveComponentTree(
      ["Homepage", "Contact form"],
      ["HomePage", "ServicesPage", "ContactPage"]
    );
    expect(result).toContain("App");
    expect(result).toContain("HomePage");
    expect(result).toContain("ContactPage");
  });

  it("never returns Undefined", () => {
    const result = deriveComponentTree([], []);
    expect(result).not.toContain("Undefined");
    expect(result).not.toContain("Unknown");
    expect(result.length).toBeGreaterThan(0);
  });
});

// ── Data Flow Derivation ───────────────────────

describe("deriveDataFlow", () => {
  it("uses domain template", () => {
    const result = deriveDataFlow("Visitor submits quote request → API validates → database stores lead");
    expect(result).toContain("quote request");
  });

  it("never returns Unknown", () => {
    const result = deriveDataFlow("");
    expect(result).not.toContain("Unknown");
    expect(result.length).toBeGreaterThan(0);
  });
});

// ── Roadmap Derivation ─────────────────────────

describe("deriveRoadmap", () => {
  const domainPhases = [
    { title: "Foundation & Setup", tasks: ["Initialize project", "Configure tooling"] },
    { title: "Core Features", tasks: ["Build feature A", "Build feature B"] },
  ];

  it("generates phases from domain templates", () => {
    const result = deriveRoadmap(domainPhases, []);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0].title).toBe("Foundation & Setup");
  });

  it("adds MVP feature phase when features exist", () => {
    const result = deriveRoadmap(domainPhases, ["Homepage", "Contact form"]);
    const hasFeaturePhase = result.some((p) =>
      p.title.toLowerCase().includes("mvp") ||
      p.title.toLowerCase().includes("feature")
    );
    expect(hasFeaturePhase).toBe(true);
  });

  it("uses English titles only", () => {
    const result = deriveRoadmap(domainPhases, []);
    for (const phase of result) {
      expect(phase.title).not.toMatch(/[éèêëàâäùûüôöîï]/); // No Dutch/French chars
    }
  });
});

// ── Confidence Scoring ─────────────────────────

describe("scoreCompleteness", () => {
  it("scores complete project highly", () => {
    const { confidence, warnings } = scoreCompleteness({
      projectName: "MyApp",
      targetUsers: ["User A", "User B"],
      mvpFeatures: ["Feature 1", "Feature 2", "Feature 3"],
      roadmap: [{ id: "p1", title: "Phase 1", tasks: [] }],
      componentTree: "App\n├── HomePage",
      dataFlow: "User → API → DB",
      domain: "fitness",
    });
    expect(confidence).toBeGreaterThan(50);
    expect(warnings.length).toBe(0);
  });

  it("generates warnings for missing fields", () => {
    const { confidence, warnings } = scoreCompleteness({
      projectName: "",
      targetUsers: [],
      mvpFeatures: [],
      roadmap: [],
      componentTree: "",
      dataFlow: "",
      domain: "generic",
    });
    expect(confidence).toBeLessThan(50);
    expect(warnings.length).toBeGreaterThan(0);
  });
});

// ── Domain Classifier ──────────────────────────

describe("detectDomain", () => {
  it("detects plumbing domain", () => {
    const domain = detectDomain("I need a loodgieter for my lekkage repair");
    expect(domain.name).toBe("plumbing");
  });

  it("detects fitness domain", () => {
    const domain = detectDomain("A fitness app for personal training");
    expect(domain.name).toBe("fitness");
  });

  it("detects solar-energy domain", () => {
    const domain = detectDomain("Zonnepanelen offerte voor duurzame energie");
    expect(domain.name).toBe("solar-energy");
  });

  it("falls back to generic for unknown domains", () => {
    const domain = detectDomain("A random gardening idea");
    expect(domain.name).toBe("generic");
  });
});

describe("detectProjectType", () => {
  it("detects mobile apps", () => {
    expect(detectProjectType("A mobile app for iOS")).toBe("mobile");
  });

  it("detects APIs", () => {
    expect(detectProjectType("A REST API backend")).toBe("api");
  });

  it("detects SaaS platforms", () => {
    expect(detectProjectType("A SaaS dashboard")).toBe("saas");
  });

  it("defaults to website", () => {
    expect(detectProjectType("Just a simple project")).toBe("website");
  });
});

describe("detectLanguage", () => {
  it("detects Dutch text", () => {
    expect(detectLanguage("Ik wil een website bouwen voor mijn bedrijf")).toBe("nl");
  });

  it("detects English text", () => {
    expect(detectLanguage("I want to build a website for my business")).toBe("en");
  });
});

// ── Normalization Helpers ──────────────────────

describe("normalizeMvpFeatures", () => {
  it("cleans 'and ' prefixes", () => {
    const result = normalizeMvpFeatures(["homepage", "and admin dashboard"]);
    expect(result).toContain("Admin dashboard");
    expect(result).not.toContain("and admin dashboard");
  });

  it("removes trailing punctuation", () => {
    const result = normalizeMvpFeatures(["contact form.", "services page,"]);
    expect(result).toContain("Contact form");
    expect(result).toContain("Services page");
  });
});

describe("normalizeTargetUsers", () => {
  it("capitalizes first letter", () => {
    const result = normalizeTargetUsers(["homeowners", "property managers"]);
    expect(result).toContain("Homeowners");
    expect(result).toContain("Property managers");
  });

  it("removes trailing punctuation", () => {
    const result = normalizeTargetUsers(["homeowners,", "property managers."]);
    expect(result).toContain("Homeowners");
    expect(result).toContain("Property managers");
  });
});

// ── Full Pipeline Integration ──────────────────

describe("extractRequirements (full pipeline)", () => {
  it("extracts AquaFix Plumbing correctly", () => {
    const input = `I want to build AquaFix Plumbing, a loodgietersbedrijf for local plumbers. The target users are homeowners, landlords, and property managers. The site should include a homepage, services page, emergency contact, quote request form, and admin dashboard.`;
    const result = extractRequirements(input);
    expect(result.projectName).toBe("AquaFix Plumbing");
    expect(result.targetUsers.length).toBeGreaterThan(0);
    expect(result.mvpFeatures.length).toBeGreaterThan(0);
    expect(result.domain).toBe("plumbing");
    expect(result.confidence).toBeGreaterThan(50);
  });

  it("extracts TaskForge correctly", () => {
    const input = `I want to create TaskForge. It's a project management tool for software teams. Features include task board, sprint planning, team dashboard, and GitHub integration.`;
    const result = extractRequirements(input);
    expect(result.projectName).toBe("TaskForge");
    expect(result.domain).toBe("project-management");
    expect(result.mvpFeatures.length).toBeGreaterThan(0);
  });

  it("handles Dutch input", () => {
    const input = `Ik wil SolarPro Lokaal bouwen, een platform voor zonnepanelen installateurs. Het bevat offerte generator, klantbeheer, en PDF export.`;
    const result = extractRequirements(input);
    expect(result.projectName).toBe("SolarPro Lokaal");
    expect(result.language).toBe("nl");
    expect(result.domain).toBe("solar-energy");
  });

  it("handles empty input gracefully", () => {
    const result = extractRequirements("");
    expect(result.projectName).toBe("New Software Project");
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("handles very short input gracefully", () => {
    const result = extractRequirements("Hello");
    expect(result.projectName).toBe("New Software Project");
    expect(result.domain).toBe("generic");
  });
});
