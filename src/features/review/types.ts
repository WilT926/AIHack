// The review screen's view model, built on the shared data shapes in
// src/lib/schemas (comments, deliberation and the feedback report are the
// shared ones). The only additions are what the screen derives: paragraph
// numbers and a word count.
import type {
  Assessor as SharedAssessor,
  Comment as SharedComment,
  Deliberation as SharedDeliberation,
  FeedbackReport,
  Paragraph as SharedParagraph,
  ReplySource,
  Severity,
} from "@/lib/schemas";

export type Assessor = SharedAssessor;
export type Comment = SharedComment;
export type Deliberation = SharedDeliberation;
export type CommentSeverity = Severity;

/** A paragraph with its 1-based position, shown as ¶1, ¶2. */
export type Paragraph = SharedParagraph & { index: number };

export type Document = {
  id: string;
  title: string;
  chapter?: string;
  version: number;
  paragraphs: Paragraph[];
  wordCount: number;
};

export type Board = { id: string; name: string; assessorIds: string[] };

/** Live progress of a run, driven by useLiveReview (step 2.3). */
export type LiveState = {
  status: "reviewing" | "deliberating" | "done";
  doneAssessorIds: string[];
  reading?: { assessorId: string }[];
  failed?: { assessorId: string; message: string }[];
  /** Set when the deliberation call failed. */
  deliberationError?: string;
};

/** What the board has said so far on this document. */
export type ReviewResult = {
  /** Saved review id, once there is one. */
  id: string | null;
  createdAt?: string;
  comments: Comment[];
  deliberation: Deliberation | null;
  report: FeedbackReport | null;
  /** "sample" when the replies were generated without Claude: the screen must say so. */
  replySource: ReplySource;
};

/** Everything the review screen needs, in one object. */
export type ReviewView = {
  project: { id: string; name: string };
  board: Board;
  assessors: Assessor[];
  document: Document;
  review: ReviewResult;
  live?: LiveState;
};
