// Sample workspace for the home floor. Invented, publishable content only.
// Same shape as src/lib/data returns, so the floor can switch to the database
// without its components changing.
import type {
  Assessor,
  AssessorNote,
  Board,
  DocumentSummary,
  FeedbackReport,
  PitchSession,
  Project,
  Review,
  Workspace,
} from "../src/lib/schemas";
import { attemptFromPitch, attemptFromReview, withAttempt } from "../src/lib/engine/memory";

const preset = (a: Omit<Assessor, "isPreset" | "personality"> & { personality?: string }): Assessor => ({
  personality: "",
  isPreset: true,
  ...a,
});

export const sampleAssessors: Assessor[] = [
  preset({ id: "module-lead", name: "Prof. Alan Marsh", field: "Biomedical engineering", role: "Module Lead", harshness: 3, focusAreas: ["Mark scheme", "Handbook requirements"], avatar: "avatar-006" }),
  preset({ id: "methodologist", name: "Dr Raj Patel", field: "Experimental design", role: "Methodologist", harshness: 4, focusAreas: ["Sample size", "Controls", "Analysis"], avatar: "avatar-012" }),
  preset({ id: "literature-hawk", name: "Dr Amara Osei", field: "Related work", role: "Literature Hawk", harshness: 3, focusAreas: ["Citations", "Novelty"], avatar: "avatar-008" }),
  preset({ id: "communicator", name: "Sophie Lang", field: "Scientific writing", role: "Communicator", harshness: 2, focusAreas: ["Structure", "Flow", "Clarity"], avatar: "avatar-014" }),
  preset({ id: "outsider", name: "Marcus Reid", field: "Medical device industry", role: "Outsider", harshness: 3, focusAreas: ["Cost", "Adoption", "Market"], avatar: "avatar-016" }),
  preset({ id: "sceptic", name: "Dr Nina Volkova", field: "Clinical research", role: "Sceptic", harshness: 5, focusAreas: ["Weakest claim", "Bias"], avatar: "avatar-004" }),
  preset({ id: "technical-judge", name: "Dr Ezra Cole", field: "Software engineering", role: "Technical Judge", harshness: 4, focusAreas: ["Architecture", "What actually works"], avatar: "avatar-027" }),
  preset({ id: "education-lead", name: "Prof. Hana Ito", field: "Learning design", role: "Education Lead", harshness: 3, focusAreas: ["Student benefit", "Evidence of learning"], avatar: "avatar-048" }),
  preset({ id: "investor", name: "Tom Achebe", field: "Early-stage venture", role: "Investor", harshness: 4, focusAreas: ["Market", "Who pays"], avatar: "avatar-064" }),
  preset({ id: "design-judge", name: "Mira Santos", field: "Product design", role: "Design Judge", harshness: 3, focusAreas: ["Clarity", "Craft", "Consistency"], avatar: "avatar-035" }),
];

export const sampleNotes: AssessorNote[] = [
  { id: "n1", assessorId: "module-lead", text: "Wants safety considered in the design, even where the handbook does not ask for it.", source: "lecture", createdAt: "2026-10-08T11:00:00Z" },
  { id: "n2", assessorId: "module-lead", text: "Marks down any figure without a caption that says what to look at.", source: "lecture", createdAt: "2026-10-22T11:00:00Z" },
  { id: "n3", assessorId: "module-lead", text: "Methods must justify the sample size.", source: "handbook", createdAt: "2026-09-30T09:00:00Z" },
  { id: "n4", assessorId: "methodologist", text: "Asks for effect sizes, not only p-values.", source: "lecture", createdAt: "2026-10-15T14:00:00Z" },
  { id: "n5", assessorId: "technical-judge", text: "Wants to see the live product, not slides about it.", source: "other", createdAt: "2026-11-13T18:00:00Z" },
];

export const sampleBoards: Board[] = [
  { id: "board-mt", name: "Thesis markers", assessorIds: ["module-lead", "methodologist", "literature-hawk", "sceptic"] },
  { id: "board-lr", name: "Lab report markers", assessorIds: ["methodologist", "communicator"] },
  { id: "board-hp", name: "Pitch judges", assessorIds: ["technical-judge", "education-lead", "investor", "design-judge"] },
  { id: "board-rp", name: "Proposal readers", assessorIds: ["module-lead", "outsider", "communicator"] },
];

const brief = (what: string, topic: string, graded: string[], goal: string) => ({ what, topic, graded, goal });

const projectsBase: Omit<Project, "memory">[] = [
  {
    id: "proj-mt",
    title: "Master's Thesis",
    template: "masters-report",
    brief: brief("MSc thesis", "A graded compression wrap for venous leg ulcers", ["Methods", "Analysis", "Writing"], "A distinction"),
    deadline: "2027-01-09T12:00:00Z",
    markSchemeText: "Sample mark scheme: aims, methods, analysis, discussion, presentation.",
    weakSpots: ["Sample size", "Discussion is thin"],
    boardId: "board-mt",
    createdAt: "2026-09-20T10:00:00Z",
    updatedAt: "2026-11-14T09:40:00Z",
  },
  {
    id: "proj-lr",
    title: "Lab Report Series",
    template: "lab-report",
    brief: brief("Weekly lab reports", "Additive manufacturing of lattice samples", ["Method", "Results", "Error analysis"], "Clear, complete reports"),
    deadline: "2026-11-20T15:00:00Z",
    markSchemeText: "",
    weakSpots: ["Error bars"],
    boardId: "board-lr",
    createdAt: "2026-10-01T10:00:00Z",
    updatedAt: "2026-11-13T17:00:00Z",
  },
  {
    id: "proj-hp",
    title: "Hackathon Pitch",
    template: "pitch",
    brief: brief("Five-minute pitch and Q&A", "Panel: a board of AI assessors", ["Originality", "Relevance", "Design", "Presentation"], "Win the design prize"),
    deadline: "2026-11-15T13:00:00Z",
    markSchemeText: "Sample judging criteria: originality, relevance, industry application, design, presentation.",
    weakSpots: ["Running over time"],
    boardId: "board-hp",
    createdAt: "2026-11-01T10:00:00Z",
    updatedAt: "2026-11-13T21:00:00Z",
  },
  {
    id: "proj-rp",
    title: "Research Proposal",
    template: "masters-report",
    brief: brief("PhD application proposal", "Low-cost pressure sensing", ["Novelty", "Feasibility"], "A funded place"),
    deadline: null,
    markSchemeText: "",
    weakSpots: [],
    boardId: "board-rp",
    createdAt: "2026-11-10T10:00:00Z",
    updatedAt: "2026-11-10T10:00:00Z",
  },
];

export const sampleDocuments: DocumentSummary[] = [
  { id: "doc-mt-ch2", projectId: "proj-mt", title: "Chapter 2 draft", createdAt: "2026-10-12T09:00:00Z" },
  { id: "doc-mt-lit", projectId: "proj-mt", title: "Literature review", createdAt: "2026-11-05T09:00:00Z" },
  { id: "doc-mt-ch3", projectId: "proj-mt", title: "Chapter 3 Methods", createdAt: "2026-11-14T09:30:00Z" },
  { id: "doc-lr-1", projectId: "proj-lr", title: "Lab report · draft 1", createdAt: "2026-10-20T09:00:00Z" },
  { id: "doc-lr-2", projectId: "proj-lr", title: "Lab report · draft 2", createdAt: "2026-11-13T17:00:00Z" },
];

const action = (id: string, what: string, raisedBy: string[], effort: "quick" | "moderate" | "substantial", done = false) => ({
  id,
  what,
  why: "",
  raisedBy,
  evidence: { paragraphIds: ["p2"], quote: null },
  effort,
  done,
});

const reportBase = (verdict: string): FeedbackReport => ({
  kind: "report",
  verdict,
  criteria: [],
  strengths: [],
  actions: [],
  assessorVerdicts: [],
  escalations: [],
  sinceLastTime: null,
  likelyQuestions: null,
  delivery: null,
  questionReview: null,
});

export const sampleReviews: Review[] = [
  {
    id: "rev-mt-1",
    projectId: "proj-mt",
    documentId: "doc-mt-ch2",
    createdAt: "2026-10-12T10:00:00Z",
    status: "done",
    assessorResults: [],
    replySource: "sample",
    deliberation: null,
    report: {
      ...reportBase("A solid chapter with a clear aim. The board wants the gap in the literature stated earlier."),
      actions: [action("a1", "State the gap in the first paragraph", ["literature-hawk"], "quick", true)],
    },
  },
  {
    id: "rev-mt-2",
    projectId: "proj-mt",
    documentId: "doc-mt-lit",
    createdAt: "2026-11-05T10:00:00Z",
    status: "done",
    assessorResults: [],
    replySource: "sample",
    deliberation: null,
    report: {
      ...reportBase("The review covers the field but reads as a list. Group the studies by the question they answer."),
      actions: [
        action("a1", "Group studies by question, not by year", ["literature-hawk", "module-lead"], "moderate"),
        action("a2", "Say why twelve participants is enough", ["methodologist", "sceptic"], "quick"),
        action("a3", "Cut the history section to one paragraph", ["module-lead"], "quick"),
        action("a4", "Add the 2024 meta-analysis", ["literature-hawk"], "quick", true),
      ],
      likelyQuestions: [
        { assessorId: "sceptic", question: "Why twelve participants?" },
        { assessorId: "methodologist", question: "Walk us through the randomisation." },
        { assessorId: "literature-hawk", question: "What does this add to the 2024 review?" },
        { assessorId: "module-lead", question: "What would you cut?" },
      ],
    },
  },
  {
    id: "rev-mt-3",
    projectId: "proj-mt",
    documentId: "doc-mt-ch3",
    createdAt: "2026-11-14T09:40:00Z",
    status: "running",
    assessorResults: [],
    replySource: "sample",
    deliberation: null,
    report: null,
  },
  {
    id: "rev-lr-1",
    projectId: "proj-lr",
    documentId: "doc-lr-1",
    createdAt: "2026-10-20T10:00:00Z",
    status: "done",
    assessorResults: [],
    replySource: "sample",
    deliberation: null,
    report: {
      ...reportBase("Results are clear. The error analysis needs to say where the uncertainty comes from."),
      actions: [
        action("a1", "Add error bars to figure 2", ["methodologist"], "quick"),
        action("a2", "Name the main source of uncertainty", ["methodologist", "communicator"], "moderate"),
      ],
      likelyQuestions: [
        { assessorId: "methodologist", question: "How many samples per lattice density?" },
        { assessorId: "communicator", question: "What should figure 2 show at a glance?" },
      ],
    },
  },
  {
    id: "rev-lr-2",
    projectId: "proj-lr",
    documentId: "doc-lr-2",
    createdAt: "2026-11-13T17:05:00Z",
    status: "ready",
    assessorResults: [],
    replySource: "sample",
    deliberation: null,
    report: null,
  },
];

export const samplePitchSessions: PitchSession[] = [
  {
    id: "pitch-hp-1",
    projectId: "proj-hp",
    status: "done",
    transcript: "",
    createdAt: "2026-11-13T20:00:00Z",
    startedAt: "2026-11-13T20:01:00Z",
    endedAt: "2026-11-13T20:07:00Z",
    settings: { questionCount: 3, mode: "spoken", conditions: "coaching" },
    qa: { mode: null, struggles: 0, turns: [], escalations: [] },
    questions: [],
    replySource: "sample",
    report: {
      ...reportBase("A clear problem and a memorable demo. The ending runs long and the business case is thin."),
      kind: "pitch",
      actions: [
        action("a1", "Cut the closing to thirty seconds", ["design-judge"], "quick"),
        action("a2", "Say who pays, in one sentence", ["investor"], "quick"),
      ],
    },
  },
  {
    id: "pitch-hp-2",
    projectId: "proj-hp",
    status: "ready",
    transcript: "",
    createdAt: "2026-11-14T08:00:00Z",
    startedAt: null,
    endedAt: null,
    settings: { questionCount: 3, mode: "spoken", conditions: "coaching" },
    qa: { mode: null, struggles: 0, turns: [], escalations: [] },
    questions: [],
    replySource: "sample",
    report: null,
  },
];

/** Each project's board memory, built from its finished sample sessions. */
export const sampleProjects: Project[] = projectsBase.map((p) => {
  const title = (docId: string) => sampleDocuments.find((d) => d.id === docId)?.title ?? "Report";
  const attempts = [
    ...sampleReviews.filter((r) => r.projectId === p.id && r.status === "done").map((r) => attemptFromReview(r, title(r.documentId))),
    ...samplePitchSessions.filter((s) => s.projectId === p.id && s.status === "done").map(attemptFromPitch),
  ];
  return { ...p, memory: attempts.reduce(withAttempt, { attempts: [] }) };
});

export const sampleWorkspace: Workspace = {
  profile: {
    id: "demo-user",
    name: "Sam Rivera",
    university: "Imperial College London",
    course: "MSc Biomedical Engineering",
    level: "PGT",
    avatar: "avatar-021",
  },
  assessors: sampleAssessors,
  notes: sampleNotes,
  boards: sampleBoards,
  projects: sampleProjects,
  documents: sampleDocuments,
  reviews: sampleReviews,
  pitchSessions: samplePitchSessions,
};
