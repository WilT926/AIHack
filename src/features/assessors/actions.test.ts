import { beforeEach, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { assessorNotes, assessors } from "@/lib/data";
import { copyAssessor, deleteAssessorNote, saveAssessorNote } from "./actions";

beforeEach(() => { delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SECRET_KEY; delete process.env.SUPABASE_SERVICE_ROLE_KEY; });
it("copies traits with a new identity and empty notes, then saves, edits and deletes an owned note", async () => {
  const original = (await assessors.get("module-lead"))!;
  const copied = await copyAssessor({ basedOn: original.id, name: "Dr Alex Demo", field: "Engineering design", harshness: 4, focusAreas: ["Design rationale"], avatar: "avatar-100" });
  expect(copied.ok).toBe(true);
  if (!copied.ok) return;
  expect(copied.value).toMatchObject({ name: "Dr Alex Demo", basedOn: original.id, isPreset: false, role: original.role, harshness: 4 });
  expect(copied.value.id).not.toBe(original.id);
  expect(await assessorNotes.list({ assessorId: copied.value.id })).toEqual([]);
  const saved = await saveAssessorNote({ assessorId: copied.value.id, source: "lecture", text: "wants safety considered in the design" });
  expect(saved.ok).toBe(true);
  if (!saved.ok) return;
  const edited = await saveAssessorNote({ ...saved.value, source: "handbook", text: "Explain the design constraints." });
  expect(edited.ok && edited.value.createdAt).toBe(saved.value.createdAt);
  expect((await assessorNotes.get(saved.value.id))?.text).toBe("Explain the design constraints.");
  expect((await deleteAssessorNote({ id: saved.value.id, assessorId: "methodologist" })).ok).toBe(false);
  expect((await deleteAssessorNote({ id: saved.value.id, assessorId: copied.value.id })).ok).toBe(true);
  expect(await assessorNotes.get(saved.value.id)).toBeNull();
  expect((await assessors.get(original.id))?.name).toBe(original.name);
});
it("rejects empty notes, unsupported avatars and edits to another assessor's note", async () => {
  expect((await saveAssessorNote({ assessorId: "module-lead", text: "   ", source: "other" })).ok).toBe(false);
  expect((await saveAssessorNote({ assessorId: "sceptic", id: "n1", text: "Changed", source: "other" })).ok).toBe(false);
  expect((await copyAssessor({ basedOn: "module-lead", name: "x", field: "x", harshness: 3, focusAreas: [], avatar: "avatar-101" })).ok).toBe(false);
});
