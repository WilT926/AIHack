// Opt-in evidence: uses invented notes/documents only, no student material.
import { writeFile } from "node:fs/promises";
import { expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { copyAssessor, saveAssessorNote } from "@/features/assessors/actions";
import { assessorNotes, assessors, boards, callLogs, documents, projects } from "@/lib/data";
import { reportBoard } from "@/lib/data/seed-data";
import { reviewWithAssessor } from "./service";

it.skipIf(process.env.PANEL_VERIFY_LIVE !== "1")("lecture notes change only the copied assessor's real review", async () => {
  process.loadEnvFile(".env.local");
  expect(Boolean(process.env.ANTHROPIC_API_KEY)).toBe(true);
  // Use the temporary store even if a database is connected: evidence must never mutate student data.
  delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SECRET_KEY; delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const lead = (await assessors.get("module-lead"))!;
  const copy = await copyAssessor({ basedOn: lead.id, name: "Dr Alex Rowan (invented)", field: lead.field, harshness: lead.harshness, focusAreas: lead.focusAreas, avatar: "avatar-099" });
  expect(copy.ok).toBe(true); if (!copy.ok) return;
  const boardIds = [copy.value.id, ...reportBoard.assessorIds.filter((id) => id !== lead.id)];
  // Remove seeded lecture notes in this isolated test store so the added note is the only intervention.
  for (const note of await assessorNotes.list()) await assessorNotes.remove(note.id);
  const now = new Date().toISOString();
  await boards.save({ id: "note-evidence-board", name: "Note intervention board", assessorIds: boardIds });
  await projects.save({ id: "note-evidence-project", title: "Timetable search report (invented)", template: "masters-report", boardId: "note-evidence-board", brief: { what: "Short prototype report", topic: "Searching a campus timetable", graded: ["Design rationale", "Evaluation", "Clarity"], goal: "Find gaps before submission" }, markSchemeText: "", weakSpots: [], createdAt: now, updatedAt: now });
  const doc = await documents.save({ id: "note-evidence-doc", projectId: "note-evidence-project", title: "Prototype report (invented)", createdAt: now, paragraphs: [
    { id: "p1", type: "paragraph", text: "We built an offline timetable search prototype. It indexes invented module names and room labels from a fixed local file. A keyword query returns matching timetable entries. The prototype has no network connection, accounts or personal records." },
    { id: "p2", type: "paragraph", text: "We compared keyword search with manually scanning the same timetable. Six volunteers completed eight lookup tasks in counterbalanced order. We measured completion time and correct matches. The median completion time was 18 seconds with search and 31 seconds with manual scanning, with five incorrect matches across all search tasks." },
    { id: "p3", type: "paragraph", text: "The interface uses one search box and a list of matching modules. Participants said abbreviations were difficult to recognise. Our next version will show full module titles. The small convenience sample and the fixed lookup tasks limit what can be concluded about use across courses." },
  ] });
  const before = await reviewWithAssessor({ projectId: doc.projectId, documentId: doc.id, assessorId: copy.value.id });
  expect(before.status).toBe("done");
  const note = await saveAssessorNote({ assessorId: copy.value.id, text: "wants safety considered in the design", source: "lecture" });
  expect(note.ok).toBe(true);
  const after = await Promise.all(boardIds.map((assessorId) => reviewWithAssessor({ projectId: doc.projectId, documentId: doc.id, assessorId })));
  const safety = (r: typeof before) => r.status === "done" && r.comments.some((c) => /\bsafe(?:ty)?\b|\bhazards?\b/i.test(`${c.text} ${c.suggestion} ${c.category}`));
  // Preserve all observations even if the causal isolation check fails.
  await writeFile("fixtures/engine/real-note-intervention.json", JSON.stringify({ provenance: "Real Claude on invented document and invented lecture note; isolated temporary store; not student work", verifiedAt: now, copiedAssessor: copy.value, document: doc, intervention: { source: "lecture", text: "wants safety considered in the design" }, before, after, safetyRaised: { before: safety(before), after: after.map((r) => ({ assessorId: r.assessorId, raised: safety(r) })) }, calls: await callLogs.list() }, null, 2) + "\n");
  expect(safety(before)).toBe(false);
  expect(after.every((r) => r.status === "done")).toBe(true);
  expect(safety(after[0])).toBe(true);
  expect(after.slice(1).some(safety)).toBe(false);
}, 180000);
