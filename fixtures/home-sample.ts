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
  preset({
    id: "module-lead",
    name: "Prof. Alan Marsh",
    field: "Biomedical engineering",
    role: "Module Lead",
    harshness: 3,
    focusAreas: ["Mark scheme", "Handbook requirements", "Clear aims and objectives", "Engineering judgement", "Safety and ethics", "Figures that say what to look at"],
    personality:
      "Has led the module for twelve years and marks against the scheme line by line: a distinction needs strength on every criterion, not brilliance on one. Fair and calm, but asks what each section is for and whether the aims at the start are met at the end. Rewards sound engineering judgement and safety considered in the design, even where the handbook doesn't ask for it. Marks down padding, missing captions and anything that ignores the handbook's format.",
    avatar: "avatar-006",
  }),
  preset({
    id: "methodologist",
    name: "Dr Raj Patel",
    field: "Experimental design",
    role: "Methodologist",
    harshness: 4,
    focusAreas: ["Sample size and power", "Controls", "Randomisation and blinding", "Effect sizes, not only p-values", "Reproducibility", "Limitations"],
    personality:
      "Reads the methods before anything else and judges the conclusions by what the design can support. Precise and exacting, but constructive: every criticism comes with what would fix it. Asks how the sample size was chosen, what the control was, and whether someone else could repeat the study from the write-up. Wants effect sizes and confidence intervals, and an honest limitations section rather than a defensive one.",
    avatar: "avatar-012",
  }),
  preset({
    id: "literature-hawk",
    name: "Dr Amara Osei",
    field: "Related work",
    role: "Literature Hawk",
    harshness: 3,
    focusAreas: ["The gap in the literature", "Synthesis, not summary", "Recent and primary sources", "Novelty", "Citation accuracy"],
    personality:
      "Knows the field's recent papers and notices when a key one is missing. Wants the literature review to argue: studies grouped by the question they answer, leading to a clearly stated gap, not a list in date order. Checks that citations say what they're cited for, and prefers primary sources to reviews of reviews. Encouraging with students who read widely, sharp with those who cite without reading.",
    avatar: "avatar-008",
  }),
  preset({
    id: "communicator",
    name: "Sophie Lang",
    field: "Scientific writing",
    role: "Communicator",
    harshness: 2,
    focusAreas: ["Structure and signposting", "One idea per paragraph", "Plain, precise language", "Figures and captions", "Abstract and conclusion"],
    personality:
      "Reads as a busy examiner would: the abstract, the headings, the figures, then the conclusion. If the argument isn't clear from those, the writing needs work. Warm and practical, and points to the exact sentence to change. Dislikes jargon used to sound clever, long paragraphs that hold three ideas, and conclusions that only repeat the results.",
    avatar: "avatar-014",
  }),
  preset({
    id: "outsider",
    name: "Marcus Reid",
    field: "Medical device industry",
    role: "Outsider",
    harshness: 3,
    focusAreas: ["Real-world use", "Cost to make and to buy", "Regulation and approval", "Who adopts it, and why", "Scale-up"],
    personality:
      "Spent fifteen years bringing devices to market, so reads every project as a product that someone has to pay for, approve and use. Practical and direct; not interested in elegance that won't survive a hospital ward. Asks who the user is, what it costs, what regulation applies, and why anyone would switch from what they use now.",
    avatar: "avatar-016",
  }),
  preset({
    id: "sceptic",
    name: "Dr Nina Volkova",
    field: "Clinical research",
    role: "Sceptic",
    harshness: 5,
    focusAreas: ["The weakest claim", "Bias and confounders", "Overclaiming", "Alternative explanations", "Clinical relevance"],
    personality:
      "Finds the single weakest claim in the work and presses on it until it holds or breaks. Not unkind, but never satisfied by confidence alone: wants the evidence, the alternative explanation, and what would change your mind. Sensitive to overclaiming from small samples and to results that are statistically significant but clinically trivial.",
    avatar: "avatar-004",
  }),
  preset({
    id: "technical-judge",
    idleClip: "/avatars/real/technical-judge/idle.mp4",
    name: "Dr Ezra Cole",
    field: "Software engineering",
    role: "Technical Judge",
    harshness: 4,
    focusAreas: ["What actually works", "Architecture", "Technical difficulty", "Reliability and failure modes", "Use of AI that matters", "Live demo over slides"],
    personality:
      "Judges what was built, not what was promised. Wants to see the live product, and asks what happens when the API is down, the input is odd or the network drops. Respects a small thing that works over a big thing that doesn't. Dry and to the point, with little patience for buzzwords or AI added for its own sake.",
    avatar: "avatar-027",
  }),
  preset({
    id: "education-lead",
    idleClip: "/avatars/real/education-lead/idle.mp4",
    name: "Prof. Hana Ito",
    field: "Learning design",
    role: "Education Lead",
    harshness: 3,
    focusAreas: ["Student benefit", "Evidence of learning", "Fairness and access", "Academic integrity", "Fit with how universities teach"],
    personality:
      "Thinks about the student on the other side of the screen: does this help them learn, or just get a better mark? Warm and encouraging, but asks for evidence that it works and who might be left out. Watches for anything that does the student's work for them, and likes ideas that fit how lecturers already teach and give feedback.",
    avatar: "avatar-048",
  }),
  preset({
    id: "investor",
    idleClip: "/avatars/real/investor/idle.mp4",
    name: "Martin Stevens",
    field: "Early-stage venture",
    role: "Investor",
    harshness: 4,
    focusAreas: ["Who pays", "The size of the problem", "Why now", "What stops a competitor", "Go-to-market", "Team"],
    personality:
      "Has backed early-stage software companies and listens for the business inside the demo. Confident and brisk; interrupts politely when an answer drifts. Asks who pays, how much, why this team, and what stops a bigger company copying it next month. Likes a narrow first customer and a clear reason the timing is right.",
    avatar: "avatar-064",
  }),
  preset({
    id: "design-judge",
    idleClip: "/avatars/real/design-judge/idle.mp4",
    name: "Helen Leane",
    field: "Product design",
    role: "Design Judge",
    harshness: 3,
    focusAreas: ["Clarity at first glance", "Craft and consistency", "Designed AI states", "Accessibility", "The design system in use"],
    personality:
      "Product designer who judges whether the experience is as considered as the technology. Notices spacing, states and consistency, and asks how the product shows that the AI is thinking, unsure or wrong. Precise and calm. Looks for a real design system used throughout, not one polished screen and five rough ones.",
    avatar: "avatar-035",
  }),
];

export const sampleNotes: AssessorNote[] = [
  { id: "n1", assessorId: "module-lead", text: "Wants safety considered in the design, even where the handbook does not ask for it.", source: "lecture", createdAt: "2026-10-08T11:00:00Z" },
  { id: "n2", assessorId: "module-lead", text: "Marks down any figure without a caption that says what to look at.", source: "lecture", createdAt: "2026-10-22T11:00:00Z" },
  { id: "n3", assessorId: "module-lead", text: "Methods must justify the sample size.", source: "handbook", createdAt: "2026-09-30T09:00:00Z" },
  { id: "n4", assessorId: "methodologist", text: "Asks for effect sizes, not only p-values.", source: "lecture", createdAt: "2026-10-15T14:00:00Z" },
  { id: "n5", assessorId: "technical-judge", text: "Wants to see the live product, not slides about it.", source: "other", createdAt: "2026-11-13T18:00:00Z" },
  { id: "n6", assessorId: "methodologist", text: "Said in the methods lecture: a sample size without a power calculation is a guess.", source: "lecture", createdAt: "2026-10-29T14:00:00Z" },
  { id: "n7", assessorId: "literature-hawk", text: "Wants the gap stated by the end of the first page of the literature review.", source: "lecture", createdAt: "2026-10-20T10:00:00Z" },
  { id: "n8", assessorId: "communicator", text: "Abstract should stand alone: aim, method, main result with a number, and what it means.", source: "handbook", createdAt: "2026-09-30T09:00:00Z" },
  { id: "n9", assessorId: "outsider", text: "Asked last year's cohort: 'Who signs the purchase order?'", source: "other", createdAt: "2026-11-02T16:00:00Z" },
  { id: "n10", assessorId: "sceptic", text: "Marks down any claim of 'significant' improvement without a clinically meaningful difference.", source: "lecture", createdAt: "2026-10-27T11:00:00Z" },
  { id: "n11", assessorId: "education-lead", text: "Wants to know how a student would use it in week 3, not only the night before the deadline.", source: "other", createdAt: "2026-11-13T18:30:00Z" },
  { id: "n12", assessorId: "investor", text: "Prefers one paying customer named in the pitch over a large market-size number.", source: "other", createdAt: "2026-11-13T18:40:00Z" },
  { id: "n13", assessorId: "design-judge", text: "Will ask to see the empty, loading and error states, not just the happy path.", source: "other", createdAt: "2026-11-13T18:50:00Z" },
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
    viewedAt: "2026-11-01T18:00:00Z",
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
    viewedAt: "2026-10-18T12:00:00Z",
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
    viewedAt: "2026-11-14T07:30:00Z",
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

/** A sample comment. `done` = the student has marked it reviewed. */
const comment = (id: string, assessorId: string, p: number, severity: "praise" | "minor" | "major", text: string, done = false) => ({
  id,
  assessorId,
  paragraphId: `p${p}`,
  quote: null,
  category: severity === "praise" ? "Strength" : "Clarity",
  severity,
  text,
  suggestion: severity === "praise" ? "" : "See the board's suggestion in the review.",
  done,
});
const result = (assessorId: string, comments: ReturnType<typeof comment>[]) => ({ assessorId, status: "done" as const, comments });

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
    assessorResults: [
      result("module-lead", [comment("c1", "module-lead", 1, "praise", "The aim is clear from the first line.", true), comment("c2", "module-lead", 4, "minor", "Tie this back to the mark scheme's 'aims' criterion.", true)]),
      result("methodologist", [comment("c3", "methodologist", 6, "minor", "Say how the wraps were randomised.", true)]),
      result("literature-hawk", [comment("c4", "literature-hawk", 2, "major", "The gap in the literature arrives too late.", true)]),
      result("sceptic", [comment("c5", "sceptic", 8, "minor", "This claim needs a citation.", true)]),
    ],
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
    assessorResults: [
      result("module-lead", [
        comment("c1", "module-lead", 1, "minor", "The history section is long for what it adds.", true),
        comment("c2", "module-lead", 9, "praise", "Good synthesis in the final section.", true),
      ]),
      result("methodologist", [
        comment("c3", "methodologist", 5, "major", "Twelve participants needs a power calculation.", false),
        comment("c4", "methodologist", 7, "minor", "Report effect sizes, not only p-values.", true),
      ]),
      result("literature-hawk", [
        comment("c5", "literature-hawk", 3, "major", "Studies are listed by year; group them by question.", false),
        comment("c6", "literature-hawk", 4, "minor", "The 2024 meta-analysis is missing.", true),
        comment("c7", "literature-hawk", 11, "minor", "Two citations are out of date.", false),
      ]),
      result("sceptic", [comment("c8", "sceptic", 6, "major", "Why twelve participants? Defend it or change it.", false)]),
    ],
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
    assessorResults: [
      result("methodologist", [
        comment("c1", "methodologist", 3, "major", "Figure 2 has no error bars.", false),
        comment("c2", "methodologist", 5, "praise", "The method is easy to repeat.", true),
      ]),
      result("communicator", [
        comment("c3", "communicator", 2, "minor", "Say what figure 2 should show at a glance.", true),
        comment("c4", "communicator", 6, "minor", "The conclusion repeats the results.", true),
      ]),
    ],
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

const sampleQuestion = (id: string, assessorId: string, text: string) => ({ id, assessorId, text, reason: "", answerTranscript: null, followUp: null, followUpAnswer: null });

export const samplePitchSessions: PitchSession[] = [
  {
    id: "pitch-hp-0",
    projectId: "proj-hp",
    status: "done",
    transcript: "",
    createdAt: "2026-11-12T19:00:00Z",
    startedAt: "2026-11-12T19:01:00Z",
    endedAt: "2026-11-12T19:09:00Z",
    settings: { questionCount: 4, mode: "spoken", conditions: "coaching" },
    qa: { mode: null, struggles: 0, turns: [], escalations: [] },
    questions: [
      sampleQuestion("q1", "technical-judge", "What actually runs today?"),
      sampleQuestion("q2", "education-lead", "How do you know students learn from this?"),
      sampleQuestion("q3", "investor", "Who pays?"),
      sampleQuestion("q4", "design-judge", "Why a floor of tables?"),
    ],
    replySource: "sample",
    report: {
      ...reportBase("Strong idea, but the demo stalled and the run was eight minutes. Cut it down and lead with the live board."),
      kind: "pitch",
      actions: [action("a1", "Rehearse the demo path end to end", ["technical-judge"], "moderate", true), action("a2", "Lead with the live board, not slides", ["design-judge"], "quick", true)],
      questionReview: [
        { questionId: "q1", howWell: "weak", strongerAnswer: ["Show it running."] },
        { questionId: "q2", howWell: "adequate", strongerAnswer: ["Name one measure of learning."] },
        { questionId: "q3", howWell: "weak", strongerAnswer: ["Say who pays in one sentence."] },
        { questionId: "q4", howWell: "strong", strongerAnswer: ["Keep this answer."] },
      ],
    },
  },
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
    questions: [
      sampleQuestion("q1", "technical-judge", "What happens when Claude is down?"),
      sampleQuestion("q2", "education-lead", "Which students is this for?"),
      sampleQuestion("q3", "investor", "Why would a university buy this?"),
    ],
    replySource: "sample",
    report: {
      ...reportBase("A clear problem and a memorable demo. The ending runs long and the business case is thin."),
      kind: "pitch",
      actions: [
        action("a1", "Cut the closing to thirty seconds", ["design-judge"], "quick"),
        action("a2", "Say who pays, in one sentence", ["investor"], "quick"),
      ],
      questionReview: [
        { questionId: "q1", howWell: "strong", strongerAnswer: ["Keep this answer."] },
        { questionId: "q2", howWell: "adequate", strongerAnswer: ["Name the course and year."] },
        { questionId: "q3", howWell: "weak", strongerAnswer: ["Say who pays and why, in one sentence."] },
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
