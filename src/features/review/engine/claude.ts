// The one place the review engine talks to Claude. Server only.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { engineConfig } from "./config";

export class EngineError extends Error {
  constructor(
    message: string,
    readonly code: "no-key" | "refused" | "truncated" | "invalid-output" | "rate-limited" | "api" | "cancelled",
  ) {
    super(message);
  }
}

let client: Anthropic | undefined;
function getClient(): Anthropic {
  // Reads ANTHROPIC_API_KEY on the server. maxRetries covers 429/5xx/network.
  client ??= new Anthropic({ maxRetries: 2, timeout: 90_000 });
  return client;
}

/** One structured call: returns the parsed, schema-valid output or throws EngineError. */
export async function callStructured<S extends z.ZodType>(options: {
  system: string;
  user: string;
  schema: S;
  maxTokens: number;
  signal?: AbortSignal;
}): Promise<{ output: z.infer<S>; model: string; inputTokens: number; outputTokens: number }> {
  if (!engineConfig.hasApiKey) {
    throw new EngineError("No Anthropic API key is set on the server (ANTHROPIC_API_KEY).", "no-key");
  }

  let response;
  try {
    response = await getClient().beta.messages.parse({
      model: engineConfig.reviewModel,
      max_tokens: options.maxTokens,
      system: [{ type: "text", text: options.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: options.user }],
      output_config: { effort: engineConfig.effort, format: betaZodOutputFormat(options.schema) },
      // On models that support it, a policy decline is retried on a fallback model server-side.
      ...(engineConfig.useFallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
    }, { signal: options.signal });
  } catch (err) {
    if (err instanceof Anthropic.APIUserAbortError) throw new EngineError("The request was cancelled.", "cancelled");
    if (err instanceof Anthropic.RateLimitError) throw new EngineError("Claude is busy right now. Try again shortly.", "rate-limited");
    if (err instanceof Anthropic.AuthenticationError) throw new EngineError("The server's Anthropic API key was rejected.", "no-key");
    if (err instanceof Anthropic.APIError) throw new EngineError(`Claude returned an error (${err.status ?? "network"}).`, "api");
    throw new EngineError("Claude's reply didn't match the expected shape.", "invalid-output");
  }

  // Check why it stopped before reading anything.
  if (response.stop_reason === "refusal") throw new EngineError("This assessor declined to review the document.", "refused");
  if (response.stop_reason === "max_tokens") throw new EngineError("The reply was cut off before it finished.", "truncated");
  if (!response.parsed_output) throw new EngineError("Claude's reply didn't match the expected shape.", "invalid-output");

  return {
    output: response.parsed_output,
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}
