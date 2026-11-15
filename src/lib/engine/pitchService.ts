import "server-only";
// Presentation practice on the server: the board's questions, follow-ups and
// the feedback report, saved on the PitchSession. Uses Claude when a key is
// set, otherwise labelled sample replies (replySource "sample").
import { engine, models } from "@/config";
import { assessorNotes, assessors, boards, callLogs, pitchSessions, projects } from "@/lib/data";
import type { Assessment, PitchSession, QaMode, QaTurn } from "@/lib/schemas";
import { durationSeconds, wordCount, wordsPerMinute } from "@/lib/voice/transcript";
import { callClaude, callWithRetry, EngineError, type CallLogger } from "./claude";
import {
  checkPitchReport,
  checkQuestions,
  pitchReportPrompt,
  pitchReportReplySchema,
  questionsPrompt,
  questionsReplySchema,
  samplePitchReportReply,
  sampleQuestionsReply,
  type PitchContext,
} from "./pitch";
import { behaviorFor, recordGuardrailEvents } from "./eventStore";
import { guardrailEscalations, runIntegrityPipeline } from "./pipeline";
import { replySource } from "./service";
import { attemptFromPitch, memoryForBoard, sinceLastTime, stillOpen } from "./memory";
import { recordAttempt } from "./memoryStore";
import {
  assessmentReplySchema,
  checkAssessment,
  decideNext,
  modeFor,
  pauseUtterance,
  routerPrompt,
  ruleIntent,
  sampleAssessment,
  sampleUtterance,
  turnKind,
  utterancePrompt,
  utteranceReplySchema,
} from "./router";

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

/** Everything the pitch calls are built from, including the board's memory of earlier attempts. */
export async function pitchContextFor(sessionId: string): Promise<PitchContext> {
  return loadContext(await loadSession(sessionId));
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
    memory: memoryForBoard(project.memory, s.id),
    lastOpen: stillOpen(project.memory, s.id),
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

  const pipeline = await runIntegrityPipeline({
    material: { transcript: ctx.transcript }, supplied: JSON.stringify({ transcript: s.transcript, answers: s.qa.turns.map((t) => t.answer), brief: ctx.project.brief, markScheme: ctx.project.markSchemeText }),
    assess: async (material) => {
      const clean = { ...ctx, transcript: material.transcript };
      let reply;
      if (source === "sample") reply = sampleQuestionsReply(clean, count);
      else {
        const p = questionsPrompt(clean, count);
        reply = (
          await callWithRetry(
            { kind: "questions", model: models.pitch, system: p.system, user: p.user, schema: questionsReplySchema, effort: engine.effort.questions, maxTokens: engine.maxTokens.questions },
            callClaude,
            logCall,
          )
        ).output;
      }
      return reply;
    },
    check: (reply) => checkQuestions(reply, boardIds, count),
  });
  await recordGuardrailEvents(s.id, pipeline.events);
  const questions = pipeline.value;
  if (questions.length === 0) throw new EngineError("The board came back without usable questions. Try again.", "invalid_reply", true);
  const first = questions[0];
  const qa = {
    mode: null,
    struggles: 0,
    turns: [{ id: "t1", questionId: first.id, assessorId: first.assessorId, kind: "question" as const, mode: null, text: first.text, answer: null, assessment: null, timing: null }],
    escalations: [],
  };
  return pitchSessions.save({ ...s, status: "questions", questions, qa, replySource: source === "sample" ? "sample" : s.replySource });
}

export type TurnResult = {
  session: PitchSession;
  /** What the board says next, or null when the Q&A is over. */
  next: QaTurn | null;
  assessment: Assessment;
  mode: QaMode;
};

/**
 * One turn of the routed Q&A: input check, router call, code picks the mode
 * and what happens next, then the next utterance in that mode's prompt
 * block only. Timings are saved on the new turn.
 */
export async function takeAnswer(sessionId: string, answer: string): Promise<TurnResult> {
  const source = requireSource();
  const started = Date.now();
  const s = await loadSession(sessionId);
  const turns = [...s.qa.turns];
  const currentIndex = turns.findLastIndex((t) => t.answer == null);
  if (currentIndex < 0) throw new EngineError("There is no question waiting for an answer.", "invalid_reply", false);
  const current = turns[currentIndex];
  const planned = s.questions.find((q) => q.id === current.questionId);
  const conditions = s.settings.conditions;

  const originalAnswer = answer;
  const ctx = await loadContext(s);
  const pipeline = await runIntegrityPipeline({
    material: { answer, transcript: s.transcript, ...Object.fromEntries(turns.map((t) => [`answer:${t.id}`, t.answer ?? ""])) },
    supplied: JSON.stringify({ transcript: s.transcript, answers: s.qa.turns.map((t) => t.answer), brief: ctx.project.brief, markScheme: ctx.project.markSchemeText }),
    route: async (material) => {
      answer = material.answer;

      const ruled = ruleIntent(originalAnswer);
      let assessment: Assessment;
      if (source === "sample" || !answer.trim()) {
        assessment = answer.trim() ? sampleAssessment(current.text, answer) : { answerQuality: "struggling", studentIntent: ruled ?? "answering" };
      } else {
        const p = routerPrompt(current.text, answer);
        try {
          const r = await callWithRetry(
            { kind: "router", model: models.router, system: p.system, user: p.user, schema: assessmentReplySchema, effort: engine.effort.router, maxTokens: engine.maxTokens.router },
            callClaude,
            logCall,
          );
          assessment = checkAssessment(r.output);
        } catch {
          assessment = sampleAssessment(current.text, answer); // the router failed: fall back to the rule-based reading
        }
      }
      if (ruled) assessment = { ...assessment, studentIntent: ruled };
      return { assessment, routerMs: Date.now() - started };

    },
    assess: async (material, { assessment, routerMs }) => {
      // 2. Code picks the mode and the next action.
      const mode = modeFor(assessment, conditions);
      turns[currentIndex] = { ...current, answer: originalAnswer, assessment };
      const action = decideNext(mode, { turns }, s.questions, current.questionId);

      // 3. The next utterance, generated with this mode's block only.
      const utteranceStarted = Date.now();
      let next: QaTurn | null = null;
      const escalations = [...s.qa.escalations];
      if (action.kind === "pause") {
        next = { id: `t${turns.length + 1}`, questionId: current.questionId, assessorId: current.assessorId, kind: "pause", mode, text: pauseUtterance(assessment.studentIntent), answer: null, assessment: null, timing: null };
        escalations.push({
          reason: assessment.studentIntent === "distressed" ? "The student said they were struggling, so the board paused the questions." : "The student asked to stop, so the board paused the questions.",
          whoToAsk: "Your personal tutor or supervisor",
        });
      } else if (action.kind !== "end") {
        const target = s.questions.find((q) => q.id === action.questionId) ?? planned;
        const assessorId = action.kind === "follow-up" ? current.assessorId : (target?.assessorId ?? current.assessorId);
        const blockMode = mode as Exclude<QaMode, "paused">;
        const plannedText = target?.text ?? current.text;
        let text: string;
        if (source === "sample") {
          text = sampleUtterance(blockMode, action.kind, plannedText, turns.length + 1);
        } else {

          const judge = ctx.board.find((b) => b.id === assessorId);
          const p = utterancePrompt({
            mode: blockMode,
            conditions,
            action: action.kind,
            judge: { name: judge?.name ?? "A judge", role: judge?.role ?? "", field: judge?.field ?? "" },
            plannedQuestion: plannedText,
            transcriptExcerpt: material.transcript.slice(0, 6000),
            memory: ctx.memory,
            history: turns.map((t) => ({ text: t.text, answer: t.id === current.id ? material.answer : material[`answer:${t.id}`] })),
          });
          try {
            const r = await callWithRetry(
              { kind: "utterance", model: models.router, system: p.system, user: p.user, schema: utteranceReplySchema, effort: engine.effort.utterance, maxTokens: engine.maxTokens.utterance },
              callClaude,
              logCall,
            );
            text = r.output.text.trim();
          } catch {
            text = "";
          }
        }
        // Never repeat a question, and never leave the student with nothing.
        const said = new Set(turns.map((t) => t.text.trim().toLowerCase()));
        if (!text || said.has(text.toLowerCase())) {
          text = action.kind === "next-question" && !said.has(plannedText.trim().toLowerCase()) ? plannedText : "";
          if (!text) text = `Let's come back to it from another angle, ${turns.length + 1 > 3 ? "briefly" : "one part at a time"}: ${plannedText}`;
          if (said.has(text.toLowerCase())) text = `${text} (question ${turns.length + 1})`;
        }
        next = { id: `t${turns.length + 1}`, questionId: action.kind === "follow-up" ? current.questionId : action.questionId, assessorId, kind: turnKind(mode, action), mode, text, answer: null, assessment: null, timing: null };
      }
      const utteranceMs = Date.now() - utteranceStarted;
      if (next) next = { ...next, timing: { routerMs, utteranceMs, gapMs: Date.now() - started } };

      return { next, assessment, mode, escalations };
    },
  });
  await recordGuardrailEvents(s.id, pipeline.events);
  const { assessment, mode } = pipeline.value;
  const escalations = [...pipeline.value.escalations, ...pipeline.escalations];
  // If the generated utterance crossed a boundary, replace it with a fixed question.
  const next = pipeline.value.next && !pipeline.value.next.text.trim()
    ? { ...pipeline.value.next, text: "Which evidence from your own work addresses this question?" }
    : pipeline.value.next;
  answer = originalAnswer;

  // Keep the planned questions' answer fields in step, for the report.
  const questions = s.questions.map((q) => {
    if (q.id !== current.questionId) return q;
    if (current.kind === "question") return { ...q, answerTranscript: answer };
    if (!q.followUp) return { ...q, followUp: current.text, followUpAnswer: answer };
    return q;
  });

  const qa = {
    mode,
    struggles: s.qa.struggles + (assessment.answerQuality === "struggling" ? 1 : 0),
    turns: next ? [...turns, next] : turns,
    escalations,
  };
  const replySource = source === "sample" ? "sample" : s.replySource;
  const session = await pitchSessions.save({ ...s, questions, qa, replySource });
  return { session, next, assessment, mode };
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

  const pipeline = await runIntegrityPipeline({
    material: { transcript: ctx.transcript, ...Object.fromEntries(s.qa.turns.map((t) => [`answer:${t.id}`, t.answer ?? ""])) }, supplied: JSON.stringify({ transcript: s.transcript, answers: s.qa.turns.map((t) => t.answer), brief: ctx.project.brief, markScheme: ctx.project.markSchemeText }),
    assess: async (material) => {
      const clean = { ...ctx, transcript: material.transcript };
      const safeTurns = s.qa.turns.map((t) => ({ ...t, answer: material[`answer:${t.id}`] }));
      const safeQa = qa.map((q) => ({ ...q, answer: material[`answer:${s.qa.turns.find((t) => t.questionId === q.id && t.kind === "question")?.id}`] ?? "", followUpAnswer: "" }));
      let reply;
      if (source === "sample") reply = samplePitchReportReply(clean, qa.map((q) => q.id));
      else {
        const p = pitchReportPrompt(clean, safeQa, { lengthSeconds, wordsPerMinute: wpm }, safeTurns);
        reply = (
          await callWithRetry(
            { kind: "pitchReport", model: models.pitch, system: p.system, user: p.user, schema: pitchReportReplySchema, effort: engine.effort.pitchReport, maxTokens: engine.maxTokens.pitchReport },
            callClaude,
            logCall,
          )
        ).output;
      }
      return reply;
    },
  });
  await recordGuardrailEvents(s.id, pipeline.events);
  const reply = pipeline.value;
  const checked = checkPitchReport(reply, {
    boardIds: ctx.board.map((b) => b.id),
    spoken: [s.transcript, ...s.qa.turns.map((t) => t.answer ?? ""), ...qa.flatMap((q) => [q.answer, q.followUpAnswer ?? ""])],
    questionIds: qa.map((q) => q.id),
    lengthSeconds,
    wordsPerMinute: wpm,
  });
  const project = await projects.get(s.projectId);
  const memory = project?.memory ?? { attempts: [] };
  const behavior = await behaviorFor(s.id, s);
  const report = {
    ...checked,
    behavior,
    // A pause is always handed to a human, whatever the report call wrote.
    escalations: [...s.qa.escalations, ...checked.escalations, ...guardrailEscalations(behavior.guardrailEvents)],
    // Improved and raised again from the board, still open from code.
    sinceLastTime: sinceLastTime(memory, s.id, reply.sinceLastTime),
  };
  const saved = await pitchSessions.save({ ...s, status: "done", report, replySource: source === "sample" ? "sample" : s.replySource });
  // The session has ended: the board remembers it.
  await recordAttempt(s.projectId, attemptFromPitch(saved));
  return saved;
}
