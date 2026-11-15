// What the pitch screens need, built on the server from the data layer.

export type PitchSeat = {
  id: string;
  name: string;
  short: string;
  field: string;
  avatar: string;
  /** Realistic counterpart for the call (optional, Lane 3 step 3.2c). */
  portrait?: string | null;
  idleClip?: string | null;
  /** Listening loop for the board row while the student presents (sits beside idle.mp4). */
  listenClip?: string | null;
  talkingClip?: string | null;
  /** Synthesia interactive avatar for the live call (only when LIVE_AVATAR=1). */
  interactiveId?: string | null;
  /** Picks a distinct browser voice when ElevenLabs is off. */
  voiceIndex: number;
};
export type PitchBoard = { id: string; name: string; seats: PitchSeat[] };
export type PitchProject = { id: string; title: string; code: string; isPitch: boolean; boardId: string | null };

export type PitchSetupData = {
  projects: PitchProject[];
  boards: PitchBoard[];
  initialProjectId: string | null;
  defaultQuestionCount: number;
  defaultMode: "spoken" | "text";
  /** True when running on the temporary store / sample data, not the database. */
  sample: boolean;
  /** True while presentation practice is still being built. */
  preview: boolean;
  /** True when replies will be generated samples, not Claude (no API key). */
  sampleReplies: boolean;
  /** True when the ElevenLabs route is switched on and has a key. */
  elevenLabs: boolean;
  /** True when LIVE_AVATAR=1 and LiveKit is set up: the board can speak as live avatars. */
  liveAvatar: boolean;
  /** The student's initials, for their tile when the camera is off. */
  initials: string;
};

export type Phase = "setup" | "listening" | "typing" | "conferring" | "questions" | "feedback" | "report";
