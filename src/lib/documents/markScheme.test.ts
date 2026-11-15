import { describe, expect, it } from "vitest";
import { normaliseWeights, parseMarkScheme, toCriteria } from "./markScheme";

describe("parseMarkScheme", () => {
  it("reads percentages, in any position", () => {
    const c = parseMarkScheme("Originality 30%\nRelevance to the theme — 20%\n20% Potential industry application\nUser experience & design: 15%\nPresentation (10%)\nSecurity & resilience 5%\nTotal 100%");
    expect(c.map((x) => [x.name, x.weight])).toEqual([
      ["Originality", 30],
      ["Relevance to the theme", 20],
      ["Potential industry application", 20],
      ["User experience & design", 15],
      ["Presentation", 10],
      ["Security & resilience", 5],
    ]);
  });

  it("reads marks and scales them to 100", () => {
    const c = parseMarkScheme("1. Methods - 20 marks\n2. Results - 20 marks\n3. Discussion - 10 marks");
    expect(c.map((x) => [x.name, x.weight])).toEqual([
      ["Methods", 40],
      ["Results", 40],
      ["Discussion", 20],
    ]);
  });

  it("reads a trailing number", () => {
    expect(parseMarkScheme("Introduction: 10\nAnalysis: 30").map((x) => x.weight)).toEqual([25, 75]);
  });

  it("falls back to equal weights for a plain list", () => {
    const c = parseMarkScheme("Clarity of argument\nUse of evidence\nStructure\nThis paragraph explains how marks are given to students.");
    expect(c.map((x) => x.name)).toEqual(["Clarity of argument", "Use of evidence", "Structure"]);
    expect(c.reduce((n, x) => n + x.weight, 0)).toBe(100);
  });

  it("gives every criterion a unique id", () => {
    const c = parseMarkScheme("Design 50%\nDesign 50%");
    expect(new Set(c.map((x) => x.id)).size).toBe(2);
  });

  it("returns nothing for empty text", () => {
    expect(parseMarkScheme("   ")).toEqual([]);
  });
});

describe("normaliseWeights", () => {
  it("always sums to exactly 100", () => {
    for (const ws of [[1, 1, 1], [33, 33, 33], [7, 13, 29, 51], [0, 0]]) {
      expect(normaliseWeights(ws.map((weight) => ({ weight }))).reduce((n, c) => n + c.weight, 0)).toBe(100);
    }
  });
});

describe("toCriteria", () => {
  it("gives ids, fills missing weights and sums to 100", () => {
    const out = toCriteria([
      { name: "Method", weight: 40 },
      { name: "Results", weight: null },
      { name: "method", weight: 10 },
      { name: "  ", weight: 5 },
    ]);
    expect(out.map((c) => c.id)).toEqual(["method", "results"]);
    expect(out.reduce((n, c) => n + c.weight, 0)).toBe(100);
    expect(out[0].weight).toBe(50);
  });
});
