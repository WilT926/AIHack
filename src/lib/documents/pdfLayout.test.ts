import { describe, expect, it } from "vitest";
import { pagesToText, toLines, type PdfTextItem } from "./pdfLayout";
import { buildDocument } from "./split";

const item = (str: string, x: number, y: number, extra: Partial<PdfTextItem> = {}): PdfTextItem => ({
  str,
  x,
  y,
  width: str.length * 5,
  height: 10,
  ...extra,
});

/** A page: header, body lines (spacing 14, paragraph gap 28), footer page number. */
function page(n: number, body: string[][]): PdfTextItem[] {
  const items: PdfTextItem[] = [item("Thesis draft · Chapter 3", 50, 800)];
  let y = 760;
  for (const para of body) {
    for (const line of para) {
      items.push(item(line, 50, y));
      y -= 14;
    }
    y -= 14;
  }
  items.push(item(String(n), 300, 40));
  return items;
}

describe("toLines", () => {
  it("joins items on the same baseline and adds missing spaces", () => {
    const lines = toLines([item("Hello", 50, 100), item("world", 90, 100), item("Next", 50, 86)]);
    expect(lines.map((l) => l.text)).toEqual(["Hello world", "Next"]);
  });

  it("does not add a space between touching items", () => {
    const lines = toLines([item("cali", 50, 100, { width: 20 }), item("brated", 70, 100)]);
    expect(lines[0].text).toBe("calibrated");
  });
});

describe("pagesToText", () => {
  const pages = [
    page(1, [["First paragraph line one", "and line two ends."], ["Second paragraph ends."]]),
    page(2, [["Third paragraph starts here and", "carries on."], ["Fourth paragraph wraps onto"]]),
    page(3, [["the next page and ends."], ["Fifth paragraph ends."]]),
  ];

  it("drops repeating headers and page numbers, and keeps paragraphs apart", () => {
    const doc = buildDocument(pagesToText(pages));
    expect(doc.paragraphs.map((p) => p.text)).toEqual([
      "First paragraph line one and line two ends.",
      "Second paragraph ends.",
      "Third paragraph starts here and carries on.",
      "Fourth paragraph wraps onto the next page and ends.",
      "Fifth paragraph ends.",
    ]);
  });

  it("joins a paragraph that crosses a page break at the end of a sentence", () => {
    // Full-width lines end at x = 50 + 40 * 5 = 250; the last line of a paragraph is shorter.
    const full = "x".repeat(37) + " end.";
    const text = pagesToText([
      [item("Short opening paragraph.", 50, 700), item(full, 50, 672)],
      [item("Next sentence on the new page.", 50, 700), item("Short closing line.", 50, 686)],
    ]);
    expect(buildDocument(text).paragraphs).toHaveLength(2);
  });

  it("splits a heading in a larger font from the text under it", () => {
    const text = pagesToText([[item("Methods", 50, 700, { height: 18 }), item("We did a study here.", 50, 680)]]);
    expect(buildDocument(text).paragraphs.map((p) => p.type)).toEqual(["heading", "paragraph"]);
  });
});
