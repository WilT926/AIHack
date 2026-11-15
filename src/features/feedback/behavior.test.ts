import { expect, it } from "vitest";
import { summarizeGuardrails } from "./behavior";
import type { GuardrailEvent } from "@/lib/schemas";

it("adds event counts across assessor calls while retaining distinct reasons", () => {
  const event: GuardrailEvent = { rule: "rewriting", stage: "output", action: "dropped", location: "comments[0]", reason: "Replacement wording removed.", count: 1 };
  expect(summarizeGuardrails([event, { ...event, location: "comments[2]", count: 2 }, { ...event, rule: "grade-prediction", reason: "Mark prediction removed." }])).toEqual([
    { label: "Replacement wording removed", count: 3, reason: "Replacement wording removed." },
    { label: "Mark or grade predictions removed", count: 1, reason: "Mark prediction removed." },
  ]);
});
