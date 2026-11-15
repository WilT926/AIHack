// Turns a finished run into what the engine needs for the next one (step 2.5).
// Paragraph ids change between versions, so each comment carries the start of
// the paragraph it was about instead. Pure, so it is unit tested.
import type { Run } from "../types";
import type { PreviousRun } from "./schemas";

const PARAGRAPH_CHARS = 300;
const PER_ASSESSOR = 20;
const TOTAL = 80;

export function toPreviousRun(run: Run): PreviousRun | undefined {
  const text = new Map(run.document.paragraphs.map((p) => [p.id, p.text]));
  const perAssessor = new Map<string, number>();
  const comments: PreviousRun["comments"] = [];
  for (const c of run.comments) {
    const paragraph = (text.get(c.paragraphIds[0] ?? "") ?? "").replace(/\s+/g, " ").trim().slice(0, PARAGRAPH_CHARS);
    const n = perAssessor.get(c.assessorId) ?? 0;
    if (!paragraph || n >= PER_ASSESSOR || comments.length >= TOTAL) continue;
    perAssessor.set(c.assessorId, n + 1);
    comments.push({ assessorId: c.assessorId, kind: c.kind, text: c.text.slice(0, 2000), paragraph });
  }
  if (comments.length === 0 && run.fixList.length === 0) return undefined;
  return {
    number: run.number,
    comments,
    fixList: [...run.fixList].sort((a, b) => a.rank - b.rank).map((f) => f.text.slice(0, 2000)).slice(0, 10),
  };
}

/** One assessor's share of the previous run. */
export function previousFor(previous: PreviousRun | undefined, assessorId: string) {
  if (!previous) return undefined;
  const comments = previous.comments.filter((c) => c.assessorId === assessorId).map(({ kind, text, paragraph }) => ({ kind, text, paragraph }));
  return comments.length ? { number: previous.number, comments } : undefined;
}

/** The fix list as clean text, for pasting into notes or an email. */
export function fixListText(run: Run, names: Map<string, string>, projectName: string): string {
  const header = `Fix list · ${projectName} · ${run.document.title} v${run.document.version} (run ${run.number})`;
  const label = new Map(run.document.paragraphs.map((p) => [p.id, `¶${p.index}`]));
  const lines = [...run.fixList]
    .sort((a, b) => a.rank - b.rank)
    .map((f) => {
      const where = f.paragraphIds.map((id) => label.get(id)).filter(Boolean).join(", ");
      const who = f.raisedBy.map((id) => names.get(id)).filter(Boolean).join(", ");
      return [`${f.rank}. ${f.text}`, where && `(${where})`, who && `· raised by ${who}`].filter(Boolean).join(" ");
    });
  const extra: string[] = [];
  if (run.addOrCut?.add.length) extra.push("", "Add:", ...run.addOrCut.add.map((t) => `- ${t}`));
  if (run.addOrCut?.cut.length) extra.push("", "Cut:", ...run.addOrCut.cut.map((t) => `- ${t}`));
  return [header, "", ...lines, ...extra].join("\n");
}
