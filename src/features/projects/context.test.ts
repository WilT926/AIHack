import { describe, expect, it } from "vitest";
import { draftFromTemplate, HACKATHON_CRITERIA, TEMPLATES } from "./templates";
import { allWeakSpots, markSchemeText, missingFor } from "./context";

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

describe("draft helpers", () => {
  it("merges chosen and typed weak spots without duplicates", () => {
    const d = { ...draftFromTemplate("blank"), weakSpots: ["Sample size"], ownWeakSpots: "Sample size\nDiscussion" };
    expect(allWeakSpots(d)).toEqual(["Sample size", "Discussion"]);
  });

  it("writes the judging criteria as mark scheme text", () => {
    expect(markSchemeText(draftFromTemplate("hackathon-pitch"))).toMatch(/Originality \(30%\)/);
    expect(markSchemeText(draftFromTemplate("blank"))).toBeUndefined();
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
