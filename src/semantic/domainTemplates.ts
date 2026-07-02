// ──────────────────────────────────────────────
// domainTemplates — Domain-specific templates
//
// 10 domain templates that influence tagline,
// architecture, entities, roadmap, component tree,
// and data flow generation.
//
// Each template provides:
//   - taglineTemplate: (name) => string
//   - componentTemplates: string[]
//   - dataFlowTemplate: string
//   - roadmapPhases: { title, tasks }[]
//   - entities: DomainEntity[]
//   - relationships: EntityRelationship[]
//   - architecturePattern: string
// ──────────────────────────────────────────────

import type { DomainEntity, EntityRelationship } from "./domainModelTypes";

// ── Domain Template Interface ─────────────────

export interface DomainTemplate {
  name: string;
  keywords: string[];
  /** Strong keywords (2 points each) — domain-specific signals */
  strongKeywords?: string[];
  /** Weak keywords (0.5 points each) — broad terms that alone shouldn't match */
  weakKeywords?: string[];
  taglineTemplate: (projectName: string) => string;
  componentTemplates: string[];
  dataFlowTemplate: string;
  roadmapPhases: Array<{ title: string; tasks: string[] }>;
  entities: DomainEntity[];
  relationships: EntityRelationship[];
  architecturePattern: string;
}

// ── 1. Marketplace ────────────────────────────

const marketplace: DomainTemplate = {
  name: "marketplace",
  keywords: [
    "marktplaats", "marketplace", "verkoper", "koper", "advertentie",
    "listing", "shop", "winkel", "producten", "tweedehands",
    "platform", "handel", "trade", "buy", "sell",
  ],
  taglineTemplate: (name: string) =>
    `Online marketplace connecting buyers and sellers — ${name}`,
  componentTemplates: [
    "HomePage",
    "ProductListingPage",
    "ProductDetailPage",
    "SearchResultsPage",
    "SellerDashboardPage",
    "CartPage",
    "CheckoutPage",
    "UserProfilePage",
    "AdminDashboardPage",
  ],
  dataFlowTemplate:
    "Seller lists product → product indexed in search → buyer browses/search → buyer views detail → buyer adds to cart → checkout processes payment → order created → seller notified → tracking updated",
  roadmapPhases: [
    {
      title: "Foundation & Setup",
      tasks: [
        "Initialize project with chosen tech stack",
        "Set up authentication and user profiles",
        "Configure database schema for products, users, orders",
      ],
    },
    {
      title: "Core Marketplace Features",
      tasks: [
        "Build product listing and management",
        "Implement search with filters and categories",
        "Create product detail pages with images",
      ],
    },
    {
      title: "Buyer & Seller Workflows",
      tasks: [
        "Build shopping cart and checkout flow",
        "Implement seller dashboard and analytics",
        "Add order management and tracking",
      ],
    },
    {
      title: "Advanced Features & Launch",
      tasks: [
        "Add payment gateway integration",
        "Implement reviews and ratings",
        "Add monitoring, testing, and production deployment",
      ],
    },
  ],
  entities: [
    { name: "User", description: "Platform user (buyer or seller)", attributes: ["name", "email", "role", "joinedAt"] },
    { name: "Product", description: "Listed item for sale", attributes: ["title", "description", "price", "category", "images"] },
    { name: "Order", description: "Purchase transaction", attributes: ["buyerId", "sellerId", "total", "status", "createdAt"] },
    { name: "Review", description: "Product or seller review", attributes: ["rating", "comment", "authorId", "createdAt"] },
    { name: "Category", description: "Product category", attributes: ["name", "slug", "parentId"] },
  ],
  relationships: [
    { from: "User", to: "Product", type: "owns", description: "User owns listed products" },
    { from: "User", to: "Order", type: "places", description: "User places orders" },
    { from: "Order", to: "Product", type: "contains", description: "Order contains products" },
    { from: "User", to: "Review", type: "writes", description: "User writes reviews" },
  ],
  architecturePattern: "Client-server with REST API, search index, and payment gateway",
};

// ── 2. Restaurant / Hospitality ───────────────

const restaurant: DomainTemplate = {
  name: "restaurant",
  keywords: [
    "restaurant", "menu", "reservation", "order", "kitchen", "dining",
    "food", "cafe", "bar", "keuken", "bestelling", "reservering",
    "eetgelegenheid", "horeca",
  ],
  taglineTemplate: (name: string) =>
    `Digital management system for ${name} — streamline reservations, orders, and operations`,
  componentTemplates: [
    "DashboardPage",
    "ReservationCalendarPage",
    "OrderManagementPage",
    "MenuManagementPage",
    "KitchenDisplayPage",
    "TableManagementPage",
    "CustomerProfilePage",
    "ReportPage",
  ],
  dataFlowTemplate:
    "Customer makes reservation → host assigns table → waiter takes order → order sent to kitchen display → kitchen prepares and marks complete → waiter serves → payment processed → table freed",
  roadmapPhases: [
    {
      title: "Foundation & Setup",
      tasks: [
        "Initialize project with chosen tech stack",
        "Set up database schema for reservations, orders, and menu",
        "Configure real-time WebSocket connections",
      ],
    },
    {
      title: "Core Restaurant Features",
      tasks: [
        "Build reservation calendar with table management",
        "Implement digital order taking",
        "Create kitchen display system",
      ],
    },
    {
      title: "Menu & Operations",
      tasks: [
        "Build menu management with categories",
        "Add real-time table status overview",
        "Implement payment integration",
      ],
    },
    {
      title: "Advanced Features & Launch",
      tasks: [
        "Add reporting and analytics",
        "Implement customer loyalty features",
        "Add monitoring, testing, and production deployment",
      ],
    },
  ],
  entities: [
    { name: "Customer", description: "Restaurant guest", attributes: ["name", "phone", "email", "preferences"] },
    { name: "Reservation", description: "Table booking", attributes: ["date", "time", "partySize", "tableId", "status"] },
    { name: "Order", description: "Food and drink order", attributes: ["tableId", "items", "total", "status", "createdAt"] },
    { name: "MenuItem", description: "Available dish or drink", attributes: ["name", "price", "category", "ingredients"] },
    { name: "Table", description: "Dining table", attributes: ["number", "capacity", "section", "status"] },
  ],
  relationships: [
    { from: "Customer", to: "Reservation", type: "makes", description: "Customer makes a reservation" },
    { from: "Reservation", to: "Table", type: "assigned", description: "Reservation assigned to a table" },
    { from: "Order", to: "MenuItem", type: "contains", description: "Order contains menu items" },
    { from: "Table", to: "Order", type: "serves", description: "Table has active orders" },
  ],
  architecturePattern: "Client-server with WebSocket real-time updates and kitchen display system",
};

// ── 3. CRM / Sales ────────────────────────────

const crm: DomainTemplate = {
  name: "crm",
  keywords: [
    "crm", "customer", "relationship", "sales", "lead", "contact",
    "pipeline", "deal", "klant", "relatie", "verkoop", "offerte",
    "verkooppijplijn",
  ],
  taglineTemplate: (name: string) =>
    `Simple CRM solution for ${name} — manage contacts, deals, and sales pipelines`,
  componentTemplates: [
    "DashboardPage",
    "ContactListPage",
    "DealPipelinePage",
    "ActivityTimelinePage",
    "ReportPage",
    "SettingsPage",
    "ImportExportPage",
    "EmailIntegrationPage",
  ],
  dataFlowTemplate:
    "User adds contact → contact appears in pipeline → user moves deal through stages → dashboard updates metrics → reports generated from pipeline data",
  roadmapPhases: [
    {
      title: "Foundation & Setup",
      tasks: [
        "Initialize project with chosen tech stack",
        "Set up database schema for contacts, deals, and activities",
        "Configure authentication and multi-tenant support",
      ],
    },
    {
      title: "Core CRM Features",
      tasks: [
        "Build contact management with import/export",
        "Implement deal pipeline with drag-and-drop",
        "Add activity tracking and notes",
      ],
    },
    {
      title: "Dashboard & Reporting",
      tasks: [
        "Build sales dashboard with key metrics",
        "Implement reporting (monthly/quarterly)",
        "Add data visualisation and export",
      ],
    },
    {
      title: "Integrations & Launch",
      tasks: [
        "Add email integration",
        "Implement calendar sync",
        "Add monitoring, testing, and production deployment",
      ],
    },
  ],
  entities: [
    { name: "Contact", description: "Customer or prospect", attributes: ["name", "email", "phone", "company", "source"] },
    { name: "Deal", description: "Sales opportunity", attributes: ["title", "value", "stage", "probability", "expectedClose"] },
    { name: "Activity", description: "Interaction with contact", attributes: ["type", "description", "date", "contactId"] },
    { name: "Pipeline", description: "Sales pipeline configuration", attributes: ["name", "stages", "defaultProbability"] },
    { name: "User", description: "CRM user", attributes: ["name", "email", "role", "teamId"] },
  ],
  relationships: [
    { from: "Contact", to: "Deal", type: "associated", description: "Contact associated with deals" },
    { from: "Deal", to: "Pipeline", type: "belongs", description: "Deal belongs to a pipeline stage" },
    { from: "User", to: "Activity", type: "logs", description: "User logs activities" },
    { from: "Contact", to: "Activity", type: "has", description: "Contact has activities" },
  ],
  architecturePattern: "Multi-tenant SaaS with REST API and role-based access control",
};

// ── 4. Fitness / Health ───────────────────────

const fitness: DomainTemplate = {
  name: "fitness",
  keywords: [
    "fitness", "workout", "training", "gym", "sport", "exercise",
    "personal trainer", "gezondheid", "health", "workout plan",
    "training schedule", "fitness app",
  ],
  taglineTemplate: (name: string) =>
    `Modern fitness platform — ${name} helps you train smarter and track progress`,
  componentTemplates: [
    "HomePage",
    "WorkoutPlannerPage",
    "ProgressDashboard",
    "ExerciseLibrary",
    "UserProfilePage",
    "SubscriptionPage",
    "SocialFeedPage",
  ],
  dataFlowTemplate:
    "User creates profile → selects fitness goals → AI generates workout plan → user logs exercises → progress tracked and visualised → plan adapts based on feedback",
  roadmapPhases: [
    {
      title: "Foundation & Setup",
      tasks: [
        "Initialize React/Vite/TypeScript project",
        "Configure Tailwind, routing, and base tooling",
        "Set up authentication and user profiles",
      ],
    },
    {
      title: "Core Workout Features",
      tasks: [
        "Build workout plan generator",
        "Create exercise library with search and filters",
        "Add workout logging and tracking",
      ],
    },
    {
      title: "Progress & Analytics",
      tasks: [
        "Build progress dashboard with charts",
        "Add goal setting and achievement tracking",
        "Implement workout history and statistics",
      ],
    },
    {
      title: "Premium Features & Launch",
      tasks: [
        "Add subscription and payment integration",
        "Implement social features and sharing",
        "Add monitoring, testing, and production deployment",
      ],
    },
  ],
  entities: [
    { name: "User", description: "Platform user", attributes: ["name", "email", "fitnessLevel", "goals"] },
    { name: "Workout", description: "Planned or completed workout session", attributes: ["name", "type", "duration", "calories", "date"] },
    { name: "Exercise", description: "Individual exercise", attributes: ["name", "sets", "reps", "weight", "muscleGroup"] },
    { name: "Progress", description: "User progress record", attributes: ["date", "weight", "measurements", "workoutCount"] },
    { name: "Goal", description: "Fitness goal", attributes: ["title", "target", "deadline", "status"] },
  ],
  relationships: [
    { from: "User", to: "Workout", type: "completes", description: "User completes workouts" },
    { from: "Workout", to: "Exercise", type: "contains", description: "Workout contains exercises" },
    { from: "User", to: "Progress", type: "tracks", description: "User tracks progress" },
    { from: "User", to: "Goal", type: "sets", description: "User sets fitness goals" },
  ],
  architecturePattern: "Progressive Web App with offline-first workout tracking and AI plan generation",
};

// ── 5. Construction / Contracting ─────────────

const construction: DomainTemplate = {
  name: "construction",
  keywords: [
    "bouw", "construction", "aannemer", "project", "bouwproject",
    "renovatie", "verbouwing", "contractor", "building", "architect",
    "engineering", "constructie", "bouwbedrijf",
  ],
  taglineTemplate: (name: string) =>
    `Project management platform for construction — ${name} keeps your builds on track`,
  componentTemplates: [
    "DashboardPage",
    "ProjectOverviewPage",
    "TaskManagementPage",
    "MaterialOrderPage",
    "TeamSchedulePage",
    "DocumentStoragePage",
    "BudgetTrackerPage",
    "ClientPortalPage",
  ],
  dataFlowTemplate:
    "Project manager creates project → assigns tasks to team → materials ordered from suppliers → progress tracked on site → photos uploaded as evidence → client reviews in portal → project signed off",
  roadmapPhases: [
    {
      title: "Foundation & Setup",
      tasks: [
        "Initialize project with chosen tech stack",
        "Set up database schema for projects, tasks, and materials",
        "Configure authentication and role-based access",
      ],
    },
    {
      title: "Core Project Management",
      tasks: [
        "Build project creation and overview",
        "Implement task assignment and tracking",
        "Add team scheduling and calendar",
      ],
    },
    {
      title: "Materials & Budget",
      tasks: [
        "Build material ordering and inventory",
        "Implement budget tracking and forecasting",
        "Add supplier management",
      ],
    },
    {
      title: "Client Portal & Launch",
      tasks: [
        "Build client portal with progress updates",
        "Add document sharing and approvals",
        "Add monitoring, testing, and production deployment",
      ],
    },
  ],
  entities: [
    { name: "Project", description: "Construction project", attributes: ["name", "address", "status", "startDate", "endDate"] },
    { name: "Task", description: "Project task or milestone", attributes: ["title", "assignedTo", "dueDate", "status", "priority"] },
    { name: "Material", description: "Construction material order", attributes: ["name", "quantity", "supplier", "cost", "deliveryDate"] },
    { name: "TeamMember", description: "Project team member", attributes: ["name", "role", "specialty", "hourlyRate"] },
    { name: "Document", description: "Project document or photo", attributes: ["name", "type", "url", "uploadedBy", "uploadedAt"] },
  ],
  relationships: [
    { from: "Project", to: "Task", type: "has", description: "Project has tasks" },
    { from: "Project", to: "Material", type: "requires", description: "Project requires materials" },
    { from: "Task", to: "TeamMember", type: "assigned", description: "Task assigned to team member" },
    { from: "Project", to: "Document", type: "contains", description: "Project contains documents" },
  ],
  architecturePattern: "Client-server with role-based access, file storage, and mobile field reporting",
};

// ── 6. Agency / Service Business ──────────────

const agency: DomainTemplate = {
  name: "agency",
  keywords: [
    "agency", "bureau", "dienstverlening", "service", "consultancy",
    "consulting", "marketing", "design", "development", "creative",
    "digital agency", "webdesign", "communicatie",
  ],
  taglineTemplate: (name: string) =>
    `Agency management platform — ${name} streamlines client projects and team workflows`,
  componentTemplates: [
    "DashboardPage",
    "ClientManagementPage",
    "ProjectOverviewPage",
    "TimeTrackingPage",
    "InvoicePage",
    "TeamSchedulePage",
    "ResourcePlannerPage",
    "ReportPage",
  ],
  dataFlowTemplate:
    "Client inquiry received → project scoped and quoted → team assigned → work tracked with time entries → progress shared with client → invoice generated → payment collected → project closed",
  roadmapPhases: [
    {
      title: "Foundation & Setup",
      tasks: [
        "Initialize project with chosen tech stack",
        "Set up database schema for clients, projects, and invoices",
        "Configure authentication and team roles",
      ],
    },
    {
      title: "Client & Project Management",
      tasks: [
        "Build client management with contact history",
        "Implement project creation and scoping",
        "Add task and milestone tracking",
      ],
    },
    {
      title: "Time Tracking & Invoicing",
      tasks: [
        "Build time tracking with manual and timer modes",
        "Implement invoice generation from time entries",
        "Add expense tracking and reporting",
      ],
    },
    {
      title: "Advanced Features & Launch",
      tasks: [
        "Add resource planning and capacity management",
        "Implement client portal for collaboration",
        "Add monitoring, testing, and production deployment",
      ],
    },
  ],
  entities: [
    { name: "Client", description: "Agency client", attributes: ["name", "company", "email", "phone", "industry"] },
    { name: "Project", description: "Client project", attributes: ["name", "scope", "budget", "status", "deadline"] },
    { name: "TimeEntry", description: "Logged work time", attributes: ["date", "hours", "description", "projectId", "teamMemberId"] },
    { name: "Invoice", description: "Client invoice", attributes: ["number", "amount", "status", "dueDate", "projectId"] },
    { name: "TeamMember", description: "Agency team member", attributes: ["name", "role", "hourlyRate", "capacity"] },
  ],
  relationships: [
    { from: "Client", to: "Project", type: "engages", description: "Client engages projects" },
    { from: "Project", to: "TimeEntry", type: "has", description: "Project has time entries" },
    { from: "Project", to: "Invoice", type: "bills", description: "Project generates invoices" },
    { from: "TeamMember", to: "TimeEntry", type: "logs", description: "Team member logs time entries" },
  ],
  architecturePattern: "Client-server with time tracking, invoicing, and role-based access",
};

// ── 7. Healthcare / Medical ───────────────────

const healthcare: DomainTemplate = {
  name: "healthcare",
  keywords: [
    "healthcare", "medical", "patient", "doctor", "kliniek", "clinical",
    "zorg", "gezondheidszorg", "arts", "patient", "afspraak",
    "ehealth", "telehealth", "medical practice",
  ],
  taglineTemplate: (name: string) =>
    `Healthcare management platform — ${name} simplifies patient care and practice operations`,
  componentTemplates: [
    "DashboardPage",
    "PatientManagementPage",
    "AppointmentCalendarPage",
    "MedicalRecordsPage",
    "PrescriptionPage",
    "BillingPage",
    "ReportPage",
    "TelehealthPage",
  ],
  dataFlowTemplate:
    "Patient registers → appointment scheduled → doctor reviews history → consultation documented → prescription issued → billing processed → follow-up scheduled",
  roadmapPhases: [
    {
      title: "Foundation & Setup",
      tasks: [
        "Initialize project with chosen tech stack",
        "Set up database schema for patients, appointments, and records",
        "Configure authentication and role-based access (HIPAA/GDPR)",
      ],
    },
    {
      title: "Patient & Appointment Management",
      tasks: [
        "Build patient registration and management",
        "Implement appointment scheduling and calendar",
        "Add patient intake forms and consent management",
      ],
    },
    {
      title: "Medical Records & Billing",
      tasks: [
        "Build electronic medical records (EMR) system",
        "Implement prescription management",
        "Add billing and insurance processing",
      ],
    },
    {
      title: "Telehealth & Launch",
      tasks: [
        "Add video consultation capabilities",
        "Implement patient portal and secure messaging",
        "Add monitoring, testing, and production deployment",
      ],
    },
  ],
  entities: [
    { name: "Patient", description: "Healthcare patient", attributes: ["name", "dob", "contactInfo", "medicalHistory", "insuranceId"] },
    { name: "Appointment", description: "Patient appointment", attributes: ["date", "time", "doctorId", "patientId", "status", "type"] },
    { name: "MedicalRecord", description: "Patient medical record", attributes: ["date", "diagnosis", "treatment", "notes", "doctorId"] },
    { name: "Prescription", description: "Medication prescription", attributes: ["medication", "dosage", "duration", "prescribedBy", "refills"] },
    { name: "Doctor", description: "Healthcare provider", attributes: ["name", "specialty", "licenseNumber", "schedule"] },
  ],
  relationships: [
    { from: "Patient", to: "Appointment", type: "schedules", description: "Patient schedules appointments" },
    { from: "Doctor", to: "Appointment", type: "conducts", description: "Doctor conducts appointments" },
    { from: "Patient", to: "MedicalRecord", type: "has", description: "Patient has medical records" },
    { from: "Doctor", to: "Prescription", type: "issues", description: "Doctor issues prescriptions" },
  ],
  architecturePattern: "Secure client-server with HIPAA/GDPR compliance, role-based access, and audit logging",
};

// ── 8. Education / E-Learning ─────────────────

const education: DomainTemplate = {
  name: "education",
  keywords: [
    "education", "learning", "course", "student", "teacher", "school",
    "opleiding", "cursus", "student", "docent", "training",
    "e-learning", "online course", "academy", "classroom",
  ],
  taglineTemplate: (name: string) =>
    `E-learning platform — ${name} makes learning engaging and trackable`,
  componentTemplates: [
    "DashboardPage",
    "CourseCatalogPage",
    "CoursePlayerPage",
    "QuizPage",
    "ProgressTrackerPage",
    "DiscussionForumPage",
    "AdminDashboardPage",
    "CertificatePage",
  ],
  dataFlowTemplate:
    "Student browses courses → enrolls in course → progresses through modules → completes quizzes → earns certificates → instructor tracks cohort progress → analytics updated",
  roadmapPhases: [
    {
      title: "Foundation & Setup",
      tasks: [
        "Initialize project with chosen tech stack",
        "Set up database schema for courses, students, and progress",
        "Configure authentication and role-based access",
      ],
    },
    {
      title: "Course Content Management",
      tasks: [
        "Build course creation and module management",
        "Implement rich content editor (video, text, quizzes)",
        "Add course catalog with search and filters",
      ],
    },
    {
      title: "Student Experience",
      tasks: [
        "Build course player with progress tracking",
        "Implement quiz and assessment engine",
        "Add discussion forums and Q&A",
      ],
    },
    {
      title: "Advanced Features & Launch",
      tasks: [
        "Add certificate generation",
        "Implement analytics and reporting for instructors",
        "Add monitoring, testing, and production deployment",
      ],
    },
  ],
  entities: [
    { name: "Student", description: "Course participant", attributes: ["name", "email", "enrolledCourses", "progress"] },
    { name: "Course", description: "Educational course", attributes: ["title", "description", "category", "difficulty", "duration"] },
    { name: "Module", description: "Course module or lesson", attributes: ["title", "content", "order", "courseId", "type"] },
    { name: "Quiz", description: "Knowledge assessment", attributes: ["title", "questions", "passScore", "moduleId"] },
    { name: "Certificate", description: "Course completion certificate", attributes: ["studentId", "courseId", "issuedAt", "expiresAt"] },
  ],
  relationships: [
    { from: "Student", to: "Course", type: "enrolls", description: "Student enrolls in courses" },
    { from: "Course", to: "Module", type: "contains", description: "Course contains modules" },
    { from: "Module", to: "Quiz", type: "assesses", description: "Module has quizzes" },
    { from: "Student", to: "Certificate", type: "earns", description: "Student earns certificates" },
  ],
  architecturePattern: "Client-server with media streaming, progress tracking, and role-based access",
};

// ── 9. AI SaaS / AI Tool ──────────────────────

// ── 9a. AI SaaS — Generic AI Tool ──────────────

const aiSaaS: DomainTemplate = {
  name: "ai-saas",
  keywords: [
    "artificial intelligence", "machine learning", "llm", "gpt",
    "chatbot", "deep learning", "nlp", "computer vision",
  ],
  // Strong keywords (2 points each) — specific AI SaaS signals
  strongKeywords: [
    "support ticket", "chatbot", "model training", "ai agent",
    "llm workflow", "prompt management", "fine-tuning",
    "conversation summary", "reply suggestion", "ai model",
    "training pipeline", "api key management", "usage tracking",
    "model deployment", "inference", "vector search",
    "rag", "retrieval augmented generation", "embedding",
  ],
  // Weak keywords (0.5 points each) — broad terms that alone shouldn't match
  weakKeywords: [
    "ai", "smart", "intelligent", "automation", "ml",
    "predictive", "neural",
  ],
  taglineTemplate: (name: string) =>
    `AI-powered platform — ${name} brings intelligent automation to your workflow`,
  componentTemplates: [
    "DashboardPage",
    "AIChatInterface",
    "ModelManagementPage",
    "TrainingPipelinePage",
    "ResultsViewerPage",
    "ApiKeyManagementPage",
    "UsageAnalyticsPage",
    "SettingsPage",
  ],
  dataFlowTemplate:
    "User inputs data → AI model processes → results returned with confidence scores → user reviews and refines → feedback loop improves model → usage tracked and billed",
  roadmapPhases: [
    {
      title: "Foundation & Setup",
      tasks: [
        "Initialize project with chosen tech stack",
        "Set up AI model serving infrastructure",
        "Configure API gateway and authentication",
      ],
    },
    {
      title: "Core AI Features",
      tasks: [
        "Build AI model interface and prompt management",
        "Implement result processing and confidence scoring",
        "Add batch processing and queue management",
      ],
    },
    {
      title: "User Management & Billing",
      tasks: [
        "Build API key management and rate limiting",
        "Implement usage tracking and analytics",
        "Add subscription and billing integration",
      ],
    },
    {
      title: "Advanced Features & Launch",
      tasks: [
        "Add model fine-tuning and customization",
        "Implement feedback loop for model improvement",
        "Add monitoring, testing, and production deployment",
      ],
    },
  ],
  entities: [
    { name: "User", description: "Platform user", attributes: ["name", "email", "apiKey", "tier", "usage"] },
    { name: "Model", description: "AI model deployment", attributes: ["name", "version", "provider", "parameters", "status"] },
    { name: "Prompt", description: "AI prompt or input", attributes: ["content", "modelId", "userId", "tokens", "createdAt"] },
    { name: "Result", description: "AI model output", attributes: ["promptId", "output", "confidence", "latency", "tokensUsed"] },
    { name: "UsageRecord", description: "API usage record", attributes: ["userId", "modelId", "tokens", "cost", "timestamp"] },
  ],
  relationships: [
    { from: "User", to: "Prompt", type: "creates", description: "User creates prompts" },
    { from: "Prompt", to: "Model", type: "targets", description: "Prompt targets a model" },
    { from: "Prompt", to: "Result", type: "produces", description: "Prompt produces results" },
    { from: "User", to: "UsageRecord", type: "generates", description: "User generates usage records" },
  ],
  architecturePattern: "Cloud-native SaaS with AI model serving, API gateway, and usage-based billing",
};

// ── 9b. AI SaaS — Support Platform ─────────────

const aiSaaSSupport: DomainTemplate = {
  name: "ai-saas/support-platform",
  keywords: [
    "artificial intelligence", "machine learning", "llm", "gpt",
    "chatbot", "deep learning", "nlp", "computer vision",
    "customer support", "helpdesk", "help desk", "customer service",
    "ticketing", "reply suggestions",
    "conversation summaries", "support agents",
  ],
  // Strong keywords (2 points each) — specific support platform signals
  strongKeywords: [
    "support ticket", "ticketing system", "helpdesk", "help desk",
    "customer support", "reply suggestion", "conversation summary",
    "support agent", "ticket management", "customer service",
    "ticket inbox", "email integration", "multi-tenant workspace",
  ],
  // Weak keywords (0.5 points each) — broad terms
  weakKeywords: [
    "ai", "smart", "intelligent", "automation", "ml",
    "support", "ticket", "help",
  ],
  taglineTemplate: (name: string) =>
    `AI-powered support platform — ${name} helps support teams resolve tickets faster`,
  componentTemplates: [
    "DashboardPage",
    "TicketInboxPage",
    "TicketDetailPage",
    "ConversationSummaryPanel",
    "ReplySuggestionPanel",
    "TeamManagementPage",
    "AnalyticsPage",
    "SettingsPage",
  ],
  dataFlowTemplate:
    "Customer submits ticket → AI categorizes and prioritizes → support agent reviews → AI suggests reply → agent approves or edits → customer receives response → conversation summarized → analytics updated",
  roadmapPhases: [
    {
      title: "Foundation",
      tasks: [
        "Initialize project with chosen tech stack",
        "Set up database schema for tickets, workspaces, and users",
        "Configure authentication and multi-tenant workspaces",
        "Set up CI/CD pipeline and development tooling",
      ],
    },
    {
      title: "Auth & Workspaces",
      tasks: [
        "Implement authentication with Clerk",
        "Build multi-tenant workspace management",
        "Add team management and role-based access",
        "Create onboarding flow for new workspaces",
      ],
    },
    {
      title: "Ticket Inbox",
      tasks: [
        "Build email integration for ticket ingestion",
        "Create ticket management UI with status workflows",
        "Implement search, filtering, and sorting",
        "Add ticket assignment and collaboration features",
      ],
    },
    {
      title: "AI Assistance",
      tasks: [
        "Implement AI-powered reply suggestions",
        "Build conversation summarization feature",
        "Add sentiment analysis and auto-tagging",
        "Create AI model management and configuration",
      ],
    },
    {
      title: "Analytics & Integrations",
      tasks: [
        "Build analytics dashboard with key metrics",
        "Implement Slack and Teams integrations",
        "Add webhook API for custom integrations",
        "Create export and reporting functionality",
      ],
    },
    {
      title: "Production Launch",
      tasks: [
        "Performance optimization and load testing",
        "Security audit and compliance review",
        "Write documentation and onboarding guides",
        "Production deployment and monitoring setup",
      ],
    },
  ],
  entities: [
    { name: "Workspace", description: "Multi-tenant organization", attributes: ["name", "slug", "plan", "settings"] },
    { name: "User", description: "Platform user (support agent or admin)", attributes: ["name", "email", "role", "workspaceId"] },
    { name: "Ticket", description: "Customer support ticket", attributes: ["subject", "status", "priority", "assigneeId", "customerEmail", "createdAt"] },
    { name: "Conversation", description: "Ticket conversation thread", attributes: ["ticketId", "messages", "summary", "sentiment"] },
    { name: "ReplySuggestion", description: "AI-generated reply suggestion", attributes: ["ticketId", "content", "confidence", "accepted"] },
    { name: "Integration", description: "External service integration", attributes: ["type", "config", "enabled", "workspaceId"] },
  ],
  relationships: [
    { from: "Workspace", to: "User", type: "has", description: "Workspace has users" },
    { from: "Workspace", to: "Ticket", type: "owns", description: "Workspace owns tickets" },
    { from: "Ticket", to: "Conversation", type: "has", description: "Ticket has conversations" },
    { from: "Ticket", to: "ReplySuggestion", type: "generates", description: "Ticket generates reply suggestions" },
    { from: "Workspace", to: "Integration", type: "configures", description: "Workspace configures integrations" },
  ],
  architecturePattern: "Multi-tenant SaaS with AI-powered features, email integration, and real-time updates",
};

// ── 10. Emulator / Retro Gaming ───────────────

const emulator: DomainTemplate = {
  name: "emulator",
  keywords: [
    "emulator", "emulation", "rom", "game boy", "gba", "nes", "snes",
    "nintendo", "retro", "gaming", "console", "simulator",
    "gameboy", "gameboy advance", "n64", "sega",
  ],
  taglineTemplate: (name: string) =>
    `Retro gaming emulator — ${name} brings classic games to modern devices`,
  componentTemplates: [
    "HomePage",
    "GameLibraryPage",
    "EmulatorCorePage",
    "RomManagerPage",
    "SaveStatePage",
    "ControllerConfigPage",
    "SettingsPage",
  ],
  dataFlowTemplate:
    "User launches app → browses game library → selects ROM → emulator core loads → game renders with audio/video → user plays with mapped controls → save state created → progress persisted",
  roadmapPhases: [
    {
      title: "Foundation & Setup",
      tasks: [
        "Initialize project with chosen tech stack",
        "Set up emulator core integration",
        "Configure ROM loading and file management",
      ],
    },
    {
      title: "Core Emulation Features",
      tasks: [
        "Build game library with metadata scraping",
        "Implement emulator core with save states",
        "Add controller mapping and input handling",
      ],
    },
    {
      title: "User Experience",
      tasks: [
        "Build save state management UI",
        "Implement cheat code support",
        "Add display filters and scaling options",
      ],
    },
    {
      title: "Advanced Features & Launch",
      tasks: [
        "Add multiplayer/netplay support",
        "Implement achievement system",
        "Add monitoring, testing, and production deployment",
      ],
    },
  ],
  entities: [
    { name: "Game", description: "ROM game entry", attributes: ["title", "platform", "genre", "year", "filePath"] },
    { name: "SaveState", description: "Game save state", attributes: ["gameId", "slot", "timestamp", "screenshot"] },
    { name: "EmulatorCore", description: "Emulator engine", attributes: ["name", "version", "platform", "compatibility"] },
    { name: "ControllerProfile", description: "Controller mapping", attributes: ["name", "mappings", "deviceType"] },
    { name: "Cheat", description: "Cheat code entry", attributes: ["gameId", "name", "code", "enabled"] },
  ],
  relationships: [
    { from: "Game", to: "SaveState", type: "has", description: "Game has save states" },
    { from: "Game", to: "EmulatorCore", type: "runs_on", description: "Game runs on emulator core" },
    { from: "Game", to: "Cheat", type: "supports", description: "Game supports cheat codes" },
    { from: "User", to: "ControllerProfile", type: "configures", description: "User configures controller profiles" },
  ],
  architecturePattern: "Desktop application with plugin-based emulator cores and local file storage",
};

// ── 11. Plumbing / HVAC / Trade Services ──────

const plumbing: DomainTemplate = {
  name: "plumbing",
  keywords: [
    "plumbing", "loodgieter", "hvac", "verwarming", "installation",
    "reparatie", "onderhoud", "service", "monteur", "installateur",
    "cv", "ketel", "boiler", "water", "gas",
    "trade service", "field service", "klus",
  ],
  taglineTemplate: (name: string) =>
    `Trade service management — ${name} helps plumbing and HVAC pros run their business`,
  componentTemplates: [
    "DashboardPage",
    "JobManagementPage",
    "ScheduleCalendarPage",
    "CustomerManagementPage",
    "InventoryPage",
    "InvoicePage",
    "TeamPage",
    "ReportPage",
  ],
  dataFlowTemplate:
    "Customer requests service → job created and scheduled → technician dispatched → job completed on site → invoice generated → payment collected → customer follow-up scheduled",
  roadmapPhases: [
    {
      title: "Foundation & Setup",
      tasks: [
        "Initialize project with chosen tech stack",
        "Set up database schema for jobs, customers, and inventory",
        "Configure authentication and role-based access",
      ],
    },
    {
      title: "Core Job Management",
      tasks: [
        "Build job creation and scheduling",
        "Implement calendar view with drag-and-drop",
        "Add technician assignment and dispatch",
      ],
    },
    {
      title: "Customer & Invoicing",
      tasks: [
        "Build customer management with history",
        "Implement invoicing and payment tracking",
        "Add inventory and parts management",
      ],
    },
    {
      title: "Advanced Features & Launch",
      tasks: [
        "Add customer portal and self-service",
        "Implement reporting and analytics",
        "Add monitoring, testing, and production deployment",
      ],
    },
  ],
  entities: [
    { name: "Customer", description: "Service customer", attributes: ["name", "address", "phone", "email", "propertyType"] },
    { name: "Job", description: "Service job or work order", attributes: ["title", "description", "status", "priority", "scheduledDate"] },
    { name: "Technician", description: "Field service technician", attributes: ["name", "specialty", "phone", "schedule"] },
    { name: "Part", description: "Inventory part or material", attributes: ["name", "sku", "quantity", "cost", "supplier"] },
    { name: "Invoice", description: "Customer invoice", attributes: ["number", "amount", "status", "dueDate", "jobId"] },
  ],
  relationships: [
    { from: "Customer", to: "Job", type: "requests", description: "Customer requests jobs" },
    { from: "Job", to: "Technician", type: "assigned", description: "Job assigned to technician" },
    { from: "Job", to: "Part", type: "uses", description: "Job uses parts" },
    { from: "Job", to: "Invoice", type: "generates", description: "Job generates invoice" },
  ],
  architecturePattern: "Client-server with mobile field reporting, scheduling, and invoicing",
};

// ── 12. Project Management ─────────────────────

const projectManagement: DomainTemplate = {
  name: "project-management",
  keywords: [
    "project management", "project", "task", "team", "sprint",
    "agile", "scrum", "kanban", "board", "workflow",
    "projectmanager", "taak", "samenwerking",
  ],
  taglineTemplate: (name: string) =>
    `Project management platform — ${name} helps teams stay organized and deliver on time`,
  componentTemplates: [
    "DashboardPage",
    "BoardViewPage",
    "TaskDetailPage",
    "TimelinePage",
    "TeamPage",
    "ReportPage",
    "SettingsPage",
  ],
  dataFlowTemplate:
    "Project manager creates project → defines tasks and milestones → team members assigned → work tracked on board → progress updated → reports generated → project completed",
  roadmapPhases: [
    {
      title: "Foundation & Setup",
      tasks: [
        "Initialize project with chosen tech stack",
        "Set up database schema for projects, tasks, and teams",
        "Configure authentication and role-based access",
      ],
    },
    {
      title: "Core Project Features",
      tasks: [
        "Build project creation and management",
        "Implement task board with drag-and-drop",
        "Add task detail view with comments",
      ],
    },
    {
      title: "Team & Collaboration",
      tasks: [
        "Build team management and permissions",
        "Implement real-time collaboration",
        "Add notifications and activity feed",
      ],
    },
    {
      title: "Advanced Features & Launch",
      tasks: [
        "Add timeline and Gantt chart view",
        "Implement reporting and export",
        "Add monitoring, testing, and production deployment",
      ],
    },
  ],
  entities: [
    { name: "Project", description: "Project entity", attributes: ["name", "description", "status", "startDate", "endDate"] },
    { name: "Task", description: "Project task", attributes: ["title", "description", "status", "priority", "assigneeId", "dueDate"] },
    { name: "Team", description: "Project team", attributes: ["name", "members", "projectId"] },
    { name: "Comment", description: "Task comment", attributes: ["content", "authorId", "taskId", "createdAt"] },
    { name: "Attachment", description: "Task attachment", attributes: ["name", "url", "type", "taskId"] },
  ],
  relationships: [
    { from: "Project", to: "Task", type: "has", description: "Project has tasks" },
    { from: "Project", to: "Team", type: "has", description: "Project has teams" },
    { from: "Task", to: "Comment", type: "has", description: "Task has comments" },
    { from: "Task", to: "Attachment", type: "contains", description: "Task contains attachments" },
  ],
  architecturePattern: "Client-server with real-time updates, drag-and-drop boards, and role-based access",
};

// ── 13. Travel / Hospitality ───────────────────

const travel: DomainTemplate = {
  name: "travel",
  keywords: [
    "travel", "reis", "vakantie", "hotel", "booking", "flight",
    "vlucht", "bestemming", "destination", "trip", "tour",
    "accommodatie", "verblijf", "vakantiehuis",
  ],
  taglineTemplate: (name: string) =>
    `Travel platform — ${name} makes trip planning and booking effortless`,
  componentTemplates: [
    "HomePage",
    "SearchResultsPage",
    "ListingDetailPage",
    "BookingPage",
    "TripDashboardPage",
    "UserProfilePage",
    "ReviewPage",
  ],
  dataFlowTemplate:
    "User searches destinations → browses listings → views details → books accommodation → payment processed → trip confirmed → review left after stay",
  roadmapPhases: [
    {
      title: "Foundation & Setup",
      tasks: [
        "Initialize project with chosen tech stack",
        "Set up database schema for listings, bookings, and users",
        "Configure authentication and payment integration",
      ],
    },
    {
      title: "Core Travel Features",
      tasks: [
        "Build search with filters and maps",
        "Implement listing detail pages",
        "Add booking and reservation system",
      ],
    },
    {
      title: "User Experience",
      tasks: [
        "Build trip dashboard and itinerary",
        "Implement reviews and ratings",
        "Add wishlist and favorites",
      ],
    },
    {
      title: "Advanced Features & Launch",
      tasks: [
        "Add multi-currency and localization",
        "Implement partner/owner dashboard",
        "Add monitoring, testing, and production deployment",
      ],
    },
  ],
  entities: [
    { name: "Listing", description: "Travel accommodation or experience", attributes: ["name", "type", "location", "price", "capacity"] },
    { name: "Booking", description: "Reservation record", attributes: ["listingId", "userId", "checkIn", "checkOut", "status", "total"] },
    { name: "User", description: "Platform user", attributes: ["name", "email", "preferences", "loyaltyPoints"] },
    { name: "Review", description: "Stay or experience review", attributes: ["rating", "comment", "listingId", "userId", "date"] },
    { name: "Payment", description: "Booking payment", attributes: ["bookingId", "amount", "method", "status", "timestamp"] },
  ],
  relationships: [
    { from: "User", to: "Booking", type: "makes", description: "User makes bookings" },
    { from: "Booking", to: "Listing", type: "books", description: "Booking reserves listing" },
    { from: "Booking", to: "Payment", type: "has", description: "Booking has payment" },
    { from: "User", to: "Review", type: "writes", description: "User writes reviews" },
  ],
  architecturePattern: "Client-server with search index, payment gateway, and multi-currency support",
};

// ── 14. Solar Energy / Renewable Energy ────────

const solarEnergy: DomainTemplate = {
  name: "solar-energy",
  keywords: [
    "solar", "zonne-energie", "zonnepaneel", "panel", "energy",
    "energie", "renewable", "duurzaam", "sustainable", "green",
    "pv", "photovoltaic", "omvormer", "inverter", "solar panel",
    "solar installation", "zonne",
  ],
  taglineTemplate: (name: string) =>
    `Solar energy management — ${name} helps you monitor and optimize your solar installation`,
  componentTemplates: [
    "DashboardPage",
    "EnergyProductionPage",
    "PanelMonitorPage",
    "BatteryStatusPage",
    "ConsumptionPage",
    "SavingsReportPage",
    "AlertPage",
    "SettingsPage",
  ],
  dataFlowTemplate:
    "Solar panels generate DC → inverter converts to AC → energy monitored in real-time → consumption tracked → excess exported to grid → savings calculated → alerts triggered on anomalies",
  roadmapPhases: [
    {
      title: "Foundation & Setup",
      tasks: [
        "Initialize project with chosen tech stack",
        "Set up database schema for panels, production, and consumption",
        "Configure real-time data ingestion from inverters",
      ],
    },
    {
      title: "Core Monitoring Features",
      tasks: [
        "Build real-time energy production dashboard",
        "Implement panel-level monitoring",
        "Add consumption tracking and comparison",
      ],
    },
    {
      title: "Analytics & Savings",
      tasks: [
        "Build savings and ROI calculator",
        "Implement historical production reports",
        "Add weather-based production forecasting",
      ],
    },
    {
      title: "Advanced Features & Launch",
      tasks: [
        "Add battery storage management",
        "Implement alert system for anomalies",
        "Add monitoring, testing, and production deployment",
      ],
    },
  ],
  entities: [
    { name: "Panel", description: "Solar panel unit", attributes: ["id", "model", "capacity", "efficiency", "installationDate"] },
    { name: "Production", description: "Energy production record", attributes: ["panelId", "timestamp", "watts", "voltage", "temperature"] },
    { name: "Consumption", description: "Energy consumption record", attributes: ["timestamp", "watts", "source", "cost"] },
    { name: "Inverter", description: "Solar inverter", attributes: ["model", "status", "efficiency", "lastMaintenance"] },
    { name: "Alert", description: "System alert or anomaly", attributes: ["type", "severity", "message", "timestamp", "resolved"] },
  ],
  relationships: [
    { from: "Panel", to: "Production", type: "generates", description: "Panel generates production data" },
    { from: "Panel", to: "Inverter", type: "connected_to", description: "Panel connected to inverter" },
    { from: "Production", to: "Consumption", type: "offsets", description: "Production offsets consumption" },
    { from: "System", to: "Alert", type: "triggers", description: "System triggers alerts" },
  ],
  architecturePattern: "IoT-enabled monitoring system with real-time data ingestion, analytics, and alerting",
};

// ── 15. Website / Landing Page ─────────────────

const website: DomainTemplate = {
  name: "website",
  keywords: [
    "website", "landing page", "webpage", "site", "web",
    "portfolio", "blog", "homepage", "web presence",
    "online presence", "bedrijfswebsite", "website bouwen",
  ],
  taglineTemplate: (name: string) =>
    `Professional website — ${name} establishes your online presence`,
  componentTemplates: [
    "HomePage",
    "AboutPage",
    "ServicesPage",
    "ContactPage",
    "BlogPage",
    "PortfolioPage",
    "FAQPage",
  ],
  dataFlowTemplate:
    "Visitor lands on homepage → browses content → reads about services → views portfolio → submits contact form → inquiry received by owner",
  roadmapPhases: [
    {
      title: "Foundation & Setup",
      tasks: [
        "Initialize project with chosen tech stack",
        "Set up routing and page structure",
        "Configure SEO meta tags and analytics",
      ],
    },
    {
      title: "Core Pages",
      tasks: [
        "Build homepage with hero section",
        "Implement about and services pages",
        "Add contact form with validation",
      ],
    },
    {
      title: "Content & Blog",
      tasks: [
        "Build blog with CMS integration",
        "Implement portfolio/gallery section",
        "Add FAQ accordion component",
      ],
    },
    {
      title: "Polish & Launch",
      tasks: [
        "Add animations and transitions",
        "Implement responsive design tweaks",
        "Add monitoring, testing, and production deployment",
      ],
    },
  ],
  entities: [
    { name: "Page", description: "Website page", attributes: ["title", "slug", "content", "metaDescription"] },
    { name: "BlogPost", description: "Blog article", attributes: ["title", "content", "author", "publishedAt", "tags"] },
    { name: "ContactSubmission", description: "Contact form submission", attributes: ["name", "email", "message", "submittedAt"] },
    { name: "PortfolioItem", description: "Portfolio project", attributes: ["title", "description", "images", "url"] },
  ],
  relationships: [
    { from: "Visitor", to: "ContactSubmission", type: "submits", description: "Visitor submits contact form" },
    { from: "Author", to: "BlogPost", type: "writes", description: "Author writes blog posts" },
  ],
  architecturePattern: "Static or server-rendered website with CMS integration and SEO optimization",
};

// ── 16. Generic / Fallback ─────────────────────

const generic: DomainTemplate = {
  name: "generic",
  keywords: [],
  taglineTemplate: (name: string) =>
    `${name} — a custom software project`,
  componentTemplates: [
    "HomePage",
    "DashboardPage",
    "SettingsPage",
  ],
  dataFlowTemplate:
    "User interacts with application → data processed → results displayed → actions logged",
  roadmapPhases: [
    {
      title: "Foundation & Setup",
      tasks: [
        "Initialize project with chosen tech stack",
        "Set up database schema and authentication",
        "Configure development tooling and CI/CD",
      ],
    },
    {
      title: "Core Features",
      tasks: [
        "Build main application features",
        "Implement user interface and navigation",
        "Add data management and storage",
      ],
    },
    {
      title: "Testing & Launch",
      tasks: [
        "Write tests and perform QA",
        "Optimize performance and security",
        "Deploy to production and monitor",
      ],
    },
  ],
  entities: [
    { name: "User", description: "Application user", attributes: ["name", "email", "role", "createdAt"] },
    { name: "Record", description: "Generic data record", attributes: ["id", "data", "createdAt", "updatedAt"] },
  ],
  relationships: [
    { from: "User", to: "Record", type: "manages", description: "User manages records" },
  ],
  architecturePattern: "Standard client-server architecture with authentication and data persistence",
};

// ── Registry ──────────────────────────────────

export const ALL_DOMAINS: DomainTemplate[] = [

  marketplace,
  restaurant,
  crm,
  fitness,
  construction,
  agency,
  healthcare,
  education,
  aiSaaS,
  aiSaaSSupport,
  emulator,
  plumbing,
  projectManagement,
  travel,
  solarEnergy,
  website,
  generic,
];

// ── Helpers ────────────────────────────────────

/**
 * Get a domain template by name.
 */
export function getDomainTemplate(name: string): DomainTemplate {
  return ALL_DOMAINS.find((d) => d.name === name) ?? generic;
}

/**
 * Get all registered domain names.
 */
export function getDomainNames(): string[] {
  return ALL_DOMAINS.map((d) => d.name);
}

/**
 * Minimum confidence score for a domain template to be selected.
 *
 * A score of 1.0 means at least 1 regular keyword match is required before a
 * template is chosen. Below this threshold, the generic fallback is used —
 * preventing unknown domains from inheriting an unrelated template.
 *
 * This implements the "generic-first" fallback philosophy:
 *   "Is there sufficient evidence for a template?" not "Which template fits best?"
 *
 * Rationale for 1.0:
 *   - A single keyword match (e.g., "restaurant", "loodgieter") is sufficient
 *     evidence for a clear domain signal.
 *   - Zero matches means the input has no domain-specific keywords at all,
 *     which is the case for unknown domains like reef restoration, aerospace
 *     analytics, carbon accounting, etc.
 *   - The ai-saas guard (strongKeywords check) is separate and stricter.
 */
const MIN_CONFIDENCE_SCORE = 1.0;

/**
 * Detect the best-matching domain from raw text using weighted keyword scoring.
 *
 * Scoring:
 *   - strongKeywords: 2 points each
 *   - keywords: 1 point each
 *   - weakKeywords: 0.5 points each
 *
 * ai-saas and ai-saas/support-platform require at least 1 strong keyword match
 * OR a total score >= 4.0 to prevent false positives from broad terms.
 *
 * Generic-first fallback:
 *   If the best score is below MIN_CONFIDENCE_SCORE (2.0), return generic.
 *   This prevents unknown domains (reef restoration, aerospace analytics, etc.)
 *   from inheriting an unrelated template like project-management or crm.
 */
export function detectDomainFromText(text: string): DomainTemplate {
  const lower = text.toLowerCase();

  let bestMatch: DomainTemplate = generic;
  let bestScore = 0;

  for (const domain of ALL_DOMAINS) {
    let score = 0;
    let strongMatches = 0;

    // Strong keywords (2 points each)
    if (domain.strongKeywords) {
      for (const kw of domain.strongKeywords) {
        if (lower.includes(kw.toLowerCase())) {
          score += 2;
          strongMatches++;
        }
      }
    }

    // Regular keywords (1 point each)
    for (const kw of domain.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += 1;
      }
    }

    // Weak keywords (0.5 points each)
    if (domain.weakKeywords) {
      for (const kw of domain.weakKeywords) {
        if (lower.includes(kw.toLowerCase())) {
          score += 0.5;
        }
      }
    }

    // ai-saas and ai-saas/support-platform require at least 1 strong keyword
    // OR total score >= 4.0 to prevent false positives
    if (domain.name === "ai-saas" || domain.name === "ai-saas/support-platform") {
      if (strongMatches === 0 && score < 4.0) {
        continue; // Skip — not enough evidence
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = domain;
    }
  }

  // Generic-first fallback: only use a template if there's sufficient evidence
  if (bestScore < MIN_CONFIDENCE_SCORE) {
    return generic;
  }

  return bestMatch;
}

