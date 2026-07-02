/// <reference types="vitest/globals" />

// ──────────────────────────────────────────────
// Golden Test Suite — v0.2.0 Release Quality
// 8 fixed test projects with snapshot-based
// regression testing for all generators.
//
// v0.2.0: Uses central pipeline:
//   resolveProjectDefinition() → buildRenderModel()
//   → pass RenderModel to all generators.
//   Added resolver, validator, and domain consistency tests.
// ──────────────────────────────────────────────

import type { ProjectDefinition } from "../types/projectDefinition";
import { resolveProjectDefinition } from "../canonical/projectDefinitionResolver";
import { buildRenderModel } from "../generator/renderModel";
import { validateProjectDefinition } from "../generator/projectDefinitionValidator";
import { validateDomainConsistency } from "../generator/consistencyValidator";
import { generateClineBootstrapPrompt } from "../lib/bootstrapPromptGenerator";
import { generateDocumentationFiles } from "../lib/docsGenerator";
import { generateMemoryBankFiles } from "../lib/memoryBankGenerator";
import { generateClinerulesFiles } from "../lib/clinerulesGenerator";
import { normalizeArray, normalizeString } from "../lib/normalize";


// ── Golden Test Projects ───────────────────────

const solarProLokaal: ProjectDefinition = {
  project: {
    name: "SolarPro Lokaal",
    tagline: "Lokaal offerteplatform voor zonnepaneleninstallateurs",
    version: "0.1.0",
    description: "Een platform waar lokale zonnepaneleninstallateurs offertes kunnen maken, beheren en versturen naar klanten. Het platform biedt een professionele uitstraling met een eenvoudige workflow.",
    status: "draft",
    repositoryState: "greenfield",
  },
  product: {
    targetUsers: ["Zonnepaneleninstallateurs", "MKB-bedrijven in de zonne-energie"],
    problemStatement: "Lokale zonnepaneleninstallateurs hebben geen professioneel offerteplatform, waardoor ze tijd verliezen met handmatige offertes en een minder professionele uitstraling hebben.",
    solution: "Een gebruiksvriendelijk webplatform waar installateurs snel offertes kunnen genereren, beheren en versturen, met een professionele template en klantbeheer.",
    userStories: [
      "Als installateur wil ik een offerte kunnen maken op basis van een template, zodat ik tijd bespaar.",
      "Als installateur wil ik klantgegevens kunnen opslaan, zodat ik ze niet elke keer opnieuw hoef in te voeren.",
    ],
    mvpScope: "Offerte maken met template\nKlantbeheer met adresgegevens\nOfferte exporteren als PDF\nOfferte status bijhouden (concept/verzonden/goedgekeurd)",
    mvpFeatures: [
      "Offerte maken met template",
      "Klantbeheer met adresgegevens",
      "Offerte exporteren als PDF",
      "Offerte status bijhouden (concept/verzonden/goedgekeurd)",
    ],
  },
  tech: {
    languages: ["TypeScript", "HTML", "CSS"],
    frameworks: ["React", "Vite", "Tailwind CSS"],
    tools: [],
    dependencies: [],
    constraints: ["Lokaal draaiend zonder backend", "Offertes moeten offline beschikbaar zijn"],
  },
  architecture: {
    pattern: "Single-page application met client-side routing",
    directoryStructure: "",
    componentTree: "",
    dataFlow: "",
    domainModel: {
      entities: [
        { name: "Panel", description: "Solar panel product" },
        { name: "Installation", description: "Solar panel installation project" },
        { name: "Quote", description: "Customer quote for solar installation" },
        { name: "Customer", description: "Customer requesting a quote" },
      ],
      relationships: [],
    },
  },
  roadmap: {
    phases: [
      { id: "phase-1", title: "Foundation & Setup", tasks: [{ id: "t1", title: "Project scaffold opzetten", status: "pending" }] },
      { id: "phase-2", title: "MVP — Kernfunctionaliteit", tasks: [{ id: "t2", title: "Offerte template bouwen", status: "pending" }] },
    ],
    activePhaseId: "phase-1",
  },
  memory: {
    files: [
      { path: "memory-bank/projectbrief.md", description: "Core requirements and goals", required: true },
      { path: "memory-bank/productContext.md", description: "Why this exists and how it should work", required: true },
      { path: "memory-bank/activeContext.md", description: "Current focus and recent changes", required: true },
      { path: "memory-bank/systemPatterns.md", description: "Architecture and technical decisions", required: true },
      { path: "memory-bank/techContext.md", description: "Technologies and setup", required: true },
      { path: "memory-bank/progress.md", description: "What works and what's left", required: true },
    ],
    updateCadence: "After every session and at milestones",
    patterns: [],
  },
  agents: { agents: [] },
  quality: {
    codeStyle: "TypeScript strict mode, functional components, Tailwind classes",
    testingStrategy: "Manual review in MVP",
    validationRules: ["Offerte template moet valide PDF opleveren", "Klantgegevens moeten lokaal worden opgeslagen"],
    fallbackBehavior: "Empty sections render a helpful hint instead of crashing",
  },
  options: {
    compression: false,
    orchestratorModel: "gpt-4o",
    focusChain: true,
    extraDocs: [],
  },
};

const fitFlowStudio: ProjectDefinition = {
  project: {
    name: "FitFlow Studio",
    tagline: "AI-powered personal training app",
    version: "0.1.0",
    description: "A mobile-first web app that generates personalized workout plans using AI, tracks progress, and adapts routines based on user feedback.",
    status: "idea",
    repositoryState: "greenfield",
  },
  product: {
    targetUsers: ["Personal trainers", "Fitness enthusiasts", "People starting their fitness journey"],
    problemStatement: "Generic workout apps don't adapt to individual progress and preferences, leading to plateaus and loss of motivation.",
    solution: "An AI-powered fitness app that creates dynamic workout plans that evolve with the user's progress, preferences, and feedback.",
    userStories: [
      "As a user, I want to get a personalized workout plan based on my goals and equipment.",
      "As a user, I want to log my workouts and see progress over time.",
    ],
    mvpScope: "User onboarding with fitness assessment\nAI-generated workout plan\nWorkout logging and tracking\nProgress dashboard with charts",
    mvpFeatures: [
      "User onboarding with fitness assessment",
      "AI-generated workout plan",
      "Workout logging and tracking",
      "Progress dashboard with charts",
    ],
  },
  tech: {
    languages: ["TypeScript", "JavaScript"],
    frameworks: ["React", "Vite", "Tailwind CSS"],
    tools: [],
    dependencies: [],
    constraints: ["Mobile-first responsive design", "Offline support for workout tracking"],
  },
  architecture: {
    pattern: "Progressive Web App with service worker caching",
    directoryStructure: "",
    componentTree: "",
    dataFlow: "",
  },
  roadmap: {
    phases: [
      { id: "phase-1", title: "Foundation & Setup", tasks: [{ id: "t1", title: "Project scaffold opzetten", status: "pending" }] },
      { id: "phase-2", title: "MVP — Core Features", tasks: [{ id: "t2", title: "Workout plan generator", status: "pending" }] },
    ],
    activePhaseId: "phase-1",
  },
  memory: {
    files: [
      { path: "memory-bank/projectbrief.md", description: "Core requirements and goals", required: true },
      { path: "memory-bank/productContext.md", description: "Why this exists and how it should work", required: true },
      { path: "memory-bank/activeContext.md", description: "Current focus and recent changes", required: true },
      { path: "memory-bank/systemPatterns.md", description: "Architecture and technical decisions", required: true },
      { path: "memory-bank/techContext.md", description: "Technologies and setup", required: true },
      { path: "memory-bank/progress.md", description: "What works and what's left", required: true },
    ],
    updateCadence: "After every session and at milestones",
    patterns: [],
  },
  agents: { agents: [] },
  quality: {
    codeStyle: "TypeScript strict mode, functional components, Tailwind classes",
    testingStrategy: "Manual review in MVP; vitest planned",
    validationRules: ["Workout plans must be valid and safe", "Progress data must be stored locally"],
    fallbackBehavior: "Empty sections render a helpful hint instead of crashing",
  },
  options: {
    compression: false,
    orchestratorModel: "gpt-4o",
    focusChain: true,
    extraDocs: [],
  },
};

const restaurantFlow: ProjectDefinition = {
  project: {
    name: "RestaurantFlow",
    tagline: "Digital restaurant management system",
    version: "0.1.0",
    description: "A comprehensive system for restaurants to manage reservations, table assignments, menu updates, and order tracking in real-time.",
    status: "draft",
    repositoryState: "existing-project",
  },
  product: {
    targetUsers: ["Restaurant owners", "Restaurant managers", "Waitstaff"],
    problemStatement: "Restaurants struggle with coordinating reservations, table assignments, and orders using paper-based or disconnected digital tools.",
    solution: "A unified digital platform that streamlines reservation management, table assignment, and order tracking with real-time updates.",
    userStories: [
      "As a host, I want to manage reservations and assign tables visually.",
      "As a waiter, I want to send orders to the kitchen digitally.",
    ],
    mvpScope: "Reservation calendar with table management\nDigital order taking and kitchen display\nMenu management with categories\nReal-time table status overview",
    mvpFeatures: [
      "Reservation calendar with table management",
      "Digital order taking and kitchen display",
      "Menu management with categories",
      "Real-time table status overview",
    ],
  },
  tech: {
    languages: ["TypeScript", "SQL"],
    frameworks: ["React", "Node.js", "Express"],
    tools: [],
    dependencies: ["PostgreSQL"],
    constraints: ["Real-time sync required", "Multi-device support (tablet, kiosk, kitchen display)"],
  },
  architecture: {
    pattern: "Client-server architecture with WebSocket real-time updates",
    directoryStructure: "",
    componentTree: "",
    dataFlow: "",
  },
  roadmap: {
    phases: [
      { id: "phase-1", title: "Foundation & Setup", tasks: [{ id: "t1", title: "Database schema ontwerpen", status: "done" }] },
      { id: "phase-2", title: "MVP — Core Features", tasks: [{ id: "t2", title: "Reservation system", status: "pending" }] },
    ],
    activePhaseId: "phase-2",
  },
  memory: {
    files: [
      { path: "memory-bank/projectbrief.md", description: "Core requirements and goals", required: true },
      { path: "memory-bank/productContext.md", description: "Why this exists and how it should work", required: true },
      { path: "memory-bank/activeContext.md", description: "Current focus and recent changes", required: true },
      { path: "memory-bank/systemPatterns.md", description: "Architecture and technical decisions", required: true },
      { path: "memory-bank/techContext.md", description: "Technologies and setup", required: true },
      { path: "memory-bank/progress.md", description: "What works and what's left", required: true },
    ],
    updateCadence: "After every session and at milestones",
    patterns: [],
  },
  agents: { agents: [] },
  quality: {
    codeStyle: "TypeScript strict mode, functional components",
    testingStrategy: "Integration tests for API endpoints",
    validationRules: ["Reservations must not double-book tables", "Orders must reach kitchen within 2 seconds"],
    fallbackBehavior: "Empty sections render a helpful hint instead of crashing",
  },
  options: {
    compression: false,
    orchestratorModel: "gpt-4o",
    focusChain: true,
    extraDocs: [],
  },
};

const crmPro: ProjectDefinition = {
  project: {
    name: "CRM Pro",
    tagline: "Simple CRM for small businesses",
    version: "0.2.0",
    description: "A lightweight customer relationship management tool designed specifically for small businesses that need contact management, deal tracking, and basic reporting.",
    status: "ready",
    repositoryState: "existing-project",
  },
  product: {
    targetUsers: ["Small business owners", "Freelancers", "Sales representatives"],
    problemStatement: "Small businesses find enterprise CRMs too complex and expensive, while spreadsheets lack the structure needed for effective sales tracking.",
    solution: "A simple, affordable CRM that provides contact management, deal pipeline tracking, and basic reporting without the enterprise overhead.",
    userStories: [
      "As a sales rep, I want to track deals through a pipeline.",
      "As a business owner, I want to see a dashboard with key metrics.",
    ],
    mvpScope: "Contact management with import/export\nDeal pipeline with drag-and-drop\nDashboard with sales metrics\nBasic reporting (monthly/quarterly)",
    mvpFeatures: [
      "Contact management with import/export",
      "Deal pipeline with drag-and-drop",
      "Dashboard with sales metrics",
      "Basic reporting (monthly/quarterly)",
    ],
  },
  tech: {
    languages: ["TypeScript", "Python"],
    frameworks: ["React", "FastAPI"],
    tools: [],
    dependencies: ["PostgreSQL", "Redis"],
    constraints: ["GDPR compliant data handling", "Multi-tenant architecture"],
  },
  architecture: {
    pattern: "Microservices with REST API gateway",
    directoryStructure: "",
    componentTree: "",
    dataFlow: "",
  },
  roadmap: {
    phases: [
      { id: "phase-1", title: "Foundation & Setup", tasks: [{ id: "t1", title: "Project scaffold opzetten", status: "done" }] },
      { id: "phase-2", title: "MVP — Core Features", tasks: [{ id: "t2", title: "Contact management", status: "done" }] },
      { id: "phase-3", title: "Advanced Features", tasks: [{ id: "t3", title: "Email integration", status: "pending" }] },
    ],
    activePhaseId: "phase-3",
  },
  memory: {
    files: [
      { path: "memory-bank/projectbrief.md", description: "Core requirements and goals", required: true },
      { path: "memory-bank/productContext.md", description: "Why this exists and how it should work", required: true },
      { path: "memory-bank/activeContext.md", description: "Current focus and recent changes", required: true },
      { path: "memory-bank/systemPatterns.md", description: "Architecture and technical decisions", required: true },
      { path: "memory-bank/techContext.md", description: "Technologies and setup", required: true },
      { path: "memory-bank/progress.md", description: "What works and what's left", required: true },
    ],
    updateCadence: "After every session and at milestones",
    patterns: [],
  },
  agents: { agents: [] },
  quality: {
    codeStyle: "TypeScript strict mode, Python type hints",
    testingStrategy: "Unit tests + integration tests",
    validationRules: ["Contact data must be exportable", "Deal pipeline must support custom stages"],
    fallbackBehavior: "Empty sections render a helpful hint instead of crashing",
  },
  options: {
    compression: false,
    orchestratorModel: "gpt-4o",
    focusChain: true,
    extraDocs: [],
  },
};

const travelPlanner: ProjectDefinition = {
  project: {
    name: "Travel Planner",
    tagline: "AI-assisted trip planning and itinerary builder",
    version: "0.1.0",
    description: "An intelligent travel planning app that helps users discover destinations, build itineraries, track budgets, and share trip plans with travel companions.",
    status: "idea",
    repositoryState: "greenfield",
  },
  product: {
    targetUsers: ["Travel enthusiasts", "Trip planners", "Group travelers"],
    problemStatement: "Planning a trip involves juggling multiple tabs, spreadsheets, and apps for flights, hotels, activities, and budgets, leading to a fragmented experience.",
    solution: "A unified trip planning platform with AI-powered destination discovery, collaborative itinerary building, budget tracking, and sharing features.",
    userStories: [
      "As a traveler, I want AI suggestions for destinations based on my preferences.",
      "As a group traveler, I want to collaborate on the itinerary with my companions.",
    ],
    mvpScope: "Destination discovery with AI suggestions\nItinerary builder with drag-and-drop\nBudget tracker per trip\nTrip sharing with companions",
    mvpFeatures: [
      "Destination discovery with AI suggestions",
      "Itinerary builder with drag-and-drop",
      "Budget tracker per trip",
      "Trip sharing with companions",
    ],
  },
  tech: {
    languages: ["TypeScript"],
    frameworks: ["React", "Vite", "Tailwind CSS"],
    tools: [],
    dependencies: [],
    constraints: ["Offline access to saved trips", "Collaborative editing with conflict resolution"],
  },
  architecture: {
    pattern: "Single-page application with offline-first architecture",
    directoryStructure: "",
    componentTree: "",
    dataFlow: "",
  },
  roadmap: {
    phases: [
      { id: "phase-1", title: "Foundation & Setup", tasks: [{ id: "t1", title: "Project scaffold opzetten", status: "pending" }] },
      { id: "phase-2", title: "MVP — Core Features", tasks: [{ id: "t2", title: "Itinerary builder", status: "pending" }] },
      { id: "phase-3", title: "Social Features", tasks: [{ id: "t3", title: "Trip sharing", status: "pending" }] },
    ],
    activePhaseId: "phase-1",
  },
  memory: {
    files: [
      { path: "memory-bank/projectbrief.md", description: "Core requirements and goals", required: true },
      { path: "memory-bank/productContext.md", description: "Why this exists and how it should work", required: true },
      { path: "memory-bank/activeContext.md", description: "Current focus and recent changes", required: true },
      { path: "memory-bank/systemPatterns.md", description: "Architecture and technical decisions", required: true },
      { path: "memory-bank/techContext.md", description: "Technologies and setup", required: true },
      { path: "memory-bank/progress.md", description: "What works and what's left", required: true },
    ],
    updateCadence: "After every session and at milestones",
    patterns: [],
  },
  agents: { agents: [] },
  quality: {
    codeStyle: "TypeScript strict mode, functional components, Tailwind classes",
    testingStrategy: "Manual review in MVP; vitest planned",
    validationRules: ["Itinerary must support date ranges", "Budget must calculate totals correctly"],
    fallbackBehavior: "Empty sections render a helpful hint instead of crashing",
  },
  options: {
    compression: false,
    orchestratorModel: "gpt-4o",
    focusChain: true,
    extraDocs: [],
  },
};

// ── TaskForge — regression test for v0.1.0 fixes ──
// This project tests:
//   - No "TaskForge" name hallucination (name should NOT be "TaskForge")
//   - Architecture score/confidence sanity check (should be capped at 30)
//   - Generic pattern detection (should not use "Modular Monolith")
//   - Component tree fallback from mvpFeatures
//   - Roadmap with individual tasks from mvpScope
//   - Normalized targetUsers (deduped, sorted)

const taskForge: ProjectDefinition = {
  project: {
    name: "New Software Project",
    tagline: "AI-ready software project",
    version: "0.1.0",
    description: "I want to build a tool that helps developers track their tasks across multiple projects. The tool should integrate with GitHub and Jira and provide a unified dashboard.",
    status: "draft",
    repositoryState: "greenfield",
  },
  product: {
    targetUsers: ["Developers", "Tech leads", "Developers", "Project managers"],
    problemStatement: "Developers work across multiple projects and tools, making it hard to track what they're working on.",
    solution: "A unified task tracking dashboard that aggregates tasks from GitHub and Jira into a single view.",
    userStories: [
      "As a developer, I want to see all my tasks from GitHub and Jira in one dashboard.",
      "As a tech lead, I want to see my team's workload across projects.",
    ],
    mvpScope: "GitHub issue integration, Jira ticket integration, Unified task dashboard, Team workload view",
    mvpFeatures: [
      "GitHub issue integration",
      "Jira ticket integration",
      "Unified task dashboard",
      "Team workload view",
    ],
  },
  tech: {
    languages: ["TypeScript"],
    frameworks: ["React", "Vite", "Tailwind CSS"],
    tools: [],
    dependencies: [],
    constraints: ["Local-first with optional cloud sync", "OAuth for GitHub and Jira"],
  },
  architecture: {
    pattern: "",
    directoryStructure: "",
    componentTree: "",
    dataFlow: "",
  },
  roadmap: {
    phases: [],
    activePhaseId: null,
  },
  memory: {
    files: [
      { path: "memory-bank/projectbrief.md", description: "Core requirements and goals", required: true },
      { path: "memory-bank/productContext.md", description: "Why this exists and how it should work", required: true },
      { path: "memory-bank/activeContext.md", description: "Current focus and recent changes", required: true },
      { path: "memory-bank/systemPatterns.md", description: "Architecture and technical decisions", required: true },
      { path: "memory-bank/techContext.md", description: "Technologies and setup", required: true },
      { path: "memory-bank/progress.md", description: "What works and what's left", required: true },
    ],
    updateCadence: "After every session and at milestones",
    patterns: [],
  },
  agents: { agents: [] },
  quality: {
    codeStyle: "TypeScript strict mode, functional components, Tailwind classes",
    testingStrategy: "Manual review in MVP; vitest planned",
    validationRules: ["Tasks must sync bidirectionally", "Dashboard must load within 2 seconds"],
    fallbackBehavior: "Empty sections render a helpful hint instead of crashing",
  },
  options: {
    compression: false,
    orchestratorModel: "gpt-4o",
    focusChain: true,
    extraDocs: [],
  },
};

// ── PawPilot — pet care platform ────────────────
// Tests domain-aware generation for pet care / veterinary domain.
// Features: appointment scheduling, pet profiles, medical records,
// medication tracking, and vet communication.

const pawPilot: ProjectDefinition = {
  project: {
    name: "PawPilot",
    tagline: "Pet care platform for pet owners and veterinarians",
    version: "0.1.0",
    description: "A comprehensive pet care platform that connects pet owners with veterinarians. Features include appointment scheduling, pet health profiles, medical record management, medication tracking, and direct communication with vets.",
    status: "idea",
    repositoryState: "greenfield",
  },
  product: {
    targetUsers: ["Pet owners", "Veterinarians", "Pet care providers"],
    problemStatement: "Pet owners struggle to keep track of their pets' health records, appointments, and medications across multiple vet visits and providers.",
    solution: "A unified platform that centralizes pet health management with appointment scheduling, digital health records, medication reminders, and direct vet communication.",
    userStories: [
      "As a pet owner, I want to store my pet's health records in one place.",
      "As a veterinarian, I want to access a pet's medical history before an appointment.",
    ],
    mvpScope: "Pet profile creation with health records\nAppointment scheduling with calendar view\nMedication tracking with reminders\nVet communication via in-app messaging",
    mvpFeatures: [
      "Pet profile creation with health records",
      "Appointment scheduling with calendar view",
      "Medication tracking with reminders",
      "Vet communication via in-app messaging",
    ],
  },
  tech: {
    languages: ["TypeScript"],
    frameworks: ["React", "Vite", "Tailwind CSS"],
    tools: [],
    dependencies: [],
    constraints: ["Mobile-first responsive design", "HIPAA/GDPR compliant data handling"],
  },
  architecture: {
    pattern: "",
    directoryStructure: "",
    componentTree: "",
    dataFlow: "",
  },
  roadmap: {
    phases: [],
    activePhaseId: null,
  },
  memory: {
    files: [
      { path: "memory-bank/projectbrief.md", description: "Core requirements and goals", required: true },
      { path: "memory-bank/productContext.md", description: "Why this exists and how it should work", required: true },
      { path: "memory-bank/activeContext.md", description: "Current focus and recent changes", required: true },
      { path: "memory-bank/systemPatterns.md", description: "Architecture and technical decisions", required: true },
      { path: "memory-bank/techContext.md", description: "Technologies and setup", required: true },
      { path: "memory-bank/progress.md", description: "What works and what's left", required: true },
    ],
    updateCadence: "After every session and at milestones",
    patterns: [],
  },
  agents: { agents: [] },
  quality: {
    codeStyle: "TypeScript strict mode, functional components, Tailwind classes",
    testingStrategy: "Manual review in MVP; vitest planned",
    validationRules: ["Pet health data must be stored securely", "Appointment scheduling must prevent double-booking"],
    fallbackBehavior: "Empty sections render a helpful hint instead of crashing",
  },
  options: {
    compression: false,
    orchestratorModel: "gpt-4o",
    focusChain: true,
    extraDocs: [],
  },
};

// ── RetroForge — retro game emulator ────────────
// Tests domain-aware generation for emulator / retro gaming domain.
// This project specifically tests:
//   - Domain detection for "emulator" (not generic)
//   - Tech stack with C++, SDL2, OpenGL, WebAssembly
//   - Target users: retro gaming enthusiasts, emulator developers
//   - Architecture: WebAssembly-based emulation core
//   - Roadmap with emulator-specific phases (ROM loading, save states)

const retroForge: ProjectDefinition = {
  project: {
    name: "RetroForge",
    tagline: "Web-based retro game emulator for classic console experiences",
    version: "0.1.0",
    description: "A browser-based retro game emulator that supports NES, SNES, and Game Boy platforms. Features include ROM loading, save state management, controller configuration, and cheat code support. Built with WebAssembly for high-performance emulation.",
    status: "idea",
    repositoryState: "greenfield",
  },
  product: {
    targetUsers: ["Retro gaming enthusiasts", "Emulator developers", "Game preservationists"],
    problemStatement: "Retro gaming enthusiasts struggle to find modern, cross-platform emulators that work seamlessly in the browser without complex setup or dedicated hardware.",
    solution: "A web-based emulator platform that brings classic console gaming to any modern browser with save states, controller support, and a clean library management interface.",
    userStories: [
      "As a retro gamer, I want to load ROMs and play classic games in my browser.",
      "As a gamer, I want to save and load my progress at any point.",
      "As a power user, I want to configure controller mappings for different platforms.",
    ],
    mvpScope: "ROM loading and parsing for NES/SNES/Game Boy\nEmulation core with CPU, GPU, and audio\nSave state creation and loading\nController configuration UI\nROM library with grid view",
    mvpFeatures: [
      "ROM loading and parsing for NES/SNES/Game Boy",
      "Emulation core with CPU, GPU, and audio",
      "Save state creation and loading",
      "Controller configuration UI",
      "ROM library with grid view",
    ],
  },
  tech: {
    languages: ["TypeScript", "C++", "WebAssembly"],
    frameworks: ["React", "Vite", "Tailwind CSS"],
    tools: ["Emscripten", "SDL2"],
    dependencies: ["OpenGL", "IndexedDB"],
    constraints: ["WebAssembly-based emulation core", "IndexedDB for ROM and save state storage", "Offline-capable after initial load"],
  },
  architecture: {
    pattern: "",
    directoryStructure: "",
    componentTree: "",
    dataFlow: "",
    domainModel: {
      entities: [
        { name: "ROM", description: "Game ROM file for emulation" },
        { name: "SaveState", description: "Saved game state snapshot" },
        { name: "Game", description: "Retro game instance" },
        { name: "ControllerConfig", description: "Controller mapping configuration" },
        { name: "EmulatorCore", description: "Emulation core engine" },
      ],
      relationships: [],
    },
  },
  roadmap: {
    phases: [],
    activePhaseId: null,
  },
  memory: {
    files: [
      { path: "memory-bank/projectbrief.md", description: "Core requirements and goals", required: true },
      { path: "memory-bank/productContext.md", description: "Why this exists and how it should work", required: true },
      { path: "memory-bank/activeContext.md", description: "Current focus and recent changes", required: true },
      { path: "memory-bank/systemPatterns.md", description: "Architecture and technical decisions", required: true },
      { path: "memory-bank/techContext.md", description: "Technologies and setup", required: true },
      { path: "memory-bank/progress.md", description: "What works and what's left", required: true },
    ],
    updateCadence: "After every session and at milestones",
    patterns: [],
  },
  agents: { agents: [] },
  quality: {
    codeStyle: "TypeScript strict mode, C++ with modern standards",
    testingStrategy: "Unit tests for emulation core; integration tests for UI",
    validationRules: ["ROM files must be validated before loading", "Save states must be portable across sessions"],
    fallbackBehavior: "Empty sections render a helpful hint instead of crashing",
  },
  options: {
    compression: false,
    orchestratorModel: "gpt-4o",
    focusChain: true,
    extraDocs: [],
  },
};

// ── Test Projects Registry ──────────────────────

const goldenProjects: Array<{ name: string; project: ProjectDefinition }> = [
  { name: "SolarPro Lokaal", project: solarProLokaal },
  { name: "FitFlow Studio", project: fitFlowStudio },
  { name: "RestaurantFlow", project: restaurantFlow },
  { name: "CRM Pro", project: crmPro },
  { name: "Travel Planner", project: travelPlanner },
  { name: "TaskForge", project: taskForge },
  { name: "PawPilot", project: pawPilot },
  { name: "RetroForge", project: retroForge },
];


// ── Helper: build RenderModel from project ────

function buildTestRenderModel(project: ProjectDefinition) {
  const resolved = resolveProjectDefinition(JSON.parse(JSON.stringify(project)));
  return buildRenderModel(resolved);
}

// ── Snapshot Tests ──────────────────────────────

describe("Golden Test Suite — Bootstrap Prompt Generator", () => {
  for (const { name, project } of goldenProjects) {
    it(`generates bootstrap prompt for ${name}`, () => {
      const rm = buildTestRenderModel(project);
      const prompt = generateClineBootstrapPrompt(project, rm);
      expect(prompt).toBeTruthy();
      expect(prompt).toContain(project.project.name);
      expect(prompt).toContain("Cline Bootstrap");
      // Verify English output (no Dutch section headers)
      expect(prompt).toContain("Project Overview");
      expect(prompt).toContain("Goals and Scope");
      expect(prompt).toContain("Technology Stack");
      // Verify mvpFeatures are included
      if (project.product.mvpFeatures.length > 0) {
        expect(prompt).toContain("MVP features:");
        for (const feature of project.product.mvpFeatures) {
          expect(prompt).toContain(feature);
        }
      }
      // Verify repository state is included
      expect(prompt).toContain(`Repository state: ${project.project.repositoryState}`);
      // Snapshot
      expect(prompt).toMatchSnapshot(`bootstrap-prompt-${name.toLowerCase().replace(/\s+/g, "-")}`);
    });
  }
});

describe("Golden Test Suite — Documentation Generator", () => {
  for (const { name, project } of goldenProjects) {
    it(`generates documentation files for ${name}`, () => {
      const rm = buildTestRenderModel(project);
      const files = generateDocumentationFiles(project, rm);
      expect(files).toHaveLength(4);
      // Check README
      const readme = files.find((f) => f.path === "README.md");
      expect(readme).toBeDefined();
      expect(readme!.content).toContain(project.project.name);
      // Check SPEC
      const spec = files.find((f) => f.path === "SPEC.md");
      expect(spec).toBeDefined();
      expect(spec!.content).toContain(project.project.name);
      // Check PRD
      const prd = files.find((f) => f.path === "PRD.md");
      expect(prd).toBeDefined();
      expect(prd!.content).toContain(project.project.name);
      // Check roadmap
      const roadmap = files.find((f) => f.path === "roadmap.md");
      expect(roadmap).toBeDefined();
      expect(roadmap!.content).toContain(project.project.name);
      // Verify no bare "To be refined" placeholders — should have contextual fallbacks
      for (const file of files) {
        expect(file.content).not.toContain("To be refined during project review.");
      }
      // Snapshot each file
      for (const file of files) {
        const safeName = `${file.path.replace(/[\/\.]/g, "-")}-${name.toLowerCase().replace(/\s+/g, "-")}`;
        expect(file.content).toMatchSnapshot(safeName);
      }
    });
  }
});

describe("Golden Test Suite — Memory Bank Generator", () => {
  for (const { name, project } of goldenProjects) {
    it(`generates memory bank files for ${name}`, () => {
      const rm = buildTestRenderModel(project);
      const files = generateMemoryBankFiles(project, rm);
      expect(files).toHaveLength(6);
      // Check all 6 files exist
      const expectedPaths = [
        "memory-bank/projectbrief.md",
        "memory-bank/productContext.md",
        "memory-bank/activeContext.md",
        "memory-bank/systemPatterns.md",
        "memory-bank/techContext.md",
        "memory-bank/progress.md",
      ];
      for (const path of expectedPaths) {
        const file = files.find((f) => f.path === path);
        expect(file).toBeDefined();
        expect(file!.content).toContain(project.project.name);
      }
      // Verify no bare "To be refined" placeholders — should have contextual fallbacks
      for (const file of files) {
        expect(file.content).not.toContain("To be refined during project review.");
      }
      // Snapshot each file
      for (const file of files) {
        const safeName = `${file.path.replace(/[\/\.]/g, "-")}-${name.toLowerCase().replace(/\s+/g, "-")}`;
        expect(file.content).toMatchSnapshot(safeName);
      }
    });
  }
});

describe("Golden Test Suite — Normalization Pipeline", () => {
  it("normalizeArray trims and deduplicates case-insensitively", () => {
    const result = normalizeArray([" TypeScript ", "typescript", "  React  ", "react"]);
    expect(result).toEqual(["React", "TypeScript"]);
  });

  it("normalizeArray sorts alphabetically", () => {
    const result = normalizeArray(["Z", "A", "M"]);
    expect(result).toEqual(["A", "M", "Z"]);
  });

  it("normalizeArray handles empty input", () => {
    expect(normalizeArray([])).toEqual([]);
    expect(normalizeArray(["", "  "])).toEqual([]);
  });

  it("normalizeString fixes AI capitalization", () => {
    expect(normalizeString("ai powered tool")).toBe("AI powered tool");
    expect(normalizeString("an ai model")).toBe("an AI model");
  });

  it("normalizeString trims and collapses spaces", () => {
    expect(normalizeString("  hello   world  ")).toBe("hello world");
  });
});

describe("Golden Test Suite — Edge Cases", () => {
  it("handles empty project definition gracefully", () => {
    const empty: ProjectDefinition = {
      project: { name: "", tagline: "", version: "0.1.0", description: "", status: "idea", repositoryState: "greenfield" },
      product: { targetUsers: [], problemStatement: "", solution: "", userStories: [], mvpScope: "", mvpFeatures: [] },
      tech: { languages: [], frameworks: [], tools: [], dependencies: [], constraints: [] },
      architecture: { pattern: "", directoryStructure: "", componentTree: "", dataFlow: "" },
      roadmap: { phases: [], activePhaseId: null },
      memory: { files: [], updateCadence: "", patterns: [] },
      agents: { agents: [] },
      quality: { codeStyle: "", testingStrategy: "", validationRules: [], fallbackBehavior: "" },
      options: { compression: false, orchestratorModel: "", focusChain: false, extraDocs: [] },
    };
    // Should not crash
    const rm = buildTestRenderModel(empty);
    const prompt = generateClineBootstrapPrompt(empty, rm);
    expect(prompt).toBeTruthy();
    const docs = generateDocumentationFiles(empty, rm);
    expect(docs).toHaveLength(4);
    const mem = generateMemoryBankFiles(empty, rm);
    expect(mem).toHaveLength(6);
  });

  it("handles missing mvpFeatures (backward compatible with mvpScope)", () => {
    const project: ProjectDefinition = {
      ...solarProLokaal,
      product: {
        ...solarProLokaal.product,
        mvpFeatures: [], // empty mvpFeatures, but mvpScope is set
      },
    };
    const rm = buildTestRenderModel(project);
    const prompt = generateClineBootstrapPrompt(project, rm);
    // Should fall back to mvpScope
    expect(prompt).toContain("MVP scope:");
    expect(prompt).toContain("Offerte maken met template");
  });

  it("handles all fields empty gracefully", () => {
    const minimal: ProjectDefinition = {
      project: { name: "Test", tagline: "", version: "0.1.0", description: "", status: "idea", repositoryState: "greenfield" },
      product: { targetUsers: [], problemStatement: "", solution: "", userStories: [], mvpScope: "", mvpFeatures: [] },
      tech: { languages: [], frameworks: [], tools: [], dependencies: [], constraints: [] },
      architecture: { pattern: "", directoryStructure: "", componentTree: "", dataFlow: "" },
      roadmap: { phases: [], activePhaseId: null },
      memory: { files: [], updateCadence: "", patterns: [] },
      agents: { agents: [] },
      quality: { codeStyle: "", testingStrategy: "", validationRules: [], fallbackBehavior: "" },
      options: { compression: false, orchestratorModel: "", focusChain: false, extraDocs: [] },
    };
    const rm = buildTestRenderModel(minimal);
    const prompt = generateClineBootstrapPrompt(minimal, rm);
    expect(prompt).toContain("Test");
    const docs = generateDocumentationFiles(minimal, rm);
    for (const doc of docs) {
      expect(doc.content).toContain("Test");
    }
  });
});

// ── Resolver Tests ──────────────────────────────

describe("Golden Test Suite — ProjectDefinition Resolver", () => {
  it("is idempotent: resolve(resolve(pd)) == resolve(pd)", () => {
    const pd = JSON.parse(JSON.stringify(taskForge));
    const once = resolveProjectDefinition(pd);
    const twice = resolveProjectDefinition(JSON.parse(JSON.stringify(once)));
    // Compare key fields that should be idempotent
    expect(once.architecture.pattern).toBe(twice.architecture.pattern);
    expect(once.architecture.domainModel?.entities.length).toBe(twice.architecture.domainModel?.entities.length);
    expect(once.roadmap.phases.length).toBe(twice.roadmap.phases.length);
    expect(once.product.userStories.length).toBe(twice.product.userStories.length);
  });

  it("unknown domain gets minimal entities (User, Organization)", () => {
    const pd = JSON.parse(JSON.stringify(taskForge));
    // Remove any domain model to trigger minimal fallback
    pd.architecture.domainModel = { entities: [], relationships: [] };
    const resolved = resolveProjectDefinition(pd);
    const entityNames = resolved.architecture.domainModel?.entities.map((e: { name: string }) => e.name) || [];
    expect(entityNames).toContain("User");
    expect(entityNames).toContain("Organization");
    // Should NOT contain PM entities
    expect(entityNames).not.toContain("Project");
    expect(entityNames).not.toContain("Task");
    expect(entityNames).not.toContain("Board");
  });

  it("preserves all tech items (no information loss)", () => {
    const pd = JSON.parse(JSON.stringify(retroForge));
    const resolved = resolveProjectDefinition(pd);
    const allResolved = [
      ...resolved.tech.languages,
      ...resolved.tech.frameworks,
      ...resolved.tech.tools,
      ...resolved.tech.dependencies,
    ];
    // All original items should be present
    for (const item of [...retroForge.tech.languages, ...retroForge.tech.frameworks, ...retroForge.tech.tools, ...retroForge.tech.dependencies]) {
      expect(allResolved).toContain(item);
    }
  });

  it("does not overwrite existing user data", () => {
    const pd = JSON.parse(JSON.stringify(solarProLokaal));
    const originalPattern = pd.architecture.pattern;
    const resolved = resolveProjectDefinition(pd);
    // Pattern should remain unchanged (user set it)
    expect(resolved.architecture.pattern).toBe(originalPattern);
  });
});

// ── Validator Tests ─────────────────────────────

describe("Golden Test Suite — ProjectDefinition Validator", () => {
  it("validates a complete project definition", () => {
    const pd = JSON.parse(JSON.stringify(solarProLokaal));
    const resolved = resolveProjectDefinition(pd);
    const result = validateProjectDefinition(resolved);
    // Should have no errors (warnings/info are OK)
    expect(result.errors.length).toBe(0);
  });

  it("detects missing project name as error", () => {
    const pd = JSON.parse(JSON.stringify(solarProLokaal));
    pd.project.name = "";
    const resolved = resolveProjectDefinition(pd);
    const result = validateProjectDefinition(resolved);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.field === "project.name")).toBe(true);
  });

  it("detects contradictory frameworks", () => {
    const pd = JSON.parse(JSON.stringify(solarProLokaal));
    pd.tech.frameworks = ["React", "Vue"];
    const resolved = resolveProjectDefinition(pd);
    const result = validateProjectDefinition(resolved);
    expect(result.warnings.some((w) => w.category === "Stack")).toBe(true);
  });
});

// ── Domain Consistency Tests ────────────────────

describe("Golden Test Suite — Domain Consistency", () => {
  it("generated files contain domain keywords for RetroForge (emulator)", () => {
    const pd = JSON.parse(JSON.stringify(retroForge));
    const resolved = resolveProjectDefinition(pd);
    const rm = buildRenderModel(resolved);
    const files = generateClinerulesFiles(resolved, rm);
    const result = validateDomainConsistency(files, rm);
    // Should find domain keywords in generated files
    expect(result.issues.length).toBeGreaterThan(0);
    // At least some files should have domain keywords
    const filesWithKeywords = result.issues.filter((i) => i.severity === "info");
    expect(filesWithKeywords.length).toBeGreaterThan(0);
  });

  it("generated files contain domain keywords for SolarPro (solar-energy)", () => {
    const pd = JSON.parse(JSON.stringify(solarProLokaal));
    const resolved = resolveProjectDefinition(pd);
    const rm = buildRenderModel(resolved);
    const files = generateClinerulesFiles(resolved, rm);
    const result = validateDomainConsistency(files, rm);
    // Should find domain keywords in generated files
    const filesWithKeywords = result.issues.filter((i) => i.severity === "info");
    expect(filesWithKeywords.length).toBeGreaterThan(0);
  });
});
