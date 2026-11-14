import type { Assessor, Comment, CommentKind, Document } from "./types";

export function indexAssessors(assessors: Assessor[]): Map<string, Assessor> {
  return new Map(assessors.map((a) => [a.id, a]));
}

/** "p2" -> "¶2", using the paragraph's index in the document. */
export function paragraphLabel(doc: Document, paragraphId: string): string {
  const p = doc.paragraphs.find((x) => x.id === paragraphId);
  return p ? `¶${p.index}` : paragraphId;
}

export function paragraphOrder(doc: Document): Map<string, number> {
  return new Map(doc.paragraphs.map((p) => [p.id, p.index]));
}

const kindPriority: CommentKind[] = ["critique", "question", "praise"];

/** The kind that sets a paragraph's tint: critique beats question beats praise. */
export function dominantKind(comments: Comment[]): CommentKind | undefined {
  return kindPriority.find((k) => comments.some((c) => c.kind === k));
}

/** Group open comments by the paragraphs they reference. */
export function commentsByParagraph(comments: Comment[]): Map<string, Comment[]> {
  const map = new Map<string, Comment[]>();
  for (const c of comments) {
    for (const pid of c.paragraphIds) {
      const list = map.get(pid) ?? [];
      list.push(c);
      map.set(pid, list);
    }
  }
  return map;
}

/** Sort comments by the first paragraph they point at, keeping input order otherwise. */
export function sortByParagraph(comments: Comment[], order: Map<string, number>): Comment[] {
  const first = (c: Comment) => Math.min(...c.paragraphIds.map((id) => order.get(id) ?? Infinity));
  return [...comments].sort((a, b) => first(a) - first(b));
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-GB");
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** "Chapter 3" -> "Ch.3", for the breadcrumb. */
export function shortChapter(chapter: string): string {
  return chapter.replace(/^chapter\s*/i, "Ch.");
}
