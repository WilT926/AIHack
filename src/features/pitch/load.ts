import "server-only";
import { defaults, features } from "@/config";
import { assessors, boards, dataSource, projects } from "@/lib/data";
import { projectCode, shortName } from "@/features/home/model";
import type { PitchSetupData } from "./types";

/** Everything the set-up screen needs, from the data layer. */
export async function loadPitchSetup(initialProjectId: string | null): Promise<PitchSetupData> {
  const [p, b, a] = await Promise.all([projects.list(), boards.list(), assessors.list()]);
  const byId = new Map(a.map((x) => [x.id, x]));
  return {
    projects: p.map((x) => ({ id: x.id, title: x.title, code: projectCode(x.title), isPitch: x.template === "pitch", boardId: x.boardId ?? null })),
    boards: b.map((x) => ({
      id: x.id,
      name: x.name,
      seats: x.assessorIds
        .map((id) => byId.get(id))
        .filter((s) => s !== undefined)
        .map((s) => ({ id: s.id, name: s.name, short: shortName(s.name), field: s.field, avatar: s.avatar })),
    })),
    initialProjectId,
    defaultQuestionCount: defaults.questionCount,
    defaultMode: defaults.questionMode,
    sample: dataSource() !== "database",
    preview: !features.pitch,
  };
}
