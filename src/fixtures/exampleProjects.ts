// ──────────────────────────────────────────────
// Example projects — shown as cards on the landing page
// Clicking a card fills the textarea with the prompt
// ──────────────────────────────────────────────

export interface ExampleProject {
  id: string;
  name: string;
  tagline: string;
  category: string;
  prompt: string;
}

export const EXAMPLE_PROJECTS: ExampleProject[] = [
  {
    id: "biobatch-sentinel",
    name: "BioBatch Sentinel",
    tagline: "Biotech Lab Operations",
    category: "Biotech",
    prompt: `I want to build BioBatch Sentinel, a laboratory operations platform for biotech labs. It should track samples, manage batch workflows, integrate with lab equipment via APIs, and provide real-time dashboards for QC metrics. Built with React, Node.js, and PostgreSQL.`,
  },
  {
    id: "supportflow-ai",
    name: "SupportFlow AI",
    tagline: "AI SaaS",
    category: "SaaS",
    prompt: `I want to build SupportFlow AI, an intelligent customer support platform that uses AI to triage, route, and respond to support tickets. It should integrate with Slack, email, and Zendesk. Built with Next.js, TypeScript, and OpenAI API.`,
  },
  {
    id: "smilesync",
    name: "SmileSync",
    tagline: "Healthcare",
    category: "Healthcare",
    prompt: `I want to build SmileSync, a dental practice management platform. It should handle appointment scheduling, patient records, insurance claims, and treatment planning. Built with React Native, Node.js, and MongoDB.`,
  },
  {
    id: "solarpro-lokaal",
    name: "SolarPro Lokaal",
    tagline: "Business Website",
    category: "Business",
    prompt: `I want to build SolarPro Lokaal, a local business website for a solar panel installation company. It should include service pages, a quote calculator, customer testimonials, and a contact form. Built with Next.js and Tailwind CSS.`,
  },
];
