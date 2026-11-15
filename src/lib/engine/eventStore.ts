import "server-only";
import { engineEvents } from "@/lib/data";
import type { GuardrailEvent, PitchSession } from "@/lib/schemas";

export async function recordGuardrailEvents(sessionId: string, events: GuardrailEvent[]) {
  await Promise.all(events.map((e) => engineEvents.save({ ...e, id: crypto.randomUUID(), sessionId, createdAt: new Date().toISOString() })));
}

export async function behaviorFor(sessionId: string, session?: PitchSession) {
  const events = await engineEvents.list({ sessionId });
  let last: string | null = null;
  const modeShifts = (session?.qa.turns ?? []).flatMap((t, index, turns) => {
    if (!t.mode || t.mode === last) return [];
    last = t.mode;
    const prior = turns[index - 1];
    return [{ turnId: t.id, mode: t.mode, reason: prior?.assessment ? `${prior.assessment.answerQuality} answer · ${prior.assessment.studentIntent}` : "The board changed its approach for this turn." }];
  });
  const finalTurn = session?.qa.turns.at(-1);
  if (session?.qa.mode && session.qa.mode !== last && finalTurn?.assessment) {
    modeShifts.push({ turnId: finalTurn.id, mode: session.qa.mode, reason: `${finalTurn.assessment.answerQuality} answer · ${finalTurn.assessment.studentIntent}` });
  }
  return { modeShifts, guardrailEvents: events.map(({ rule, stage, action, location, reason, count }) => ({ rule, stage, action, location, reason, count })).slice(-1000) };
}
