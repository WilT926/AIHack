// Checks Claude's replies before anything reaches the screen. Invalid items
// are dropped, not shown (CLAUDE.md). Pure, so it is unit tested.
import type { Comment, Deliberation, Document, FixItem, Question } from "../types";
import type { AssessorOutput, DeliberationOutput } from "./schemas";

export const LIMITS = {
  commentsPerAssessor: 8,
  commentText: 800,
  paragraphsPerItem: 4,
  agreements: 5,
  splits: 4,
  fixes: 5,
  questionsPerAssessor: 2,
  shortText: 400,
  sinceLastTimeItems: 4,
  addOrCutItems: 4,
};

function cleanList(items: string[] | undefined, max: number): string[] {
  return (items ?? []).map((t) => clean(t, LIMITS.shortText)).filter(Boolean).slice(0, max);
}

function clean(text: string, max: number): string {
  return text.replace(/\s+/g, " ").trim().slice(0, max);
}

function validParagraphIds(ids: string[], doc: Document): string[] {
  const known = new Set(doc.paragraphs.map((p) => p.id));
  return [...new Set(ids.map((id) => id.trim().toLowerCase()))].filter((id) => known.has(id)).slice(0, LIMITS.paragraphsPerItem);
}

function validAssessorIds(ids: string[], known: Set<string>): string[] {
  return [...new Set(ids)].filter((id) => known.has(id));
}

/** Keep comments that point at real paragraphs and have text. A criterion tag is kept only if it names a real criterion. */
export function sanitizeAssessorOutput(
  output: AssessorOutput,
  doc: Document,
  assessorId: string,
  criterionIds: string[] = [],
): Comment[] {
  const comments: Comment[] = [];
  for (const c of output.comments) {
    const paragraphIds = validParagraphIds(c.paragraphIds, doc);
    const text = clean(c.text, LIMITS.commentText);
    if (paragraphIds.length === 0 || !text) continue;
    if (!["critique", "question", "praise"].includes(c.kind)) continue;
    const criterionId = c.criterionId && criterionIds.includes(c.criterionId) ? c.criterionId : undefined;
    comments.push({
      id: `${assessorId}-${comments.length + 1}`,
      assessorId,
      paragraphIds,
      kind: c.kind,
      text,
      ...(criterionId ? { criterionId } : {}),
    });
    if (comments.length >= LIMITS.commentsPerAssessor) break;
  }
  return comments;
}

export function sanitizeDeliberation(
  output: DeliberationOutput,
  doc: Document,
  assessorIds: string[],
  seconds: number,
  options: { hasPrevious?: boolean; written?: boolean } = {},
): {
  deliberation: Deliberation;
  fixList: FixItem[];
  questions: Question[];
  sinceLastTime?: { improved: string[]; stillWeak: string[]; ignored: string[] };
  addOrCut?: { add: string[]; cut: string[] };
} {
  const known = new Set(assessorIds);

  const agreements = output.agreements
    .map((a) => clean(a, LIMITS.shortText))
    .filter(Boolean)
    .slice(0, LIMITS.agreements);

  const splits = output.splits
    .map((s) => {
      const approve = validAssessorIds(s.approve, known);
      const object = validAssessorIds(s.object, known).filter((id) => !approve.includes(id));
      return {
        paragraphIds: validParagraphIds(s.paragraphIds, doc),
        topic: clean(s.topic, LIMITS.shortText),
        approve,
        object,
        advice: clean(s.advice, LIMITS.shortText),
      };
    })
    // A split needs a paragraph, a topic, advice and someone on each side.
    .filter((s) => s.paragraphIds.length > 0 && s.topic && s.advice && s.approve.length > 0 && s.object.length > 0)
    .slice(0, LIMITS.splits);

  const fixList = output.fixList
    .map((f) => ({
      text: clean(f.text, LIMITS.shortText),
      paragraphIds: validParagraphIds(f.paragraphIds, doc),
      raisedBy: validAssessorIds(f.raisedBy, known),
    }))
    .filter((f) => f.text)
    .slice(0, LIMITS.fixes)
    .map((f, i) => ({ rank: i + 1, ...f }));

  const perAssessor = new Map<string, number>();
  const questions: Question[] = [];
  for (const q of output.questions) {
    const text = clean(q.text, LIMITS.shortText);
    if (!known.has(q.assessorId) || !text) continue;
    const n = perAssessor.get(q.assessorId) ?? 0;
    if (n >= LIMITS.questionsPerAssessor) continue;
    perAssessor.set(q.assessorId, n + 1);
    questions.push({ assessorId: q.assessorId, text });
  }

  // "Since last time" only when there was a run to compare with; add/cut only in written mode.
  const since = options.hasPrevious
    ? {
        improved: cleanList(output.sinceLastTime?.improved, LIMITS.sinceLastTimeItems),
        stillWeak: cleanList(output.sinceLastTime?.stillWeak, LIMITS.sinceLastTimeItems),
        ignored: cleanList(output.sinceLastTime?.ignored, LIMITS.sinceLastTimeItems),
      }
    : undefined;
  const sinceLastTime = since && since.improved.length + since.stillWeak.length + since.ignored.length > 0 ? since : undefined;
  const advice = options.written
    ? { add: cleanList(output.addOrCut?.add, LIMITS.addOrCutItems), cut: cleanList(output.addOrCut?.cut, LIMITS.addOrCutItems) }
    : undefined;
  const addOrCut = advice && advice.add.length + advice.cut.length > 0 ? advice : undefined;

  return {
    deliberation: { seconds, agreements, splits },
    fixList,
    questions,
    ...(sinceLastTime ? { sinceLastTime } : {}),
    ...(addOrCut ? { addOrCut } : {}),
  };
}
