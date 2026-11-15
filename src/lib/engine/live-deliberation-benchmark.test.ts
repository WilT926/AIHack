// Opt-in timing/quality comparison on the same previously verified, invented comments.
import { readFile, writeFile } from "node:fs/promises";
import { expect, it } from "vitest";
import { getProfile, projects } from "@/lib/data";
import { reviewSchema } from "@/lib/schemas";
import { sampleEngineDocument } from "../../../fixtures/engine/sample-document";
import { callClaude, type Effort, type ModelCaller } from "./claude";
import { runDeliberation } from "./run";
import { sampleAssessors } from "../../../fixtures/home-sample";

it.skipIf(process.env.PANEL_BENCHMARK_LIVE !== "1")("compares deliberation effort with frozen input and quality checks", async () => {
  process.loadEnvFile(".env.local");
  delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SECRET_KEY; delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const fixture = JSON.parse(await readFile("fixtures/engine/guarded-real-review.json", "utf8"));
  const review = reviewSchema.parse(fixture.review);
  const p = (await projects.get("proj-mt"))!;
  const context = { profile: (await getProfile())!, project: { ...p, markSchemeText: "", brief: { ...p.brief, graded: ["Methods", "Analysis", "Writing"], goal: "Clear, justified methods" } }, document: sampleEngineDocument };
  const board = review.assessorResults.map((r) => sampleAssessors.find((a) => a.id === r.assessorId)!);
  const results = review.assessorResults.filter((r) => r.status === "done");
  const variant = process.env.PANEL_BENCHMARK_VARIANT ?? "";
  const suffix = variant ? `-${variant}` : "";
  const selected = process.env.PANEL_BENCHMARK_EFFORT;
  const efforts: Effort[] = selected ? [selected as Effort] : ["high", "medium", "low"];
  const benchmarks = await Promise.all(efforts.map(async (effort) => {
    let apiMs = 0;
    let outputTokens = 0;
    let inputTokens = 0;
    let thinkingTokens: number | null = null;
    const call: ModelCaller = async (req) => {
      const started = performance.now();
      const result = await callClaude({ ...req, effort });
      apiMs += performance.now() - started;
      outputTokens = result.outputTokens; inputTokens = result.inputTokens;
      thinkingTokens = result.thinkingTokens ?? null;
      return result;
    };
    const started = performance.now();
    const outcome = await runDeliberation({ context, board, results }, { call, log: async () => {} });
    const totalMs = performance.now() - started;
    const prose = JSON.stringify(outcome.report.actions).toLowerCase();
    const quality = {
      criteria: outcome.report.criteria.map((c) => c.criterion),
      boardVerdicts: outcome.report.assessorVerdicts.length,
      actions: outcome.report.actions.length,
      anchoredActions: outcome.report.actions.every((a) => a.evidence.paragraphIds.length > 0 && a.raisedBy.length > 0),
      coverage: {
        sampleRationale: /sample|power|feasibility/.test(prose),
        randomisationOrCarryover: /random|washout|carryover|order effect/.test(prose),
        missingData: /withdraw|missing data|attrition|partial data/.test(prose),
        comfortThreshold: /threshold|two.point|comfort/.test(prose),
        calibration: /calibrat|sensor/.test(prose),
        writing: /roadmap|writing|clarity|plain.language|define|signpost/.test(prose),
      },
      hasEscalations: outcome.report.escalations.length > 0,
      safetyEscalation: /safe|pressure|ethic/.test(JSON.stringify(outcome.report.escalations).toLowerCase()),
      dropped: outcome.dropped,
      guardrailEvents: outcome.guardrailEvents,
    };
    const value = { provenance: "Real Claude effort benchmark on the frozen invented comments in guarded-real-review.json; same complete input for each effort", verifiedAt: new Date().toISOString(), effort, totalMs: Math.round(totalMs), apiMs: Math.round(apiMs), localMs: Math.round(totalMs - apiMs), inputTokens, outputTokens, thinkingTokens, approximateVisibleTokens: thinkingTokens == null ? null : outputTokens - thinkingTokens, quality, outcome };
    await writeFile(`fixtures/engine/deliberation-${effort}${suffix}.json`, JSON.stringify(value, null, 2) + "\n");
    expect(quality.criteria.sort()).toEqual(["Analysis", "Methods", "Writing"]);
    expect(quality.boardVerdicts).toBe(6);
    expect(quality.actions).toBeGreaterThanOrEqual(4);
    expect(quality.actions).toBeLessThanOrEqual(6);
    expect(quality.anchoredActions).toBe(true);
    expect(Object.values(quality.coverage).every(Boolean)).toBe(true);
    expect(quality.hasEscalations).toBe(true);
    if (variant === "final") expect(quality.safetyEscalation).toBe(true);
    return value;
  }));
  await writeFile(`fixtures/engine/deliberation-timings${suffix}.json`, JSON.stringify(benchmarks.map((b) => ({ effort: b.effort, totalMs: b.totalMs, apiMs: b.apiMs, localMs: b.localMs, inputTokens: b.inputTokens, outputTokens: b.outputTokens, thinkingTokens: b.thinkingTokens, approximateVisibleTokens: b.approximateVisibleTokens, quality: b.quality })), null, 2) + "\n");
}, 240000);
