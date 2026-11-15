import "server-only";
// Presentation practice on the server: the board's questions, follow-ups and
// the feedback report, saved on the PitchSession. Uses Claude when a key is
// set, otherwise labelled sample replies (replySource "sample").
import { engine, models } from "@/config";
import { assessorNotes, assessors, boards, callLogs, pitchSessions, projects } from "@/lib/data";
import type { PitchSession } from "@/lib/schemas";
import { durationSeconds, wordCount, wordsPerMinute } from "@/lib/voice/transcript";
import { callClaude, callWithRetry, EngineError, type CallLogger } from "./claude";
import {
  checkFollowUp,
  checkPitchReport,
  checkQuestions,
  followUpPrompt,
  followUpReplySchema,
  pitchReportPrompt,
  pitchReportReplySchema,
  questionsPrompt,
  questionsReplySchema,
  sampleFollowUpReply,
  samplePitchReportReply,
  sampleQuestionsReply,
  type PitchContext,
} from "./pitch";
import { replySource } from "./service";

const logCall: CallLogger = async (entry) => {
  await callLogs.save({ id: crypto.randomUUID(), ...entry });
};

function requireSource() {
  const s = replySource();
  if (!s) throw new EngineError("The engine is not configured: set ANTHROPIC_API_KEY.", "not_configured", false);
  return s;
}

async function loadSession(sessionId: string): Promise<PitchSession> {
  const s = await pitchSessions.get(sessionId);
  if (!s) throw new EngineError("That session no longer exists.", "invalid_reply", false);
  return s;
}

async function loadContext(s: PitchSession): Promise<PitchContext> {
  const project = await projects.get(s.projectId);
  if (!project) throw new EngineError("That project no longer exists.", "invalid_reply", false);
  const boardId = s.settings.boardId ?? project.boardId;
  const board = boardId ? await boards.get(boardId) : null;
  if (!board || board.assessorIds.length === 0) throw new EngineError("No one is seated at this board.", "invalid_reply", false);
  const [members, notes] = await Promise.all([Promise.all(board.assessorIds.map((id) => assessors.get(id))), assessorNotes.list()]);
  return {
    project,
    transcript: s.transcript,
    board: members
      .filter((a) => a !== null)
      .map((a) => ({ ...a, notes: notes.filter((n) => n.assessorId === a.id) })),
  };
}

/** The board steps out and agrees its questions. */
export async function generateQuestions(sessionId: string): Promise<PitchSession> {
  const source = requireSource();
  const s = await loadSession(sessionId);
  if (!s.transcript.trim()) throw new EngineError("There is no transcript to question.", "invalid_reply", false);
  if (s.questions.length > 0 && s.status !== "conferring") return s; // already asked
  const ctx = await loadContext(s);
  const count = s.settings.questionCount;
  const boardIds = ctx.board.map((b) => b.id);

  let reply;
  if (source === "sample") reply = sampleQuestionsReply(ctx, count);
  else {
    const p = questionsPrompt(ctx, count);
    reply = (
      await callWithRetry(
        { kind: "questions", model: models.pitch, system: p.system, user: p.user, schema: questionsReplySchema, effort: engine.effort.questions, maxTokens: engine.maxTokens.questions },
        callClaude,
        logCall,
      )
    ).output;
  }
  const questions = checkQuestions(reply, boardIds, count);
  if (questions.length === 0) throw new EngineError("The board came back without usable questions. Try again.", "invalid_reply", true);
  return pitchSessions.save({ ...s, status: "questions", questions, replySource: source === "sample" ? "sample" : s.replySource });
}

/** Save the answer, then decide on at most one follow-up for this question. */
export async function answerQuestion(sessionId: string, questionId: string, answer: string): Promise<{ session: PitchSession; followUp: string | null }> {
  const source = requireSource();
  const s = await loadSession(sessionId);
  const index = s.questions.findIndex((q) => q.id === questionId);
  if (index < 0) throw new EngineError("That question was not asked in this session.", "invalid_reply", false);
  const q = s.questions[index];

  // A follow-up has already been asked: this is its answer. No second follow-up.
  if (q.followUp) {
    const questions = s.questions.map((x, i) => (i === index ? { ...x, followUpAnswer: answer } : x));
    return { session: await pitchSessions.save({ ...s, questions }), followUp: null };
  }

  let followUp: string | null = null;
  if (answer.trim()) {
    if (source === "sample") followUp = checkFollowUp(sampleFollowUpReply(index));
    else {
      const ctx = await loadContext(s);
      const p = followUpPrompt(ctx, q, answer);
      try {
        const r = await callWithRetry(
          { kind: "followUp", model: models.pitch, system: p.system, user: p.user, schema: followUpReplySchema, effort: engine.effort.followUp, maxTokens: engine.maxTokens.followUp },
          callClaude,
          logCall,
        );
        followUp = checkFollowUp(r.output);
      } catch {
        followUp = null; // a failed follow-up decision just moves on
      }
    }
  }
  const questions = s.questions.map((x, i) => (i === index ? { ...x, answerTranscript: answer, followUp } : x));
  const replySource = source === "sample" ? "sample" : s.replySource;
  return { session: await pitchSessions.save({ ...s, questions, replySource }), followUp };
}

/** End the Q&A and write the feedback report. Length and pace are measured here, in code. */
export async function finishQandA(sessionId: string): Promise<PitchSession> {
  const source = requireSource();
  const s = await loadSession(sessionId);
  if (s.status === "done" && s.report) return s;
  const ctx = await loadContext(s);
  const lengthSeconds = durationSeconds(s.startedAt, s.endedAt);
  const wpm = wordsPerMinute(wordCount(s.transcript), lengthSeconds);
  const asked = s.questions.filter((q) => q.answerTranscript != null || q.followUp);
  const qa = asked.map((q) => ({ id: q.id, assessorId: q.assessorId, text: q.text, answer: q.answerTranscript ?? "", followUp: q.followUp, followUpAnswer: q.followUpAnswer }));

  let reply;
  if (source === "sample") reply = samplePitchReportReply(ctx, qa.map((q) => q.id));
  else {
    const p = pitchReportPrompt(ctx, qa, { lengthSeconds, wordsPerMinute: wpm });
    reply = (
      await callWithRetry(
        { kind: "pitchReport", model: models.pitch, system: p.system, user: p.user, schema: pitchReportReplySchema, effort: engine.effort.pitchReport, maxTokens: engine.maxTokens.pitchReport },
        callClaude,
        logCall,
      )
    ).output;
  }
  const report = checkPitchReport(reply, {
    boardIds: ctx.board.map((b) => b.id),
    spoken: [s.transcript, ...qa.flatMap((q) => [q.answer, q.followUpAnswer ?? ""])],
    questionIds: qa.map((q) => q.id),
    lengthSeconds,
    wordsPerMinute: wpm,
  });
  return pitchSessions.save({ ...s, status: "done", report, replySource: source === "sample" ? "sample" : s.replySource });
}
