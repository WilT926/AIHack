"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assessorNotes, assessors } from "@/lib/data";
import { harshnessSchema, noteSourceSchema } from "@/lib/schemas";

const id = z.string().min(1).max(100);
const copyInput = z.object({
  basedOn: id,
  name: z.string().trim().min(1).max(100),
  field: z.string().trim().min(1).max(200),
  harshness: harshnessSchema,
  focusAreas: z.array(z.string().trim().min(1).max(200)).max(12),
  avatar: z.string().regex(/^avatar-(?:00[1-9]|0[1-9]\d|100)$/),
});
const noteInput = z.object({
  assessorId: id,
  id: id.optional(),
  source: noteSourceSchema,
  text: z.string().trim().min(1, "Write a note first.").max(20000),
});

function refresh(assessorId: string) {
  revalidatePath("/assessors");
  revalidatePath(`/assessors/${assessorId}`);
  revalidatePath("/");
}
const errorMessage = (e: unknown) => e instanceof z.ZodError ? e.issues[0]?.message ?? "Check the form." : "Could not save. Please try again.";

/** Copy the assessor's traits. Notes belong to their original marker and start empty. */
export async function copyAssessor(raw: z.input<typeof copyInput>) {
  try {
    const v = copyInput.parse(raw);
    const original = await assessors.get(v.basedOn);
    if (!original) return { ok: false as const, error: "That assessor no longer exists." };
    const value = await assessors.save({ ...original, ...v, id: crypto.randomUUID(), isPreset: false, portrait: null, idleClip: null, talkingClip: null });
    refresh(value.id);
    return { ok: true as const, value };
  } catch (e) { return { ok: false as const, error: errorMessage(e) }; }
}

export async function saveAssessorNote(raw: z.input<typeof noteInput>) {
  try {
    const v = noteInput.parse(raw);
    if (!(await assessors.get(v.assessorId))) return { ok: false as const, error: "That assessor no longer exists." };
    const previous = v.id ? await assessorNotes.get(v.id) : null;
    if (v.id && previous?.assessorId !== v.assessorId) return { ok: false as const, error: "That note does not belong to this assessor." };
    const value = await assessorNotes.save({ ...v, id: previous?.id ?? crypto.randomUUID(), createdAt: previous?.createdAt ?? new Date().toISOString() });
    refresh(v.assessorId);
    return { ok: true as const, value };
  } catch (e) { return { ok: false as const, error: errorMessage(e) }; }
}

export async function deleteAssessorNote(raw: { assessorId: string; id: string }) {
  try {
    const v = z.object({ assessorId: id, id }).parse(raw);
    const note = await assessorNotes.get(v.id);
    if (!note || note.assessorId !== v.assessorId) return { ok: false as const, error: "That note does not belong to this assessor." };
    await assessorNotes.remove(v.id);
    refresh(v.assessorId);
    return { ok: true as const };
  } catch (e) { return { ok: false as const, error: errorMessage(e) }; }
}
