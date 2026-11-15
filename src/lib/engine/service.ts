import "server-only";
// What the engine routes call: load the inputs from the data layer, run each
// step on Claude (or on labelled sample replies when there is no API key),
// and save the finished review.
import { engine } from "@/config";
import { assessorNotes, assessors, boards, callLogs, documents, getProfile, projects, reviews } from "@/lib/data";
import type { Comment, ReplySource, Review } from "@/lib/schemas";
import { checkComments, checkDeliberation } from "./check";
import { callClaude, EngineError, hasClaude, type CallLogger } from "./claude";
import type { SharedContext } from "./prompts";
import { runAssessor, runDeliberation, type AssessorRunResult } from "./run";
import { sampleAssessorReply, sampleDeliberationReply } from "./sample";

const logCall: CallLogger = async (entry) => {
  await callLogs.save({ id: crypto.randomUUID(), ...entry });
};

/** Where replies will come from right now, or null if the engine cannot run. */
export function replySource(): ReplySource | null {
  if (hasClaude()) return "claude";
  return engine.sampleRepliesWithoutKey ? "sample" : null;
}

function requireSource(): ReplySource {
  const s = replySource();
  if (!s) throw new EngineError("The engine is not configured: set ANTHROPIC_API_KEY.", "not_configured", false);
  return s;
}

async function loadContext(projectId: string, documentId: string): Promise<{ context: SharedContext; boardIds: string[] }> {
  const [project, document, profile] = await Promise.all([projects.get(projectId), documents.get(documentId), getProfile()]);
  if (!project) throw new EngineError("That project does not exist.", "invalid_reply", false);
  if (!document || document.projectId !== projectId) throw new EngineError("That document does not belong to this project.", "invalid_reply", false);
  if (!document.paragraphs.some((p) => p.type !== "heading")) throw new EngineError("The document has no paragraphs to review.", "invalid_reply", false);
  if (!profile) throw new EngineError("The student profile is missing.", "invalid_reply", false);
  const board = project.boardId ? await boards.get(project.boardId) : null;
  return { context: { profile, project, document }, boardIds: board?.assessorIds ?? [] };
}

/** One assessor reads one document. Failures come back as status "failed". */
export async function reviewWithAssessor(input: {
  projectId: string;
  documentId: string;
  assessorId: string;
}): Promise<AssessorRunResult & { replySource: ReplySource }> {
  const source = requireSource();
  const { context } = await loadContext(input.projectId, input.documentId);
  const [assessor, notes] = await Promise.all([assessors.get(input.assessorId), assessorNotes.list({ assessorId: input.assessorId })]);
  if (!assessor) throw new EngineError("That assessor does not exist.", "invalid_reply", false);

  if (source === "sample") {
    // A short pause so the Reading state is visible; sample replies are instant otherwise.
    await new Promise((r) => setTimeout(r, engine.sampleDelayMs * (1 + Math.random())));
    const checked = checkComments(sampleAssessorReply(context, assessor, assessor.id.length), context.document, assessor.id);
    return { assessorId: assessor.id, status: "done", comments: checked.value, dropped: checked.dropped, angles: [], replySource: "sample" };
  }
  const result = await runAssessor({ context, assessor, notes }, { call: callClaude, log: logCall });
  return { ...result, replySource: "claude" };
}

export type FinishedResult = {
  assessorId: string;
  status: "done" | "failed";
  replySource: ReplySource;
  comments: { paragraphId: string; quote?: string | null; category: string; severity: string; text: string; suggestion: string }[];
};

/**
 * The board deliberates over the assessors' results and the whole review is
 * saved in one write. Comments are checked again against the document here,
 * since they come back from the browser.
 */
export async function deliberateAndSave(input: {
  projectId: string;
  documentId: string;
  reviewId?: string | null;
  results: FinishedResult[];
  /** Comments the student marked done while the review was still running. */
  doneCommentIds?: string[];
}): Promise<Review> {
  const source = requireSource();
  const { context } = await loadContext(input.projectId, input.documentId);

  const board = (await Promise.all(input.results.map((r) => assessors.get(r.assessorId)))).filter((a) => a !== null);
  const known = new Set(board.map((b) => b.id));
  const results = input.results
    .filter((r) => known.has(r.assessorId))
    .map((r) => ({
      assessorId: r.assessorId,
      status: r.status,
      replySource: r.replySource,
      comments: r.status === "done" ? checkComments({ comments: r.comments.map((c) => ({ ...c, quote: c.quote ?? "" })) }, context.document, r.assessorId).value : ([] as Comment[]),
    }));
  const finished = results.filter((r) => r.status === "done");

  // Anything made without Claude makes the whole review a sample.
  const anySample = source === "sample" || results.some((r) => r.replySource === "sample");

  let outcome;
  if (source === "sample") {
    const reply = sampleDeliberationReply(board, finished, context.project.brief.graded);
    outcome = checkDeliberation(reply, context.document, board.map((b) => b.id)).value;
  } else {
    outcome = await runDeliberation({ context, board, results: finished }, { call: callClaude, log: logCall });
  }

  // Keep what the student already marked done: comments marked during the
  // run, and anything saved on an earlier deliberation of this review (a
  // retry deliberates again). Actions are matched by their wording.
  const previous = input.reviewId ? await reviews.get(input.reviewId) : null;
  const doneComments = new Set([
    ...(input.doneCommentIds ?? []),
    ...(previous?.assessorResults.flatMap((a) => a.comments.filter((c) => c.done).map((c) => c.id)) ?? []),
  ]);
  const key = (t: string) => t.trim().toLowerCase().replace(/\s+/g, " ");
  const doneActions = new Set(previous?.report?.actions.filter((a) => a.done).map((a) => key(a.what)) ?? []);
  const report = { ...outcome.report, actions: outcome.report.actions.map((a) => ({ ...a, done: a.done || doneActions.has(key(a.what)) })) };

  return reviews.save({
    id: input.reviewId || crypto.randomUUID(),
    projectId: input.projectId,
    documentId: input.documentId,
    createdAt: previous?.createdAt ?? new Date().toISOString(),
    status: "done",
    assessorResults: results.map((r) => ({
      assessorId: r.assessorId,
      status: r.status,
      comments: r.comments.map((c) => (doneComments.has(c.id) ? { ...c, done: true } : c)),
    })),
    deliberation: outcome.deliberation,
    report,
    replySource: anySample ? "sample" : "claude",
  });
}
