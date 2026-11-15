// Turns a project draft into what the review engine and screens need.
import type { ReviewContext } from "../review/engine/schemas";
import { normaliseWeights } from "@/lib/documents/markScheme";
import type { Criterion, ProjectDraft } from "./types";

export function allWeakSpots(draft: ProjectDraft): string[] {
  const own = draft.ownWeakSpots
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([...draft.weakSpots, ...own])];
}

/** Criteria the engine can use: named, de-duplicated, weights summing to 100. */
export function cleanCriteria(draft: ProjectDraft): Criterion[] {
  const seen = new Set<string>();
  const named = (draft.markScheme?.criteria ?? [])
    .map((c) => ({ ...c, name: c.name.trim() }))
    .filter((c) => c.name && !seen.has(c.id) && seen.add(c.id))
    .slice(0, 12);
  return normaliseWeights(named);
}

/** Where the criteria came from; the criteria themselves travel as structured data. */
export function markSchemeText(draft: ProjectDraft): string | undefined {
  if (cleanCriteria(draft).length === 0) return undefined;
  return `Source: ${draft.markScheme?.source || "the student's mark scheme"}. Comments are tagged with these criteria and weighted by them.`;
}

export function toReviewContext(draft: ProjectDraft): ReviewContext {
  const weakSpots = allWeakSpots(draft);
  return {
    projectName: draft.name.trim() || "Untitled project",
    ...(draft.brief.trim() ? { brief: draft.brief.trim() } : {}),
    ...(draft.graded.length ? { graded: draft.graded } : {}),
    ...(weakSpots.length ? { weakSpots } : {}),
    ...(markSchemeText(draft) ? { markScheme: markSchemeText(draft), criteria: cleanCriteria(draft) } : {}),
    ...(draft.qaMode === "written" ? { qaMode: "written" as const } : {}),
  };
}

/** Which step's input is missing, if any. */
export function missingFor(step: "brief" | "board", draft: ProjectDraft): string | undefined {
  if (step === "brief") {
    if (!draft.name.trim()) return "Give the project a name.";
    if (!draft.brief.trim()) return "Say what it is and what you want from this run.";
  }
  if (step === "board" && draft.boardIds.length === 0) return "Seat at least one assessor.";
  return undefined;
}
