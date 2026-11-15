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
  /** Weighted marking criteria (step 2.5). Comments may be tagged with one. */
  criteria: z
    .array(z.object({ id: z.string().max(60), name: z.string().max(120), weight: z.number().min(0).max(100) }))
    .max(12)
    .optional(),
  /** "written": no live Q&A is coming, so give written questions plus what to add or cut. */
  qaMode: z.enum(["live", "written"]).optional(),
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

/** What this assessor said on the previous version (step 2.5). Paragraph text, not ids: ids change between versions. */
const previousCommentSchema = z.object({
  kind: z.enum(["critique", "question", "praise"]),
  text: z.string().max(MAX_SHORT),
  paragraph: z.string().max(600),
});

export const previousRunSchema = z.object({
  number: z.number().int().min(1),
  comments: z.array(previousCommentSchema.extend({ assessorId: z.string().max(100) })).max(80),
  fixList: z.array(z.string().max(MAX_SHORT)).max(10),
});
export type PreviousRun = z.infer<typeof previousRunSchema>;

export const assessorRequestSchema = z.object({
  context: reviewContextSchema,
  document: documentSchema,
  assessor: assessorSchema,
  previous: z.object({ number: z.number().int().min(1), comments: z.array(previousCommentSchema).max(20) }).optional(),
});
export type AssessorRequest = z.infer<typeof assessorRequestSchema>;

export const deliberationRequestSchema = z.object({
  context: reviewContextSchema,
  document: documentSchema,
  assessors: z.array(assessorSchema).min(1).max(12),
  comments: z.array(commentSchema).max(200),
  previous: previousRunSchema.optional(),
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
      criterionId: z
        .string()
        .nullable()
        .describe("Id of the marking criterion this comment is about, exactly as given, or null if none fits."),
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
  sinceLastTime: z
    .object({
      improved: z.array(z.string()).describe("Earlier points the new version now handles."),
      stillWeak: z.array(z.string()).describe("Earlier points partly handled or still open."),
      ignored: z.array(z.string()).describe("Earlier fixes the student did not act on."),
    })
    .describe("Only when a previous version is given; otherwise all three lists are empty."),
  addOrCut: z
    .object({
      add: z.array(z.string()).describe("What to add before it is marked."),
      cut: z.array(z.string()).describe("What to cut or shorten."),
    })
    .describe("Only in written-questions mode; otherwise both lists are empty."),
});
export type DeliberationOutput = z.infer<typeof deliberationOutputSchema>;

// ---- Mark scheme from an image (step 2.5) ----

export const markSchemeImageRequestSchema = z.object({
  mediaType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]),
  /** Base64, no data: prefix. About 4.5 MB of image at most. */
  data: z.string().min(1).max(6_000_000),
});
export type MarkSchemeImageRequest = z.infer<typeof markSchemeImageRequestSchema>;

export const markSchemeOutputSchema = z.object({
  criteria: z.array(
    z.object({
      name: z.string().describe("The criterion's name as written, e.g. \"Originality\"."),
      weight: z.number().nullable().describe("Its weight as a percentage or marks, as written; null if none is given."),
    }),
  ),
});
export type MarkSchemeOutput = z.infer<typeof markSchemeOutputSchema>;
