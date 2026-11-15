// The shared data contract (docs/plan/README.md, "Data shapes"). Defined once
// here, with validation. Only Lane 1 changes these, and announces it.
//
// Additions beyond the plan's list, all needed by the screens:
// - Profile.avatar, Project.createdAt/updatedAt, Document.createdAt,
//   PitchSession.createdAt: the floor orders and labels by these.
// - PitchSession.status: whether a presentation is ready, running or done.
// - PitchSession.settings.boardId and .capture: the board chosen for the run
//   and whether the transcript came from the microphone or was typed.
// - PitchQuestion.followUpAnswer: the answer to the one follow-up question.
// - PitchSession.settings.conditions and PitchSession.qa: coaching or exam
//   conditions, and the routed Q&A (turns, assessments, modes, struggles,
//   escalations).
// - Comment.done and FeedbackAction.done: comments can be marked done and
//   "open actions" are the unticked actions in the latest report.
// - Paragraph.type: headings are numbered but not commented on.
// - Review.replySource and PitchSession.replySource: "sample" when the replies
//   were generated without Claude (no API key). Screens must say so.
import { z } from "zod";

const id = z.string().min(1).max(100);
const shortText = z.string().max(2000);
const longText = z.string().max(20000);
const timestamp = z.iso.datetime({ offset: true });

// ---------- People ----------

export const levelSchema = z.enum(["UG", "PGT", "PGR"]);

export const profileSchema = z.object({
  id,
  name: z.string().min(1).max(100),
  university: z.string().max(200),
  course: z.string().max(200),
  level: levelSchema,
  avatar: z.string().max(100),
});
export type Profile = z.infer<typeof profileSchema>;

export const harshnessSchema = z.number().int().min(1).max(5);

export const assessorSchema = z.object({
  id,
  name: z.string().min(1).max(100),
  field: z.string().max(200),
  role: z.string().max(300),
  personality: shortText,
  harshness: harshnessSchema,
  focusAreas: z.array(z.string().max(200)).max(12),
  avatar: z.string().max(100),
  portrait: z.string().max(300).nullish(),
  idleClip: z.string().max(300).nullish(),
  talkingClip: z.string().max(300).nullish(),
  voiceId: z.string().max(100).nullish(),
  isPreset: z.boolean(),
  basedOn: id.nullish(),
});
export type Assessor = z.infer<typeof assessorSchema>;

export const noteSourceSchema = z.enum(["lecture", "handbook", "other"]);

export const assessorNoteSchema = z.object({
  id,
  assessorId: id,
  text: longText,
  source: noteSourceSchema,
  createdAt: timestamp,
});
export type AssessorNote = z.infer<typeof assessorNoteSchema>;

export const boardSchema = z.object({
  id,
  name: z.string().min(1).max(100),
  assessorIds: z.array(id).max(12),
});
export type Board = z.infer<typeof boardSchema>;

// ---------- Projects and documents ----------

export const projectTemplateSchema = z.enum(["masters-report", "lab-report", "pitch"]);
export type ProjectTemplate = z.infer<typeof projectTemplateSchema>;

export const briefSchema = z.object({
  what: shortText,
  topic: shortText,
  graded: z.array(z.string().max(300)).max(20),
  goal: shortText,
});
export type Brief = z.infer<typeof briefSchema>;

export const projectSchema = z.object({
  id,
  title: z.string().min(1).max(200),
  template: projectTemplateSchema,
  brief: briefSchema,
  deadline: timestamp.nullish(),
  markSchemeText: longText,
  weakSpots: z.array(z.string().max(500)).max(20),
  boardId: id.nullish(),
  createdAt: timestamp,
  updatedAt: timestamp,
});
export type Project = z.infer<typeof projectSchema>;

/** A project template: pre-fills the brief, the mark scheme and the board. */
export const templateSchema = z.object({
  id: projectTemplateSchema,
  title: z.string().min(1).max(200),
  description: shortText,
  brief: briefSchema,
  markSchemeText: longText,
  boardId: id.nullish(),
});
export type Template = z.infer<typeof templateSchema>;

export const paragraphSchema = z.object({
  id: z.string().regex(/^p\d{1,4}$/),
  text: z.string().max(6000),
  type: z.enum(["paragraph", "heading"]).default("paragraph"),
});
export type Paragraph = z.infer<typeof paragraphSchema>;

export const documentSchema = z.object({
  id,
  projectId: id,
  title: z.string().min(1).max(300),
  paragraphs: z.array(paragraphSchema).max(2000),
  createdAt: timestamp,
});
export type Document = z.infer<typeof documentSchema>;

/** A document without its text, for lists. */
export const documentSummarySchema = documentSchema.omit({ paragraphs: true });
export type DocumentSummary = z.infer<typeof documentSummarySchema>;

// ---------- Review output ----------

export const severitySchema = z.enum(["praise", "minor", "major"]);
export type Severity = z.infer<typeof severitySchema>;

export const commentSchema = z.object({
  id,
  assessorId: id,
  paragraphId: z.string().regex(/^p\d{1,4}$/),
  quote: z.string().max(1000).nullish(),
  category: z.string().max(100),
  severity: severitySchema,
  text: shortText,
  suggestion: shortText,
  done: z.boolean().default(false),
});
export type Comment = z.infer<typeof commentSchema>;

export const deliberationSchema = z.object({
  summary: shortText,
  agreements: z.array(shortText).max(20),
  disagreements: z
    .array(
      z.object({
        topic: z.string().max(300),
        views: z.array(z.object({ assessorId: id, view: shortText })).max(12),
        advice: shortText,
      }),
    )
    .max(20),
});
export type Deliberation = z.infer<typeof deliberationSchema>;

// ---------- Feedback report (closes both session kinds) ----------

export const ratingSchema = z.enum(["strong", "adequate", "weak"]);
export type Rating = z.infer<typeof ratingSchema>;
export const effortSchema = z.enum(["quick", "moderate", "substantial"]);
export type Effort = z.infer<typeof effortSchema>;

export const feedbackActionSchema = z.object({
  id,
  what: shortText,
  why: shortText,
  raisedBy: z.array(id).max(12),
  evidence: z.object({
    paragraphIds: z.array(z.string().regex(/^p\d{1,4}$/)).max(20).default([]),
    quote: z.string().max(1000).nullish(),
  }),
  effort: effortSchema,
  done: z.boolean().default(false),
});
export type FeedbackAction = z.infer<typeof feedbackActionSchema>;

export const feedbackReportSchema = z.object({
  kind: z.enum(["report", "pitch"]),
  verdict: shortText,
  criteria: z
    .array(z.object({ criterion: z.string().max(300), rating: ratingSchema, evidence: shortText }))
    .max(20),
  strengths: z.array(shortText).max(20),
  actions: z.array(feedbackActionSchema).max(30),
  assessorVerdicts: z.array(z.object({ assessorId: id, line: shortText })).max(12),
  escalations: z.array(z.object({ reason: shortText, whoToAsk: z.string().max(300) })).max(10),
  sinceLastTime: z
    .object({ improved: z.array(shortText).max(20), stillWeak: z.array(shortText).max(20) })
    .nullish(),
  // Report only
  likelyQuestions: z.array(z.object({ assessorId: id, question: shortText })).max(20).nullish(),
  // Pitch only
  delivery: z
    .object({
      lengthSeconds: z.number().min(0),
      wordsPerMinute: z.number().min(0),
      structure: shortText,
      clarity: shortText,
    })
    .nullish(),
  questionReview: z
    .array(z.object({ questionId: id, howWell: ratingSchema, strongerAnswer: shortText }))
    .max(10)
    .nullish(),
});
export type FeedbackReport = z.infer<typeof feedbackReportSchema>;

// ---------- Sessions ----------

export const reviewStatusSchema = z.enum(["ready", "running", "done", "failed"]);

/** Where the AI replies came from. "sample" means made up without Claude, and must be labelled on screen. */
export const replySourceSchema = z.enum(["claude", "sample"]);
export type ReplySource = z.infer<typeof replySourceSchema>;
export const assessorRunStatusSchema = z.enum(["pending", "reading", "done", "failed"]);

export const reviewSchema = z.object({
  id,
  projectId: id,
  documentId: id,
  createdAt: timestamp,
  status: reviewStatusSchema,
  assessorResults: z
    .array(z.object({ assessorId: id, status: assessorRunStatusSchema, comments: z.array(commentSchema) }))
    .max(12),
  deliberation: deliberationSchema.nullish(),
  report: feedbackReportSchema.nullish(),
  replySource: replySourceSchema.default("claude"),
});
export type Review = z.infer<typeof reviewSchema>;

export const pitchStatusSchema = z.enum(["ready", "listening", "conferring", "questions", "done"]);

// ---------- Q&A routing: how the board thinks and talks, turn by turn ----------

/** The router's read of one answer. */
export const answerQualitySchema = z.enum(["strong", "partial", "struggling", "off-topic"]);
export type AnswerQuality = z.infer<typeof answerQualitySchema>;
export const studentIntentSchema = z.enum(["answering", "asking-for-answer", "changing-rules", "distressed", "wants-to-stop"]);
export type StudentIntent = z.infer<typeof studentIntentSchema>;
export const assessmentSchema = z.object({ answerQuality: answerQualitySchema, studentIntent: studentIntentSchema });
export type Assessment = z.infer<typeof assessmentSchema>;

/** The mode the code picks from the assessment. Each mode has its own prompt block. */
export const qaModeSchema = z.enum(["pressing", "probing", "coaching", "steering", "holding-the-line", "paused"]);
export type QaMode = z.infer<typeof qaModeSchema>;

/** Coaching (hints allowed) or exam conditions (no hints). */
export const conditionsSchema = z.enum(["coaching", "exam"]);
export type Conditions = z.infer<typeof conditionsSchema>;

/** One thing a judge said, and the answer to it. */
export const qaTurnSchema = z.object({
  id,
  /** The planned question this turn belongs to. */
  questionId: id,
  assessorId: id,
  kind: z.enum(["question", "follow-up", "steer", "hold", "pause"]),
  /** The mode this utterance was generated in; null for the opening question. */
  mode: qaModeSchema.nullish(),
  text: shortText,
  answer: longText.nullish(),
  /** The router's read of the answer, once given. */
  assessment: assessmentSchema.nullish(),
  /** Milliseconds: router call, utterance call, and the whole gap from answer to next question. */
  timing: z.object({ routerMs: z.number().min(0), utteranceMs: z.number().min(0), gapMs: z.number().min(0) }).nullish(),
});
export type QaTurn = z.infer<typeof qaTurnSchema>;

export const qaStateSchema = z.object({
  mode: qaModeSchema.nullish(),
  struggles: z.number().int().min(0),
  turns: z.array(qaTurnSchema).max(60),
  /** Points handed to a human, e.g. when the board paused. */
  escalations: z.array(z.object({ reason: shortText, whoToAsk: z.string().max(300) })).max(10),
});
export type QaState = z.infer<typeof qaStateSchema>;

export const pitchQuestionSchema = z.object({
  id,
  assessorId: id,
  text: shortText,
  reason: shortText,
  answerTranscript: longText.nullish(),
  followUp: shortText.nullish(),
  /** The answer to the follow-up, if one was asked. */
  followUpAnswer: longText.nullish(),
});
export type PitchQuestion = z.infer<typeof pitchQuestionSchema>;

export const pitchSessionSchema = z.object({
  id,
  projectId: id,
  status: pitchStatusSchema,
  transcript: longText,
  createdAt: timestamp,
  startedAt: timestamp.nullish(),
  endedAt: timestamp.nullish(),
  settings: z.object({
    questionCount: z.number().int().min(1).max(5),
    mode: z.enum(["spoken", "text"]),
    /** The board for this run, when it differs from the project's own. */
    boardId: id.nullish(),
    /** How the transcript was captured: live from the microphone, or typed/pasted. */
    capture: z.enum(["live", "typed"]).nullish(),
    /** Coaching (default) or exam conditions. */
    conditions: conditionsSchema.default("coaching"),
  }),
  /** The planned questions, agreed when the board stepped out. */
  questions: z.array(pitchQuestionSchema).max(10),
  /** The live Q&A: every turn, its assessment and mode, and the struggle count. */
  qa: qaStateSchema.default({ mode: null, struggles: 0, turns: [], escalations: [] }),
  report: feedbackReportSchema.nullish(),
  replySource: replySourceSchema.default("claude"),
});
export type PitchSession = z.infer<typeof pitchSessionSchema>;

export const callLogSchema = z.object({
  id,
  kind: z.string().max(50),
  model: z.string().max(100),
  startedAt: timestamp,
  durationMs: z.number().int().min(0),
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
  ok: z.boolean(),
  error: z.string().max(2000).nullish(),
});
export type CallLog = z.infer<typeof callLogSchema>;

// ---------- Everything one student owns ----------

/**
 * One student's whole workspace, as the home floor reads it. Documents come
 * without their text. Served by src/lib/data (or fixtures/ while developing).
 */
export const workspaceSchema = z.object({
  profile: profileSchema,
  assessors: z.array(assessorSchema),
  notes: z.array(assessorNoteSchema),
  boards: z.array(boardSchema),
  projects: z.array(projectSchema),
  documents: z.array(documentSummarySchema),
  reviews: z.array(reviewSchema),
  pitchSessions: z.array(pitchSessionSchema),
});
export type Workspace = z.infer<typeof workspaceSchema>;

// ---------- Helpers ----------

/**
 * Keep the items that match the schema and drop the rest. Used on every list
 * that comes back from Claude or the database: invalid items are dropped, not
 * shown.
 */
export function keepValid<S extends z.ZodType>(schema: S, items: unknown): z.infer<S>[] {
  if (!Array.isArray(items)) return [];
  const out: z.infer<S>[] = [];
  for (const item of items) {
    const parsed = schema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}
