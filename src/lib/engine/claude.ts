import "server-only";
// The one place that calls Claude. Server only: reads ANTHROPIC_API_KEY.
// - Structured replies through output_config.format (no forced tool choice,
//   no prefill, no temperature: the current API rejects them).
// - Thinking is left at its default (adaptive); depth is set with effort.
// - stop_reason is checked before the reply is read, including refusal and
//   max_tokens. Opus 5.5 and Sonnet 5.5 calls carry the server-side refusal
//   fallback, so a declined request is re-run on a fallback model.
// - One retry per call; every attempt is written to the call log.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import type { CallLog } from "@/lib/schemas";

export type CallKind = "review" | "deliberation" | "questions" | "followUp" | "pitchReport" | "router" | "utterance";
export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export type StructuredRequest<S extends z.ZodType> = {
  kind: CallKind;
  model: string;
  /** Fixed rules first, then the shared context (cached across calls in a run). */
  system: { rules: string; context: string };
  user: string;
  schema: S;
  effort: Effort;
  maxTokens: number;
};

export type CallResult<T> = { output: T; model: string; inputTokens: number; outputTokens: number; thinkingTokens?: number | null };

/** Anything that can answer a structured request. The real one calls Claude; tests pass a fake. */
export type ModelCaller = <S extends z.ZodType>(req: StructuredRequest<S>) => Promise<CallResult<z.infer<S>>>;

export type EngineErrorReason = "refusal" | "max_tokens" | "invalid_reply" | "api" | "not_configured";

export class EngineError extends Error {
  constructor(
    message: string,
    readonly reason: EngineErrorReason,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "EngineError";
  }
}

/** True when Claude can be called in this environment. */
export function hasClaude(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/** Models that accept the server-side refusal fallback ("default" routing). */
function supportsFallback(model: string): boolean {
  return model === "claude-opus-5-5" || model === "claude-sonnet-5-5";
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!hasClaude()) throw new EngineError("ANTHROPIC_API_KEY is not set.", "not_configured", false);
  // Our own wrapper does the one retry, so the SDK does not retry as well.
  client ??= new Anthropic({ maxRetries: 0, timeout: 120_000 });
  return client;
}

/** The real caller: one request to Claude, checked before use. */
export const callClaude: ModelCaller = async (req) => {
  const fallback = supportsFallback(req.model)
    ? { betas: ["server-side-fallback-2026-07-01" as const], fallbacks: "default" as const }
    : {};
  let response;
  try {
    response = await getClient().beta.messages.parse({
      model: req.model,
      max_tokens: req.maxTokens,
      system: [
        { type: "text", text: req.system.rules },
        { type: "text", text: req.system.context, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: req.user }],
      output_config: { effort: req.effort, format: zodOutputFormat(req.schema) },
      ...fallback,
    });
  } catch (e) {
    throw toEngineError(e);
  }

  if (response.stop_reason === "refusal") {
    throw new EngineError("Claude declined this request.", "refusal", false);
  }
  if (response.stop_reason === "max_tokens") {
    throw new EngineError("The reply was cut off at the length limit.", "max_tokens", true);
  }
  if (response.parsed_output == null) {
    throw new EngineError("The reply did not match the expected shape.", "invalid_reply", true);
  }
  return {
    output: response.parsed_output as z.infer<typeof req.schema>,
    model: response.model,
    inputTokens: response.usage.input_tokens + (response.usage.cache_read_input_tokens ?? 0) + (response.usage.cache_creation_input_tokens ?? 0),
    outputTokens: response.usage.output_tokens,
    thinkingTokens: response.usage.output_tokens_details?.thinking_tokens ?? null,
  };
};

function toEngineError(e: unknown): EngineError {
  if (e instanceof EngineError) return e;
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
    return new EngineError("The Anthropic API key was rejected.", "api", false);
  }
  if (e instanceof Anthropic.BadRequestError || e instanceof Anthropic.NotFoundError) {
    return new EngineError(`Claude rejected the request: ${e.message}`, "api", false);
  }
  if (e instanceof Anthropic.RateLimitError) return new EngineError("Claude is rate limited. Try again shortly.", "api", true);
  if (e instanceof Anthropic.APIConnectionError) return new EngineError("Could not reach Claude.", "api", true);
  if (e instanceof Anthropic.APIError) return new EngineError(`Claude returned an error (${e.status ?? "unknown"}).`, "api", true);
  return new EngineError(e instanceof Error ? e.message : "Unknown error calling Claude.", "api", true);
}

export type CallLogger = (entry: Omit<CallLog, "id">) => Promise<void>;

/**
 * Run a request with one retry. Every attempt is logged. Non-retryable
 * failures (refusal, bad key, bad request) are not retried.
 */
export async function callWithRetry<S extends z.ZodType>(
  req: StructuredRequest<S>,
  call: ModelCaller,
  log: CallLogger,
): Promise<CallResult<z.infer<S>>> {
  let last: EngineError | null = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const started = Date.now();
    try {
      const result = await call(req);
      await log({
        kind: req.kind,
        model: result.model || req.model,
        startedAt: new Date(started).toISOString(),
        durationMs: Date.now() - started,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        ok: true,
        error: null,
      }).catch(() => {});
      return result;
    } catch (e) {
      last = toEngineError(e);
      await log({
        kind: req.kind,
        model: req.model,
        startedAt: new Date(started).toISOString(),
        durationMs: Date.now() - started,
        inputTokens: 0,
        outputTokens: 0,
        ok: false,
        error: `${last.reason}: ${last.message}`.slice(0, 2000),
      }).catch(() => {});
      if (!last.retryable) break;
    }
  }
  throw last ?? new EngineError("Unknown error.", "api", false);
}
