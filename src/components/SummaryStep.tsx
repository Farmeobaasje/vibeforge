// ──────────────────────────────────────────────
// SummaryStep — Step 4: Project Overview
// Executive review before generating the project package.
//
// Design principles:
//   - One screen + minimal scroll
//   - Highly scannable — understand the project in 30 seconds
//   - Details are available but never forced (expandable)
//   - Every section answers one question
// ──────────────────────────────────────────────

import { useState, useMemo } from "react";
import type { ProjectDefinition } from "../types/projectDefinition";
import ReviewStep from "./ReviewStep";

interface Props {
  projectDefinition: ProjectDefinition;
  onUpdate: (partial: Partial<ProjectDefinition>) => void;
  onBack: () => void;
  onContinue: () => void;
}

// ── Helpers ──────────────────────────────────

function repoIcon(state: string): string {
  switch (state) {
    case "greenfield": return "🆕";
    case "empty-repository": return "📂";
    case "existing-project": return "📦";
    default: return "📄";
  }
}

function repoLabel(state: string): string {
  switch (state) {
    case "greenfield": return "Greenfield";
    case "empty-repository": return "Empty repository";
    case "existing-project": return "Existing project";
    default: return state;
  }
}

function statusBadge(status: string): { label: string; color: string } {
  switch (status) {
    case "idea": return { label: "Idea", color: "bg-warning/10 text-warning border-warning/30" };
    case "draft": return { label: "Draft", color: "bg-info/10 text-info border-info/30" };
    case "ready": return { label: "Ready", color: "bg-success/10 text-success border-success/30" };
    case "bootstrapped": return { label: "Bootstrapped", color: "bg-brand/10 text-brand-soft border-brand/30" };
    default: return { label: status, color: "bg-elevated text-muted border-app" };
  }
}

function countPhases(roadmap: ProjectDefinition["roadmap"]): number {
  return roadmap.phases.length;
}

function countTasks(roadmap: ProjectDefinition["roadmap"]): number {
  return roadmap.phases.reduce((sum, p) => sum + p.tasks.length, 0);
}

function countGeneratedFiles(): number {
  return 8; // README, PRD, SPEC, Memory Bank (6), Roadmap, .clinerules, Bootstrap, AGENTS.md
}

function formatTimeAgo(date: Date | null): string {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ── Main Component ───────────────────────────

export default function SummaryStep({ projectDefinition, onUpdate, onBack, onContinue }: Props) {
  const [showEditor, setShowEditor] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState(false);
  const [expandedArchitecture, setExpandedArchitecture] = useState(false);
  const { project, product, tech, architecture, roadmap } = projectDefinition;

  const hasData = !!(project.name && project.name !== "My Project");

  // Readiness checklist
  const readiness = useMemo(() => ({
    projectDefined: hasData,
    architectureReviewed: architecture.pattern.trim().length > 0,
    technologySelected: tech.languages.length > 0 || tech.frameworks.length > 0,
    documentationReady: true, // always ready — generator handles this
  }), [hasData, architecture.pattern, tech.languages, tech.frameworks]);

  // Categorized tech for GitHub-style display
  const categorizedTech = useMemo(() => {
    const cats: Record<string, string[]> = {};
    const bucketMap: Record<string, string> = {
      // Frontend
      "react": "Frontend", "vue": "Frontend", "angular": "Frontend", "svelte": "Frontend",
      "next.js": "Frontend", "nextjs": "Frontend", "nuxt": "Frontend",
      "tailwind css": "Frontend", "tailwind": "Frontend", "bootstrap": "Frontend",
      "shadcn/ui": "Frontend", "shadcn": "Frontend",
      "material ui": "Frontend", "material-ui": "Frontend", "chakra ui": "Frontend", "chakra": "Frontend",
      "vite": "Frontend",
      // Backend
      "node.js": "Backend", "node": "Backend", "deno": "Backend", "bun": "Backend",
      "express": "Backend", "fastify": "Backend", "django": "Backend", "flask": "Backend",
      "fastapi": "Backend", "spring": "Backend", "spring boot": "Backend",
      "rails": "Backend", "laravel": "Backend", "asp.net": "Backend", "blazor": "Backend",
      "nestjs": "Backend", "nest.js": "Backend", "nest": "Backend",
      // Database
      "postgresql": "Database", "postgres": "Database", "mysql": "Database",
      "mongodb": "Database", "redis": "Database", "sqlite": "Database",
      "prisma": "Database", "typeorm": "Database", "drizzle orm": "Database", "drizzle": "Database",
      // Infrastructure
      "docker": "Infrastructure", "kubernetes": "Infrastructure",
      "aws": "Infrastructure", "azure": "Infrastructure", "gcp": "Infrastructure",
      "vercel": "Infrastructure", "netlify": "Infrastructure",
      "firebase": "Infrastructure", "supabase": "Infrastructure",
      // Auth
      "clerk": "Auth", "auth0": "Auth", "next-auth": "Auth", "nextauth": "Auth",
      // Storage
      "supabase storage": "Storage", "supabase-storage": "Storage", "s3": "Storage",
      // Monitoring
      "sentry": "Monitoring", "datadog": "Monitoring", "grafana": "Monitoring",
      // Testing
      "playwright": "Testing", "vitest": "Testing", "jest": "Testing", "cypress": "Testing",
      // AI / ML
      "openai": "AI / ML", "anthropic": "AI / ML", "langchain": "AI / ML",
    };

    const allItems = [
      ...tech.languages,
      ...tech.frameworks,
      ...tech.tools,
      ...tech.dependencies,
    ];

    for (const item of allItems) {
      const lower = item.toLowerCase().trim();
      const cat = bucketMap[lower] || "Other";
      if (!cats[cat]) cats[cat] = [];
      if (!cats[cat].includes(item.trim())) {
        cats[cat].push(item.trim());
      }
    }

    return cats;
  }, [tech]);

  // ── Advanced Editing mode ──
  if (showEditor) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-app">Advanced Editing</h2>
          <button
            onClick={() => setShowEditor(false)}
            className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Overview
          </button>
        </div>
        <ReviewStep
          projectDefinition={projectDefinition}
          onUpdate={onUpdate}
          onBack={() => setShowEditor(false)}
          onContinue={() => { setShowEditor(false); onContinue(); }}
        />
      </div>
    );
  }

  // ── Empty state ──
  if (!hasData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-app">Project Overview</h2>
          <p className="text-sm text-muted mt-1">No project data yet. Go back to Describe to add your idea.</p>
        </div>
        <div className="bg-surface/50 border border-app rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">🚀</div>
          <p className="text-muted text-sm mb-6">
            No project definition found. Describe your idea first.
          </p>
          <button
            onClick={onBack}
            className="btn-primary px-6 py-2.5 text-sm"
          >
            Go to Describe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* ── Sticky Status Bar ── */}
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-surface/90 backdrop-blur-sm border-b border-app mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-app">Everything looks good.</p>
              <p className="text-xs text-muted">Ready to generate your AI workspace.</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted">
            <span>{countGeneratedFiles()} files</span>
            <span className="text-divider">·</span>
            <span>Bootstrap ready</span>
            <span className="text-divider">·</span>
            <span>Updated {formatTimeAgo(new Date())}</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* SECTION 1: Project                      */}
      {/* ════════════════════════════════════════ */}
      <Section title="Project">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-app truncate">{project.name}</h3>
            {project.tagline && project.tagline !== "A brief description of what this project does" && (
              <p className="text-sm text-secondary mt-0.5">{project.tagline}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="text-xs text-muted flex items-center gap-1">
              <span>{repoIcon(project.repositoryState)}</span>
              {repoLabel(project.repositoryState)}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusBadge(project.status).color}`}>
              {statusBadge(project.status).label}
            </span>
          </div>
        </div>
      </Section>

      {/* ════════════════════════════════════════ */}
      {/* SECTION 2: Product                      */}
      {/* ════════════════════════════════════════ */}
      <Section title="Product">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Target Users */}
          <div>
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Target Users</span>
            {product.targetUsers.length > 0 ? (
              <ul className="mt-1 space-y-0.5">
                {product.targetUsers.map((u, i) => (
                  <li key={i} className="text-sm text-secondary">{u}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted italic mt-1">Not specified</p>
            )}
          </div>

          {/* Problem */}
          <div>
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Problem</span>
            {product.problemStatement ? (
              <p className="text-sm text-secondary mt-1 leading-relaxed">{product.problemStatement}</p>
            ) : (
              <p className="text-sm text-muted italic mt-1">Not specified</p>
            )}
          </div>

          {/* Solution */}
          <div>
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Solution</span>
            {product.solution ? (
              <p className="text-sm text-secondary mt-1 leading-relaxed">{product.solution}</p>
            ) : (
              <p className="text-sm text-muted italic mt-1">Not specified</p>
            )}
          </div>

          {/* MVP */}
          <div>
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">MVP</span>
            {product.mvpFeatures && product.mvpFeatures.length > 0 ? (
              <p className="text-sm text-secondary mt-1">{product.mvpFeatures.length} features planned</p>
            ) : product.mvpScope ? (
              <p className="text-sm text-secondary mt-1 line-clamp-2">{product.mvpScope}</p>
            ) : (
              <p className="text-sm text-muted italic mt-1">Not specified</p>
            )}
          </div>
        </div>

        {/* Expandable: full product details */}
        {(product.targetUsers.length > 0 || product.problemStatement || product.solution || (product.mvpFeatures && product.mvpFeatures.length > 0) || product.mvpScope) && (
          <ExpandableSection expanded={expandedProduct} onToggle={() => setExpandedProduct(!expandedProduct)} label="Show all product details">
            <div className="space-y-4 pt-4 border-t border-divider">
              {product.targetUsers.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">All target users</h4>
                  <BulletList items={product.targetUsers} />
                </div>
              )}
              {product.problemStatement && (
                <div>
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Problem statement</h4>
                  <p className="text-sm text-secondary leading-relaxed">{product.problemStatement}</p>
                </div>
              )}
              {product.solution && (
                <div>
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Solution description</h4>
                  <p className="text-sm text-secondary leading-relaxed">{product.solution}</p>
                </div>
              )}
              {product.mvpFeatures && product.mvpFeatures.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">MVP features</h4>
                  <BulletList items={product.mvpFeatures} />
                </div>
              )}
              {product.mvpScope && !(product.mvpFeatures && product.mvpFeatures.length > 0) && (
                <div>
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">MVP scope</h4>
                  <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">{product.mvpScope}</p>
                </div>
              )}
              {product.userStories.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">User stories</h4>
                  <BulletList items={product.userStories} />
                </div>
              )}
            </div>
          </ExpandableSection>
        )}
      </Section>

      {/* ════════════════════════════════════════ */}
      {/* SECTION 3: Architecture                  */}
      {/* ════════════════════════════════════════ */}
      <Section title="Architecture">
        {architecture.pattern ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-brand-soft">{architecture.pattern}</span>
            </div>

            {/* Mini stack flow diagram */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-secondary mb-3">
              {tech.frameworks.length > 0 && (
                <>
                  <span className="px-2 py-1 bg-elevated rounded border border-app">{tech.frameworks[0]}</span>
                  <span className="text-muted">→</span>
                </>
              )}
              {tech.languages.length > 0 && (
                <>
                  <span className="px-2 py-1 bg-elevated rounded border border-app">{tech.languages[0]}</span>
                  <span className="text-muted">→</span>
                </>
              )}
              {tech.dependencies.filter(d => ["postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite"].includes(d.toLowerCase())).length > 0 ? (
                <span className="px-2 py-1 bg-elevated rounded border border-app">
                  {tech.dependencies.find(d => ["postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite"].includes(d.toLowerCase()))}
                </span>
              ) : (
                <span className="text-muted italic">stack</span>
              )}
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
              {architecture.dataFlow && <span>Data flow defined</span>}
              {roadmap.phases.length > 0 && (
                <span>{countPhases(roadmap)} phases · {countTasks(roadmap)} tasks</span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted italic">No architecture pattern specified yet.</p>
        )}

        {/* Expandable: technical details */}
        {(architecture.dataFlow || architecture.componentTree || architecture.directoryStructure) && (
          <ExpandableSection expanded={expandedArchitecture} onToggle={() => setExpandedArchitecture(!expandedArchitecture)} label="Show technical details">
            <div className="space-y-4 pt-4 border-t border-divider">
              {architecture.dataFlow && (
                <div>
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Data Flow</h4>
                  <p className="text-sm text-secondary whitespace-pre-wrap">{architecture.dataFlow}</p>
                </div>
              )}
              {architecture.componentTree && (
                <div>
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Component Tree</h4>
                  <pre className="text-sm text-secondary whitespace-pre-wrap font-mono">{architecture.componentTree}</pre>
                </div>
              )}
              {architecture.directoryStructure && (
                <div>
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Directory Structure</h4>
                  <pre className="text-sm text-secondary whitespace-pre-wrap font-mono">{architecture.directoryStructure}</pre>
                </div>
              )}
            </div>
          </ExpandableSection>
        )}
      </Section>

      {/* ════════════════════════════════════════ */}
      {/* SECTION 4: Technology                    */}
      {/* ════════════════════════════════════════ */}
      <Section title="Technology">
        {Object.keys(categorizedTech).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(categorizedTech).map(([category, items]) => (
              <div key={category}>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">{category}</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {items.map((item, i) => (
                    <span key={i} className="text-xs bg-brand/10 text-brand-soft px-2.5 py-1 rounded-full border border-brand/30">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted italic">No technologies specified yet.</p>
        )}

        {tech.constraints.length > 0 && (
          <ExpandableSection expanded={false} onToggle={() => {}} label="Show constraints">
            <div className="pt-4 border-t border-divider">
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Constraints</h4>
              <BulletList items={tech.constraints} />
            </div>
          </ExpandableSection>
        )}
      </Section>

      {/* ════════════════════════════════════════ */}
      {/* SECTION 5: Ready to Generate             */}
      {/* ════════════════════════════════════════ */}
      <div className="bg-surface/50 border border-app rounded-xl p-6 mb-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-app">Ready to Generate</h3>
        </div>

        {/* Readiness checklist */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <ReadinessItem label="Project Definition" done={readiness.projectDefined} />
          <ReadinessItem label="Architecture" done={readiness.architectureReviewed} />
          <ReadinessItem label="Technology" done={readiness.technologySelected} />
          <ReadinessItem label="Documentation" done={readiness.documentationReady} />
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={onContinue}
            className="flex-1 btn-primary px-6 py-3 text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate Project Package
          </button>
          <button
            onClick={() => setShowEditor(true)}
            className="btn-secondary px-5 py-3 text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* SECTION 6: Included in your package      */}
      {/* ════════════════════════════════════════ */}
      <div className="bg-surface/30 border border-app/60 rounded-xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Included in your package</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {["README.md", "PRD.md", "SPEC.md", "Memory Bank", "Roadmap", "AI Rules", "Bootstrap Prompt", "AGENTS.md"].map((file) => (
            <span key={file} className="text-xs text-secondary bg-elevated/50 px-2.5 py-1 rounded-md border border-app/50">
              {file}
            </span>
          ))}
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="btn-secondary text-sm px-5 py-2.5 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Architecture Review
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 pb-6 border-b border-divider last:border-b-0">
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ExpandableSection({
  expanded,
  onToggle,
  label,
  children,
}: {
  expanded: boolean;
  onToggle: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-xs text-brand-soft hover:text-brand transition-colors"
        aria-expanded={expanded}
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {expanded ? "Hide details" : label}
      </button>
      {expanded && (
        <div className="mt-3">
          {children}
        </div>
      )}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-secondary">
          <span className="text-brand mt-1 shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ReadinessItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
      done
        ? "bg-success/10 border-success/30 text-success"
        : "bg-elevated/40 border-app/50 text-muted"
    }`}>
      {done ? (
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      )}
      <span>{label}</span>
    </div>
  );
}
