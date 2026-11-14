// Shapes for the review engine: what the screen sends, what Claude must
// return, and what the routes send back. TEMPORARY (Lane 2) until Lane 1's
// engine and src/lib/schemas land; keep the route contracts stable.
import { z } from "zod";

const MAX_PARAGRAPHS = 2000;
const MAX_TEXT = 6000; // per paragraph
const MAX_SHORT = 2000;

const paragraph = z.object({
  id: z.string().regex(/^p\d{1,4}$/),
  index: z.number().int().min(1),
  type: z.enum(["paragraph", "heading"]),
  text: z.string().max(MAX_TEXT),
});

export const documentSchema = z.object({
  id: z.string().max(100),
  title: z.string().max(300),
  chapter: z.string().max(100).optional(),
  version: z.number().int().min(1),
  paragraphs: z.array(paragraph).min(1).max(MAX_PARAGRAPHS),
  wordCount: z.number().int().min(0),
});

export const assessorSchema = z.object({
  id: z.string().max(100),
  name: z.string().max(100),
  role: z.string().max(100),
  field: z.string().max(200),
  harshness: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  focus: z.array(z.string().max(200)).max(12),
  personality: z.string().max(MAX_SHORT).optional(),
  notes: z.array(z.string().max(MAX_SHORT)).max(30).optional(),
  avatar: z.string().max(100),
});

/** Shared context every assessor sees. Step 2.4 fills in the brief and weak spots. */
export const reviewContextSchema = z.object({
  projectName: z.string().max(200),
  brief: z.string().max(MAX_SHORT).optional(),
  goal: z.string().max(MAX_SHORT).optional(),
  graded: z.array(z.string().max(100)).max(12).optional(),
  weakSpots: z.array(z.string().max(500)).max(20).optional(),
  markScheme: z.string().max(20000).optional(),
});
export type ReviewContext = z.infer<typeof reviewContextSchema>;

const commentSchema = z.object({
  id: z.string().max(100),
  assessorId: z.string().max(100),
  paragraphIds: z.array(z.string().max(10)).min(1).max(5),
  kind: z.enum(["critique", "question", "praise"]),
  text: z.string().max(MAX_SHORT),
  criterionId: z.string().max(100).optional(),
  resolved: z.boolean().optional(),
});

export const assessorRequestSchema = z.object({
  context: reviewContextSchema,
  document: documentSchema,
  assessor: assessorSchema,
});
export type AssessorRequest = z.infer<typeof assessorRequestSchema>;

export const deliberationRequestSchema = z.object({
  context: reviewContextSchema,
  document: documentSchema,
  assessors: z.array(assessorSchema).min(1).max(12),
  comments: z.array(commentSchema).max(200),
});
export type DeliberationRequest = z.infer<typeof deliberationRequestSchema>;

// ---- What Claude must return (structured output) ----
// Kept free of min/max so it maps cleanly onto a JSON schema; limits are
// enforced afterwards in sanitize.ts.

export const assessorOutputSchema = z.object({
  comments: z.array(
    z.object({
      paragraphIds: z.array(z.string()).describe('Ids of the paragraphs this comment is about, e.g. ["p4"].'),
      kind: z.enum(["critique", "question", "praise"]),
      text: z.string().describe("The comment, in your own voice, 1-3 sentences."),
    }),
  ),
});
export type AssessorOutput = z.infer<typeof assessorOutputSchema>;

export const deliberationOutputSchema = z.object({
  agreements: z.array(z.string()).describe("Points most of the board agrees on, one sentence each."),
  splits: z.array(
    z.object({
      paragraphIds: z.array(z.string()),
      topic: z.string().describe('The disagreement as a short question, e.g. "is twelve participants enough?"'),
      approve: z.array(z.string()).describe("Assessor ids who would keep it as it is."),
      object: z.array(z.string()).describe("Assessor ids who object."),
      advice: z.string().describe("How to satisfy both sides, 1-2 sentences."),
    }),
  ),
  fixList: z.array(
    z.object({
      text: z.string().describe("One concrete fix, most important first."),
      paragraphIds: z.array(z.string()),
      raisedBy: z.array(z.string()).describe("Assessor ids who raised it."),
    }),
  ),
  questions: z.array(
    z.object({
      assessorId: z.string(),
      text: z.string().describe("A question this assessor is likely to ask in person."),
    }),
  ),
});
export type DeliberationOutput = z.infer<typeof deliberationOutputSchema>;
