// TEMPORARY (Lane 2): engine settings until Lane 1's src/config lands.
// Server-only values; nothing here is secret (the API key is read by the SDK
// from ANTHROPIC_API_KEY on the server).
import "server-only";

type Effort = "low" | "medium" | "high" | "xhigh" | "max";

/** Models that accept the server-side refusal fallback (`fallbacks: "default"`). */
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-sonnet-5-5", "claude-fable-5-2"]);

const reviewModel = process.env.PANEL_REVIEW_MODEL || "claude-haiku-5-5"; // dev default (CLAUDE.md)

export const engineConfig = {
  /** Set PANEL_REVIEW_MODEL=claude-opus-5-5 for rehearsal and judging. */
  reviewModel,
  effort: (process.env.PANEL_REVIEW_EFFORT as Effort | undefined) || "medium",
  useFallbacks: FALLBACK_MODELS.has(reviewModel),
  /** PANEL_ENGINE_MOCK=1 returns canned feedback without calling Claude (screen work, demos offline). */
  mock: process.env.PANEL_ENGINE_MOCK === "1",
  hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN),
};
