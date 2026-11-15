// Pitch engine tests on hand-written replies; no Claude call is made.
import { beforeEach, describe, expect, it } from "vitest";
import { finishPitch, startPitchSession } from "@/features/pitch/actions";
import { checkPitchReport, checkQuestions, pitchReportPrompt, questionsPrompt, type PitchContext } from "./pitch";
import { finishQandA, generateQuestions, takeAnswer } from "./pitchService";

const ctx: PitchContext = {
  project: { title: "Hackathon Pitch", brief: { what: "Pitch", topic: "Panel", graded: ["Originality", "Design"], goal: "" }, markSchemeText: "", weakSpots: [] },
  transcript: "Hello judges. Panel builds a board of AI assessors modelled on your markers. Thank you.",
  board: [
    { id: "investor", name: "Martin Stevens", role: "Investor", field: "Early-stage venture", personality: "", harshness: 4, focusAreas: ["Market"], notes: [] },
    { id: "design-judge", name: "Helen Leane", role: "Design Judge", field: "Product design", personality: "", harshness: 3, focusAreas: ["Clarity"], notes: [{ text: "Wants to see it live.", source: "other" }] },
  ],
};

describe("pitch prompts and checks", () => {
  it("asks for the right number of questions and never for tone or body language", () => {
    const p = questionsPrompt(ctx, 3);
    expect(p.user).toMatch(/exactly 3 questions/);
    expect(p.system.rules).toMatch(/Never comment on tone of voice/);
    expect(p.system.context).toMatch(/Wants to see it live/);
    expect(p.system.context).toMatch(/None supplied\. Do not invent any\./);
  });

  it("includes every routed follow-up in the final report prompt", () => {
    const p = pitchReportPrompt(ctx, [], { lengthSeconds: 60, wordsPerMinute: 100 }, [
      { questionId: "q1", text: "What is the evidence?", answer: "A pilot." },
      { questionId: "q1", text: "What baseline did you use?", answer: "A generic chatbot." },
    ]);
    expect(p.user).toContain("What baseline did you use?");
    expect(p.user).toContain("A generic chatbot.");
  });

  it("passes length and pace measured in code", () => {
    const p = pitchReportPrompt(ctx, [], { lengthSeconds: 187, wordsPerMinute: 142 });
    expect(p.user).toMatch(/length 3 min 7 s, 142 words per minute/);
  });

  it("keeps board questions only, up to the count", () => {
    const qs = checkQuestions(
      { questions: [
        { assessorId: "investor", text: "Who pays?", reason: "r" },
        { assessorId: "stranger", text: "Dropped", reason: "" },
        { assessorId: "design-judge", text: "  ", reason: "" },
        { assessorId: "design-judge", text: "Can we see it?", reason: "r" },
        { assessorId: "investor", text: "Over the count", reason: "" },
      ] },
      ["investor", "design-judge"],
      2,
    );
    expect(qs.map((q) => [q.id, q.assessorId, q.text])).toEqual([["q1", "investor", "Who pays?"], ["q2", "design-judge", "Can we see it?"]]);
  });

  it("keeps only actions that quote what was really said, and uses measured delivery", () => {
    const r = checkPitchReport(
      {
        verdict: "Clear.",
        criteria: [{ criterion: "Design", rating: "Strong", evidence: "e" }, { criterion: "Bad", rating: "great", evidence: "" }],
        strengths: ["Short."],
        actions: [
          { what: "Name the buyer", why: "w", raisedBy: ["investor"], quote: "board of AI assessors", effort: "quick" },
          { what: "Invented quote", why: "w", raisedBy: ["investor"], quote: "we have ten thousand users", effort: "quick" },
          { what: "Stranger", why: "w", raisedBy: ["stranger"], quote: "Hello judges", effort: "quick" },
        ],
        assessorVerdicts: [{ assessorId: "investor", line: "Who pays?" }, { assessorId: "stranger", line: "x" }],
        escalations: [],
        delivery: { structure: "s", clarity: "c" },
        questionReview: [{ questionId: "q1", howWell: "weak", strongerAnswer: ["Who pays"]  }, { questionId: "q9", howWell: "weak", strongerAnswer: [] }],
        sinceLastTime: { improved: [], raisedAgain: [] },
      },
      { boardIds: ["investor", "design-judge"], spoken: [ctx.transcript], questionIds: ["q1"], lengthSeconds: 187, wordsPerMinute: 142 },
    );
    expect(r.kind).toBe("pitch");
    expect(r.actions.map((a) => a.what)).toEqual(["Name the buyer"]);
    expect(r.actions[0].evidence.quote).toBe("board of AI assessors");
    expect(r.criteria).toHaveLength(1);
    expect(r.assessorVerdicts).toHaveLength(1);
    expect(r.questionReview).toHaveLength(1);
    expect(r.delivery).toMatchObject({ lengthSeconds: 187, wordsPerMinute: 142 });
  });
});

describe("pitch session with no key (sample replies)", () => {
  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
  });

  it("runs end to end, marked as sample", async () => {
    const s = await startPitchSession({ projectId: "proj-hp", questionCount: 2, mode: "spoken", capture: "live" });
    await finishPitch({ sessionId: s.id, transcript: ctx.transcript, capture: "live", startedAt: "2026-11-15T10:00:00Z", endedAt: "2026-11-15T10:01:00Z" });
    const asked = await generateQuestions(s.id);
    expect(asked.status).toBe("questions");
    expect(asked.questions).toHaveLength(2);
    expect(asked.replySource).toBe("sample");

    const first = await takeAnswer(s.id, "Students rehearse with it before the real marking.");
    expect(first.next?.kind).toBe("follow-up");
    const second = await takeAnswer(s.id, "For example a viva.");
    expect(second.session.questions[0].followUpAnswer).toBe("For example a viva.");

    const done = await finishQandA(s.id);
    expect(done.status).toBe("done");
    expect(done.report?.kind).toBe("pitch");
    expect(done.report?.delivery).toMatchObject({ lengthSeconds: 60, wordsPerMinute: 15 });
    expect(done.report?.verdict).toMatch(/^Sample feedback report/);
    expect(done.replySource).toBe("sample");
  });
});
