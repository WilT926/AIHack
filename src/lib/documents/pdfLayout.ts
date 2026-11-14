// Rebuilds readable text from positioned PDF text items: groups items into
// lines, drops running headers, footers and page numbers, and inserts a blank
// line wherever the vertical gap says a new paragraph starts.
// Pure, so it can be tested without a PDF.

import { isPageNumberLine } from "./split";

export type PdfTextItem = {
  str: string;
  x: number;
  y: number; // baseline, PDF units (grows upwards)
  width: number;
  height: number;
  hasEOL?: boolean;
};

type Line = { text: string; y: number; height: number; endX: number };

/** Value at the given fraction through the sorted list (0.5 = median). */
function quantile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * q))];
}

/** Group a page's items into lines, in reading order. */
export function toLines(items: PdfTextItem[]): Line[] {
  const lines: Line[] = [];
  let current: Line | undefined;

  for (const item of items) {
    if (!item.str && !item.hasEOL) continue;
    const tolerance = Math.max(2, (item.height || 10) * 0.5);
    const sameLine = current && Math.abs(item.y - current.y) <= tolerance;

    if (current && sameLine && item.str) {
      const gap = item.x - current.endX;
      const needsSpace =
        gap > (item.height || 10) * 0.15 && !/\s$/.test(current.text) && !/^\s/.test(item.str);
      current.text += (needsSpace ? " " : "") + item.str;
      current.endX = item.x + item.width;
      current.height = Math.max(current.height, item.height);
    } else if (item.str) {
      if (current) lines.push(current);
      current = { text: item.str, y: item.y, height: item.height, endX: item.x + item.width };
    }

    if (item.hasEOL && current) {
      lines.push(current);
      current = undefined;
    }
  }
  if (current) lines.push(current);

  return lines
    .map((l) => ({ text: l.text.replace(/\s+/g, " ").trim(), y: l.y, height: l.height, endX: l.endX }))
    .filter((l) => l.text);
}

/** Normalise a line so "Page 3" and "Page 4", or "Thesis · 3" and "Thesis · 4", match. */
function signature(text: string): string {
  return text.toLowerCase().replace(/\d+/g, "#").replace(/\s+/g, " ").trim();
}

/** Lines in the top or bottom two of a page that repeat on at least half the pages. */
function runningLines(pages: Line[][]): Set<string> {
  const counts = new Map<string, number>();
  for (const lines of pages) {
    const edges = new Set([...lines.slice(0, 2), ...lines.slice(-2)].map((l) => signature(l.text)));
    for (const sig of edges) counts.set(sig, (counts.get(sig) ?? 0) + 1);
  }
  const threshold = Math.max(2, Math.ceil(pages.length * 0.5));
  return new Set([...counts].filter(([, n]) => pages.length >= 3 && n >= threshold).map(([sig]) => sig));
}

function lineGaps(lines: Line[]): number[] {
  const gaps: number[] = [];
  for (let i = 1; i < lines.length; i++) {
    const gap = lines[i - 1].y - lines[i].y;
    if (gap > 0) gaps.push(gap);
  }
  return gaps;
}

/**
 * Turn one page's lines into text, with blank lines between paragraphs.
 * usualGap and usualHeight are measured across the whole document, since a
 * single page may have too few lines to tell.
 */
function pageText(lines: Line[], usualGap: number, usualHeight: number): string {
  let out = "";
  lines.forEach((line, i) => {
    if (i === 0) {
      out = line.text;
      return;
    }
    const prev = lines[i - 1];
    const gap = prev.y - line.y;
    const bigGap = usualGap > 0 && gap > usualGap * 1.35;
    const wentUp = gap < -usualHeight; // new column or out-of-order block
    const sizeChange = usualHeight > 0 && Math.abs(line.height - prev.height) > usualHeight * 0.2;
    out += bigGap || wentUp || sizeChange ? `\n\n${line.text}` : `\n${line.text}`;
  });
  return out;
}

/** Pages of positioned items -> text for buildDocument(). */
export function pagesToText(pages: PdfTextItem[][]): string {
  const pageLines = pages.map(toLines);
  const running = runningLines(pageLines);

  const cleaned = pageLines.map((lines) =>
    lines.filter((l, i) => {
      const atEdge = i < 2 || i >= lines.length - 2;
      if (atEdge && running.has(signature(l.text))) return false;
      return !isPageNumberLine(l.text);
    }),
  );

  // Most gaps are ordinary line spacing; paragraph gaps are the bigger ones.
  const usualGap = quantile(cleaned.flatMap(lineGaps), 0.25);
  const usualHeight = quantile(cleaned.flat().map((l) => l.height), 0.5);

  // A line that runs to the right margin was wrapped, so a paragraph whose
  // page ends on one carries on at the top of the next page.
  const rightEdge = quantile(cleaned.flat().map((l) => l.endX), 0.9);
  const runsToMargin = (l: Line | undefined) => l !== undefined && rightEdge > 0 && l.endX >= rightEdge * 0.9;

  let out = "";
  cleaned.forEach((lines, i) => {
    if (lines.length === 0) return;
    const text = pageText(lines, usualGap, usualHeight);
    if (!out) {
      out = text;
      return;
    }
    const prevLines = cleaned.slice(0, i).reverse().find((l) => l.length > 0);
    const prevLast = prevLines?.[prevLines.length - 1];
    const continues =
      runsToMargin(prevLast) && usualHeight > 0 && Math.abs(lines[0].height - (prevLast?.height ?? 0)) <= usualHeight * 0.2;
    out += (continues ? "\n" : "\n\n") + text;
  });
  return out;
}
