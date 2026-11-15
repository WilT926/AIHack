"use server";

// Saves a project draft from the setup flow as a real Project and Board, so
// the review engine and the floor can use it.
import { z } from "zod";
import { boards, projects } from "@/lib/data";
import type { ProjectTemplate } from "@/lib/schemas";
import { allWeakSpots, markSchemeText } from "./context";
import type { ProjectDraft } from "./types";

const TEMPLATE: Record<ProjectDraft["template"], ProjectTemplate> = {
  "masters-thesis": "masters-report",
  "lab-report": "lab-report",
  "hackathon-pitch": "pitch",
  "viva-rehearsal": "masters-report",
  "grant-proposal": "masters-report",
  blank: "masters-report",
};

const draftSchema = z.object({
  template: z.enum(["masters-thesis", "lab-report", "hackathon-pitch", "viva-rehearsal", "grant-proposal", "blank"]),
  name: z.string().min(1).max(200),
  brief: z.string().max(2000),
  graded: z.array(z.string().max(300)).max(20),
  weakSpots: z.array(z.string().max(500)).max(20),
  ownWeakSpots: z.string().max(5000),
  markScheme: z
    .object({ source: z.string().max(500), criteria: z.array(z.object({ id: z.string().max(100), name: z.string().max(300), weight: z.number() })).max(30) })
    .optional(),
  boardIds: z.array(z.string().min(1).max(100)).min(1).max(12),
});

export async function createProjectFromDraft(raw: ProjectDraft): Promise<{ ok: true; projectId: string; boardId: string; template: ProjectTemplate } | { ok: false; error: string }> {
  try {
    const draft = draftSchema.parse(raw) as ProjectDraft;
    const now = new Date().toISOString();
    const name = draft.name.trim();
    const board = await boards.save({ id: crypto.randomUUID(), name: `${name} board`, assessorIds: draft.boardIds });
    const template = TEMPLATE[draft.template];
    const project = await projects.save({
      id: crypto.randomUUID(),
      title: name,
      template,
      brief: { what: draft.brief.trim(), topic: "", graded: draft.graded, goal: "" },
      deadline: null,
      markSchemeText: markSchemeText(draft) ?? "",
      weakSpots: allWeakSpots(draft),
      boardId: board.id,
      createdAt: now,
      updatedAt: now,
    });
    return { ok: true, projectId: project.id, boardId: board.id, template };
  } catch (e) {
    return { ok: false, error: e instanceof z.ZodError ? "Some of the project details are missing." : e instanceof Error ? e.message : "Something went wrong." };
  }
}
