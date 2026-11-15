"use server";

// Ticks on the feedback report's actions, saved with the report.
import { z } from "zod";
import { pitchSessions, reviews } from "@/lib/data";

const input = z.object({
  kind: z.enum(["review", "pitch"]),
  id: z.string().min(1).max(100),
  actionId: z.string().min(1).max(20),
  done: z.boolean(),
});

export async function setActionDone(raw: z.input<typeof input>): Promise<void> {
  const v = input.parse(raw);
  const mark = <T extends { actions: { id: string; done: boolean }[] }>(r: T): T => ({
    ...r,
    actions: r.actions.map((a) => (a.id === v.actionId ? { ...a, done: v.done } : a)),
  });
  if (v.kind === "review") {
    const r = await reviews.get(v.id);
    if (r?.report) await reviews.save({ ...r, report: mark(r.report) });
  } else {
    const s = await pitchSessions.get(v.id);
    if (s?.report) await pitchSessions.save({ ...s, report: mark(s.report) });
  }
}
