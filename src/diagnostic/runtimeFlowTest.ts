// ──────────────────────────────────────────────
// Runtime Flow Diagnostic Test
// Simulates the EXACT runtime flow:
//   mock answer → processUserAnswer() → buildRequirements()
//   → applyRequirementsUpdate() → ProjectRequirements state
//   → syncWithGenerator() → deterministicGenerate()
//   → requirementsToProjectDefinition() → ProjectDefinition
//   → docsGenerator → README.md content
//
// This test simulates what happens in the React runtime
// by calling the same functions in the same order.
//
// Run: cd e:\VibeForge\app && npx tsx e:\VibeForge\app\src\diagnostic\runtimeFlowTest.ts
// ──────────────────────────────────────────────

import { createEmptyConversationMemory, type ConversationMemory, type InterviewQuestion } from "../models/conversationMemory";
import { createEmptyProjectRequirements, type ProjectRequirements } from "../models/projectRequirements";
import { buildRequirements } from "../orchestrator/requirementsBuilder";
import { deterministicGenerate } from "../generator";
import { generateDocumentationFiles } from "../lib/docsGenerator";
import { buildRenderModel } from '../generator/renderModel'
import { createEmptyArchitectureAnalysis } from "../models/architectureAnalysis";
import { defaultProjectDefinition } from "../types/projectDefinition";

// ── Helpers ───────────────────────────────────

function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function makeQuestion(topic: string, answer: string, skipped = false): InterviewQuestion {
  return {
    id: uid(),
    topic,
    question: `Tell me about ${topic}`,
    answer,
    confidence: "high",
    skipped,
    createdAt: new Date().toISOString(),
    answeredAt: skipped ? null : new Date().toISOString(),
  };
}

function makeMemory(questions: InterviewQuestion[]): ConversationMemory {
  const mem = createEmptyConversationMemory();
  mem.questions = questions;
  return mem;
}

// ── Mock data: FitFlow Studio (complete interview) ──

const FITFLOW_QUESTIONS: InterviewQuestion[] = [
  makeQuestion("vision", "FitFlow Studio wordt een alles-in-één platform voor personal trainers en sportscholen om hun administratie, planning en klantcommunicatie te beheren. Het moet gebruiksvriendelijk zijn en werken zonder uitgebreide technische kennis."),
  makeQuestion("project-name", "FitFlow Studio"),
  makeQuestion("target-users", "Personal trainers\nKleine sportscholen\nFitness instructeurs\nZelfstandige sportcoaches"),
  makeQuestion("problems", "Personal trainers besteden te veel tijd aan administratie\nKlantcommunicatie verloopt rommelig via WhatsApp en email\nPlanning maken is tijdrovend en foutgevoelig\nGeen centraal overzicht van klantgegevens en voortgang"),
  makeQuestion("goals", "Administratietijd met 50% verminderen\nCentraal klantportaal met voortgang\nGeautomatiseerde planning en herinneringen\nProfessionele uitstraling voor de trainer"),
  makeQuestion("solution", "FitFlow Studio biedt een dashboard met klantbeheer, planningstool, automatische herinneringen en een white-label app voor klanten. Trainers kunnen in één oogopslag zien wie er komt, wie betalingen open heeft staan en welke oefeningen gedaan zijn."),
  makeQuestion("mvp", "Klantprofielen met contactgegevens en notities\nAgenda met mogelijkheid om sessies in te plannen\nAutomatische herinneringen via email\nBasis dashboard met overzicht van vandaag"),
  makeQuestion("tech-stack", "React\nTypeScript\nNode.js\nPostgreSQL\nTailwind CSS"),
  makeQuestion("integrations", "Google Calendar voor synchronisatie\nStripe voor betalingen\nSendGrid voor email herinneringen"),
  makeQuestion("constraints", "Moet werken op mobiel en desktop\nPrivacy gevoelige klantdata moet veilig worden opgeslagen\nBudget: bootstrapped, dus kostenefficiënt"),
  makeQuestion("risks", "Concurrentie van gevestigde partijen zoals Virtuagym\nKlanten kunnen terughoudend zijn met het overzetten van hun data\nTijdsinvestering voor integratie met bestaande systemen"),
  makeQuestion("ai-workflow", "Cline"),
];

// ── Test runner ───────────────────────────────

interface TestStep {
  name: string;
  pass: boolean;
  detail: string;
}

const steps: TestStep[] = [];

function assert(condition: boolean, name: string, detail: string): void {
  steps.push({ name, pass: condition, detail });
  if (!condition) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ${detail}`);
  } else {
    console.log(`  ✅ PASS: ${name}`);
  }
}

async function runRuntimeFlowTest(label: string, questions: InterviewQuestion[]): Promise<void> {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📋 RUNTIME FLOW TEST: ${label}`);
  console.log(`${'='.repeat(70)}`);

  // ══════════════════════════════════════════════
  // PHASE 1: Simulate the interview flow
  // (what happens in useInterview → sendAnswer → processUserAnswer)
  // ══════════════════════════════════════════════

  console.log(`\n── PHASE 1: Interview Flow (simulating sendAnswer) ──`);

  // Step 1: Create memory with questions (simulating what processUserAnswer does)
  const memory = makeMemory(questions);
  assert(
    memory.questions.length > 0,
    "Memory has questions",
    `questions.length = ${memory.questions.length}`
  );

  // Log all questions
  console.log(`\n  📝 Questions in memory (${memory.questions.length}):`);
  for (const q of memory.questions) {
    const preview = q.answer.length > 60 ? q.answer.slice(0, 60) + "..." : q.answer;
    console.log(`     [${q.topic}] "${preview}"`);
  }

  // Step 2: Run buildRequirements() (simulating what processUserAnswer does at line 246)
  console.log(`\n  🔍 buildRequirements()...`);
  const reqResult = buildRequirements(memory);
  const update = reqResult.update;

  console.log(`     update keys: ${Object.keys(update).join(", ")}`);
  console.log(`     missingFields: ${reqResult.missingFields.map(mf => mf.field).join(", ")}`);

  // Assert all fields are extracted
  assert(update.vision !== undefined && update.vision.length > 0, "vision extracted", `vision = "${update.vision?.slice(0, 60)}..."`);
  assert(update.projectName !== undefined && update.projectName.length > 0, "projectName extracted", `projectName = "${update.projectName}"`);
  assert(update.mvpScope !== undefined && update.mvpScope.length > 0, "mvpScope extracted", `mvpScope = "${update.mvpScope?.slice(0, 60)}..."`);
  assert(update.targetUsers !== undefined && update.targetUsers.length > 0, "targetUsers extracted", `targetUsers = ${JSON.stringify(update.targetUsers)}`);
  assert(update.problems !== undefined && update.problems.length > 0, "problems extracted", `problems = ${JSON.stringify(update.problems)}`);
  assert(update.solutionIdeas !== undefined && update.solutionIdeas.length > 0, "solutionIdeas extracted", `solutionIdeas = ${JSON.stringify(update.solutionIdeas)}`);
  assert(update.goals !== undefined && update.goals.length > 0, "goals extracted", `goals = ${JSON.stringify(update.goals)}`);

  // ══════════════════════════════════════════════
  // PHASE 2: Simulate applyRequirementsUpdate()
  // (what happens in useInterview → processResult → applyRequirementsUpdate)
  // ══════════════════════════════════════════════

  console.log(`\n── PHASE 2: applyRequirementsUpdate() (simulating processResult) ──`);

  // Create ProjectRequirements from the update (simulating what applyRequirementsUpdate does)
  const req: ProjectRequirements = {
    ...createEmptyProjectRequirements(),
    vision: update.vision ?? "",
    projectName: update.projectName ?? "",
    goals: update.goals ?? [],
    targetUsers: update.targetUsers ?? [],
    problems: update.problems ?? [],
    solutionIdeas: update.solutionIdeas ?? [],
    mvpScope: update.mvpScope ?? "",
    integrations: update.integrations ?? [],
    constraints: update.constraints ?? [],
    preferredTech: update.preferredTech ?? [],
    aiWorkflowTarget: update.aiWorkflowTarget ?? "",
    risks: update.risks ?? [],
    unknowns: update.unknowns ?? [],
    confidence: update.confidence ?? "low",
  };

  console.log(`     req.targetUsers = ${JSON.stringify(req.targetUsers)}`);
  console.log(`     req.problems = ${JSON.stringify(req.problems)}`);
  console.log(`     req.solutionIdeas = ${JSON.stringify(req.solutionIdeas)}`);
  console.log(`     req.mvpScope = "${req.mvpScope}"`);

  assert(req.targetUsers.length > 0, "ProjectRequirements.targetUsers is filled", `targetUsers = ${JSON.stringify(req.targetUsers)}`);
  assert(req.problems.length > 0, "ProjectRequirements.problems is filled", `problems = ${JSON.stringify(req.problems)}`);
  assert(req.solutionIdeas.length > 0, "ProjectRequirements.solutionIdeas is filled", `solutionIdeas = ${JSON.stringify(req.solutionIdeas)}`);
  assert(req.mvpScope.length > 0, "ProjectRequirements.mvpScope is filled", `mvpScope = "${req.mvpScope}"`);

  // ══════════════════════════════════════════════
  // PHASE 3: Simulate syncWithGenerator()
  // (what happens in App.tsx when user clicks "Continue")
  // ══════════════════════════════════════════════

  console.log(`\n── PHASE 3: syncWithGenerator() (simulating step transition) ──`);

  // This is what syncWithGenerator does:
  //   const memory = loadConversationMemory();  // ← reads from localStorage
  //   const analysis = createEmptyArchitectureAnalysis();
  //   const result = await deterministicGenerate({ memory, requirements, architecture: analysis });
  //   updateProjectDefinition(result.projectDefinition);

  const analysis = createEmptyArchitectureAnalysis();

  console.log(`\n  🔄 deterministicGenerate()...`);
  const genResult = await deterministicGenerate({
    memory,
    requirements: req,
    architecture: analysis,
    // NOTE: `existing` is intentionally omitted
  });

  const pd = genResult.projectDefinition;

  console.log(`     project.name = "${pd.project.name}"`);
  console.log(`     project.tagline = "${pd.project.tagline.slice(0, 60)}..."`);
  console.log(`     product.targetUsers = ${JSON.stringify(pd.product.targetUsers)}`);
  console.log(`     product.problemStatement = "${pd.product.problemStatement.slice(0, 60)}..."`);
  console.log(`     product.solution = "${pd.product.solution.slice(0, 60)}..."`);
  console.log(`     product.mvpScope = "${pd.product.mvpScope.slice(0, 60)}..."`);
  console.log(`     product.userStories = ${JSON.stringify(pd.product.userStories)}`);
  console.log(`     tech.languages = ${JSON.stringify(pd.tech.languages)}`);
  console.log(`     tech.frameworks = ${JSON.stringify(pd.tech.frameworks)}`);

  // Assert ProjectDefinition fields
  assert(pd.product.targetUsers.length > 0, "ProjectDefinition.product.targetUsers is filled", `targetUsers = ${JSON.stringify(pd.product.targetUsers)}`);
  assert(pd.product.problemStatement.length > 0, "ProjectDefinition.product.problemStatement is filled", `problemStatement = "${pd.product.problemStatement.slice(0, 80)}..."`);
  assert(pd.product.solution.length > 0, "ProjectDefinition.product.solution is filled", `solution = "${pd.product.solution.slice(0, 80)}..."`);
  assert(pd.product.mvpScope.length > 0, "ProjectDefinition.product.mvpScope is filled", `mvpScope = "${pd.product.mvpScope.slice(0, 80)}..."`);
  assert(pd.product.userStories.length > 0, "ProjectDefinition.product.userStories is filled", `userStories = ${JSON.stringify(pd.product.userStories)}`);

  // ══════════════════════════════════════════════
  // PHASE 4: Generate docs (what GenerateStep and ExportStep do)
  // ══════════════════════════════════════════════

  console.log(`\n── PHASE 4: generateDocumentationFiles() (simulating GenerateStep) ──`);

  const rm = buildRenderModel(pd);
  const docs = generateDocumentationFiles(pd, rm);

  // Find README.md
  const readme = docs.find(d => d.path === "README.md");
  assert(readme !== undefined, "README.md is generated", "README.md found in docs");

  if (readme) {
    console.log(`\n  📄 README.md content:`);
    console.log(`  ${readme.content.split("\n").slice(0, 20).join("\n  ")}`);
    console.log(`  ...`);

    // The fallback text appears in the Problem, Solution, and MVP sections
    // Count occurrences - should be 0 if all fields are filled
    const fallbackCount = (readme.content.match(/To be refined during project review/g) || []).length;

    assert(
      fallbackCount === 0,
      "README.md has NO 'To be refined during project review' fallbacks",
      `Found ${fallbackCount} fallback occurrences in README.md`
    );

    // Also check that the actual content is present
    assert(
      readme.content.includes("Personal trainers") || readme.content.includes("Zonnepanelen"),
      "README.md contains target users content",
      "Target users content found in README.md"
    );
    assert(
      readme.content.includes("administratie") || readme.content.includes("Offertes"),
      "README.md contains problem content",
      "Problem content found in README.md"
    );
    assert(
      readme.content.includes("dashboard") || readme.content.includes("offertemodule"),
      "README.md contains solution content",
      "Solution content found in README.md"
    );
    assert(
      readme.content.includes("Klantprofielen") || readme.content.includes("Offerte module"),
      "README.md contains MVP content",
      "MVP content found in README.md"
    );
  }

  // ══════════════════════════════════════════════
  // PHASE 5: Test with `existing` parameter
  // (simulating what happens when user has an existing ProjectDefinition)
  // ══════════════════════════════════════════════

  console.log(`\n── PHASE 5: With existing ProjectDefinition (simulating re-generation) ──`);

  const existingPd = { ...defaultProjectDefinition };
  existingPd.project.name = "Old Name";
  existingPd.product.targetUsers = [];
  existingPd.product.problemStatement = "";
  existingPd.product.solution = "";
  existingPd.product.mvpScope = "";

  const genResultWithExisting = await deterministicGenerate({
    memory,
    requirements: req,
    architecture: analysis,
    existing: existingPd,
  });

  const pdWithExisting = genResultWithExisting.projectDefinition;

  console.log(`     project.name = "${pdWithExisting.project.name}"`);
  console.log(`     product.targetUsers = ${JSON.stringify(pdWithExisting.product.targetUsers)}`);
  console.log(`     product.problemStatement = "${pdWithExisting.product.problemStatement.slice(0, 60)}..."`);

  assert(
    pdWithExisting.product.targetUsers.length > 0,
    "With existing: targetUsers is filled (overwrites empty existing)",
    `targetUsers = ${JSON.stringify(pdWithExisting.product.targetUsers)}`
  );
  assert(
    pdWithExisting.product.problemStatement.length > 0,
    "With existing: problemStatement is filled (overwrites empty existing)",
    `problemStatement = "${pdWithExisting.product.problemStatement.slice(0, 80)}..."`
  );

  // ══════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════

  const passed = steps.filter(s => s.pass).length;
  const failed = steps.filter(s => !s.pass).length;
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`📊 RESULT: ${passed} passed, ${failed} failed out of ${steps.length} assertions`);
  console.log(`${'─'.repeat(70)}`);
}

// ── Main ──────────────────────────────────────

console.log(`\n${'█'.repeat(70)}`);
console.log(`█  RUNTIME FLOW DIAGNOSTIC TEST`);
console.log(`█  ${new Date().toISOString()}`);
console.log(`${'█'.repeat(70)}`);

// Clear steps before each test
steps.length = 0;
await runRuntimeFlowTest("FitFlow Studio — Complete Interview", FITFLOW_QUESTIONS);

// ── Final summary ──
console.log(`\n${'█'.repeat(70)}`);
console.log(`█  DIAGNOSTIC COMPLETE`);
console.log(`${'█'.repeat(70)}`);
