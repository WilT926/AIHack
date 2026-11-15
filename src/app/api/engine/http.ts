import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { EngineError } from "@/lib/engine/claude";

/** A JSON error the screens can show. Never includes stack traces or keys. */
export function errorResponse(e: unknown): NextResponse {
  if (e instanceof z.ZodError) return NextResponse.json({ error: "The request was not valid." }, { status: 400 });
  if (e instanceof EngineError) {
    const status = e.reason === "not_configured" ? 503 : e.reason === "invalid_reply" ? 422 : 502;
    return NextResponse.json({ error: e.message, reason: e.reason }, { status });
  }
  return NextResponse.json({ error: "Something went wrong on the server." }, { status: 500 });
}
