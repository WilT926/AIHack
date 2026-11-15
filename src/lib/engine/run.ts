import "server-only";
// Review orchestration; the caller/logger are injected so tests use no API credit.
import { engine, models } from "@/config";
import type { Assessor, AssessorNote, Comment, Deliberation, FeedbackReport, GuardrailEvent } from "@/lib/schemas";
import { pickAngles } from "./angles";
import { checkComments, checkDeliberation } from "./check";
import { callWithRetry, EngineError, type CallLogger, type ModelCaller } from "./claude";
import { assessorPrompt, deliberationPrompt, type SharedContext } from "./prompts";
import { checkInput, runIntegrityPipeline } from "./pipeline";
import { assessorReplySchema, deliberationReplySchema } from "./replies";

export type EngineDeps = { call: ModelCaller; log: CallLogger; random?: () => number };
export type AssessorRunResult =
  | { assessorId: string; status: "done"; comments: Comment[]; dropped: number; angles: string[]; guardrailEvents: GuardrailEvent[] }
  | { assessorId: string; status: "failed"; error: string; guardrailEvents?: GuardrailEvent[] };

const materialFor = (context: SharedContext) => Object.fromEntries(context.document.paragraphs.map((p) => [p.id, p.text]));
const suppliedFor = (context: SharedContext) => JSON.stringify({ document: context.document, brief: context.project.brief, markScheme: context.project.markSchemeText });
const cleanContext = (context: SharedContext, material: Record<string, string>): SharedContext => ({
  ...context,
  document: { ...context.document, paragraphs: context.document.paragraphs.map((p) => ({ ...p, text: material[p.id] })) },
});

/** One failed assessor never stops the others. */
export async function runAssessor(
  input: { context: SharedContext; assessor: Assessor; notes: AssessorNote[]; earlierSummary?: string | null },
  deps: EngineDeps,
): Promise<AssessorRunResult> {
  const angles = pickAngles(input.assessor.role, engine.anglesPerRun, deps.random);
  try {
    const pipeline = await runIntegrityPipeline({
      material: materialFor(input.context),
      supplied: suppliedFor(input.context),
      assess: async (material) => {
        const prompt = assessorPrompt({ ...input, context: cleanContext(input.context, material), angles });
        const result = await callWithRetry(
          { kind: "review", model: models.review, system: prompt.system, user: prompt.user, schema: assessorReplySchema, effort: engine.effort.review, maxTokens: engine.maxTokens.review },
          deps.call,
          deps.log,
        );
        return result.output;
      },
      check: (reply) => checkComments(reply, input.context.document, input.assessor.id),
    });
    const checked = pipeline.value;
    return { assessorId: input.assessor.id, status: "done", comments: checked.value, dropped: checked.dropped, angles, guardrailEvents: pipeline.events };
  } catch (e) {
    return { assessorId: input.assessor.id, status: "failed", error: e instanceof Error ? e.message : "The review did not finish.", guardrailEvents: checkInput(materialFor(input.context)).events };
  }
}

export type DeliberationResult = {
  deliberation: Deliberation;
  report: FeedbackReport;
  dropped: number;
  since: { improved: string[]; raisedAgain: string[] } | null;
  guardrailEvents: GuardrailEvent[];
};

/** All finished comments pass through the same boundaries before a report is saved. */
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
  const pipeline = await runIntegrityPipeline({
    material: materialFor(input.context),
    supplied: suppliedFor(input.context),
    assess: async (material) => {
      const prompt = deliberationPrompt({ ...input, context: cleanContext(input.context, material) });
      const result = await callWithRetry(
        { kind: "deliberation", model: models.review, system: prompt.system, user: prompt.user, schema: deliberationReplySchema, effort: engine.effort.deliberation, maxTokens: engine.maxTokens.deliberation },
        deps.call,
        deps.log,
      );
      return result.output;
    },
  });
  const checked = checkDeliberation(pipeline.value, input.context.document, input.board.map((b) => b.id));
  return {
    ...checked.value,
    report: { ...checked.value.report, escalations: [...checked.value.report.escalations, ...pipeline.escalations] },
    dropped: checked.dropped,
    since: pipeline.value.sinceLastTime ?? null,
    guardrailEvents: pipeline.events,
  };
}
