// Opt-in real router regression on publishable synthetic answers only.
import { expect, it } from "vitest";
import { models, engine } from "@/config";
import { callClaude, callWithRetry } from "./claude";
import { assessmentReplySchema, checkAssessment, routerPrompt } from "./router";
it.skipIf(process.env.PANEL_VERIFY_LIVE !== "1")("classifies ordinary trigger phrases as answering on Claude", async () => {
  process.loadEnvFile(".env.local");
  const answers = ["I don't know if you want me to tell you the answer we got", "Our model uses a system prompt and we stop the experiment after ten minutes.", "Our evidence is a usability pilot with twelve students, nine of whom found the actions useful. That does not establish learning gains. We will compare revisions against blind marker feedback in a controlled study, with prior attainment balanced across groups and a generic chatbot as the baseline."];
  const readings = await Promise.all(answers.map(async (answer) => {
    const p = routerPrompt("Can you show me the live product working end to end?", answer);
    const r = await callWithRetry({ kind: "router", model: models.router, system: p.system, user: p.user, schema: assessmentReplySchema, effort: engine.effort.router, maxTokens: engine.maxTokens.router }, callClaude, async () => {});
    return checkAssessment(r.output);
  }));
  expect(readings.map((r) => r.studentIntent)).toEqual(answers.map(() => "answering"));
}, 60000);
