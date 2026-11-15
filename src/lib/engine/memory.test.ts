// Memory across attempts (Part B), for both session kinds. Sample replies:
// no Claude call is made, so this checks what the calls receive and what is
// saved, not how Claude uses it.
import { beforeEach, describe, expect, it, vi } from "vitest";

// The Reading animation delay belongs to the UI, not memory integration checks.
vi.mock("@/config", async (original) => {
  const config = await original<typeof import("@/config")>();
  return { ...config, engine: { ...config.engine, sampleDelayMs: 0 } };
});
import { finishPitch, startPitchSession } from "@/features/pitch/actions";
import { setActionDone } from "@/features/feedback/actions";
import { memoryAttemptSchema } from "@/lib/schemas";
import { documents, projects } from "@/lib/data";
import { assessorPrompt } from "./prompts";
import { questionsPrompt } from "./pitch";
import { finishQandA, generateQuestions, pitchContextFor, takeAnswer } from "./pitchService";
import { assessorInput, deliberateAndSave, reviewWithAssessor } from "./service";

beforeEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SECRET_KEY;
});

async function runReview(projectId: string, documentId: string) {
  const board = ["methodologist", "communicator"];
  const results = [];
  for (const id of board) {
    const r = await reviewWithAssessor({ projectId, documentId, assessorId: id });
    if (r.status === "done") results.push({ assessorId: id, status: "done" as const, replySource: r.replySource, comments: r.comments });
  }
  return deliberateAndSave({ projectId, documentId, results });
}

describe("memory across report reviews", () => {
  it("labels legacy memory as sample and excludes invented attempts from real calls", async () => {
    const project = (await projects.get("proj-mt"))!;
    const attempt = project.memory.attempts[0];
    expect(memoryAttemptSchema.parse({ ...attempt, replySource: undefined }).replySource).toBe("sample");
    process.env.ANTHROPIC_API_KEY = "test-only-not-a-key"; // context assembly only; no call
    const input = await assessorInput({ projectId: project.id, documentId: "doc-mt-ch3", assessorId: "sceptic" });
    expect(input.earlierSummary).toBeNull();
    await projects.save({ ...project, memory: { attempts: [{ ...attempt, replySource: "claude", raised: [{ assessorId: "sceptic", points: ["Check the sample-size rationale."] }] }] } });
    const real = await assessorInput({ projectId: project.id, documentId: "doc-mt-ch3", assessorId: "sceptic" });
    expect(real.earlierSummary).toContain("Check the sample-size rationale.");
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("a second review's assessor call receives the first review's memory", async () => {
    await projects.save({ ...(await projects.get("proj-lr"))!, memory: { attempts: [] } });
    await documents.save({
      id: "doc-mem",
      projectId: "proj-lr",
      title: "Draft A",
      createdAt: "2026-11-15T09:00:00Z",
      paragraphs: [
        { id: "p1", type: "paragraph", text: "We printed ten lattice samples and measured their stiffness." },
        { id: "p2", type: "paragraph", text: "Error bars are not shown because the spread was small." },
      ],
    });
    const before = await assessorInput({ projectId: "proj-lr", documentId: "doc-mem", assessorId: "methodologist" });
    expect(before.earlierSummary).toBeNull();

    const first = await runReview("proj-lr", "doc-mem");
    expect(first.report?.sinceLastTime).toBeNull(); // nothing to compare with yet
    const saved = await projects.get("proj-lr");
    expect(saved?.memory.attempts.map((a) => a.sessionId)).toEqual([first.id]);

    const input = await assessorInput({ projectId: "proj-lr", documentId: "doc-mem", assessorId: "communicator" });
    expect(input.earlierSummary).toMatch(/You raised:/);
    expect(input.earlierSummary).toMatch(/Do not contradict earlier feedback/);
    const prompt = assessorPrompt({ ...input, angles: [] });
    expect(prompt.user).toMatch(/<earlier_feedback>[\s\S]*report review of "Draft A"/);

    const second = await runReview("proj-lr", "doc-mem");
    expect(second.report?.sinceLastTime?.stillOpen.length).toBeGreaterThan(0);
    expect(second.assessorResults.flatMap((a) => a.comments).some((c) => c.category.includes("Since last time"))).toBe(true);
  });

  it("ticking an action is remembered", async () => {
    const review = await runReview("proj-lr", "doc-mem");
    const action = review.report!.actions[0];
    await setActionDone({ kind: "review", id: review.id, actionId: action.id, done: true });
    const attempt = (await projects.get("proj-lr"))!.memory.attempts.find((a) => a.sessionId === review.id);
    expect(attempt?.actions.find((a) => a.id === action.id)?.done).toBe(true);
  });
});

describe("memory across pitch attempts", () => {
  async function pitchOnce() {
    const s = await startPitchSession({ projectId: "proj-rp", questionCount: 2, mode: "text", capture: "typed", boardId: "board-pitch" });
    await finishPitch({ sessionId: s.id, transcript: "Hello. Our sensor costs two pounds. Thank you.", capture: "typed", startedAt: "2026-11-15T10:00:00Z", endedAt: "2026-11-15T10:02:00Z" });
    await generateQuestions(s.id);
    await takeAnswer(s.id, "It is cheap because it is printed on paper, and we tested it with twelve volunteers over a week.");
    return finishQandA(s.id);
  }

  it("a second pitch's question call knows about the first", async () => {
    await projects.save({ ...(await projects.get("proj-rp"))!, memory: { attempts: [] } });
    const first = await pitchOnce();
    expect(first.report?.sinceLastTime).toBeNull();

    const s2 = await startPitchSession({ projectId: "proj-rp", questionCount: 2, mode: "text", capture: "typed", boardId: "board-pitch" });
    await finishPitch({ sessionId: s2.id, transcript: "Hello again. Thank you.", capture: "typed", startedAt: "2026-11-16T10:00:00Z", endedAt: "2026-11-16T10:01:00Z" });
    const ctx = await pitchContextFor(s2.id);
    expect(ctx.memory).toMatch(/presentation practice/);
    expect(questionsPrompt(ctx, 2).system.context).toMatch(/<board_memory>[\s\S]*Asked:/);
    const asked = await generateQuestions(s2.id);
    expect(asked.questions[0].text).toMatch(/last time the board asked you/);
    await takeAnswer(s2.id, "We changed the closing.");
    const done = await finishQandA(s2.id);
    expect(done.report?.sinceLastTime?.stillOpen).toEqual(first.report!.actions.filter((a) => !a.done).map((a) => a.what));
  });
});
