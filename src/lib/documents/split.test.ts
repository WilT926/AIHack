import { describe, expect, it } from "vitest";
import { buildDocument, isPageNumberLine, splitBlocks, titleFromFilename } from "./split";

describe("splitBlocks", () => {
  it("splits on blank lines and joins wrapped lines", () => {
    const blocks = splitBlocks("First line\nwraps here.\n\nSecond paragraph is here.");
    expect(blocks).toEqual([
      { type: "paragraph", text: "First line wraps here." },
      { type: "paragraph", text: "Second paragraph is here." },
    ]);
  });

  it("marks short title lines as headings", () => {
    const blocks = splitBlocks("3.2 Participants\n\nTwelve people took part in the study.\n\nMETHODS\n\n## Results");
    expect(blocks.map((b) => b.type)).toEqual(["heading", "paragraph", "heading", "heading"]);
    expect(blocks[3].text).toBe("Results");
  });

  it("does not treat a short sentence as a heading", () => {
    expect(splitBlocks("We used twelve.")[0].type).toBe("paragraph");
  });

  it("drops page numbers", () => {
    const blocks = splitBlocks("Some text that ends.\n\n12\n\nPage 3 of 20\n\nMore text that ends.");
    expect(blocks.map((b) => b.text)).toEqual(["Some text that ends.", "More text that ends."]);
  });

  it("merges a paragraph broken across a page", () => {
    const blocks = splitBlocks("The wrap was worn for one\n\nweek by each participant.");
    expect(blocks).toEqual([{ type: "paragraph", text: "The wrap was worn for one week by each participant." }]);
  });

  it("mends words hyphenated at a line break", () => {
    expect(splitBlocks("a carefully cali-\nbrated sensor was used.")[0].text).toBe("a carefully calibrated sensor was used.");
  });

  it("merges fragments shorter than a sentence", () => {
    const blocks = splitBlocks("A full sentence is here.\n\nand two");
    expect(blocks).toHaveLength(1);
  });

  it("handles Windows newlines and form feeds", () => {
    const blocks = splitBlocks("One sentence.\r\n\r\nTwo sentence.\fThree sentence.");
    expect(blocks.map((b) => b.text)).toEqual(["One sentence.", "Two sentence.", "Three sentence."]);
  });
});

describe("buildDocument", () => {
  it("numbers paragraphs p1, p2 ... with 1-based indexes", () => {
    const doc = buildDocument("Methods\n\nFirst paragraph here.\n\nSecond paragraph here.", { id: "d1" });
    expect(doc.paragraphs.map((p) => [p.id, p.index, p.type])).toEqual([
      ["p1", 1, "heading"],
      ["p2", 2, "paragraph"],
      ["p3", 3, "paragraph"],
    ]);
    expect(doc.title).toBe("Methods");
    expect(doc.wordCount).toBe(7);
    expect(doc.version).toBe(1);
  });

  it("prefers the given title", () => {
    expect(buildDocument("Some text here.", { title: "Chapter 3" }).title).toBe("Chapter 3");
  });

  it("returns no paragraphs for empty text", () => {
    expect(buildDocument("   \n\n  ").paragraphs).toEqual([]);
  });
});

describe("helpers", () => {
  it("recognises page number lines", () => {
    for (const s of ["4", "Page 4", "4 of 20", "- 4 -", "iv", "12/30"]) expect(isPageNumberLine(s)).toBe(true);
    for (const s of ["4 participants", "Figure 4", "Methods"]) expect(isPageNumberLine(s)).toBe(false);
  });

  it("makes a title from a file name", () => {
    expect(titleFromFilename("Thesis_ch3-final.pdf")).toBe("Thesis ch3 final");
  });
});
