// Runs one assessor over one document. The screen calls this once per
// assessor, in parallel, so no single request runs long.
import { NextResponse } from "next/server";
import { z } from "zod";
import { reviewWithAssessor } from "@/lib/engine/service";
import { errorResponse } from "../http";

export const maxDuration = 120;

const body = z.object({
  projectId: z.string().min(1).max(100),
  documentId: z.string().min(1).max(100),
  assessorId: z.string().min(1).max(100),
});

export async function POST(req: Request) {
  try {
    const input = body.parse(await req.json());
    return NextResponse.json(await reviewWithAssessor(input));
  } catch (e) {
    return errorResponse(e);
  }
}
