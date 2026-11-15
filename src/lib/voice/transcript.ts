// Pure helpers for the spoken pitch: word counts, timing and the
// "thank you" ending. Length and pace are worked out here, in code, never
// guessed by a model (lane-1.md, steps 1.3 and 1.4).

/** Number of words in a transcript. */
export function wordCount(text: string): number {
  const words = text.trim().match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu);
  return words ? words.length : 0;
}

/** Seconds between two ISO timestamps, or 0 if either is missing or out of order. */
export function durationSeconds(startedAt?: string | null, endedAt?: string | null): number {
  if (!startedAt || !endedAt) return 0;
  const ms = Date.parse(endedAt) - Date.parse(startedAt);
  return Number.isFinite(ms) && ms > 0 ? Math.round(ms / 1000) : 0;
}

/** Words per minute, rounded. 0 when the length is unknown. */
export function wordsPerMinute(words: number, seconds: number): number {
  return seconds > 0 ? Math.round((words * 60) / seconds) : 0;
}

/** "3:07" */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Parse "3:07", "3m 7s", "187" (seconds) or "3" (minutes) into seconds. */
export function parseClock(input: string): number | null {
  const t = input.trim().toLowerCase();
  if (!t) return null;
  let m = t.match(/^(\d{1,3}):([0-5]?\d)$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  m = t.match(/^(?:(\d{1,3})\s*m(?:in)?)?\s*(?:(\d{1,3})\s*s(?:ec)?)?$/);
  if (m && (m[1] || m[2])) return Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
  m = t.match(/^\d{1,4}$/);
  if (m) {
    const n = Number(t);
    return n <= 30 ? n * 60 : n; // small numbers read as minutes
  }
  return null;
}

const THANKS =
  /\b(thank you|thanks)( (so|very) much)?( (all|everyone|everybody))?( for (listening|your time|having me))?[\s.!,]*$/i;

/** True when the transcript ends with a closing "thank you". */
export function endsWithThanks(text: string): boolean {
  return THANKS.test(text.trim());
}

/** Join the final transcript and the words still being recognised. */
export function joinTranscript(finalText: string, interim: string): string {
  return [finalText.trim(), interim.trim()].filter(Boolean).join(" ");
}
