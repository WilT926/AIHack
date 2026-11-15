import { beforeEach, describe, expect, it } from "vitest";
import { dataSource, getWorkspace, pitchSessions, projects, reviews } from "./index";

describe("data layer without a database (temporary memory store)", () => {
  beforeEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("reports itself as memory, not database", () => {
    expect(dataSource()).toBe("memory");
  });

  it("serves the sample workspace", async () => {
    const ws = await getWorkspace();
    expect(ws.profile.id).toBe("demo-user");
    expect(ws.assessors.length).toBe(10);
    expect(ws.projects.map((p) => p.id)).toContain("proj-mt");
  });

  it("saves and reads back a pitch session", async () => {
    const saved = await pitchSessions.save({
      id: "pitch-test",
      projectId: "proj-hp",
      status: "listening",
      transcript: "Hello judges",
      createdAt: "2026-11-15T09:00:00Z",
      startedAt: "2026-11-15T09:00:05Z",
      endedAt: null,
      settings: { questionCount: 3, mode: "spoken" },
      questions: [],
      report: null,
    });
    expect(saved.transcript).toBe("Hello judges");
    const list = await pitchSessions.list({ projectId: "proj-hp" });
    expect(list.map((s) => s.id)).toContain("pitch-test");
  });

  it("rejects an invalid write", async () => {
    await expect(pitchSessions.save({ id: "bad" } as never)).rejects.toThrow();
  });

  it("removes a project's sessions with it", async () => {
    await projects.remove("proj-lr");
    expect(await projects.get("proj-lr")).toBeNull();
    expect(await reviews.list({ projectId: "proj-lr" })).toEqual([]);
  });
});
