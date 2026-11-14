// POST /review/api/deliberate: the board compares notes once everyone is done.
import { deliberate } from "@/features/review/engine/run";
import { deliberationRequestSchema } from "@/features/review/engine/schemas";
import { errorResponse, readBody } from "@/features/review/engine/http";

export const maxDuration = 120;

export async function POST(request: Request) {
  const body = await readBody(request, deliberationRequestSchema);
  if (body instanceof Response) return body;
  try {
    return Response.json(await deliberate(body));
  } catch (err) {
    return errorResponse(err);
  }
}
