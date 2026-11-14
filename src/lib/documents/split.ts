// Turns raw text (pasted, or extracted from a PDF) into a numbered Document.
// Pure functions, no browser or server APIs, so both sides can use them.
//
// Input convention: a blank line separates paragraphs; single newlines are
// line wraps inside a paragraph.

import type { Document, Paragraph } from "@/features/review/types";

/** "12", "Page 3", "3 of 20", "- 4 -", "iv". */
const PAGE_NUMBER = /^\s*(?:[-–—]\s*)?(?:page\s+)?(?:\d{1,4}|[ivxlcdm]{1,6})(?:\s*(?:of|\/)\s*\d{1,4})?(?:\s*[-–—])?\s*$/i;

/** Lines that close a sentence (allowing a closing quote or bracket). */
const ENDS_SENTENCE = /[.!?:;]["'”’)\]]*$/;

export function isPageNumberLine(line: string): boolean {
  return PAGE_NUMBER.test(line);
}

function wordCount(text: string): number {
  const words = text.trim().match(/\S+/g);
  return words ? words.length : 0;
}

/** Join wrapped lines, mending words hyphenated across a line break. */
function joinLines(lines: string[]): string {
  let out = "";
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (!out) {
      out = line;
    } else if (/[A-Za-z]{2}-$/.test(out) && /^[a-z]/.test(line)) {
      // Mend "cali-" + "brated", but leave "p-" + "values" alone.
      out = out.slice(0, -1) + line;
    } else {
      out = `${out} ${line}`;
    }
  }
  return out.replace(/\s+/g, " ");
}

/**
 * A short single line with no closing punctuation that looks like a title:
 * "3.2 Participants", "Chapter 3", "METHODS", "## Results".
 */
export function looksLikeHeading(lines: string[]): boolean {
  if (lines.length !== 1) return false;
  const text = lines[0].trim();
  if (!text || text.length > 90) return false;
  if (/^#{1,6}\s/.test(text)) return true;
  const words = wordCount(text);
  if (words === 0 || words > 12) return false;
  if (/[.,;:!]$/.test(text)) return false;
  if (/^(chapter|section|part|appendix)\s+[\dIVX]+\b/i.test(text)) return true;
  if (/^\d+(\.\d+)*\.?\s+\S/.test(text)) return true; // numbered heading
  if (text === text.toUpperCase() && /[A-Z]/.test(text)) return true;
  // Title-ish: starts with a capital and is short.
  return /^[A-Z]/.test(text) && words <= 8;
}

type Block = { type: Paragraph["type"]; text: string };

/** Split text into heading and paragraph blocks, before numbering. */
export function splitBlocks(text: string): Block[] {
  const normalised = text
    .replace(/\r\n?/g, "\n")
    .replace(/\f/g, "\n\n")
    .replace(/[ \t]/g, " ")
    .replace(/­/g, ""); // soft hyphens

  const rawBlocks = normalised.split(/\n\s*\n/);
  const blocks: Block[] = [];

  for (const raw of rawBlocks) {
    const lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !isPageNumberLine(l));
    if (lines.length === 0) continue;

    if (looksLikeHeading(lines)) {
      blocks.push({ type: "heading", text: lines[0].replace(/^#{1,6}\s+/, "") });
    } else {
      blocks.push({ type: "paragraph", text: joinLines(lines) });
    }
  }

  return mergeFragments(blocks);
}

/**
 * Merge a paragraph into the one before it when the earlier one stops
 * mid-sentence and this one carries on (a page break or stray blank line),
 * or when it is too short to stand alone.
 */
function mergeFragments(blocks: Block[]): Block[] {
  const out: Block[] = [];
  for (const block of blocks) {
    const prev = out[out.length - 1];
    // A "heading" followed by a lowercase continuation was really the start
    // of a paragraph that broke across a page.
    if (prev && prev.type === "heading" && block.type === "paragraph" && /^[a-z]/.test(block.text)) {
      prev.type = "paragraph";
      prev.text = joinLines([prev.text, block.text]);
      continue;
    }
    if (prev && prev.type === "paragraph" && block.type === "paragraph") {
      const carriesOn = !ENDS_SENTENCE.test(prev.text) && /^[a-z(“"'‘]/.test(block.text);
      const tooShort = wordCount(block.text) < 4 && !ENDS_SENTENCE.test(block.text);
      if (carriesOn || tooShort) {
        prev.text = joinLines([prev.text, block.text]);
        continue;
      }
    }
    out.push({ ...block });
  }
  return out;
}

export type BuildDocumentOptions = {
  id?: string;
  title?: string;
  version?: number;
};

/** Raw text -> Document with paragraphs p1, p2, ... */
export function buildDocument(text: string, options: BuildDocumentOptions = {}): Document {
  const blocks = splitBlocks(text);
  const paragraphs: Paragraph[] = blocks.map((b, i) => ({
    id: `p${i + 1}`,
    index: i + 1,
    type: b.type,
    text: b.text,
  }));
  const firstHeading = paragraphs.find((p) => p.type === "heading");
  return {
    id: options.id ?? `doc-${Date.now().toString(36)}`,
    title: options.title?.trim() || firstHeading?.text || "Untitled document",
    version: options.version ?? 1,
    paragraphs,
    wordCount: paragraphs.reduce((n, p) => n + wordCount(p.text), 0),
  };
}

/** "Thesis_ch3-final.pdf" -> "Thesis ch3 final" */
export function titleFromFilename(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
