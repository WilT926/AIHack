// What the pitch screens need, built on the server from the data layer.

export type PitchSeat = { id: string; name: string; short: string; field: string; avatar: string };
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
};

export type Phase = "setup" | "listening" | "typing" | "saved";
