// ──────────────────────────────────────────────
// ReviewStep — Step 2: Review your project definition
// Tabbed interface with collapsible sections
// ──────────────────────────────────────────────

import { useState } from "react";
import type { ProjectDefinition } from "../types/projectDefinition";
import TextInput from "./form/TextInput";
import TextArea from "./form/TextArea";
import ArrayEditor from "./form/ArrayEditor";
import RoadmapEditor from "./RoadmapEditor";
import ProjectDefinitionDiffPanel from "./ProjectDefinitionDiffPanel";

interface Props {
  projectDefinition: ProjectDefinition;
  onUpdate: (partial: Partial<ProjectDefinition>) => void;
  onBack: () => void;
  onContinue: () => void;
}

type ReviewTab = "project" | "product" | "tech" | "architecture" | "quality" | "roadmap";

const TABS: { id: ReviewTab; label: string; icon: string }[] = [
  { id: "project", label: "Project", icon: "📋" },
  { id: "product", label: "Product", icon: "🎯" },
  { id: "tech", label: "Tech", icon: "⚙️" },
  { id: "architecture", label: "Architecture", icon: "🏗" },
  { id: "quality", label: "Quality", icon: "✅" },
  { id: "roadmap", label: "Roadmap", icon: "🗺" },
];

export default function ReviewStep({ projectDefinition, onUpdate, onBack, onContinue }: Props) {
  const [activeTab, setActiveTab] = useState<ReviewTab>("project");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { project, product, tech, architecture, quality, roadmap } = projectDefinition;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-app">Review your project definition</h2>
        <p className="text-sm text-muted mt-1">
          Review and refine each section before generating your project files.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-app mb-6">
        <nav className="flex gap-1 overflow-x-auto -mb-px">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                  border-b-2 transition-all duration-200
                  ${isActive
                    ? "border-brand text-brand-soft"
                    : "border-transparent text-muted hover:text-secondary hover:border-app"
                  }
                `}
              >
                <span className="text-base">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === "project" && (
          <CollapsibleSection title="Project" description="Core project identity" defaultOpen={true}>
            <div className="space-y-4">
              <TextInput label="Name" value={project.name} onChange={(v) => onUpdate({ project: { ...project, name: v } })} />
              <TextInput label="Tagline" value={project.tagline} onChange={(v) => onUpdate({ project: { ...project, tagline: v } })} />
              <TextInput label="Version" value={project.version} onChange={(v) => onUpdate({ project: { ...project, version: v } })} />
              <TextArea label="Description" value={project.description} onChange={(v) => onUpdate({ project: { ...project, description: v } })} rows={4} />
              <div>
                <label className="block text-xs font-medium text-muted mb-1 uppercase tracking-wider">Status</label>
                <select
                  className="input"
                  value={project.status}
                  onChange={(e) => onUpdate({ project: { ...project, status: e.target.value as ProjectDefinition["project"]["status"] } })}
                >
                  <option value="idea">Idea</option>
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="bootstrapped">Bootstrapped</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1 uppercase tracking-wider">Repository State</label>
                <select
                  className="input"
                  value={project.repositoryState}
                  onChange={(e) => onUpdate({ project: { ...project, repositoryState: e.target.value as ProjectDefinition["project"]["repositoryState"] } })}
                >
                  <option value="greenfield">🆕 Greenfield (new project)</option>
                  <option value="empty-repository">📂 Empty repository</option>
                  <option value="existing-project">📦 Existing project</option>
                </select>
              </div>
            </div>
          </CollapsibleSection>
        )}

        {activeTab === "product" && (
          <CollapsibleSection title="Product" description="Target users, problem, and solution" defaultOpen={true}>
            <div className="space-y-4">
              <ArrayEditor label="Target Users" values={product.targetUsers} onChange={(v) => onUpdate({ product: { ...product, targetUsers: v } })} />
              <TextArea label="Problem Statement" value={product.problemStatement} onChange={(v) => onUpdate({ product: { ...product, problemStatement: v } })} rows={3} />
              <TextArea label="Solution" value={product.solution} onChange={(v) => onUpdate({ product: { ...product, solution: v } })} rows={3} />
              <ArrayEditor label="User Stories" values={product.userStories} onChange={(v) => onUpdate({ product: { ...product, userStories: v } })} placeholder="Add user story..." />
              <TextArea label="MVP Scope" value={product.mvpScope} onChange={(v) => onUpdate({ product: { ...product, mvpScope: v } })} rows={3} />
            </div>
          </CollapsibleSection>
        )}

        {activeTab === "tech" && (
          <CollapsibleSection title="Tech Stack" description="Languages, frameworks, tools, and constraints" defaultOpen={true}>
            <div className="space-y-4">
              <ArrayEditor label="Languages" values={tech.languages} onChange={(v) => onUpdate({ tech: { ...tech, languages: v } })} />
              <ArrayEditor label="Frameworks" values={tech.frameworks} onChange={(v) => onUpdate({ tech: { ...tech, frameworks: v } })} />
              <ArrayEditor label="Tools" values={tech.tools} onChange={(v) => onUpdate({ tech: { ...tech, tools: v } })} />
              <ArrayEditor label="Dependencies" values={tech.dependencies} onChange={(v) => onUpdate({ tech: { ...tech, dependencies: v } })} />
              <ArrayEditor label="Constraints" values={tech.constraints} onChange={(v) => onUpdate({ tech: { ...tech, constraints: v } })} />
            </div>
          </CollapsibleSection>
        )}

        {activeTab === "architecture" && (
          <CollapsibleSection title="Architecture" description="Pattern, structure, and data flow" defaultOpen={true}>
            <div className="space-y-4">
              <TextInput label="Pattern" value={architecture.pattern} onChange={(v) => onUpdate({ architecture: { ...architecture, pattern: v } })} />
              <TextArea label="Directory Structure" value={architecture.directoryStructure} onChange={(v) => onUpdate({ architecture: { ...architecture, directoryStructure: v } })} rows={4} />
              <TextArea label="Component Tree" value={architecture.componentTree} onChange={(v) => onUpdate({ architecture: { ...architecture, componentTree: v } })} rows={4} />
              <TextArea label="Data Flow" value={architecture.dataFlow} onChange={(v) => onUpdate({ architecture: { ...architecture, dataFlow: v } })} rows={4} />
            </div>
          </CollapsibleSection>
        )}

        {activeTab === "quality" && (
          <CollapsibleSection title="Quality" description="Code style, testing, and validation rules" defaultOpen={true}>
            <div className="space-y-4">
              <TextArea label="Code Style" value={quality.codeStyle} onChange={(v) => onUpdate({ quality: { ...quality, codeStyle: v } })} rows={2} />
              <TextArea label="Testing Strategy" value={quality.testingStrategy} onChange={(v) => onUpdate({ quality: { ...quality, testingStrategy: v } })} rows={2} />
              <ArrayEditor label="Validation Rules" values={quality.validationRules} onChange={(v) => onUpdate({ quality: { ...quality, validationRules: v } })} placeholder="Add validation rule..." />
              <TextArea label="Fallback Behavior" value={quality.fallbackBehavior} onChange={(v) => onUpdate({ quality: { ...quality, fallbackBehavior: v } })} rows={2} />
            </div>
          </CollapsibleSection>
        )}

        {activeTab === "roadmap" && (
          <CollapsibleSection title="Roadmap" description="Phases, tasks, and progress tracking" defaultOpen={true}>
            <RoadmapEditor roadmap={roadmap} onUpdate={(partial) => onUpdate(partial)} />
          </CollapsibleSection>
        )}
      </div>

      {/* Advanced: Diff + Memory/Agents/Options */}
      <div className="mt-8 pt-6 border-t border-app">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-muted hover:text-secondary transition-colors flex items-center gap-1.5"
        >
          <svg className={`w-3 h-3 transition-transform ${showAdvanced ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Advanced {showAdvanced ? "▲" : "▼"}
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-6">
            {/* Memory, Agents, Options — read-only summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface/40 border border-app rounded-xl p-4">
                <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">🧠 Memory Bank</h4>
                <p className="text-xs text-muted">{projectDefinition.memory.files.length} files · {projectDefinition.memory.updateCadence}</p>
              </div>
              <div className="bg-surface/40 border border-app rounded-xl p-4">
                <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">🤖 Agents</h4>
                <p className="text-xs text-muted">{projectDefinition.agents.agents.length} agents configured</p>
              </div>
              <div className="bg-surface/40 border border-app rounded-xl p-4">
                <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">⚙️ Options</h4>
                <p className="text-xs text-muted">Compression: {projectDefinition.options.compression ? "ON" : "OFF"} · Focus Chain: {projectDefinition.options.focusChain ? "ON" : "OFF"}</p>
              </div>
            </div>

            {/* Diff Panel */}
            <ProjectDefinitionDiffPanel projectDefinition={projectDefinition} />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="btn-secondary text-sm px-5 py-2.5 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Summary
        </button>
        <button
          onClick={onContinue}
          className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2"
        >
          Continue to Generate
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Collapsible Section ──────────────────────

function CollapsibleSection({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-surface/50 border border-app rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface/30 transition-colors text-left"
      >
        <div>
          <h3 className="text-base font-semibold text-app">{title}</h3>
          <p className="text-xs text-muted mt-0.5">{description}</p>
        </div>
        <svg
          className={`w-4 h-4 text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-app pt-4">
          {children}
        </div>
      )}
    </div>
  );
}
