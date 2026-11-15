// The board's memory across attempts (judging criterion: session state and
// memory across multi-turn interactions and prior attempts).
//
// Per project, every finished attempt (report review or pitch practice) is
// kept: what each assessor raised, the board's actions and whether they were
// ticked, and each criterion's rating. It is updated when a session ends and
// when an action is ticked, and passed into every assessor call and the pitch
// question call with the rule not to contradict earlier feedback.
//
// Pure functions only; saving goes through src/lib/data in ./memoryStore.ts.
import type { BoardMemory, FeedbackReport, MemoryAttempt, PitchSession, Review } from "@/lib/schemas";

const firstSentence = (t: string) => {
  const m = t.trim().match(/^.*?[.?!](\s|$)/);
  return (m ? m[0] : t).trim().slice(0, 280);
};

function fromReport(report: FeedbackReport | null | undefined) {
  return {
    verdict: report ? firstSentence(report.verdict) : "",
    actions: (report?.actions ?? []).map((a) => ({ id: a.id, what: a.what, done: a.done, raisedBy: a.raisedBy })),
    criteria: (report?.criteria ?? []).map((c) => ({ criterion: c.criterion, rating: c.rating })),
  };
}

const SEVERITY_ORDER = { major: 0, minor: 1, praise: 2 } as const;

/** A finished review as an attempt: each assessor's main points, most serious first. */
export function attemptFromReview(review: Review, title: string): MemoryAttempt {
  return {
    sessionId: review.id,
    kind: "report",
    at: review.createdAt,
    title,
    ...fromReport(review.report),
    raised: review.assessorResults
      .filter((a) => a.status === "done" && a.comments.length > 0)
      .map((a) => ({
        assessorId: a.assessorId,
        points: [...a.comments]
          .sort((x, y) => SEVERITY_ORDER[x.severity] - SEVERITY_ORDER[y.severity])
          .slice(0, 5)
          .map((c) => `${c.severity === "praise" ? "Praised" : c.severity === "major" ? "Major" : "Minor"} (${c.paragraphId}): ${firstSentence(c.text)}`),
      })),
  };
}

/** A finished pitch session as an attempt: the questions each judge asked, and the actions they raised. */
export function attemptFromPitch(session: PitchSession): MemoryAttempt {
  const byJudge = new Map<string, string[]>();
  for (const t of session.qa.turns.length ? session.qa.turns : session.questions.map((q) => ({ assessorId: q.assessorId, text: q.text, kind: "question" as const }))) {
    if (t.kind === "pause") continue;
    byJudge.set(t.assessorId, [...(byJudge.get(t.assessorId) ?? []), `Asked: ${firstSentence(t.text)}`]);
  }
  for (const a of session.report?.actions ?? []) {
    for (const id of a.raisedBy) byJudge.set(id, [...(byJudge.get(id) ?? []), `Raised: ${firstSentence(a.what)}`]);
  }
  return {
    sessionId: session.id,
    kind: "pitch",
    at: session.endedAt ?? session.createdAt,
    title: "Presentation practice",
    ...fromReport(session.report),
    raised: [...byJudge.entries()].map(([assessorId, points]) => ({ assessorId, points: points.slice(0, 6) })),
  };
}

/** Add or replace an attempt (by session), keeping them oldest first. */
export function withAttempt(memory: BoardMemory, attempt: MemoryAttempt): BoardMemory {
  const attempts = [...memory.attempts.filter((a) => a.sessionId !== attempt.sessionId), attempt].sort((a, b) => a.at.localeCompare(b.at));
  return { attempts: attempts.slice(-30) };
}

/** Record a tick on an attempt's action. */
export function withActionDone(memory: BoardMemory, sessionId: string, actionId: string, done: boolean): BoardMemory {
  return {
    attempts: memory.attempts.map((a) =>
      a.sessionId === sessionId ? { ...a, actions: a.actions.map((x) => (x.id === actionId ? { ...x, done } : x)) } : a,
    ),
  };
}

/** Earlier attempts only: never the session being run now. */
export function priorAttempts(memory: BoardMemory, currentSessionId?: string | null): MemoryAttempt[] {
  return memory.attempts.filter((a) => a.sessionId !== currentSessionId);
}

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const kindLabel = (a: MemoryAttempt) => (a.kind === "report" ? `report review of "${a.title}"` : "presentation practice");

export const MEMORY_RULE =
  "Do not contradict earlier feedback. If you now see a point differently, say so and why. Say whether points raised before have been fixed, and do not raise a fixed point again as if it were new.";

/** What one assessor said before, plus the board's actions and ratings: layer three of their prompt. */
export function memoryForAssessor(memory: BoardMemory, assessorId: string, currentSessionId?: string | null, limit = 3): string | null {
  const prior = priorAttempts(memory, currentSessionId).slice(-limit);
  if (prior.length === 0) return null;
  const blocks = prior.map((a, i) => {
    const mine = a.raised.find((r) => r.assessorId === assessorId)?.points ?? [];
    const actions = a.actions.map((x) => `- ${x.done ? "[ticked done]" : "[still open]"} ${x.what}`);
    const ratings = a.criteria.map((c) => `${c.criterion}: ${c.rating}`).join("; ");
    return [
      `On ${day(a.at)}, ${kindLabel(a)}${i === prior.length - 1 ? " (the most recent attempt)" : ""}:`,
      mine.length ? `You raised:\n${mine.map((p) => `- ${p}`).join("\n")}` : "You raised nothing on this attempt.",
      actions.length ? `The board's actions:\n${actions.join("\n")}` : "",
      ratings ? `Ratings: ${ratings}.` : "",
    ]
      .filter(Boolean)
      .join("\n");
  });
  return `${blocks.join("\n\n")}\n\n${MEMORY_RULE}`;
}

/** The whole board's memory, for the pitch questions, the deliberation and the report. */
export function memoryForBoard(memory: BoardMemory, currentSessionId?: string | null, limit = 3): string | null {
  const prior = priorAttempts(memory, currentSessionId).slice(-limit);
  if (prior.length === 0) return null;
  const blocks = prior.map((a) => {
    const raised = a.raised.map((r) => `  ${r.assessorId}: ${r.points.slice(0, 3).join(" | ")}`).join("\n");
    const actions = a.actions.map((x) => `  - ${x.done ? "[ticked done]" : "[still open]"} ${x.what}`).join("\n");
    const ratings = a.criteria.map((c) => `${c.criterion}: ${c.rating}`).join("; ");
    return `${day(a.at)}, ${kindLabel(a)}. Verdict: ${a.verdict}\n${raised ? `Raised:\n${raised}\n` : ""}${actions ? `Actions:\n${actions}\n` : ""}${ratings ? `Ratings: ${ratings}` : ""}`.trim();
  });
  return `${blocks.join("\n\n")}\n\n${MEMORY_RULE}`;
}

/** The previous attempt's actions the student has not ticked: "still open", worked out in code. */
export function stillOpen(memory: BoardMemory, currentSessionId?: string | null): string[] {
  const last = priorAttempts(memory, currentSessionId).at(-1);
  return last ? last.actions.filter((a) => !a.done).map((a) => a.what) : [];
}

/**
 * The report's "since last time": improved and raised again come from the
 * model (checked to be non-empty strings); still open comes from code. Null
 * when there is no earlier attempt.
 */
export function sinceLastTime(
  memory: BoardMemory,
  currentSessionId: string | null | undefined,
  fromModel: { improved?: string[]; raisedAgain?: string[] } | null | undefined,
): FeedbackReport["sinceLastTime"] {
  if (priorAttempts(memory, currentSessionId).length === 0) return null;
  const clean = (xs?: string[]) => (xs ?? []).map((x) => x.trim()).filter(Boolean).slice(0, 10);
  return { improved: clean(fromModel?.improved), raisedAgain: clean(fromModel?.raisedAgain), stillOpen: stillOpen(memory, currentSessionId).slice(0, 10) };
}

/** Rating trend per criterion across attempts, oldest first, for the home side panel. */
export function ratingTrends(memory: BoardMemory): { criterion: string; ratings: ("strong" | "adequate" | "weak")[] }[] {
  const map = new Map<string, ("strong" | "adequate" | "weak")[]>();
  for (const a of memory.attempts) for (const c of a.criteria) map.set(c.criterion, [...(map.get(c.criterion) ?? []), c.rating]);
  return [...map.entries()].map(([criterion, ratings]) => ({ criterion, ratings }));
}
