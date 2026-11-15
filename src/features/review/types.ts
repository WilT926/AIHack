// TEMPORARY (Lane 2): data shapes for the review screen, taken from the Lane 2
// brief (section 5). Lane 1 owns the shared contract in src/lib/schemas; when
// it lands, re-export from there and adapt the few extra fields marked below.

export type ParagraphType = "paragraph" | "heading";

export type Paragraph = {
  id: string; // "p1", "p2", ... comments reference these
  index: number; // 1-based, shown as ¶1, ¶2
  type: ParagraphType;
  text: string;
};

export type Document = {
  id: string;
  title: string;
  chapter?: string; // extra: label above the title, e.g. "Chapter 3"
  version: number;
  paragraphs: Paragraph[];
  wordCount: number;
};

export type Harshness = 1 | 2 | 3 | 4 | 5;

export type Assessor = {
  id: string;
  name: string;
  role: string;
  field: string;
  harshness: Harshness;
  focus: string[];
  personality?: string;
  notes?: string[];
  avatar: string; // key for the line-drawn avatar
};

export type Board = { id: string; name: string; assessorIds: string[] };

export type CommentKind = "critique" | "question" | "praise";

export type Comment = {
  id: string;
  assessorId: string;
  paragraphIds: string[];
  kind: CommentKind;
  text: string;
  criterionId?: string;
  resolved?: boolean;
};

export type Split = {
  paragraphIds: string[];
  topic: string;
  approve: string[]; // assessor ids
  object: string[]; // assessor ids
  advice: string;
};

export type Deliberation = { seconds: number; agreements: string[]; splits: Split[] };

export type FixItem = { rank: number; text: string; paragraphIds: string[]; raisedBy: string[] };

export type Question = { assessorId: string; text: string };

export type Run = {
  id: string;
  number: number;
  uploadedAt?: string; // extra: ISO date the document version was uploaded
  document: Document;
  comments: Comment[];
  deliberation?: Deliberation;
  fixList: FixItem[];
  questions: Question[];
  sinceLastTime?: { improved: string[]; stillWeak: string[]; ignored: string[] };
  /** Written-questions mode: what to add or cut (step 2.5, "if time"). */
  addOrCut?: { add: string[]; cut: string[] };
  /** The run this one was compared against. */
  previousNumber?: number;
};

/** Live progress of a run, driven by useLiveReview (step 2.3). */
export type LiveState = {
  status: "reviewing" | "deliberating" | "done";
  doneAssessorIds: string[];
  /** Assessors still reading; paragraphId when the engine reports where they are. */
  reading?: { assessorId: string; paragraphId?: string }[];
  failed?: { assessorId: string; message: string }[];
  /** Set when the deliberation call failed. */
  deliberationError?: string;
};

/** Everything the review screen needs, in one object. */
export type ReviewView = {
  project: { id: string; name: string };
  board: Board;
  assessors: Assessor[];
  run: Run;
  live?: LiveState;
  /** Marking criteria comments may be tagged with (step 2.5). */
  criteria?: { id: string; name: string; weight: number }[];
  qaMode?: "live" | "written";
};
