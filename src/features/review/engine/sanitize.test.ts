import { describe, expect, it } from "vitest";
import { buildDocument } from "@/lib/documents/split";
import { LIMITS, sanitizeAssessorOutput, sanitizeDeliberation } from "./sanitize";

const doc = buildDocument("First paragraph here.\n\nSecond paragraph here.\n\nThird paragraph here.", { id: "d" });

describe("sanitizeAssessorOutput", () => {
  it("keeps valid comments and gives them ids", () => {
    const comments = sanitizeAssessorOutput(
      { comments: [{ paragraphIds: ["p2"], kind: "critique", text: "Too thin.", criterionId: null }] },
      doc,
      "sceptic",
    );
    expect(comments).toEqual([{ id: "sceptic-1", assessorId: "sceptic", paragraphIds: ["p2"], kind: "critique", text: "Too thin." }]);
  });

  it("drops comments pointing at paragraphs that do not exist, and empty text", () => {
    const comments = sanitizeAssessorOutput(
      {
        comments: [
          { paragraphIds: ["p9"], kind: "critique", text: "Nowhere.", criterionId: null },
          { paragraphIds: ["p1"], kind: "praise", text: "   ", criterionId: null },
          { paragraphIds: ["P3", "p9", "p3"], kind: "question", text: "Why?", criterionId: null },
        ],
      },
      doc,
      "a",
    );
    expect(comments).toHaveLength(1);
    expect(comments[0].paragraphIds).toEqual(["p3"]);
  });

  it("caps the number of comments", () => {
    const many = Array.from({ length: 20 }, () => ({ paragraphIds: ["p1"], kind: "praise" as const, text: "Good.", criterionId: null }));
    expect(sanitizeAssessorOutput({ comments: many }, doc, "a")).toHaveLength(LIMITS.commentsPerAssessor);
  });
});

describe("sanitizeDeliberation", () => {
  const board = ["patel", "osei", "marsh"];

  it("drops unknown assessors, invalid splits and ranks the fix list", () => {
    const { deliberation, fixList, questions } = sanitizeDeliberation(
      {
        agreements: ["Batch control is good.", ""],
        splits: [
          { paragraphIds: ["p2"], topic: "enough people?", approve: ["osei", "ghost"], object: ["patel"], advice: "Add a power calculation." },
          { paragraphIds: ["p2"], topic: "one-sided", approve: ["osei"], object: [], advice: "x" },
          { paragraphIds: ["p99"], topic: "bad paragraph", approve: ["osei"], object: ["patel"], advice: "x" },
        ],
        fixList: [
          { text: "Add a power calculation.", paragraphIds: ["p2"], raisedBy: ["patel", "ghost"] },
          { text: "Cite the threshold.", paragraphIds: ["p7"], raisedBy: ["osei"] },
        ],
        questions: [
          { assessorId: "patel", text: "How many would you need?" },
          { assessorId: "ghost", text: "Boo?" },
        ],
        sinceLastTime: { improved: ["Power calculation added."], stillWeak: [], ignored: [] },
        addOrCut: { add: ["A limitations paragraph."], cut: [] },
      },
      doc,
      board,
      12,
    );
    expect(deliberation.seconds).toBe(12);
    expect(deliberation.agreements).toEqual(["Batch control is good."]);
    expect(deliberation.splits).toHaveLength(1);
    expect(deliberation.splits[0].approve).toEqual(["osei"]);
    expect(fixList.map((f) => [f.rank, f.raisedBy, f.paragraphIds])).toEqual([
      [1, ["patel"], ["p2"]],
      [2, ["osei"], []],
    ]);
    expect(questions).toEqual([{ assessorId: "patel", text: "How many would you need?" }]);
  });

  const base = { agreements: [], splits: [], fixList: [], questions: [] };

  it("keeps since-last-time only when there was a previous run, and add/cut only in written mode", () => {
    const output = {
      ...base,
      sinceLastTime: { improved: ["Power calculation added."], stillWeak: ["Referral bias."], ignored: [] },
      addOrCut: { add: ["Limitations."], cut: ["The second results table."] },
    };
    const plain = sanitizeDeliberation(output, doc, board, 3);
    expect(plain.sinceLastTime).toBeUndefined();
    expect(plain.addOrCut).toBeUndefined();
    const full = sanitizeDeliberation(output, doc, board, 3, { hasPrevious: true, written: true });
    expect(full.sinceLastTime).toEqual({ improved: ["Power calculation added."], stillWeak: ["Referral bias."], ignored: [] });
    expect(full.addOrCut).toEqual({ add: ["Limitations."], cut: ["The second results table."] });
  });

  it("drops empty since-last-time and add/cut blocks", () => {
    const out = sanitizeDeliberation(
      { ...base, sinceLastTime: { improved: [" "], stillWeak: [], ignored: [] }, addOrCut: { add: [], cut: [] } },
      doc,
      board,
      3,
      { hasPrevious: true, written: true },
    );
    expect(out.sinceLastTime).toBeUndefined();
    expect(out.addOrCut).toBeUndefined();
  });
});

describe("criterion tags", () => {
  it("keeps a tag only when it names a real criterion", () => {
    const comments = sanitizeAssessorOutput(
      {
        comments: [
          { paragraphIds: ["p1"], kind: "critique", text: "Thin.", criterionId: "originality" },
          { paragraphIds: ["p2"], kind: "critique", text: "Vague.", criterionId: "made-up" },
        ],
      },
      doc,
      "a",
      ["originality", "presentation"],
    );
    expect(comments[0].criterionId).toBe("originality");
    expect(comments[1].criterionId).toBeUndefined();
  });
});
