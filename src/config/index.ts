// App settings. Model names live here and nowhere else.
// While developing, every model stays on claude-haiku-5-5 (CLAUDE.md).

export const models = {
  /** Report review: one call per assessor, then the deliberation. */
  review: "claude-haiku-5-5",
  /** Presentation practice: the questions, follow-ups and feedback report. */
  pitch: "claude-haiku-5-5",
  /** The Q&A router and each next utterance: small and fast (aim: both under ~6 s). */
  router: "claude-haiku-5-5",
} as const;

/** The assessor engine (lane-1.md step 1.2). */
export const engine = {
  /** Effort per call kind; set explicitly (Opus 5.5 and Haiku 5.5 default to medium). */
  effort: { review: "medium", deliberation: "low", questions: "low", followUp: "low", pitchReport: "medium", router: "low", utterance: "low" },
  /** Reply length cap per call. Non-streaming, so kept within SDK timeouts. */
  maxTokens: { review: 16000, deliberation: 16000, questions: 8000, followUp: 2000, pitchReport: 16000, router: 1000, utterance: 1500 },
  /** Random focus angles added to each assessor's prompt per run. */
  anglesPerRun: 3,
  /**
   * Without ANTHROPIC_API_KEY, return generated sample replies (marked
   * replySource "sample" and labelled on screen) so the screens still work.
   */
  sampleRepliesWithoutKey: true,
  /** Sample replies wait this long (plus up to the same again), so the Reading state can be seen. */
  sampleDelayMs: 900,
} as const;

export const voice = {
  /** Speech recognition language. */
  lang: "en-GB",
  /** ElevenLabs model: the documented low-latency option. */
  elevenLabsModel: "eleven_flash_v2_5",
  /** Longest question sent to ElevenLabs, in characters. */
  maxSpokenChars: 600,
  /** The "board steps out" moment lasts at least this long, even when replies are quick. */
  minConferMs: 2500,
  /** After "thank you", this much silence ends the pitch automatically. */
  thanksPauseMs: 2500,
  /** How often the live transcript is saved while listening. */
  autosaveMs: 15000,
} as const;

export const defaults = {
  /** Questions the board asks after a presentation (1–5). */
  questionCount: 3,
  questionMode: "spoken" as "spoken" | "text",
} as const;

/**
 * Feature switches. An unfinished feature is switched off here rather than
 * left half-visible on screen.
 */
export const features = {
  /** Report review (Lane 2): upload, comments, deliberation. */
  review: true,
  /** Presentation practice (Lane 1, steps 1.3 and 1.4): the floor's entry points. */
  pitch: true,
  /**
   * Opens /pitch directly while presentation practice is being built, with a
   * PREVIEW label on screen. Switch off once `pitch` is on.
   */
  pitchPreview: false,
  /** Feedback report screen (Lane 2, step 2.3b). */
  feedbackReport: true,
  /** Seat and unseat assessors from the floor (Lane 3, step 3.4). */
  editBoards: false,
  /** New assessor: copy one, rename, adjust (Lane 3, step 3.3). */
  newAssessor: true,
  /** ElevenLabs voices; off means the browser's built-in voice. */
  elevenLabs: false,
} as const;

export type FeatureName = keyof typeof features;
