import "server-only";
import { defaults, features } from "@/config";
import { assessors, boards, dataSource, getProfile, projects } from "@/lib/data";
import { replySource } from "@/lib/engine/service";
import { hasElevenLabs } from "@/lib/voice/elevenlabs";
import { projectCode, shortName } from "@/features/home/model";
import type { PitchSetupData } from "./types";

/** Everything the set-up screen needs, from the data layer. */
export async function loadPitchSetup(initialProjectId: string | null): Promise<PitchSetupData> {
  const [p, b, a, profile] = await Promise.all([projects.list(), boards.list(), assessors.list(), getProfile()]);
  const voiceIndex = new Map(a.map((x, i) => [x.id, i]));
  const byId = new Map(a.map((x) => [x.id, x]));
  return {
    projects: p.map((x) => ({ id: x.id, title: x.title, code: projectCode(x.title), isPitch: x.template === "pitch", boardId: x.boardId ?? null })),
    boards: b.map((x) => ({
      id: x.id,
      name: x.name,
      seats: x.assessorIds
        .map((id) => byId.get(id))
        .filter((s) => s !== undefined)
        .map((s) => ({
          id: s.id,
          name: s.name,
          short: shortName(s.name),
          field: s.field,
          avatar: s.avatar,
          portrait: s.portrait,
          idleClip: s.idleClip,
          talkingClip: s.talkingClip,
          voiceIndex: voiceIndex.get(s.id) ?? 0,
        })),
    })),
    initialProjectId,
    defaultQuestionCount: defaults.questionCount,
    defaultMode: defaults.questionMode,
    sample: dataSource() !== "database",
    preview: !features.pitch,
    sampleReplies: replySource() !== "claude",
    elevenLabs: hasElevenLabs(),
    initials: (profile?.name ?? "You")
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  };
}
