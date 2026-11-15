// The engine service with no API key: sample replies, clearly marked.
import { beforeEach, describe, expect, it } from "vitest";
import { reviews } from "@/lib/data";
import { deliberateAndSave, replySource, reviewWithAssessor } from "./service";

describe("engine service without a key (sample replies)", () => {
  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
  });

  it("marks everything as sample", async () => {
    expect(replySource()).toBe("sample");
    const r = await reviewWithAssessor({ projectId: "proj-mt", documentId: "doc-mt-ch3", assessorId: "sceptic" });
    expect(r.replySource).toBe("sample");
    expect(r.status).toBe("done");
    if (r.status !== "done") return;
    expect(r.comments.length).toBeGreaterThan(0);
    expect(r.comments[0].text).toMatch(/^Sample comment/);

    const review = await deliberateAndSave({
      projectId: "proj-mt",
      documentId: "doc-mt-ch3",
      results: [
        { assessorId: "sceptic", status: "done", replySource: "sample", comments: r.comments },
        { assessorId: "methodologist", status: "failed", replySource: "sample", comments: [] },
      ],
    });
    expect(review.replySource).toBe("sample");
    expect(review.status).toBe("done");
    expect(review.report?.verdict).toMatch(/^Sample feedback report/);
    expect(review.assessorResults.map((a) => a.status)).toEqual(["done", "failed"]);
  });

  it("refuses a document from another project", async () => {
    await expect(reviewWithAssessor({ projectId: "proj-lr", documentId: "doc-mt-ch3", assessorId: "sceptic" })).rejects.toThrow(/does not belong/);
  });

  it("keeps comments marked done during the run, and ticks across a second deliberation", async () => {
    const r = await reviewWithAssessor({ projectId: "proj-mt", documentId: "doc-mt-ch3", assessorId: "sceptic" });
    if (r.status !== "done") throw new Error("expected done");
    const results = [{ assessorId: "sceptic", status: "done" as const, replySource: "sample" as const, comments: r.comments }];
    const first = await deliberateAndSave({ projectId: "proj-mt", documentId: "doc-mt-ch3", reviewId: "rev-keep", results, doneCommentIds: [r.comments[0].id] });
    expect(first.assessorResults[0].comments[0].done).toBe(true);
    // The student ticks an action, then a retry deliberates again.
    const ticked = first.report!.actions[0];
    await reviews.save({ ...first, report: { ...first.report!, actions: first.report!.actions.map((a) => (a.id === ticked.id ? { ...a, done: true } : a)) } });
    const second = await deliberateAndSave({ projectId: "proj-mt", documentId: "doc-mt-ch3", reviewId: "rev-keep", results });
    expect(second.report!.actions.find((a) => a.what === ticked.what)?.done).toBe(true);
    expect(second.assessorResults[0].comments[0].done).toBe(true);
  });
});
