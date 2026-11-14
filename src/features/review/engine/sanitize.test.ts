import { describe, expect, it } from "vitest";
import { buildDocument } from "@/lib/documents/split";
import { LIMITS, sanitizeAssessorOutput, sanitizeDeliberation } from "./sanitize";

const doc = buildDocument("First paragraph here.\n\nSecond paragraph here.\n\nThird paragraph here.", { id: "d" });

describe("sanitizeAssessorOutput", () => {
  it("keeps valid comments and gives them ids", () => {
    const comments = sanitizeAssessorOutput(
      { comments: [{ paragraphIds: ["p2"], kind: "critique", text: "Too thin." }] },
      doc,
      "sceptic",
    );
    expect(comments).toEqual([{ id: "sceptic-1", assessorId: "sceptic", paragraphIds: ["p2"], kind: "critique", text: "Too thin." }]);
  });

  it("drops comments pointing at paragraphs that do not exist, and empty text", () => {
    const comments = sanitizeAssessorOutput(
      {
        comments: [
          { paragraphIds: ["p9"], kind: "critique", text: "Nowhere." },
          { paragraphIds: ["p1"], kind: "praise", text: "   " },
          { paragraphIds: ["P3", "p9", "p3"], kind: "question", text: "Why?" },
        ],
      },
      doc,
      "a",
    );
    expect(comments).toHaveLength(1);
    expect(comments[0].paragraphIds).toEqual(["p3"]);
  });

  it("caps the number of comments", () => {
    const many = Array.from({ length: 20 }, () => ({ paragraphIds: ["p1"], kind: "praise" as const, text: "Good." }));
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
});
