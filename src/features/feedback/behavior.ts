import type { GuardrailEvent } from "@/lib/schemas";

export const GUARDRAIL_LABELS: Record<GuardrailEvent["rule"], string> = {
  "reviewer-instruction": "Reviewer instructions ignored",
  rewriting: "Replacement wording removed",
  "grade-prediction": "Mark or grade predictions removed",
  "unobservable-delivery": "Unobservable delivery comments removed",
  "unsupplied-citation": "Unsupplied citations removed",
  "instruction-disclosure": "Internal instructions protected",
};

export function summarizeGuardrails(events: GuardrailEvent[]) {
  const groups = new Map<string, { label: string; count: number; reason: string }>();
  for (const event of events) {
    const key = `${event.rule}:${event.reason}`;
    const previous = groups.get(key);
    groups.set(key, { label: GUARDRAIL_LABELS[event.rule], reason: event.reason, count: (previous?.count ?? 0) + event.count });
  }
  return [...groups.values()];
}
