"use server";

// A board for one presentation practice, when the student starts from scratch
// or picks the pitch assessors instead of a saved board.
import { z } from "zod";
import { boards, setBoardSeats } from "@/lib/data";

export async function boardForPitch(name: unknown, assessorIds: unknown): Promise<{ ok: true; boardId: string } | { ok: false; error: string }> {
  const parsed = z.object({ name: z.string().min(1).max(100), assessorIds: z.array(z.string().min(1).max(100)).min(1, "Choose at least one assessor.").max(12) }).safeParse({ name, assessorIds });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Choose the board." };
  try {
    const board = await boards.save({ id: crypto.randomUUID(), name: parsed.data.name, assessorIds: [] });
    await setBoardSeats(board.id, parsed.data.assessorIds);
    return { ok: true, boardId: board.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "The board could not be made." };
  }
}
