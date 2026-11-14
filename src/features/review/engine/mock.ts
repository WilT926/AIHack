// Canned feedback for PANEL_ENGINE_MOCK=1: exercises the live screen
// (arrivals, failures, deliberation) without spending credits. Every text is
// marked "[mock]" so it can never be mistaken for a real review.
import type { Assessor, Comment, Document } from "../types";
import type { AssessorOutput, DeliberationOutput } from "./schemas";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function mockDelay(seed: string): number {
  return 1500 + (hash(seed) % 3500);
}

export function mockAssessorOutput(doc: Document, a: Assessor): AssessorOutput {
  const body = doc.paragraphs.filter((p) => p.type === "paragraph");
  const h = hash(a.id + doc.id);
  const picks = [...new Set([h % body.length, (h >>> 5) % body.length, (h >>> 11) % body.length])].map((i) => body[i]);
  const kinds = ["critique", "question", "praise"] as const;
  return {
    comments: picks.map((p, i) => {
      const kind = kinds[(h + i) % 3];
      const text = {
        critique: `[mock] As the ${a.role.toLowerCase()}, I think this paragraph needs stronger support for its main claim.`,
        question: `[mock] From a ${a.field.toLowerCase()} point of view: how did you decide on this approach?`,
        praise: `[mock] This is clear and worth keeping; it does what a ${a.role.toLowerCase()} looks for.`,
      }[kind];
      return { paragraphIds: [p.id], kind, text };
    }),
  };
}

export function mockDeliberation(assessors: Assessor[], comments: Comment[]): DeliberationOutput {
  const critiques = comments.filter((c) => c.kind === "critique");
  const target = critiques[0];
  const objectors = target ? [target.assessorId] : [];
  const approvers = assessors.map((a) => a.id).filter((id) => !objectors.includes(id)).slice(0, 3);
  return {
    agreements: ["[mock] The structure is easy to follow.", "[mock] The main claims need more evidence."],
    splits:
      target && approvers.length > 0
        ? [
            {
              paragraphIds: target.paragraphIds,
              topic: "[mock] is this paragraph strong enough to keep?",
              approve: approvers,
              object: objectors,
              advice: "[mock] Keep it, but add one line of evidence that answers the objection.",
            },
          ]
        : [],
    fixList: critiques.slice(0, 4).map((c) => ({
      text: `[mock] Address: ${c.text.replace("[mock] ", "")}`,
      paragraphIds: c.paragraphIds,
      raisedBy: [c.assessorId],
    })),
    questions: assessors.map((a) => ({ assessorId: a.id, text: `[mock] What would you change first, and why?` })),
  };
}
