import type { ProjectDefinition } from '../types/projectDefinition'
import TextInput from './form/TextInput'
import TextArea from './form/TextArea'
import ArrayEditor from './form/ArrayEditor'
import RoadmapEditor from './RoadmapEditor'

interface Props {
  projectDefinition: ProjectDefinition
  onUpdate: (partial: Partial<ProjectDefinition>) => void
}

export default function ReviewSection({ projectDefinition, onUpdate }: Props) {
  const { project, product, tech, architecture, quality, roadmap } = projectDefinition


  return (
    <div className="space-y-6">
      {/* ── Project Card ─────────────────────────── */}
      <Section title="Project" description="Core project identity">
        <div className="space-y-3">
          <TextInput
            label="Name"
            value={project.name}
            onChange={(v) => onUpdate({ project: { ...project, name: v } })}
          />
          <TextInput
            label="Tagline"
            value={project.tagline}
            onChange={(v) => onUpdate({ project: { ...project, tagline: v } })}
          />
          <TextInput
            label="Version"
            value={project.version}
            onChange={(v) => onUpdate({ project: { ...project, version: v } })}
          />
          <TextArea
            label="Description"
            value={project.description}
            onChange={(v) => onUpdate({ project: { ...project, description: v } })}
            rows={4}
          />
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
              Status
            </label>
            <select
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={project.status}
              onChange={(e) =>
                onUpdate({
                  project: { ...project, status: e.target.value as ProjectDefinition['project']['status'] },
                })
              }
            >
              <option value="idea">Idea</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="bootstrapped">Bootstrapped</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
              Repository State
            </label>
            <select
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={project.repositoryState}
              onChange={(e) =>
                onUpdate({
                  project: { ...project, repositoryState: e.target.value as ProjectDefinition['project']['repositoryState'] },
                })
              }
            >
              <option value="greenfield">🆕 Greenfield (new project)</option>
              <option value="empty-repository">📂 Empty repository</option>
              <option value="existing-project">📦 Existing project</option>
            </select>
          </div>

        </div>
      </Section>

      {/* ── Product Card ─────────────────────────── */}
      <Section title="Product" description="Target users, problem, and solution">
        <div className="space-y-3">
          <ArrayEditor
            label="Target Users"
            values={product.targetUsers}
            onChange={(v) => onUpdate({ product: { ...product, targetUsers: v } })}
          />
          <TextArea
            label="Problem Statement"
            value={product.problemStatement}
            onChange={(v) => onUpdate({ product: { ...product, problemStatement: v } })}
            rows={3}
          />
          <TextArea
            label="Solution"
            value={product.solution}
            onChange={(v) => onUpdate({ product: { ...product, solution: v } })}
            rows={3}
          />
          <ArrayEditor
            label="User Stories"
            values={product.userStories}
            onChange={(v) => onUpdate({ product: { ...product, userStories: v } })}
            placeholder="Add user story..."
          />
          <TextArea
            label="MVP Scope"
            value={product.mvpScope}
            onChange={(v) => onUpdate({ product: { ...product, mvpScope: v } })}
            rows={3}
          />
        </div>
      </Section>

      {/* ── Stack Card ───────────────────────────── */}
      <Section title="Tech Stack" description="Languages, frameworks, tools, and constraints">
        <div className="space-y-3">
          <ArrayEditor
            label="Languages"
            values={tech.languages}
            onChange={(v) => onUpdate({ tech: { ...tech, languages: v } })}
          />
          <ArrayEditor
            label="Frameworks"
            values={tech.frameworks}
            onChange={(v) => onUpdate({ tech: { ...tech, frameworks: v } })}
          />
          <ArrayEditor
            label="Tools"
            values={tech.tools}
            onChange={(v) => onUpdate({ tech: { ...tech, tools: v } })}
          />
          <ArrayEditor
            label="Dependencies"
            values={tech.dependencies}
            onChange={(v) => onUpdate({ tech: { ...tech, dependencies: v } })}
          />
          <ArrayEditor
            label="Constraints"
            values={tech.constraints}
            onChange={(v) => onUpdate({ tech: { ...tech, constraints: v } })}
          />
        </div>
      </Section>

      {/* ── Architecture Card ────────────────────── */}
      <Section title="Architecture" description="Pattern, structure, and data flow">
        <div className="space-y-3">
          <TextInput
            label="Pattern"
            value={architecture.pattern}
            onChange={(v) => onUpdate({ architecture: { ...architecture, pattern: v } })}
          />
          <TextArea
            label="Directory Structure"
            value={architecture.directoryStructure}
            onChange={(v) => onUpdate({ architecture: { ...architecture, directoryStructure: v } })}
            rows={4}
          />
          <TextArea
            label="Component Tree"
            value={architecture.componentTree}
            onChange={(v) => onUpdate({ architecture: { ...architecture, componentTree: v } })}
            rows={4}
          />
          <TextArea
            label="Data Flow"
            value={architecture.dataFlow}
            onChange={(v) => onUpdate({ architecture: { ...architecture, dataFlow: v } })}
            rows={4}
          />
        </div>
      </Section>

      {/* ── Quality Card ─────────────────────────── */}
      <Section title="Quality" description="Code style, testing, and validation rules">
        <div className="space-y-3">
          <TextArea
            label="Code Style"
            value={quality.codeStyle}
            onChange={(v) => onUpdate({ quality: { ...quality, codeStyle: v } })}
            rows={2}
          />
          <TextArea
            label="Testing Strategy"
            value={quality.testingStrategy}
            onChange={(v) => onUpdate({ quality: { ...quality, testingStrategy: v } })}
            rows={2}
          />
          <ArrayEditor
            label="Validation Rules"
            values={quality.validationRules}
            onChange={(v) => onUpdate({ quality: { ...quality, validationRules: v } })}
            placeholder="Add validation rule..."
          />
          <TextArea
            label="Fallback Behavior"
            value={quality.fallbackBehavior}
            onChange={(v) => onUpdate({ quality: { ...quality, fallbackBehavior: v } })}
            rows={2}
          />
        </div>
      </Section>

      {/* ── Roadmap Card ─────────────────────────── */}
      <Section title="Roadmap" description="Phases, tasks, and progress tracking">
        <RoadmapEditor
          roadmap={roadmap}
          onUpdate={(partial) => onUpdate(partial)}
        />
      </Section>
    </div>

  )
}

// ── Shared UI components ──────────────────────────

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      {children}
    </div>
  )
}
