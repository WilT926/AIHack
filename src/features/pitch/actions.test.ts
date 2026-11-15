import { beforeEach, describe, expect, it } from "vitest";
import { finishPitch, lastSavedTranscript, saveTranscript, startPitchSession } from "./actions";

describe("pitch session actions (memory store)", () => {
  beforeEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
  });

  it("saves a typed pitch with its timing and capture", async () => {
    const s = await startPitchSession({ projectId: "proj-hp", boardId: "board-pitch", questionCount: 2, mode: "text", capture: "typed" });
    expect(s.status).toBe("ready");
    expect(s.settings.boardId).toBe("board-pitch");
    const done = await finishPitch({
      sessionId: s.id,
      transcript: "Hello judges. Thank you.",
      capture: "typed",
      startedAt: "2026-11-15T10:00:00.000Z",
      endedAt: "2026-11-15T10:02:00.000Z",
    });
    expect(done.status).toBe("conferring");
    expect(done.settings.capture).toBe("typed");
    expect(done.endedAt).toBe("2026-11-15T10:02:00.000Z");
  });

  it("autosaves only while listening, and finds the last transcript", async () => {
    const s = await startPitchSession({ projectId: "proj-mt", questionCount: 3, mode: "spoken", capture: "live" });
    expect(s.status).toBe("listening");
    expect(s.settings.boardId).toBeNull(); // same as the project's own board
    await saveTranscript(s.id, "So far so good");
    expect((await lastSavedTranscript("proj-mt"))?.transcript).toBe("So far so good");
  });

  it("refuses bad input", async () => {
    await expect(startPitchSession({ projectId: "nope", questionCount: 3, mode: "spoken", capture: "live" })).rejects.toThrow();
    await expect(startPitchSession({ projectId: "proj-hp", questionCount: 9, mode: "spoken", capture: "live" })).rejects.toThrow();
    const s = await startPitchSession({ projectId: "proj-hp", questionCount: 3, mode: "spoken", capture: "live" });
    await expect(
      finishPitch({ sessionId: s.id, transcript: "", capture: "live", startedAt: "2026-11-15T10:00:00Z", endedAt: "2026-11-15T10:01:00Z" }),
    ).rejects.toThrow();
    await expect(
      finishPitch({ sessionId: s.id, transcript: "x", capture: "live", startedAt: "2026-11-15T10:01:00Z", endedAt: "2026-11-15T10:00:00Z" }),
    ).rejects.toThrow();
  });
});
