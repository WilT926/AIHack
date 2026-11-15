import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/engine/service", () => ({ replySource: () => "sample" }));
import { documents, projects, reviews } from "@/lib/data";
import { startStoredReview } from "./actions";
import { loadDocumentView, loadIntakeContext } from "./load";

beforeEach(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SECRET_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

it("opens a document without running a review, then starts on its saved identity and text", async () => {
  const doc = await documents.save({ id: "navigation-ready", projectId: "proj-mt", title: "Stored methods", paragraphs: [{ id: "p1", type: "paragraph", text: "A synthetic methods paragraph for the navigation test." }], createdAt: "2026-11-15T03:00:00Z" });
  const before = await reviews.list();
  const loaded = await loadDocumentView(doc.id);
  expect(loaded?.canStart).toBe(true);
  expect(loaded?.view.review.id).toBeNull();
  expect(loaded?.view.document.paragraphs[0].text).toBe(doc.paragraphs[0].text);
  expect(await reviews.list()).toEqual(before);
  const started = await startStoredReview(doc.id);
  expect(started.ok).toBe(true);
  if (!started.ok) return;
  expect(started.value.documentId).toBe(doc.id);
  expect((await reviews.get(started.value.reviewId))?.documentId).toBe(doc.id);
  expect(await documents.get(doc.id)).toEqual(doc);
  expect((await documents.list()).filter((d) => d.title === doc.title)).toHaveLength(1);
});

it("reopens the latest saved run, including unfinished results, without generating anything", async () => {
  const doc = (await documents.get("doc-mt-ch2"))!;
  const original = (await reviews.list({ documentId: doc.id }))[0];
  await reviews.save({ ...original, id: "navigation-older", createdAt: "2026-11-14T03:00:00Z" });
  const latest = await reviews.save({ ...original, id: "navigation-latest", createdAt: "2026-11-15T03:00:00Z" });
  const before = await reviews.list();
  const loaded = await loadDocumentView(doc.id);
  expect(loaded?.view.review.id).toBe(latest.id);
  expect(loaded?.view.review.report).toEqual(latest.report);
  expect(loaded?.canStart).toBe(false);
  expect(await reviews.list()).toEqual(before);
  await reviews.save({ ...latest, status: "running", report: null });
  const unfinished = await loadDocumentView(doc.id);
  expect(unfinished?.canStart).toBe(true);
  expect(unfinished?.view.live?.status).toBe("done"); // never falsely resumes a run
  expect(unfinished?.view.board.assessorIds.length).toBeGreaterThan(0); // restart uses the current project board, even when the old run saved no results
});

it("handles missing text and projects without silently using another project", async () => {
  expect(await loadDocumentView("missing-document")).toBeNull();
  expect(await loadIntakeContext("missing-project")).toBeNull();
  expect((await startStoredReview("doc-lr-2")).ok).toBe(false);
  expect((await startStoredReview("missing-document")).ok).toBe(false);
  await documents.save({ id: "navigation-orphan", projectId: "missing-project", title: "Orphan", paragraphs: [{ id: "p1", type: "paragraph", text: "Synthetic text." }], createdAt: "2026-11-15T03:00:00Z" });
  expect(await loadDocumentView("navigation-orphan")).toBeNull();
  expect((await startStoredReview("navigation-orphan")).ok).toBe(false);
  const project = (await projects.get("proj-mt"))!;
  await projects.save({ ...project, id: "navigation-no-board", boardId: null });
  await documents.save({ id: "navigation-no-board", projectId: "navigation-no-board", title: "No board", paragraphs: [{ id: "p1", type: "paragraph", text: "Synthetic text." }], createdAt: "2026-11-15T03:00:00Z" });
  expect((await startStoredReview("navigation-no-board")).ok).toBe(false);
});
