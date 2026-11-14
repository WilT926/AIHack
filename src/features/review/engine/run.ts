// The engine's two operations, behind single functions so Lane 1's engine
// can replace them later without touching the screen. Server only.
import "server-only";
import type { Comment, Deliberation, FixItem, Question } from "../types";
import { callStructured } from "./claude";
import { engineConfig } from "./config";
import { mockAssessorOutput, mockDelay, mockDeliberation, sleep } from "./mock";
import { ASSESSOR_SYSTEM, DELIBERATION_SYSTEM, assessorUserMessage, deliberationUserMessage } from "./prompts";
import { sanitizeAssessorOutput, sanitizeDeliberation } from "./sanitize";
import {
  assessorOutputSchema,
  deliberationOutputSchema,
  type AssessorRequest,
  type DeliberationRequest,
} from "./schemas";

function log(kind: string, startedAt: number, extra: Record<string, unknown>) {
  // Minimal call log until Lane 1's CallLog table exists. No document text.
  console.info(JSON.stringify({ engine: kind, durationMs: Date.now() - startedAt, ...extra }));
}

export async function reviewAsAssessor(req: AssessorRequest): Promise<Comment[]> {
  const startedAt = Date.now();
  if (engineConfig.mock) {
    await sleep(mockDelay(req.assessor.id));
    if (req.assessor.id === "sceptic" && req.document.title.toLowerCase().includes("fail")) {
      throw new Error("[mock] simulated failure");
    }
    return sanitizeAssessorOutput(mockAssessorOutput(req.document, req.assessor), req.document, req.assessor.id);
  }
  try {
    const result = await callStructured({
      system: ASSESSOR_SYSTEM,
      user: assessorUserMessage(req.context, req.document, req.assessor),
      schema: assessorOutputSchema,
      maxTokens: 16000,
    });
    const comments = sanitizeAssessorOutput(result.output, req.document, req.assessor.id);
    log("assessor", startedAt, { ok: true, assessor: req.assessor.id, model: result.model, inputTokens: result.inputTokens, outputTokens: result.outputTokens, kept: comments.length, returned: result.output.comments.length });
    return comments;
  } catch (err) {
    log("assessor", startedAt, { ok: false, assessor: req.assessor.id, error: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}

export async function deliberate(
  req: DeliberationRequest,
): Promise<{ deliberation: Deliberation; fixList: FixItem[]; questions: Question[] }> {
  const startedAt = Date.now();
  const ids = req.assessors.map((a) => a.id);
  const seconds = () => Math.max(1, Math.round((Date.now() - startedAt) / 1000));
  if (engineConfig.mock) {
    await sleep(2000);
    return sanitizeDeliberation(mockDeliberation(req.assessors, req.comments), req.document, ids, seconds());
  }
  try {
    const result = await callStructured({
      system: DELIBERATION_SYSTEM,
      user: deliberationUserMessage(req.context, req.document, req.assessors, req.comments),
      schema: deliberationOutputSchema,
      maxTokens: 16000,
    });
    const out = sanitizeDeliberation(result.output, req.document, ids, seconds());
    log("deliberation", startedAt, { ok: true, model: result.model, inputTokens: result.inputTokens, outputTokens: result.outputTokens });
    return out;
  } catch (err) {
    log("deliberation", startedAt, { ok: false, error: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}
