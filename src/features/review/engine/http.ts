// Shared bits for the engine routes. Server only.
import "server-only";
import type { z } from "zod";
import { EngineError } from "./claude";

const MAX_BODY_BYTES = 2_000_000;

export async function readBody<S extends z.ZodType>(request: Request, schema: S): Promise<z.infer<S> | Response> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return Response.json({ error: "That document is too large to review in one go." }, { status: 413 });
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "The request wasn't valid JSON." }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return Response.json({ error: "The request didn't match the expected shape." }, { status: 400 });
  return parsed.data;
}

/** Turn any failure into a short message the screen can show. Never leaks internals. */
export function errorResponse(err: unknown): Response {
  if (err instanceof EngineError) {
    const status = err.code === "rate-limited" ? 429 : err.code === "no-key" ? 503 : 502;
    return Response.json({ error: err.message, code: err.code }, { status });
  }
  return Response.json({ error: "Something went wrong on the server." }, { status: 500 });
}
