// How the board sounds under each condition, so coaching and exam are
// audibly different (not only in what is said).
export type Tone = "coaching" | "exam";

/** ElevenLabs voice_settings per condition (POST /v1/text-to-speech/{voice_id}). */
export const ELEVENLABS_SETTINGS: Record<Tone, { stability: number; similarity_boost: number; style: number; speed: number }> = {
  // Warm, unhurried, expressive.
  coaching: { stability: 0.35, similarity_boost: 0.75, style: 0.45, speed: 0.94 },
  // Even, brisk, neutral.
  exam: { stability: 0.85, similarity_boost: 0.75, style: 0, speed: 1.08 },
};

/** The browser voice: rate and a pitch shift per condition. */
export const BROWSER_SETTINGS: Record<Tone, { rate: number; pitchShift: number }> = {
  coaching: { rate: 0.92, pitchShift: 0.08 },
  exam: { rate: 1.1, pitchShift: -0.1 },
};

/** Said by the first assessor before the first question. */
export const OPENING_LINE: Record<Tone, string> = {
  coaching: "Thanks, that was a good start. We have a few questions for you. Take your time, and think out loud if it helps.",
  exam: "Thank you. The panel will now put its questions to you. Please answer each one directly.",
};
