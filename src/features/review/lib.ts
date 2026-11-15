import type { Document as SharedDocument } from "@/lib/schemas";
import type { Assessor, Comment, CommentSeverity, Document } from "./types";

export function indexAssessors(assessors: Assessor[]): Map<string, Assessor> {
  return new Map(assessors.map((a) => [a.id, a]));
}

const words = (t: string) => t.trim().match(/\S+/g)?.length ?? 0;

/** A shared Document with paragraph numbers and a word count, for the screen. */
export function toViewDocument(doc: Pick<SharedDocument, "id" | "title" | "paragraphs">, extra: { chapter?: string; version?: number } = {}): Document {
  return {
    id: doc.id,
    title: doc.title,
    chapter: extra.chapter,
    version: extra.version ?? 1,
    paragraphs: doc.paragraphs.map((p, i) => ({ ...p, index: i + 1 })),
    wordCount: doc.paragraphs.reduce((n, p) => n + words(p.text), 0),
  };
}

/** "p2" -> "¶2", using the paragraph's position in the document. */
export function paragraphLabel(doc: Document, paragraphId: string): string {
  const p = doc.paragraphs.find((x) => x.id === paragraphId);
  return p ? `¶${p.index}` : paragraphId;
}

export function paragraphOrder(doc: Document): Map<string, number> {
  return new Map(doc.paragraphs.map((p) => [p.id, p.index]));
}

const severityPriority: CommentSeverity[] = ["major", "minor", "praise"];

/** The severity that sets a paragraph's anchor: major beats minor beats praise. */
export function dominantSeverity(comments: Comment[]): CommentSeverity | undefined {
  return severityPriority.find((k) => comments.some((c) => c.severity === k));
}

/** Group comments by their paragraph. */
export function commentsByParagraph(comments: Comment[]): Map<string, Comment[]> {
  const map = new Map<string, Comment[]>();
  for (const c of comments) map.set(c.paragraphId, [...(map.get(c.paragraphId) ?? []), c]);
  return map;
}

/** Sort comments by paragraph, keeping input order otherwise. */
export function sortByParagraph(comments: Comment[], order: Map<string, number>): Comment[] {
  return [...comments].sort((a, b) => (order.get(a.paragraphId) ?? Infinity) - (order.get(b.paragraphId) ?? Infinity));
}

/**
 * Split a paragraph into plain and quoted runs, so the quoted words can carry
 * the 1.5px underline (§9). Matching ignores case; overlapping quotes merge.
 */
export function quoteRuns(text: string, quotes: string[]): { text: string; quoted: boolean }[] {
  const lower = text.toLowerCase();
  const spans: [number, number][] = [];
  for (const q of quotes) {
    const t = q.trim().toLowerCase();
    if (!t) continue;
    const at = lower.indexOf(t);
    if (at >= 0) spans.push([at, at + t.length]);
  }
  spans.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s[0] <= last[1]) last[1] = Math.max(last[1], s[1]);
    else merged.push([...s]);
  }
  const runs: { text: string; quoted: boolean }[] = [];
  let i = 0;
  for (const [a, b] of merged) {
    if (a > i) runs.push({ text: text.slice(i, a), quoted: false });
    runs.push({ text: text.slice(a, b), quoted: true });
    i = b;
  }
  if (i < text.length) runs.push({ text: text.slice(i), quoted: false });
  return runs;
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
