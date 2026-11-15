"use server";

// Saving a presentation-practice session. Inputs from the browser are
// validated here before anything reaches the data layer.
import { z } from "zod";
import { pitchSessions, projects } from "@/lib/data";
import type { PitchSession } from "@/lib/schemas";

const iso = z.iso.datetime({ offset: true });
const transcript = z.string().max(20000);

const startInput = z.object({
  projectId: z.string().min(1).max(100),
  boardId: z.string().min(1).max(100).nullish(),
  questionCount: z.number().int().min(1).max(5),
  mode: z.enum(["spoken", "text"]),
  capture: z.enum(["live", "typed"]),
  startedAt: iso.nullish(),
});

/** Create a session for this project. Live sessions start listening at once. */
export async function startPitchSession(input: z.input<typeof startInput>): Promise<PitchSession> {
  const v = startInput.parse(input);
  const project = await projects.get(v.projectId);
  if (!project) throw new Error("That project no longer exists.");
  const now = new Date().toISOString();
  return pitchSessions.save({
    id: crypto.randomUUID(),
    projectId: v.projectId,
    status: v.capture === "live" ? "listening" : "ready",
    transcript: "",
    createdAt: now,
    startedAt: v.capture === "live" ? (v.startedAt ?? now) : null,
    endedAt: null,
    settings: {
      questionCount: v.questionCount,
      mode: v.mode,
      boardId: v.boardId && v.boardId !== project.boardId ? v.boardId : null,
      capture: v.capture,
    },
    questions: [],
    report: null,
  });
}

/** Save the transcript so far, while listening. */
export async function saveTranscript(sessionId: string, text: string): Promise<void> {
  const t = transcript.parse(text);
  const s = await pitchSessions.get(z.string().min(1).max(100).parse(sessionId));
  if (!s || s.status !== "listening") return;
  await pitchSessions.save({ ...s, transcript: t });
}

const finishInput = z.object({
  sessionId: z.string().min(1).max(100),
  transcript: transcript.min(1, "The transcript is empty."),
  capture: z.enum(["live", "typed"]),
  startedAt: iso,
  endedAt: iso,
});

/**
 * The pitch is over: save the transcript and when it started and ended, and
 * hand over to the board (status "conferring"). Length and pace are worked
 * out from these times in code.
 */
export async function finishPitch(input: z.input<typeof finishInput>): Promise<PitchSession> {
  const v = finishInput.parse(input);
  if (Date.parse(v.endedAt) < Date.parse(v.startedAt)) throw new Error("The pitch ended before it started.");
  const s = await pitchSessions.get(v.sessionId);
  if (!s) throw new Error("That session no longer exists.");
  return pitchSessions.save({
    ...s,
    status: "conferring",
    transcript: v.transcript,
    startedAt: v.startedAt,
    endedAt: v.endedAt,
    settings: { ...s.settings, capture: v.capture },
  });
}

/** The most recent saved transcript for this project, for the hidden fallback. */
export async function lastSavedTranscript(projectId: string): Promise<{ transcript: string; seconds: number } | null> {
  const list = await pitchSessions.list({ projectId: z.string().min(1).max(100).parse(projectId) });
  const withText = list.filter((s) => s.transcript.trim().length > 0);
  const last = withText[withText.length - 1];
  if (!last) return null;
  const seconds =
    last.startedAt && last.endedAt ? Math.max(0, Math.round((Date.parse(last.endedAt) - Date.parse(last.startedAt)) / 1000)) : 0;
  return { transcript: last.transcript, seconds };
}
