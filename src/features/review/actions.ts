"use server";

// Report review on the server: start a review (save the document and a
// running review), and mark a comment done. The engine routes in
// src/app/api/engine do the reading and the deliberation.
import { z } from "zod";
import { boards, documents, projects, reviews } from "@/lib/data";
import { replySource } from "@/lib/engine/service";
import { paragraphSchema, type ReplySource } from "@/lib/schemas";

const startInput = z.object({
  projectId: z.string().min(1).max(100),
  title: z.string().min(1).max(300),
  paragraphs: z.array(paragraphSchema).min(1).max(2000),
});

export type StartedReview = { documentId: string; reviewId: string; replySource: ReplySource; boardIds: string[] };

/** Save the document and a review in progress, so the floor shows the table in session. */
async function beginReview(raw: z.input<typeof startInput>, existingDocumentId?: string): Promise<{ ok: true; value: StartedReview } | { ok: false; error: string }> {
  try {
    const v = startInput.parse(raw);
    const source = replySource();
    if (!source) return { ok: false, error: "The engine is not configured: set ANTHROPIC_API_KEY." };
    const project = await projects.get(v.projectId);
    if (!project) return { ok: false, error: "That project no longer exists." };
    const board = project.boardId ? await boards.get(project.boardId) : null;
    if (!board || board.assessorIds.length === 0) return { ok: false, error: "No one is seated at this project's board yet." };
    if (!v.paragraphs.some((p) => p.type !== "heading" && p.text.trim())) return { ok: false, error: "The document has no paragraphs to review." };

    const now = new Date().toISOString();
    const documentId = existingDocumentId ?? (await documents.save({ id: crypto.randomUUID(), projectId: project.id, title: v.title.trim(), paragraphs: v.paragraphs, createdAt: now })).id;
    const review = await reviews.save({
      id: crypto.randomUUID(),
      projectId: project.id,
      documentId,
      createdAt: now,
      status: "running",
      assessorResults: board.assessorIds.map((id) => ({ assessorId: id, status: "reading" as const, comments: [] })),
      deliberation: null,
      report: null,
      replySource: source,
    });
    await projects.save({ ...project, updatedAt: now });
    return { ok: true, value: { documentId, reviewId: review.id, replySource: source, boardIds: board.assessorIds } };
  } catch (e) {
    return { ok: false, error: e instanceof z.ZodError ? "The document could not be read." : e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function startReview(raw: z.input<typeof startInput>) {
  return beginReview(raw);
}

/** Reuse the saved text and identity; the client cannot replace either. */
export async function startStoredReview(documentId: string) {
  const parsed = z.string().min(1).max(100).safeParse(documentId);
  if (!parsed.success) return { ok: false as const, error: "That document was not found." };
  try {
    const doc = await documents.get(parsed.data);
    if (!doc) return { ok: false as const, error: "That document was not found." };
    return beginReview({ projectId: doc.projectId, title: doc.title, paragraphs: doc.paragraphs }, doc.id);
  } catch {
    return { ok: false as const, error: "Could not open the saved document. Please try again." };
  }
}

/** Mark a comment done on a saved review. */
export async function markCommentDone(reviewId: string, commentId: string): Promise<void> {
  const r = await reviews.get(z.string().min(1).max(100).parse(reviewId));
  if (!r) return;
  const cid = z.string().min(1).max(100).parse(commentId);
  await reviews.save({
    ...r,
    assessorResults: r.assessorResults.map((a) => ({ ...a, comments: a.comments.map((c) => (c.id === cid ? { ...c, done: true } : c)) })),
  });
}
