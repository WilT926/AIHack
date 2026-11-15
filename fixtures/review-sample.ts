// Sample review for the review screen (Lane 2, step 2.1), in the shared data
// shapes. Invented, publishable content only, never the real thesis. Marked
// replySource "sample": none of it came from Claude.
import type { Comment, Document, FeedbackReport, Review } from "../src/lib/schemas";
import type { ReviewView } from "../src/features/review/types";
import { toViewDocument } from "../src/features/review/lib";
import { sampleAssessors } from "./home-sample";

const paragraphTexts = [
  "We designed a graded compression wrap and tested it with twelve participants across two clinics. Each participant wore three wrap variants for one week each, in a randomised order.",
  "Twelve participants were recruited through clinic referral. Inclusion criteria were adults with a healed venous leg ulcer in the past two years and no arterial disease.",
  "Sub-bandage pressure was logged at the ankle and calf every ten minutes using printed capacitive sensors calibrated before each session.",
  "Comfort was rated daily on a ten-point scale. We treat a two-point change as clinically meaningful, following earlier compression studies.",
  "All lattice samples were printed on the same machine from a single filament batch to limit variation between variants.",
  "Results were compared with a repeated-measures ANOVA, with Bonferroni correction across the three variants.",
  "Each wrap variant differed only in lattice density at the calf. Ankle density, wrap length and closure were held constant so that any change in pressure could be attributed to the calf section.",
  "Participants were given a one-page guide and a short demonstration on the first day. Clinic nurses checked the fit at the start of each week.",
  "Skin condition was photographed at the start and end of each week and graded by a nurse who did not know which variant had been worn.",
  "Sensor readings outside the calibrated range were flagged and removed before analysis. Days with fewer than six hours of wear were excluded.",
  "We also recorded how long each participant took to put the wrap on, as a proxy for whether it could be used at home without help.",
  "Two participants withdrew in week two, one for an unrelated illness and one who found the densest variant too warm. Their partial data are reported separately.",
  "The study was reviewed by the departmental ethics panel. All participants gave written consent and could withdraw at any time.",
  "All code and anonymised sensor data will be released with the thesis so the analysis can be repeated.",
];

export const sampleReviewDocument: Document = {
  id: "doc-sample-ch3",
  projectId: "proj-mt",
  title: "Methods",
  createdAt: "2026-11-14T10:00:00Z",
  paragraphs: paragraphTexts.map((text, i) => ({ id: `p${i + 1}`, type: "paragraph" as const, text })),
};

const comment = (c: Omit<Comment, "done" | "category"> & { category?: string }): Comment => ({ category: "General", done: false, ...c });

const comments: Comment[] = [
  comment({ id: "c1", assessorId: "methodologist", paragraphId: "p2", quote: "Twelve participants", category: "Sample size", severity: "major", text: "Twelve participants with three variants each is thin. Where is your power calculation? Without it I can't tell whether a null result means anything.", suggestion: "Add a power calculation, or frame the study as a feasibility study." }),
  comment({ id: "c2", assessorId: "literature-hawk", paragraphId: "p4", quote: "following earlier compression studies", category: "Citation", severity: "minor", text: "Which compression studies set the two-point threshold? Cite them here. If they used a different scale, say how you converted it.", suggestion: "Cite the source of the two-point threshold." }),
  comment({ id: "c3", assessorId: "module-lead", paragraphId: "p5", quote: "a single filament batch", category: "Design", severity: "praise", text: "Good: controlling for print batch is exactly what the handbook asks for. Say this in the abstract too.", suggestion: "" }),
  comment({ id: "c4", assessorId: "sceptic", paragraphId: "p2", quote: "recruited through clinic referral", category: "Bias", severity: "major", text: "Clinic referral means the clinicians picked who took part. How do you rule out them choosing patients who'd do well?", suggestion: "Say how referral bias was limited, or name it as a limitation." }),
  comment({ id: "c5", assessorId: "outsider", paragraphId: "p11", quote: null, category: "Adoption", severity: "minor", text: "Putting-on time is a good proxy. What would a clinic pay for this wrap compared with a standard four-layer bandage?", suggestion: "Add one line on cost against current practice." }),
  comment({ id: "c6", assessorId: "module-lead", paragraphId: "p13", quote: "departmental ethics panel", category: "Handbook", severity: "major", text: "Give the ethics approval reference and date. The handbook makes this a required item in the methods chapter.", suggestion: "Add the approval reference and date." }),
];

const report: FeedbackReport = {
  kind: "report",
  verdict: "A careful methods chapter with one real gap: the sample size is never justified, and referral bias is not addressed.",
  criteria: [
    { criterion: "Methods", rating: "adequate", evidence: "Clear design and controls; sample size and recruitment need justifying (¶2)." },
    { criterion: "Analysis", rating: "strong", evidence: "Appropriate test with correction (¶6)." },
    { criterion: "Ethics and handbook items", rating: "weak", evidence: "Approval reference missing (¶13)." },
  ],
  strengths: ["Controlling for print batch (¶5).", "Blinded skin grading (¶9).", "Open code and data (¶14)."],
  actions: [
    { id: "a1", what: "Add a power calculation and justify twelve participants as a feasibility study.", why: "Every marker will ask why twelve.", raisedBy: ["methodologist"], evidence: { paragraphIds: ["p2"], quote: null }, effort: "moderate", done: false },
    { id: "a2", what: "Explain how referral bias was limited.", why: "Otherwise the results may reflect who was chosen.", raisedBy: ["sceptic"], evidence: { paragraphIds: ["p2"], quote: null }, effort: "quick", done: false },
    { id: "a3", what: "Give the ethics approval reference and date.", why: "A required handbook item.", raisedBy: ["module-lead"], evidence: { paragraphIds: ["p13"], quote: null }, effort: "quick", done: false },
    { id: "a4", what: "Cite the source of the two-point comfort threshold.", why: "Unsupported thresholds cost marks.", raisedBy: ["literature-hawk"], evidence: { paragraphIds: ["p4"], quote: null }, effort: "quick", done: false },
  ],
  assessorVerdicts: [
    { assessorId: "module-lead", line: "Solid, but fix the handbook items before anything else." },
    { assessorId: "methodologist", line: "Justify the numbers." },
    { assessorId: "literature-hawk", line: "One citation away from fine." },
    { assessorId: "sceptic", line: "Tell me why referral did not pick the winners." },
    { assessorId: "outsider", line: "Say what a clinic would pay." },
  ],
  escalations: [{ reason: "Whether the ethics approval covers home use is outside the board's fields.", whoToAsk: "Your supervisor or the ethics panel" }],
  sinceLastTime: null,
  likelyQuestions: [
    { assessorId: "methodologist", question: "If you ran this again, how many participants would you need, and why?" },
    { assessorId: "sceptic", question: "What stops the clinicians choosing patients who'd do well?" },
    { assessorId: "literature-hawk", question: "Which study is your two-point threshold from?" },
  ],
  delivery: null,
  questionReview: null,
};

const boardIds = ["module-lead", "methodologist", "literature-hawk", "sceptic", "outsider"];

export const sampleReviewRecord: Review = {
  id: "rev-sample",
  projectId: "proj-mt",
  documentId: sampleReviewDocument.id,
  createdAt: "2026-11-14T10:05:00Z",
  status: "done",
  assessorResults: boardIds.map((id) => ({ assessorId: id, status: "done" as const, comments: comments.filter((c) => c.assessorId === id) })),
  deliberation: {
    summary: "The board agrees the design is sound; it splits on whether twelve participants is enough.",
    agreements: ["Controlling for print batch (¶5) is a real strength and should be kept.", "The two-point comfort threshold (¶4) needs a citation before submission."],
    disagreements: [
      {
        topic: "Is twelve participants enough?",
        views: [
          { assessorId: "methodologist", view: "Too few to support a conclusion without a power calculation." },
          { assessorId: "module-lead", view: "Enough for a feasibility study if it is framed as one." },
          { assessorId: "outsider", view: "Fine for a first study; say what a full trial would need." },
        ],
        advice: "Keep the paragraph. Add a power calculation and one line on why twelve suits a feasibility study.",
      },
    ],
  },
  report,
  replySource: "sample",
};

/** The sample review, ready for the screen. */
export const sampleReview: ReviewView = {
  project: { id: "proj-mt", name: "Master's Thesis" },
  board: { id: "board-sample", name: "Early Gateway", assessorIds: boardIds },
  assessors: sampleAssessors,
  document: toViewDocument(sampleReviewDocument, { chapter: "Chapter 3", version: 3 }),
  review: {
    id: null,
    createdAt: sampleReviewRecord.createdAt,
    comments,
    deliberation: sampleReviewRecord.deliberation ?? null,
    report,
    replySource: "sample",
  },
};
