// POST /review/api/markscheme: a photographed mark scheme becomes weighted
// criteria. Text and PDF mark schemes are parsed in the browser instead.
import { criteriaFromImage } from "@/features/review/engine/run";
import { markSchemeImageRequestSchema } from "@/features/review/engine/schemas";
import { errorResponse, readBody } from "@/features/review/engine/http";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await readBody(request, markSchemeImageRequestSchema, 6_500_000);
  if (body instanceof Response) return body;
  try {
    return Response.json({ criteria: await criteriaFromImage(body, request.signal) });
  } catch (err) {
    return errorResponse(err);
  }
}
