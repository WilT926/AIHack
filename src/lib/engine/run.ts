import "server-only";
// The review engine's two steps, independent of where data comes from.
// Dependencies (the model caller, the call logger, randomness) are passed in,
// so the same code runs against Claude, against sample replies in tests, and
// against a failing fake.
import { engine, models } from "@/config";
import type { Assessor, AssessorNote, Comment, Deliberation, FeedbackReport } from "@/lib/schemas";
import { pickAngles } from "./angles";
import { checkComments, checkDeliberation } from "./check";
import { callWithRetry, EngineError, type CallLogger, type ModelCaller } from "./claude";
import { assessorPrompt, deliberationPrompt, type SharedContext } from "./prompts";
import { assessorReplySchema, deliberationReplySchema } from "./replies";

export type EngineDeps = {
  call: ModelCaller;
  log: CallLogger;
  random?: () => number;
};

export type AssessorRunResult =
  | { assessorId: string; status: "done"; comments: Comment[]; dropped: number; angles: string[] }
  | { assessorId: string; status: "failed"; error: string };

/** One assessor reads the document. A failure is reported, never thrown, so the others carry on. */
export async function runAssessor(
  input: {
    context: SharedContext;
    assessor: Assessor;
    notes: AssessorNote[];
    earlierSummary?: string | null;
  },
  deps: EngineDeps,
): Promise<AssessorRunResult> {
  const angles = pickAngles(input.assessor.role, engine.anglesPerRun, deps.random);
  const prompt = assessorPrompt({ ...input, angles });
  try {
    const result = await callWithRetry(
      {
        kind: "review",
        model: models.review,
        system: prompt.system,
        user: prompt.user,
        schema: assessorReplySchema,
        effort: engine.effort.review,
        maxTokens: engine.maxTokens.review,
      },
      deps.call,
      deps.log,
    );
    const checked = checkComments(result.output, input.context.document, input.assessor.id);
    return { assessorId: input.assessor.id, status: "done", comments: checked.value, dropped: checked.dropped, angles };
  } catch (e) {
    return { assessorId: input.assessor.id, status: "failed", error: e instanceof Error ? e.message : "The review did not finish." };
  }
}

export type DeliberationResult = {
  deliberation: Deliberation;
  report: FeedbackReport;
  dropped: number;
  /** The model's "improved" and "raised again" lists, before code adds "still open". */
  since: { improved: string[]; raisedAgain: string[] } | null;
};

/** The board deliberates over every finished assessor's comments. Throws EngineError on failure. */
export async function runDeliberation(
  input: {
    context: SharedContext;
    board: Pick<Assessor, "id" | "name" | "role" | "field">[];
    results: { assessorId: string; comments: Comment[] }[];
    memory?: string | null;
  },
  deps: EngineDeps,
): Promise<DeliberationResult> {
  if (input.results.length === 0) throw new EngineError("No assessor finished, so there is nothing to deliberate.", "invalid_reply", false);
  const prompt = deliberationPrompt(input);
  const result = await callWithRetry(
    {
      kind: "deliberation",
      model: models.review,
      system: prompt.system,
      user: prompt.user,
      schema: deliberationReplySchema,
      effort: engine.effort.deliberation,
      maxTokens: engine.maxTokens.deliberation,
    },
    deps.call,
    deps.log,
  );
  const checked = checkDeliberation(
    result.output,
    input.context.document,
    input.board.map((b) => b.id),
  );
  return { ...checked.value, dropped: checked.dropped, since: result.output.sinceLastTime ?? null };
}
