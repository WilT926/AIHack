// Checking every reply before use (CLAUDE.md, lane-1.md step 1.2). Items that
// fail are dropped, never shown. What was dropped is counted so the call log
// and tests can see it.
import {
  commentSchema,
  deliberationSchema,
  effortSchema,
  feedbackReportSchema,
  ratingSchema,
  severitySchema,
  type Comment,
  type Deliberation,
  type Document,
  type FeedbackReport,
} from "@/lib/schemas";
import type { AssessorReply, DeliberationReply } from "./replies";

/** Normalise for quote matching: curly quotes, dashes and runs of spaces. */
function norm(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export type Checked<T> = { value: T; dropped: number };

/**
 * Keep the comments that point at a real, non-heading paragraph and whose
 * quote (if any) really is in that paragraph. Adds ids and the assessor id.
 */
export function checkComments(
  reply: Pick<AssessorReply, "comments">,
  doc: Pick<Document, "paragraphs">,
  assessorId: string,
  makeId: (i: number) => string = (i) => `${assessorId}-c${i + 1}`,
): Checked<Comment[]> {
  const byId = new Map(doc.paragraphs.map((p) => [p.id, p]));
  const out: Comment[] = [];
  let dropped = 0;
  for (const c of reply.comments ?? []) {
    const para = byId.get(String(c.paragraphId ?? "").trim());
    const quote = String(c.quote ?? "").trim();
    const severity = severitySchema.safeParse(String(c.severity ?? "").trim().toLowerCase());
    if (!para || para.type === "heading" || !severity.success || (quote && !norm(para.text).includes(norm(quote)))) {
      dropped++;
      continue;
    }
    const parsed = commentSchema.safeParse({
      id: makeId(out.length),
      assessorId,
      paragraphId: para.id,
      quote: quote || null,
      category: String(c.category ?? "").trim().slice(0, 100) || "General",
      severity: severity.data,
      text: String(c.text ?? "").trim(),
      suggestion: String(c.suggestion ?? "").trim(),
      done: false,
    });
    if (parsed.success && parsed.data.text) out.push(parsed.data);
    else dropped++;
  }
  return { value: out, dropped };
}

/**
 * Check a deliberation reply against the document and the board. Actions
 * must point at real paragraphs and be raised by someone on the board;
 * anything naming an assessor who is not on the board is dropped.
 */
export function checkDeliberation(
  reply: DeliberationReply,
  doc: Pick<Document, "paragraphs">,
  boardIds: string[],
): Checked<{ deliberation: Deliberation; report: FeedbackReport }> {
  const onBoard = new Set(boardIds);
  const paragraphIds = new Set(doc.paragraphs.map((p) => p.id));
  let dropped = 0;
  const keep = <T>(items: T[] | undefined, ok: (x: T) => boolean): T[] => {
    const all = items ?? [];
    const kept = all.filter(ok);
    dropped += all.length - kept.length;
    return kept;
  };

  const d = reply.deliberation;
  const disagreements = keep(d?.disagreements, (x) => !!x.topic?.trim()).map((x) => ({
    topic: x.topic.trim(),
    views: keep(x.views, (v) => onBoard.has(v.assessorId) && !!v.view?.trim()),
    advice: x.advice?.trim() ?? "",
  }));
  const deliberation = deliberationSchema.parse({
    summary: d?.summary?.trim() ?? "",
    agreements: keep(d?.agreements, (x) => !!x?.trim()),
    disagreements,
  });

  const r = reply.report;
  const actions = keep(r?.actions, (a) => !!a.what?.trim() && effortSchema.safeParse(a.effort?.trim().toLowerCase()).success)
    .map((a) => ({
      ...a,
      raisedBy: a.raisedBy.filter((id) => onBoard.has(id)),
      paragraphIds: a.paragraphIds.map((p) => p.trim()).filter((p) => paragraphIds.has(p)),
    }))
    .filter((a) => {
      const ok = a.raisedBy.length > 0 && a.paragraphIds.length > 0;
      if (!ok) dropped++;
      return ok;
    })
    .map((a, i) => ({
      id: `a${i + 1}`,
      what: a.what.trim(),
      why: a.why?.trim() ?? "",
      raisedBy: a.raisedBy,
      evidence: { paragraphIds: a.paragraphIds, quote: null },
      effort: effortSchema.parse(a.effort.trim().toLowerCase()),
      done: false,
    }));

  const report = feedbackReportSchema.parse({
    kind: "report",
    verdict: r?.verdict?.trim() ?? "",
    criteria: keep(r?.criteria, (c) => !!c.criterion?.trim() && ratingSchema.safeParse(c.rating?.trim().toLowerCase()).success).map((c) => ({
      criterion: c.criterion.trim(),
      rating: ratingSchema.parse(c.rating.trim().toLowerCase()),
      evidence: c.evidence?.trim() ?? "",
    })),
    strengths: keep(r?.strengths, (x) => !!x?.trim()),
    actions,
    assessorVerdicts: keep(r?.assessorVerdicts, (v) => onBoard.has(v.assessorId) && !!v.line?.trim()),
    escalations: keep(r?.escalations, (e) => !!e.reason?.trim()).map((e) => ({ reason: e.reason.trim(), whoToAsk: e.whoToAsk?.trim() || "Your supervisor" })),
    sinceLastTime: null,
    likelyQuestions: keep(r?.likelyQuestions, (q) => onBoard.has(q.assessorId) && !!q.question?.trim()),
    delivery: null,
    questionReview: null,
  });

  return { value: { deliberation, report }, dropped };
}
