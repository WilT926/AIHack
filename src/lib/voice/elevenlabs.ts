import "server-only";
// ElevenLabs text-to-speech (read from the current docs, 2026-11-15):
//   POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128
//   header xi-api-key, JSON { text, model_id }. Returns the audio file.
// Server only: the key never reaches the browser.
import { features, voice } from "@/config";

const API = "https://api.elevenlabs.io";

export function hasElevenLabs(): boolean {
  return features.elevenLabs && !!process.env.ELEVENLABS_API_KEY;
}

export class VoiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Turn text into MP3 audio in the given voice. Throws VoiceError; callers fall back to the browser voice. */
export async function speak(text: string, voiceId: string): Promise<ArrayBuffer> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!features.elevenLabs || !key) throw new VoiceError("ElevenLabs is switched off.", 503);
  const res = await fetch(`${API}/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify({ text: text.slice(0, voice.maxSpokenChars), model_id: voice.elevenLabsModel }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const reason =
      res.status === 401 ? "The ElevenLabs key was rejected." :
      res.status === 402 ? "ElevenLabs credits have run out." :
      res.status === 404 ? "That voice does not exist." :
      res.status === 429 ? "ElevenLabs is busy." : `ElevenLabs returned ${res.status}.`;
    throw new VoiceError(reason, res.status);
  }
  return res.arrayBuffer();
}
