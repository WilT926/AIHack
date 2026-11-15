// Helpers for the project draft: weak spots, the mark scheme text, validation.
import type { ProjectDraft } from "./types";

export function allWeakSpots(draft: ProjectDraft): string[] {
  const own = draft.ownWeakSpots
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([...draft.weakSpots, ...own])];
}

export function markSchemeText(draft: ProjectDraft): string | undefined {
  if (!draft.markScheme?.criteria.length) return undefined;
  const lines = draft.markScheme.criteria.map((c) => `- ${c.name} (${c.weight}%)`);
  return `${draft.markScheme.source}. Weight your attention by these:\n${lines.join("\n")}`;
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
