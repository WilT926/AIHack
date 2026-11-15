"use server";

// Floor writes: record that a table was opened, and change who sits at a board.
import { z } from "zod";
import { markProjectViewed, setBoardSeats } from "@/lib/data";

type Result = { ok: true } | { ok: false; error: string };
const id = z.string().min(1).max(100);

export async function markTableViewed(projectId: unknown): Promise<Result> {
  const parsed = id.safeParse(projectId);
  if (!parsed.success) return { ok: false, error: "Unknown table." };
  try {
    await markProjectViewed(parsed.data);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not record the visit." };
  }
}

export async function saveBoardSeats(boardId: unknown, assessorIds: unknown): Promise<Result> {
  const parsed = z.object({ boardId: id, assessorIds: z.array(id).max(12) }).safeParse({ boardId, assessorIds });
  if (!parsed.success) return { ok: false, error: "The board could not be read." };
  try {
    await setBoardSeats(parsed.data.boardId, parsed.data.assessorIds);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "The board could not be saved." };
  }
}
