// POST /review/api/assessor: one assessor reads the document and comments.
// The screen calls this once per assessor, in parallel.
import { reviewAsAssessor } from "@/features/review/engine/run";
import { assessorRequestSchema } from "@/features/review/engine/schemas";
import { errorResponse, readBody } from "@/features/review/engine/http";

export const maxDuration = 120; // seconds (Vercel). One assessor on a long document can take a while.

export async function POST(request: Request) {
  const body = await readBody(request, assessorRequestSchema);
  if (body instanceof Response) return body;
  try {
    const comments = await reviewAsAssessor(body, request.signal);
    return Response.json({ comments });
  } catch (err) {
    return errorResponse(err);
  }
}
