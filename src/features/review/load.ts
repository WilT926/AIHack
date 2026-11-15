import "server-only";
// Builds the review screens' inputs from the data layer.
import { assessors, boards, documents, projects, reviews } from "@/lib/data";
import { toViewDocument } from "./lib";
import type { Board, ReviewView } from "./types";
import { replySource } from "@/lib/engine/service";

/** A saved review, ready for the screen. No engine call. */
export async function loadReviewView(reviewId: string): Promise<ReviewView | null> {
  const review = await reviews.get(reviewId);
  if (!review) return null;
  const [doc, project, people] = await Promise.all([documents.get(review.documentId), projects.get(review.projectId), assessors.list()]);
  if (!doc || !project) return null;
  const projectBoard = project.boardId ? await boards.get(project.boardId) : null;
  const board: Board = {
    id: projectBoard?.id ?? "board",
    name: projectBoard?.name ?? "Board",
    assessorIds: review.assessorResults.map((a) => a.assessorId),
  };
  return {
    project: { id: project.id, name: project.title },
    board,
    assessors: people,
    document: toViewDocument(doc),
    review: {
      id: review.id,
      createdAt: review.createdAt,
      comments: review.assessorResults.flatMap((a) => a.comments),
      deliberation: review.deliberation ?? null,
      report: review.report ?? null,
      replySource: review.replySource,
    },
    live:
      review.status === "done"
        ? undefined
        : {
            status: "done",
            doneAssessorIds: review.assessorResults.filter((a) => a.status === "done").map((a) => a.assessorId),
            failed: review.assessorResults
              .filter((a) => a.status !== "done")
              .map((a) => ({ assessorId: a.assessorId, message: "This review was left before it finished. Start a new one from the document." })),
          },
  };
}

export type IntakeContext = Pick<ReviewView, "project" | "board" | "assessors">;

/** Opening a Desk document only reads saved data; starting a new run is explicit. */
export async function loadDocumentView(documentId: string): Promise<{ view: ReviewView; canStart: boolean } | null> {
  const doc = await documents.get(documentId);
  if (!doc) return null;
  const context = await loadIntakeContext(doc.projectId);
  if (!context) return null;
  const saved = (await reviews.list({ documentId })).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  const latest = saved[0];
  if (latest && latest.status !== "ready") {
    const view = await loadReviewView(latest.id);
    return view ? { view: latest.status === "done" ? view : { ...view, board: context.board }, canStart: latest.status !== "done" } : null;
  }
  return {
    canStart: true,
    view: { ...context, document: toViewDocument(doc), review: { id: null, comments: [], deliberation: null, report: null, replySource: replySource() ?? "sample" } },
  };
}

/** The project, its board and the assessors, for the upload screen. Defaults to the first report project. */
export async function loadIntakeContext(projectId: string | null): Promise<IntakeContext | null> {
  const all = await projects.list();
  const project = projectId ? all.find((p) => p.id === projectId) : all.find((p) => p.template !== "pitch") ?? all[0];
  if (!project) return null;
  const [board, people] = await Promise.all([project.boardId ? boards.get(project.boardId) : null, assessors.list()]);
  return {
    project: { id: project.id, name: project.title },
    board: { id: board?.id ?? "board", name: board?.name ?? "Board", assessorIds: board?.assessorIds ?? [] },
    assessors: people,
  };
}
