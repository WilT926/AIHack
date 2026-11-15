"use server";

// Saves the student's own details and avatar from user settings. Input is
// checked here; the data layer checks the whole profile again before writing.
import { z } from "zod";
import { updateProfile } from "@/lib/data";
import { levelSchema, type Profile } from "@/lib/schemas";

type Result = { ok: true; profile: Profile } | { ok: false; error: string };

const details = z.object({
  name: z.string().trim().min(1, "Add your name.").max(100),
  university: z.string().trim().max(200),
  course: z.string().trim().max(200),
  level: levelSchema,
});

/** Avatars are the pen set in public/avatars: avatar-001 … avatar-100. */
const avatarId = z.string().regex(/^avatar-(0\d\d|100)$/, "Pick an avatar from the set.").refine((a) => a !== "avatar-000");

export async function saveProfileDetails(input: unknown): Promise<Result> {
  const parsed = details.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the details." };
  try {
    return { ok: true, profile: await updateProfile(parsed.data) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Your details could not be saved." };
  }
}

export async function saveAvatar(avatar: unknown): Promise<Result> {
  const parsed = avatarId.safeParse(avatar);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Pick an avatar from the set." };
  try {
    return { ok: true, profile: await updateProfile({ avatar: parsed.data }) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Your avatar could not be saved." };
  }
}
