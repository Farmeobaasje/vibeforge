// ──────────────────────────────────────────────
// BioBatch Sentinel — Demo Scenario
// Complete scripted interview for the guided demo
// ──────────────────────────────────────────────

import type { DemoScenario } from "./types";

export const BIOBATCH_SENTINEL_DEMO: DemoScenario = {
  id: "biobatch-sentinel-demo",
  name: "BioBatch Sentinel",
  metadata: {
    tagline: "Biotech Lab Operations",
    category: "Biotech",
  },
  project: {
    prompt: `I want to build BioBatch Sentinel, a laboratory operations platform for biotech labs. It should track samples, manage batch workflows, integrate with lab equipment via APIs, and provide real-time dashboards for QC metrics. Built with React, Node.js, and PostgreSQL.`,
    name: "BioBatch Sentinel",
    tagline: "Biotech Lab Operations Platform",
  },
  interview: [
    {
      topic: "vision",
      question:
        "What is the high-level vision for BioBatch Sentinel?",
      answer:
        "BioBatch Sentinel is a laboratory operations platform for biotech teams running small-batch cell culture and fermentation experiments. It helps scientists track bioreactor runs, monitor culture conditions, record deviations, compare batch outcomes, and generate audit-ready experiment reports.",
      delay: 1800,
      typingSpeed: 25,
    },
    {
      topic: "target-users",
      question:
        "Who are the primary users?",
      answer:
        "The primary users are biotech lab managers, fermentation scientists, cell culture researchers, quality assurance reviewers, process development teams, lab technicians, and biotech startup founders managing experimental production runs.",
      delay: 1600,
      typingSpeed: 28,
    },
    {
      topic: "problems",
      question:
        "What problem does this solve?",
      answer:
        "Small biotech teams often manage experimental batch data across spreadsheets, lab notebooks, instrument exports, and disconnected cloud folders. This makes it difficult to compare culture conditions, identify contamination risks, trace deviations, reproduce successful batches, and prepare reliable documentation for internal quality reviews or regulatory audits.",
      delay: 2000,
      typingSpeed: 30,
    },
    {
      topic: "goals",
      question:
        "What are the main goals?",
      answer:
        "The goals are to improve batch traceability, reduce manual reporting work, help scientists compare process outcomes, flag deviations early, and give quality teams a clear audit trail for every experimental run.",
      delay: 1800,
      typingSpeed: 26,
    },
    {
      topic: "solution",
      question:
        "What is the proposed solution?",
      answer:
        "The solution is a secure web application with batch run tracking, bioreactor condition logs, sample collection schedules, deviation records, contamination alerts, experiment protocol templates, instrument data imports, batch comparison dashboards, QA review workflows, electronic signatures, and exportable audit reports.",
      delay: 2000,
      typingSpeed: 28,
    },
    {
      topic: "mvp",
      question:
        "What should be included in the MVP?",
      answer:
        "The MVP includes organization workspaces, a batch run dashboard, bioreactor profile management, culture condition logging, sample schedule planning, deviation tracking, contamination alert workflow, instrument CSV import, experiment protocol templates, batch comparison charts, QA review queue, electronic signatures, audit report export, role-based access control, notifications, and settings.",
      delay: 2200,
      typingSpeed: 30,
    },
    {
      topic: "tech-stack",
      question:
        "What technology stack should the project use?",
      answer:
        "The preferred stack is React, TypeScript, Vite, Tailwind CSS on the frontend; Node.js with NestJS on the backend; PostgreSQL with Prisma for data; Supabase Storage for instrument files and audit exports; Clerk for authentication; Resend for email; Sentry and OpenTelemetry for monitoring; Vitest and Playwright for testing; Vercel and Railway for deployment.",
      delay: 1800,
      typingSpeed: 25,
    },
    {
      topic: "integrations",
      question:
        "Which integrations are needed?",
      answer:
        "The platform should support CSV imports from bioreactor controllers, Google Drive, Microsoft OneDrive, Slack alerts, Resend Email, Supabase Storage, Sentry, OpenTelemetry, and an optional future LIMS export for lab system integration.",
      delay: 2000,
      typingSpeed: 28,
    },
    {
      topic: "constraints",
      question:
        "What constraints must the system respect?",
      answer:
        "The platform must protect sensitive experiment data, support tenant isolation, maintain an immutable audit trail, provide role-based access control, support electronic signatures, handle large instrument export files, remain usable in lab tablet workflows, and make all exported reports traceable to original batch data.",
      delay: 2200,
      typingSpeed: 26,
    },
    {
      topic: "risks",
      question:
        "What are the main risks?",
      answer:
        "The main risks are incorrect experiment data entry, inconsistent instrument export formats, missing deviation records, contamination events not being logged quickly enough, audit trail gaps, unauthorized access to sensitive biotech process data, and over-customization for different lab protocols.",
      delay: 2000,
      typingSpeed: 28,
    },
    {
      topic: "ai-workflow",
      question:
        "How should AI support the workflow?",
      answer:
        "The AI should interview the lab operations lead to understand experiment types, batch workflows, instrument export formats, deviation handling, QA review requirements, electronic signature rules, and reporting expectations. It should then recommend an architecture, identify scientific and compliance risks, generate a complete Project Definition, roadmap, README, PRD, SPEC, Memory Bank, Cline Rules, AGENTS.md, Bootstrap Prompt, and implementation plan, then validate everything for consistency, traceability, security, compliance readiness, and release quality before export.",
      delay: 1600,
      typingSpeed: 25,
    },
  ],
  // Legacy tooltips — kept for backward compatibility
  tooltips: [],
  // Guided Tour steps — premium onboarding experience
  tourSteps: [
    {
      id: "tour-interview",
      stepNumber: 1,
      totalSteps: 5,
      title: "The Interview",
      message:
        "VibeForge starts by interviewing you instead of immediately generating code. This lets the AI understand the real problem before making architectural decisions.\n\nWatch how the AI asks about your project vision — each answer becomes part of a structured blueprint.",
      position: "bottom",
      highlightTarget: "chat",
      triggerAfterStep: 0,
      actionLabel: "Watch the interview",
    },
    {
      id: "tour-live-definition",
      stepNumber: 2,
      totalSteps: 5,
      title: "Live Project Definition",
      message:
        "As you answer, the right panel updates in real time. Every response becomes part of a structured Project Definition — no manual documentation needed.\n\nThe AI extracts requirements, goals, and constraints automatically as the conversation progresses.",
      position: "right",
      highlightTarget: "understanding-panel",
      triggerAfterStep: 1,
      actionLabel: "See it in action",
    },
    {
      id: "tour-progress",
      stepNumber: 3,
      totalSteps: 5,
      title: "Progress Tracking",
      message:
        "The left panel shows your interview progress. Completed topics get a checkmark.\n\nThe AI uses this context to ask smarter follow-up questions — it remembers everything you've said and builds on previous answers.",
      position: "left",
      highlightTarget: "progress-panel",
      triggerAfterStep: 3,
      actionLabel: "Track the progress",
    },
    {
      id: "tour-context",
      stepNumber: 4,
      totalSteps: 5,
      title: "Building Context",
      message:
        "The AI doesn't just collect answers — it builds a complete picture of your project.\n\nEach response unlocks additional parts of the Project Definition. You don't need to think about documentation anymore; the interview builds it for you.",
      position: "bottom",
      highlightTarget: "chat",
      triggerAfterStep: 6,
      actionLabel: "See how it builds",
    },
    {
      id: "tour-almost-done",
      stepNumber: 5,
      totalSteps: 5,
      title: "Almost There",
      message:
        "One more question and the interview will be complete. The AI will then have everything it needs to generate your full project blueprint — including PRD, SPEC, README, Roadmap, and more.",
      position: "bottom",
      highlightTarget: null,
      triggerAfterStep: 9,
      actionLabel: "Finish the demo",
    },
  ],
};
