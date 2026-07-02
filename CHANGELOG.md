# Changelog

All notable changes to VibeForge are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.1] — 2026-07-02

### Added
- Guided Tour system with BioBatch Sentinel demo scenario
- 5-step interactive tour (Welcome → Describe → Interview → Summary → Completion)
- Demo playback engine with typing simulation and step tooltips
- `GuidedTourProvider`, `TourStep`, `TourProgress`, `TourHighlight` components
- `WelcomeCard` and `CompletionCard` for tour entry/exit
- `src/demo/biobatchSentinel.ts` — complete 11-step scripted interview
- `src/demo/types.ts` — DemoScenario, DemoInterviewStep, DemoStepTooltip types
- `src/fixtures/exampleProjects.ts` — 4 example project cards on landing page
- `src/components/LandingPage.tsx` — premium landing page with AI workspace cards
- `src/components/JsonImportModal.tsx` — JSON import for project definitions
- `src/lib/projectDefinitionParser.ts` — JSON parsing with validation
- `src/lib/projectDefinitionDiff.ts` — diff utility for project definitions
- `src/lib/previewFactory.ts` — preview generation for generated files
- `src/lib/zipExporter.ts` — ZIP export for generated project packages
- `src/lib/clipboard.ts` — clipboard utilities
- `src/lib/download.ts` — file download utilities
- `src/lib/schemaPrompt.ts` — schema-based prompt generation
- `src/lib/aiPromptTemplate.ts` — AI prompt templating
- `src/lib/requirementsToProjectDefinition.ts` — requirements-to-definition mapping
- `src/hooks/useWorkspaceAdapters.ts` — workspace adapter hooks
- `src/hooks/useArchitectTrigger.ts` — architect trigger hook
- `src/hooks/useAISettings.ts` — AI settings hook
- `src/hooks/useArchitectAnalysis.ts` — architect analysis hook
- `src/hooks/useArchitectureAnalysis.ts` — architecture analysis hook
- `src/hooks/useConversationMemory.ts` — conversation memory hook
- `src/hooks/useInterview.ts` — interview hook
- `src/hooks/useWorkspace.ts` — workspace hook
- `src/components/ArchitectureCard.tsx` — architecture insight card
- `src/components/ArchitectureInsightsStep.tsx` — architecture review step
- `src/components/ChatArea.tsx` — chat UI for interview
- `src/components/ChatMessage.tsx` — chat message component
- `src/components/ConfidenceBar.tsx` — confidence visualization
- `src/components/CreateStep.tsx` — project creation step
- `src/components/Dashboard.tsx` — project dashboard
- `src/components/DebugPanel.tsx` — debug panel
- `src/components/DeveloperTools.tsx` — developer tools
- `src/components/ExecutionPipeline.tsx` — execution pipeline UI
- `src/components/ExportSection.tsx` — export section
- `src/components/ExportStep.tsx` — export step
- `src/components/GeneralSettings.tsx` — general settings modal
- `src/components/GeneratedFilesPreview.tsx` — file preview component
- `src/components/GenerateStep.tsx` — generation step
- `src/components/IdeaSection.tsx` — idea input section
- `src/components/InterviewStep.tsx` — interview step
- `src/components/JsonSection.tsx` — JSON display section
- `src/components/ProgressPanel.tsx` — progress panel
- `src/components/ProjectDefinitionDiffPanel.tsx` — diff panel
- `src/components/ProjectStrengths.tsx` — project strengths display
- `src/components/ReviewSection.tsx` — review section
- `src/components/ReviewStep.tsx` — review step
- `src/components/RoadmapEditor.tsx` — roadmap editor
- `src/components/StepIndicator.tsx` — step indicator
- `src/components/SummaryStep.tsx` — summary step
- `src/components/TypingIndicator.tsx` — typing animation
- `src/components/UnderstandingPanel.tsx` — understanding panel
- `src/components/WizardHeader.tsx` — wizard header
- `src/components/form/ArrayEditor.tsx` — array form editor
- `src/components/form/TextArea.tsx` — text area form component
- `src/components/form/TextInput.tsx` — text input form component
- `src/ai/providers/AnthropicProvider.ts` — Anthropic Claude integration
- `src/ai/providers/DeepSeekProvider.ts` — DeepSeek integration
- `src/ai/providers/GoogleProvider.ts` — Google AI integration
- `src/ai/providers/LocalAIProvider.ts` — Local AI integration
- `src/ai/providers/MockProvider.ts` — Mock provider for testing
- `src/ai/providers/OpenAIProvider.ts` — OpenAI integration
- `src/ai/providers/OpenRouterProvider.ts` — OpenRouter integration
- `src/ai/AIProvider.ts` — AI provider abstraction
- `src/ai/AIService.ts` — AI service layer
- `src/ai/capabilities.ts` — provider capability definitions
- `src/ai/provider-config.ts` — provider configuration
- `src/ai/settings.ts` — AI settings management
- `src/ai/architect/ArchitectAgent.ts` — AI architect agent
- `src/ai/architect/architectPrompts.ts` — architect prompts
- `src/ai/architect/architectSession.ts` — architect session management
- `src/ai/architect/architectTypes.ts` — architect types
- `src/ai/architect/index.ts` — architect barrel export
- `src/ai/execution/executionTypes.ts` — execution types
- `src/ai/gateway/DefaultGateway.ts` — default AI gateway
- `src/ai/gateway/index.ts` — gateway barrel export
- `src/ai/interview/InterviewAgent.ts` — AI interview agent
- `src/ai/interview/interviewAgentTypes.ts` — interview agent types
- `src/ai/interview/interviewPrompts.ts` — interview prompts
- `src/ai/interview/interviewSession.ts` — interview session management
- `src/ai/interview/index.ts` — interview barrel export
- `src/generator/aiFallback.ts` — AI fallback generation
- `src/generator/aiGenerator.ts` — AI-powered generation
- `src/generator/aiValidator.ts` — AI validation
- `src/generator/confidenceMerge.ts` — confidence score merging
- `src/generator/confidencePolicy.ts` — confidence policy
- `src/generator/confidenceTypes.ts` — confidence types
- `src/generator/consistencyValidator.ts` — domain consistency validation
- `src/generator/deterministicGenerator.ts` — deterministic generation
- `src/generator/generatorTypes.ts` — generator types
- `src/generator/index.ts` — generator barrel export
- `src/generator/normalizationLayer.ts` — normalization layer
- `src/generator/projectDefinitionValidator.ts` — project definition validation
- `src/generator/promptBlockRegistry.ts` — prompt block registry
- `src/generator/promptBuilder.ts` — prompt builder
- `src/generator/promptVersions.ts` — prompt versioning
- `src/generator/renderModel.ts` — render model
- `src/generator/resolutionPipeline.ts` — resolution pipeline
- `src/generator/promptBlocks/` — 8 prompt block modules
- `src/canonical/` — canonical data model (8 files)
- `src/intelligence/` — domain classification (6 files + tests)
- `src/orchestrator/` — interview orchestration (13 files)
- `src/models/` — data models (5 files)
- `src/types/` — TypeScript types (2 files)
- `src/lib/architectureInsights.ts` — architecture insights
- `src/lib/bootstrapPromptGenerator.ts` — bootstrap prompt generation
- `src/lib/clinerulesGenerator.ts` — Cline rules generation
- `src/lib/conversationMemoryStorage.ts` — conversation memory persistence
- `src/lib/docsGenerator.ts` — documentation generation
- `src/lib/memoryBankGenerator.ts` — Memory Bank generation
- `src/lib/normalize.ts` — normalization utilities
- `src/lib/projectRequirementsStorage.ts` — requirements persistence
- `src/lib/storage.ts` — localStorage wrapper
- `src/lib/themeSettings.ts` — theme persistence
- `src/lib/workspaceStorage.ts` — workspace state persistence
- `src/diagnostic/pipelineTest.ts` — pipeline diagnostic
- `src/diagnostic/runtimeFlowTest.ts` — runtime flow diagnostic
- `src/__tests__/golden-test-suite.test.ts` — 8 golden test projects
- `src/__tests__/architect-prompt.test.ts` — architect prompt tests
- `src/__tests__/consistency-validator.test.ts` — consistency validator tests
- `src/__tests__/pipeline-verification.test.ts` — pipeline verification tests
- `src/__tests__/__snapshots__/golden-test-suite.test.ts.snap` — test snapshots
- `src/intelligence/__tests__/intelligence.test.ts` — intelligence tests
- `src/assets/brand/` — 9 brand SVG assets (lockups, marks, wordmarks)
- `src/assets/hero.png` — hero image
- `public/favicon/` — 10 favicon variants
- `public/icons.svg` — icons sprite
- `.oxlintrc.json` — Oxlint configuration

### Changed
- Upgraded to React ^19.2.7
- Upgraded to Vite ^8.1.0
- Upgraded to TypeScript ~6.0.2
- Upgraded to Tailwind CSS ^4.3.1
- Upgraded to Vitest ^4.1.9
- Upgraded to Oxlint ^1.69.0
- Replaced ESLint/Prettier with Oxlint
- Migrated from CSS modules to Tailwind CSS v4 with CSS variables
- Replaced custom build system with Vite 8
- Refactored generator to use deterministic + AI fallback pipeline
- Refactored interview system to use state machine pattern
- Refactored domain classification to weighted keyword scoring
- Refactored storage to modular per-type persistence
- Updated tsconfig for TypeScript 6.0 compatibility
- Updated vite.config.ts with Tailwind CSS plugin
- Updated vitest.config.ts for Vitest 4.x

### Removed
- ESLint configuration and dependencies
- Prettier configuration and dependencies
- CSS modules and legacy stylesheets
- Custom build scripts (replaced by Vite)
- Legacy generator code (replaced by pipeline architecture)

---

## [0.2.0] — 2026-06-15

### Added
- Central generation pipeline: resolveProjectDefinition() → buildRenderModel() → generators
- Project definition resolver with canonical data model
- Render model for type-safe template rendering
- Project definition validator with comprehensive rules
- Domain consistency validator
- Normalization layer for array and string fields
- 8 golden test projects with snapshot regression testing
- SolarPro Lokaal, FitFlow Studio, RestaurantFlow, CRM Pro
- Travel Planner, TaskForge, PawPilot, RetroForge
- Bootstrap prompt generator
- Documentation generator (README, PRD, SPEC)
- Memory Bank generator
- Cline rules generator
- Architecture analysis model and storage
- Conversation memory model and storage
- Project requirements model and storage
- Workspace state model and storage
- Theme settings with dark/light mode persistence
- CSS variable-based design system
- 6-step wizard (Describe → Interview → Architecture → Summary → Generate → Export)
- AI provider abstraction layer
- Deterministic domain template generation
- Semantic domain classification with keyword scoring
- localStorage persistence layer

### Changed
- Complete architecture rewrite from v0.1.0
- Migrated from plain HTML/JS to React + TypeScript + Vite
- Replaced simple form with multi-step wizard

---

## [0.1.0] — 2026-05-20

### Added
- Initial prototype with basic project idea input form
- Simple project definition output
- Basic domain template support
- Proof-of-concept implementation
