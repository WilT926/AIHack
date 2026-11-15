"use server";

// Floor writes: record that a table was opened, and change who sits at a board.
import { z } from "zod";
import { boards, markProjectViewed, projects, setBoardSeats } from "@/lib/data";
import { projectTemplateSchema } from "@/lib/schemas";

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

const details = z.object({
  title: z.string().trim().min(1, "Give the table a name.").max(200),
  template: projectTemplateSchema,
  what: z.string().trim().max(500),
  topic: z.string().trim().max(500),
  /** yyyy-mm-dd or empty. */
  deadline: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
});
const deadlineIso = (d: string) => (d ? new Date(`${d}T12:00:00Z`).toISOString() : null);

/** A new, blank table: its details and its board (an existing one, or a new one from chosen assessors). */
export async function createTable(input: unknown): Promise<{ ok: true; projectId: string } | { ok: false; error: string }> {
  const parsed = details
    .extend({ boardId: id.nullable(), assessorIds: z.array(id).max(12) })
    .refine((v) => v.boardId || v.assessorIds.length > 0, "Choose a board, or seat at least one assessor.")
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the details." };
  const v = parsed.data;
  try {
    const now = new Date().toISOString();
    let boardId = v.boardId;
    if (!boardId) {
      const board = await boards.save({ id: crypto.randomUUID(), name: `${v.title} board`, assessorIds: [] });
      await setBoardSeats(board.id, v.assessorIds);
      boardId = board.id;
    }
    const project = await projects.save({
      id: crypto.randomUUID(),
      title: v.title,
      template: v.template,
      brief: { what: v.what, topic: v.topic, graded: [], goal: "" },
      deadline: deadlineIso(v.deadline),
      markSchemeText: "",
      weakSpots: [],
      boardId,
      createdAt: now,
      updatedAt: now,
      viewedAt: now,
    });
    return { ok: true, projectId: project.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "The table could not be made." };
  }
}

/** Change a table's name, type, description, topic and deadline. */
export async function updateTableDetails(projectId: unknown, input: unknown): Promise<Result> {
  const pid = id.safeParse(projectId);
  const parsed = details.safeParse(input);
  if (!pid.success || !parsed.success) return { ok: false, error: parsed.error?.issues[0]?.message ?? "Check the details." };
  try {
    const p = await projects.get(pid.data);
    if (!p) return { ok: false, error: "That table no longer exists." };
    const v = parsed.data;
    await projects.save({ ...p, title: v.title, template: v.template, brief: { ...p.brief, what: v.what, topic: v.topic }, deadline: deadlineIso(v.deadline), updatedAt: new Date().toISOString() });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "The details could not be saved." };
  }
}
