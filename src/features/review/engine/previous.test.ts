import { describe, expect, it } from "vitest";
import { buildDocument } from "@/lib/documents/split";
import type { Run } from "../types";
import { fixListText, previousFor, toPreviousRun } from "./previous";
import { previousRunSchema } from "./schemas";

const doc = buildDocument("Intro paragraph.\n\nMethod paragraph with twelve people.\n\nResults paragraph.", { id: "d", title: "Ch 3" });
const run: Run = {
  id: "r1",
  number: 1,
  document: doc,
  comments: [
    { id: "a-1", assessorId: "a", paragraphIds: ["p2"], kind: "critique", text: "Twelve is too few." },
    { id: "b-1", assessorId: "b", paragraphIds: ["p9"], kind: "praise", text: "Ghost paragraph." },
  ],
  fixList: [
    { rank: 2, text: "Cite the threshold.", paragraphIds: [], raisedBy: ["b"] },
    { rank: 1, text: "Add a power calculation.", paragraphIds: ["p2"], raisedBy: ["a", "ghost"] },
  ],
  questions: [],
};

describe("toPreviousRun", () => {
  it("carries paragraph text instead of ids, drops comments on unknown paragraphs, ranks fixes", () => {
    const prev = toPreviousRun(run)!;
    expect(previousRunSchema.safeParse(prev).success).toBe(true);
    expect(prev.comments).toEqual([{ assessorId: "a", kind: "critique", text: "Twelve is too few.", paragraph: "Method paragraph with twelve people." }]);
    expect(prev.fixList).toEqual(["Add a power calculation.", "Cite the threshold."]);
    expect(previousFor(prev, "a")?.comments).toHaveLength(1);
    expect(previousFor(prev, "b")).toBeUndefined();
  });

  it("returns nothing for an empty run", () => {
    expect(toPreviousRun({ ...run, comments: [], fixList: [] })).toBeUndefined();
  });
});

describe("fixListText", () => {
  it("is clean numbered text with paragraphs and names", () => {
    const text = fixListText({ ...run, addOrCut: { add: ["Limitations."], cut: [] } }, new Map([["a", "Dr Patel"], ["b", "Dr Osei"]]), "Thesis");
    expect(text).toBe(
      [
        "Fix list · Thesis · Ch 3 v1 (run 1)",
        "",
        "1. Add a power calculation. (¶2) · raised by Dr Patel",
        "2. Cite the threshold. · raised by Dr Osei",
        "",
        "Add:",
        "- Limitations.",
      ].join("\n"),
    );
  });
});
