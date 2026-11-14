import { describe, expect, it } from "vitest";
import { reviewContextSchema } from "../review/engine/schemas";
import { draftFromTemplate, HACKATHON_CRITERIA, TEMPLATES } from "./templates";
import { allWeakSpots, missingFor, toReviewContext } from "./context";

describe("templates", () => {
  it("hackathon pitch seats the Outsider, Communicator and Sceptic and loads the judging criteria", () => {
    const d = draftFromTemplate("hackathon-pitch");
    expect(d.boardIds).toEqual(["outsider", "communicator", "sceptic"]);
    expect(d.markScheme?.criteria).toEqual(HACKATHON_CRITERIA);
    expect(d.brief).toMatch(/3-minute pitch/);
  });

  it("judging criteria weights sum to 100", () => {
    expect(HACKATHON_CRITERIA.reduce((n, c) => n + c.weight, 0)).toBe(100);
  });

  it("every template has a unique id", () => {
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
  });

  it("drafts are independent copies", () => {
    const a = draftFromTemplate("hackathon-pitch");
    a.boardIds.push("module-lead");
    a.markScheme!.criteria[0].weight = 99;
    const b = draftFromTemplate("hackathon-pitch");
    expect(b.boardIds).toHaveLength(3);
    expect(b.markScheme!.criteria[0].weight).toBe(30);
  });
});

describe("toReviewContext", () => {
  it("passes the brief, graded items, weak spots and mark scheme to the engine", () => {
    const d = { ...draftFromTemplate("hackathon-pitch"), weakSpots: ["Business model"], ownWeakSpots: "Q&A unclear\n\n Business model " };
    const ctx = toReviewContext(d);
    expect(reviewContextSchema.safeParse(ctx).success).toBe(true);
    expect(ctx.projectName).toBe("AI Hackathon pitch");
    expect(ctx.graded).toEqual(["Idea & originality", "The demo", "Presentation skills"]);
    expect(ctx.weakSpots).toEqual(["Business model", "Q&A unclear"]);
    expect(ctx.markScheme).toContain("Originality (30%)");
  });

  it("leaves out empty fields", () => {
    const ctx = toReviewContext({ ...draftFromTemplate("blank"), name: "Essay" });
    expect(ctx).toEqual({ projectName: "Essay" });
  });
});

describe("validation", () => {
  it("needs a name, a brief and at least one assessor", () => {
    const d = draftFromTemplate("blank");
    expect(missingFor("brief", d)).toBeTruthy();
    expect(missingFor("board", d)).toBeTruthy();
    expect(missingFor("brief", draftFromTemplate("lab-report"))).toBeUndefined();
    expect(allWeakSpots(d)).toEqual([]);
  });
});
