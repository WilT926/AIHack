// SAMPLE REPLIES, NOT CLAUDE. Used only when ANTHROPIC_API_KEY is not set and
// engine.sampleRepliesWithoutKey is on, so screens can be built and tested.
// Every result made here is marked replySource "sample" and screens must say
// so. The text says it is a sample, so it cannot pass for real feedback.
import type { AssessorReply, DeliberationReply } from "./replies";
import type { SharedContext } from "./prompts";

const firstWords = (text: string, n: number) => text.split(/\s+/).slice(0, n).join(" ");

/** A sample reply for one assessor, pointing at real paragraphs of this document. */
export function sampleAssessorReply(
  context: SharedContext,
  assessor: { id: string; name: string; field: string },
  seed = 0,
  /** This assessor's memory of earlier attempts, if any: one sample comment refers back to it. */
  earlier?: string | null,
): AssessorReply {
  const paras = context.document.paragraphs.filter((p) => p.type !== "heading" && p.text.trim());
  const picks = paras.filter((_, i) => (i + seed) % 3 === 0).slice(0, 3);
  const severities = ["major", "minor", "praise"] as const;
  const recalled = earlier?.match(/^- (?:Major|Minor) \(p\d+\): (.+)$/m)?.[1];
  const memoryComment = recalled && paras[0]
    ? [{
        paragraphId: paras[0].id,
        quote: "",
        category: "Sample · Since last time",
        severity: "minor",
        text: `Sample comment (no Claude call was made). Last time I raised: "${recalled}" Has this been fixed?`,
        suggestion: "Sample suggestion: say what changed since the last attempt.",
      }]
    : [];
  return {
    comments: [...memoryComment, ...picks.map((p, i) => ({
      paragraphId: p.id,
      quote: firstWords(p.text, 4),
      category: `Sample · ${assessor.field || "General"}`,
      severity: severities[i % 3],
      text: `Sample comment (no Claude call was made). ${assessor.name} would look closely at this paragraph from the point of view of ${assessor.field || "their field"}.`,
      suggestion: severities[i % 3] === "praise" ? "" : "Sample suggestion: this is placeholder text until the engine has an API key.",
    }))],
  };
}

/** A sample deliberation built from whatever comments came back. */
export function sampleDeliberationReply(
  board: { id: string; name: string }[],
  results: { assessorId: string; comments: { paragraphId: string }[] }[],
  graded: string[],
): DeliberationReply {
  const firstParas = results.flatMap((r) => r.comments.map((c) => ({ assessorId: r.assessorId, paragraphId: c.paragraphId })));
  return {
    deliberation: {
      summary: "Sample deliberation: no Claude call was made.",
      agreements: ["Sample agreement: placeholder until the engine has an API key."],
      disagreements: [],
    },
    report: {
      verdict: "Sample feedback report. No Claude call was made, so none of this is real feedback.",
      criteria: (graded.length ? graded : ["Overall"]).map((c) => ({ criterion: c, rating: "adequate", evidence: "Sample evidence." })),
      strengths: ["Sample strength."],
      actions: firstParas.slice(0, 3).map((x, i) => ({
        what: `Sample action ${i + 1}`,
        why: "Placeholder until the engine has an API key.",
        raisedBy: [x.assessorId],
        paragraphIds: [x.paragraphId],
        effort: (["quick", "moderate", "substantial"] as const)[i % 3],
      })),
      assessorVerdicts: board.map((b) => ({ assessorId: b.id, line: `Sample line from ${b.name}.` })),
      likelyQuestions: board.slice(0, 2).map((b) => ({ assessorId: b.id, question: `Sample question from ${b.name}?` })),
      escalations: [],
    },
    sinceLastTime: { improved: ["Sample: a point from last time now looks fixed."], raisedAgain: ["Sample: one point from last time came up again."] },
  };
}
