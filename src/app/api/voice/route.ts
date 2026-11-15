// Speaks a question in the assessor's ElevenLabs voice. The key stays here
// on the server. Any failure answers 204/503 so the browser uses its own voice.
import { NextResponse } from "next/server";
import { z } from "zod";
import { assessors } from "@/lib/data";
import { hasElevenLabs, speak, VoiceError } from "@/lib/voice/elevenlabs";

export const maxDuration = 30;

const body = z.object({ assessorId: z.string().min(1).max(100), text: z.string().min(1).max(2000) });

export async function POST(req: Request) {
  if (!hasElevenLabs()) return NextResponse.json({ fallback: true, reason: "ElevenLabs is switched off." }, { status: 503 });
  try {
    const { assessorId, text } = body.parse(await req.json());
    const a = await assessors.get(assessorId);
    if (!a?.voiceId) return NextResponse.json({ fallback: true, reason: "This assessor has no voice yet." }, { status: 503 });
    const audio = await speak(text, a.voiceId);
    return new NextResponse(audio, { headers: { "content-type": "audio/mpeg", "cache-control": "no-store" } });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "The request was not valid." }, { status: 400 });
    const reason = e instanceof VoiceError ? e.message : "The voice could not be made.";
    return NextResponse.json({ fallback: true, reason }, { status: 503 });
  }
}
