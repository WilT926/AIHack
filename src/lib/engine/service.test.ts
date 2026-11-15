// The engine service with no API key: sample replies, clearly marked.
import { beforeEach, describe, expect, it } from "vitest";
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
});
