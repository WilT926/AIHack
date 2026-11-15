// Leaving a panel meeting part-way still saves it: the transcript so far is
// kept and the board writes its feedback report, so the session appears in
// that panel's Desk to review later. Sent by the browser as it leaves (a
// keepalive request), so it finishes even after the page has gone.
import { NextResponse } from "next/server";
import { z } from "zod";
import { pitchSessions } from "@/lib/data";
import { finishQandA } from "@/lib/engine/pitchService";

export const maxDuration = 60;

const body = z.object({
  sessionId: z.string().min(1).max(100),
  transcript: z.string().max(200_000).optional(),
  startedAt: z.iso.datetime({ offset: true }).optional(),
  endedAt: z.iso.datetime({ offset: true }).optional(),
});

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The request was not valid." }, { status: 400 });
  const { sessionId, transcript, startedAt, endedAt } = parsed.data;
  try {
    let s = await pitchSessions.get(sessionId);
    if (!s || (s.status === "done" && s.report)) return NextResponse.json({ ok: true, skipped: true });
    if (s.status === "listening") {
      const text = (transcript ?? s.transcript).trim();
      // Nothing was said yet: nothing to review.
      if (!text) return NextResponse.json({ ok: true, skipped: true });
      const end = endedAt ?? new Date().toISOString();
      s = await pitchSessions.save({ ...s, status: "conferring", transcript: text, startedAt: startedAt ?? s.startedAt ?? end, endedAt: end });
    }
    const done = await finishQandA(s.id);
    return NextResponse.json({ ok: true, status: done.status });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "The session could not be saved." }, { status: 500 });
  }
}
