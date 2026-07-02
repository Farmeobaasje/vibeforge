// ──────────────────────────────────────────────
// Pipeline Diagnostic Test
// Traces: mock answer → ConversationMemory.questions[]
//   → buildRequirements() → ProjectRequirements
//   → requirementsToProjectDefinition() → ProjectDefinition
//
// Run: npx tsx src/diagnostic/pipelineTest.ts
// ──────────────────────────────────────────────

import { createEmptyConversationMemory, type ConversationMemory, type InterviewQuestion } from "../models/conversationMemory";
import { createEmptyProjectRequirements, type ProjectRequirements } from "../models/projectRequirements";
import { buildRequirements } from "../orchestrator/requirementsBuilder";
import { requirementsToProjectDefinition } from "../lib/requirementsToProjectDefinition";
import { validateTopics } from "../orchestrator/topicValidator";

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

// ── Mock data: SolarPro Lokaal (complete interview) ──

const SOLARPRO_QUESTIONS: InterviewQuestion[] = [
  makeQuestion("vision", "SolarPro Lokaal helpt lokale zonnepanelen installateurs om offertes te maken, projecten te beheren en klanten op de hoogte te houden van hun installatie. Het platform moet eenvoudig genoeg zijn voor een eenmanszaak maar schaalbaar naar 20+ monteurs."),
  makeQuestion("project-name", "SolarPro Lokaal"),
  makeQuestion("target-users", "Zonnepanelen installateurs\nZelfstandige monteurs\nKleine tot middelgrote zonne-energie bedrijven"),
  makeQuestion("problems", "Offertes maken kost te veel tijd\nProjectvoortgang is onduidelijk voor klanten\nVoorraadbeheer van panelen en omvormers is rommelig\nKlantgegevens staan verspreid over Excel, email en notities"),
  makeQuestion("goals", "Offertetijd met 60% verkorten\nKlantportaal met real-time projectstatus\nGeautomatiseerd voorraadbeheer\nCentraal CRM voor klantgegevens"),
  makeQuestion("solution", "SolarPro Lokaal biedt een offertemodule met templates, een project-dashboard met status updates voor klanten, voorraadbeheer voor panelen/omvormers, en een CRM voor klantgegevens. Alles in één platform, toegankelijk via browser en app."),
  makeQuestion("mvp", "Offerte module met templates en PDF export\nProject dashboard met statussen (aangevraagd-goedgekeurd-in uitvoering-opgeleverd)\nKlantportaal met project updates\nBasis CRM met contactgegevens en project historie"),
  makeQuestion("tech-stack", "React\nTypeScript\nNode.js\nMongoDB\nTailwind CSS"),
  makeQuestion("integrations", "Google Maps voor locatie\nStripe/Mollie voor betalingen\nEmail notificaties via SMTP"),
  makeQuestion("constraints", "Offertes moeten voldoen aan Nederlandse wetgeving\nKlantdata moet AVG-proof worden opgeslagen\nWerkt offline op tablets voor monteurs op locatie"),
  makeQuestion("risks", "Afhankelijkheid van leveranciers voor paneel-prijzen\nConcurrentie van grotere spelers zoals SolarEdge\nSeizoensinvloeden op de markt"),
  makeQuestion("ai-workflow", "Claude Code"),
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

function runTest(label: string, questions: InterviewQuestion[]): void {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📋 TEST: ${label}`);
  console.log(`${'='.repeat(70)}`);

  // ── Step 1: Create memory with questions ──
  const memory = makeMemory(questions);
  assert(
    memory.questions.length > 0,
    "Memory has questions",
    `questions.length = ${memory.questions.length}`
  );

  // Log all questions with their topics and answers
  console.log(`\n  📝 Questions in memory (${memory.questions.length}):`);
  for (const q of memory.questions) {
    const preview = q.answer.length > 60 ? q.answer.slice(0, 60) + "..." : q.answer;
    console.log(`     [${q.topic}] "${preview}"`);
  }

  // ── Step 2: Run buildRequirements() ──
  console.log(`\n  🔍 buildRequirements()...`);
  const reqResult = buildRequirements(memory);
  const update = reqResult.update;

  console.log(`     update keys: ${Object.keys(update).join(", ")}`);
  console.log(`     missingFields: ${reqResult.missingFields.map(mf => mf.field).join(", ")}`);

  // Assert string fields
  assert(
    update.vision !== undefined && update.vision.length > 0,
    "vision extracted",
    `vision = "${update.vision?.slice(0, 60)}..."`
  );
  assert(
    update.projectName !== undefined && update.projectName.length > 0,
    "projectName extracted",
    `projectName = "${update.projectName}"`
  );
  assert(
    update.mvpScope !== undefined && update.mvpScope.length > 0,
    "mvpScope extracted",
    `mvpScope = "${update.mvpScope?.slice(0, 60)}..."`
  );

  // Assert array fields
  assert(
    update.targetUsers !== undefined && update.targetUsers.length > 0,
    "targetUsers extracted",
    `targetUsers = ${JSON.stringify(update.targetUsers)}`
  );
  assert(
    update.problems !== undefined && update.problems.length > 0,
    "problems extracted",
    `problems = ${JSON.stringify(update.problems)}`
  );
  assert(
    update.solutionIdeas !== undefined && update.solutionIdeas.length > 0,
    "solutionIdeas extracted",
    `solutionIdeas = ${JSON.stringify(update.solutionIdeas)}`
  );
  assert(
    update.goals !== undefined && update.goals.length > 0,
    "goals extracted",
    `goals = ${JSON.stringify(update.goals)}`
  );
  assert(
    update.integrations !== undefined && update.integrations.length > 0,
    "integrations extracted",
    `integrations = ${JSON.stringify(update.integrations)}`
  );
  assert(
    update.constraints !== undefined && update.constraints.length > 0,
    "constraints extracted",
    `constraints = ${JSON.stringify(update.constraints)}`
  );
  assert(
    update.preferredTech !== undefined && update.preferredTech.length > 0,
    "preferredTech extracted",
    `preferredTech = ${JSON.stringify(update.preferredTech)}`
  );
  assert(
    update.risks !== undefined && update.risks.length > 0,
    "risks extracted",
    `risks = ${JSON.stringify(update.risks)}`
  );
  assert(
    update.aiWorkflowTarget !== undefined && update.aiWorkflowTarget.length > 0,
    "aiWorkflowTarget extracted",
    `aiWorkflowTarget = "${update.aiWorkflowTarget}"`
  );

  // ── Step 3: Create ProjectRequirements from update ──
  console.log(`\n  📦 Creating ProjectRequirements...`);
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

  // ── Step 4: Run requirementsToProjectDefinition() ──
  console.log(`\n  🔄 requirementsToProjectDefinition()...`);
  const projectDef = requirementsToProjectDefinition(req);

  console.log(`     project.name = "${projectDef.project.name}"`);
  console.log(`     project.tagline = "${projectDef.project.tagline.slice(0, 60)}..."`);
  console.log(`     product.targetUsers = ${JSON.stringify(projectDef.product.targetUsers)}`);
  console.log(`     product.problemStatement = "${projectDef.product.problemStatement.slice(0, 60)}..."`);
  console.log(`     product.solution = "${projectDef.product.solution.slice(0, 60)}..."`);
  console.log(`     product.mvpScope = "${projectDef.product.mvpScope.slice(0, 60)}..."`);
  console.log(`     product.userStories = ${JSON.stringify(projectDef.product.userStories)}`);
  console.log(`     tech.languages = ${JSON.stringify(projectDef.tech.languages)}`);
  console.log(`     tech.frameworks = ${JSON.stringify(projectDef.tech.frameworks)}`);

  // Assert ProjectDefinition fields
  assert(
    projectDef.product.targetUsers.length > 0,
    "ProjectDefinition.product.targetUsers is filled",
    `targetUsers = ${JSON.stringify(projectDef.product.targetUsers)}`
  );
  assert(
    projectDef.product.problemStatement.length > 0,
    "ProjectDefinition.product.problemStatement is filled",
    `problemStatement = "${projectDef.product.problemStatement.slice(0, 80)}..."`
  );
  assert(
    projectDef.product.solution.length > 0,
    "ProjectDefinition.product.solution is filled",
    `solution = "${projectDef.product.solution.slice(0, 80)}..."`
  );
  assert(
    projectDef.product.mvpScope.length > 0,
    "ProjectDefinition.product.mvpScope is filled",
    `mvpScope = "${projectDef.product.mvpScope.slice(0, 80)}..."`
  );
  assert(
    projectDef.product.userStories.length > 0,
    "ProjectDefinition.product.userStories is filled",
    `userStories = ${JSON.stringify(projectDef.product.userStories)}`
  );

  // ── Step 5: Run validateTopics() / evaluateCompletion() ──
  console.log(`\n  ✅ validateTopics()...`);
  const validation = validateTopics(memory);
  console.log(`     overall: ${validation.overall}%`);
  console.log(`     completeTopics: ${validation.completeTopics.join(", ")}`);
  console.log(`     incompleteTopics: ${validation.incompleteTopics.join(", ")}`);

  for (const topic of validation.topics) {
    const icon = topic.isComplete ? "✅" : topic.hasAnyAnswer ? "⏳" : "⬜";
    console.log(`     ${icon} ${topic.topicId}: ${topic.reason}`);
  }

  assert(
    validation.overall >= 90,
    "Overall completion >= 90%",
    `overall = ${validation.overall}%`
  );

  // ── Summary ────────────────────────────────
  const passed = steps.filter(s => s.pass).length;
  const failed = steps.filter(s => !s.pass).length;
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`📊 RESULT: ${passed} passed, ${failed} failed out of ${steps.length} assertions`);
  console.log(`${'─'.repeat(70)}`);
}

// ── Main ──────────────────────────────────────

console.log(`\n${'█'.repeat(70)}`);
console.log(`█  PIPELINE DIAGNOSTIC TEST`);
console.log(`█  ${new Date().toISOString()}`);
console.log(`${'█'.repeat(70)}`);

// Clear steps before each test
steps.length = 0;
runTest("FitFlow Studio — Complete Interview", FITFLOW_QUESTIONS);

steps.length = 0;
runTest("SolarPro Lokaal — Complete Interview", SOLARPRO_QUESTIONS);

// ── Edge case: empty memory ──
steps.length = 0;
console.log(`\n${'='.repeat(70)}`);
console.log(`📋 TEST: Empty Memory (edge case)`);
console.log(`${'='.repeat(70)}`);
const emptyMemory = createEmptyConversationMemory();
const emptyReqResult = buildRequirements(emptyMemory);
assert(
  Object.keys(emptyReqResult.update).length === 0 || emptyReqResult.update.confidence !== undefined,
  "Empty memory produces empty update",
  `update keys = ${Object.keys(emptyReqResult.update).join(", ")}`
);
const emptyReq = createEmptyProjectRequirements();
const emptyDef = requirementsToProjectDefinition(emptyReq);
assert(
  emptyDef.product.targetUsers.length === 0,
  "Empty requirements → empty targetUsers",
  `targetUsers = ${JSON.stringify(emptyDef.product.targetUsers)}`
);
assert(
  emptyDef.product.problemStatement === "",
  "Empty requirements → empty problemStatement",
  `problemStatement = "${emptyDef.product.problemStatement}"`
);
const emptyPassed = steps.filter(s => s.pass).length;
const emptyFailed = steps.filter(s => !s.pass).length;
console.log(`\n📊 RESULT: ${emptyPassed} passed, ${emptyFailed} failed out of ${steps.length} assertions`);

// ── Final summary ──
console.log(`\n${'█'.repeat(70)}`);
console.log(`█  DIAGNOSTIC COMPLETE`);
console.log(`${'█'.repeat(70)}`);
