// The board deliberates over the assessors' results; the review is saved.
import { NextResponse } from "next/server";
import { z } from "zod";
import { deliberateAndSave } from "@/lib/engine/service";
import { errorResponse } from "../http";

export const maxDuration = 120;

const comment = z.object({
  paragraphId: z.string().max(10),
  quote: z.string().max(1000).nullish(),
  category: z.string().max(100),
  severity: z.string().max(20),
  text: z.string().max(2000),
  suggestion: z.string().max(2000),
});

const body = z.object({
  projectId: z.string().min(1).max(100),
  documentId: z.string().min(1).max(100),
  reviewId: z.string().min(1).max(100).nullish(),
  results: z
    .array(
      z.object({
        assessorId: z.string().min(1).max(100),
        status: z.enum(["done", "failed"]),
        replySource: z.enum(["claude", "sample"]),
        comments: z.array(comment).max(30).default([]),
      }),
    )
    .min(1)
    .max(12),
  doneCommentIds: z.array(z.string().min(1).max(100)).max(200).default([]),
});

export async function POST(req: Request) {
  try {
    const input = body.parse(await req.json());
    return NextResponse.json({ review: await deliberateAndSave(input) });
  } catch (e) {
    return errorResponse(e);
  }
}
