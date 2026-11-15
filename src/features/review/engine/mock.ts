// Canned feedback for PANEL_ENGINE_MOCK=1: exercises the live screen
// (arrivals, failures, deliberation, second runs) without spending credits.
// Every text is marked "[mock]" so it can never be mistaken for a real review.
import type { Assessor, Comment, Document } from "../types";
import type { AssessorOutput, DeliberationOutput, MarkSchemeOutput, PreviousRun } from "./schemas";
import type { PreviousForAssessor } from "./prompts";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function mockDelay(seed: string): number {
  return 1500 + (hash(seed) % 3500);
}

const words = (t: string, n: number) => (t.length <= n ? t : `${t.slice(0, t.lastIndexOf(" ", n))}...`);
const strip = (t: string) => t.replace(/^\[mock\]\s*/, "").replace(/^(Still|Fixed since version \d+):\s*/, "");

export function mockAssessorOutput(
  doc: Document,
  a: Assessor,
  criterionIds: string[] = [],
  previous?: PreviousForAssessor,
): AssessorOutput {
  const body = doc.paragraphs.filter((p) => p.type === "paragraph");
  const h = hash(a.id + doc.id + doc.version);
  const picks = [...new Set([h % body.length, (h >>> 5) % body.length, (h >>> 11) % body.length])].map((i) => body[i]);
  const kinds = ["critique", "question", "praise"] as const;
  const criterion = (i: number) => (criterionIds.length ? criterionIds[(h + i) % criterionIds.length] : null);
  const comments: AssessorOutput["comments"] = picks.map((p, i) => {
    const kind = kinds[(h + i) % 3];
    const text = {
      critique: `[mock] As the ${a.role.toLowerCase()}, I think this paragraph needs stronger support for its main claim.`,
      question: `[mock] From a ${a.field.toLowerCase()} point of view: how did you decide on this approach?`,
      praise: `[mock] This is clear and worth keeping; it does what a ${a.role.toLowerCase()} looks for.`,
    }[kind];
    return { paragraphIds: [p.id], kind, text, criterionId: criterion(i) };
  });
  // Second look: refer back to the first earlier critique, by the paragraph it was about.
  const earlier = previous?.comments.find((c) => c.kind === "critique");
  if (previous && earlier) {
    const same = body.find((p) => p.text.startsWith(earlier.paragraph.slice(0, 40))) ?? body[0];
    const fixed = hash(a.id) % 2 === 0;
    comments.unshift({
      paragraphIds: [same.id],
      kind: fixed ? "praise" : "critique",
      text: fixed
        ? `[mock] Fixed since version ${previous.number}: this now answers my earlier point (${words(strip(earlier.text), 80)}).`
        : `[mock] Still open from version ${previous.number}: ${words(strip(earlier.text), 120)}`,
      criterionId: criterion(9),
    });
  }
  return { comments };
}

export function mockDeliberation(
  assessors: Assessor[],
  comments: Comment[],
  options: { previous?: PreviousRun; written?: boolean } = {},
): DeliberationOutput {
  const critiques = comments.filter((c) => c.kind === "critique");
  const target = critiques[0];
  const objectors = target ? [target.assessorId] : [];
  const approvers = assessors.map((a) => a.id).filter((id) => !objectors.includes(id)).slice(0, 3);
  const prevFixes = options.previous?.fixList ?? [];
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
      text: `[mock] Address: ${strip(c.text)}`,
      paragraphIds: c.paragraphIds,
      raisedBy: [c.assessorId],
    })),
    questions: assessors.map((a) => ({
      assessorId: a.id,
      text: options.written
        ? "[mock] Say in the text why you chose this method over the obvious alternative."
        : "[mock] What would you change first, and why?",
    })),
    sinceLastTime: {
      improved: prevFixes.slice(0, 1).map((f) => `[mock] Done: ${strip(f)}`),
      stillWeak: prevFixes.slice(1, 2).map((f) => `[mock] Partly done: ${strip(f)}`),
      ignored: prevFixes.slice(2, 3).map((f) => `[mock] Not touched: ${strip(f)}`),
    },
    addOrCut: options.written
      ? { add: ["[mock] A short limitations paragraph."], cut: ["[mock] The repeated summary at the end of the method."] }
      : { add: [], cut: [] },
  };
}

export function mockMarkScheme(): MarkSchemeOutput {
  return {
    criteria: [
      { name: "[mock] Understanding of the topic", weight: 40 },
      { name: "[mock] Method", weight: 30 },
      { name: "[mock] Presentation", weight: 30 },
    ],
  };
}
