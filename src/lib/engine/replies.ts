// The shapes Claude is asked to reply in (structured outputs). Deliberately
// loose: limits and cross-checks (does the paragraph exist? is the quote in
// it? is the assessor on this board?) happen afterwards in ./check.ts, where
// invalid items are dropped rather than failing the whole reply.
import { z } from "zod";

export const assessorReplySchema = z.object({
  comments: z.array(
    z.object({
      paragraphId: z.string().describe('The paragraph id, exactly as shown in the document, e.g. "p3".'),
      quote: z.string().describe("The exact words from that paragraph this comment is about, copied character for character, or an empty string."),
      category: z.string().describe("A short label, e.g. Sample size, Structure, Citation."),
      severity: z.string().describe("praise, minor or major."),
      text: z.string().describe("The comment, in your own voice, two or three sentences."),
      suggestion: z.string().describe("One concrete change the student could make, or an empty string for praise."),
    }),
  ),
});
export type AssessorReply = z.infer<typeof assessorReplySchema>;

export const deliberationReplySchema = z.object({
  deliberation: z.object({
    summary: z.string(),
    agreements: z.array(z.string()),
    disagreements: z.array(
      z.object({
        topic: z.string(),
        views: z.array(z.object({ assessorId: z.string(), view: z.string() })),
        advice: z.string(),
      }),
    ),
  }),
  report: z.object({
    verdict: z.string().describe("Two or three sentences."),
    criteria: z.array(z.object({ criterion: z.string(), rating: z.string().describe("strong, adequate or weak."), evidence: z.string() })),
    strengths: z.array(z.string()),
    actions: z.array(
      z.object({
        what: z.string(),
        why: z.string(),
        raisedBy: z.array(z.string()).describe("Ids of the assessors who raised it."),
        paragraphIds: z.array(z.string()).describe("The paragraphs this action is based on. At least one."),
        effort: z.string().describe("quick, moderate or substantial."),
      }),
    ).describe("Ranked, most important first."),
    assessorVerdicts: z.array(z.object({ assessorId: z.string(), line: z.string() })),
    likelyQuestions: z.array(z.object({ assessorId: z.string(), question: z.string() })),
    escalations: z.array(z.object({ reason: z.string(), whoToAsk: z.string() })),
  }),
});
export type DeliberationReply = z.infer<typeof deliberationReplySchema>;
