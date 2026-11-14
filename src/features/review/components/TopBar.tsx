import type { Assessor, ReviewView } from "../types";
import { formatNumber, formatShortDate, shortChapter } from "../lib";
import { Logo } from "../ui/Logo";
import { Label } from "../ui/Label";
import { Pill } from "../ui/Pill";
import { AvatarStack } from "../ui/Avatar";
import { Button } from "../ui/Button";

function livePillText(view: ReviewView): string | undefined {
  const { live, board } = view;
  if (!live) return undefined;
  if (live.status === "reviewing") {
    return `Reviewing · ${live.doneAssessorIds.length} of ${board.assessorIds.length} read`;
  }
  if (live.status === "deliberating") return "Board deliberating";
  return undefined;
}

export function TopBar({
  view,
  boardMembers,
  onUpload,
  onRunAgain,
}: {
  view: ReviewView;
  boardMembers: Assessor[];
  onUpload?: () => void;
  onRunAgain?: () => void;
}) {
  const { project, run, live } = view;
  const doc = run.document;
  const crumbs = [project.name, [doc.chapter && shortChapter(doc.chapter), doc.title].filter(Boolean).join(" "), `Run ${run.number}`];
  const meta = [
    `v${doc.version}`,
    run.uploadedAt && `uploaded ${formatShortDate(run.uploadedAt)}`,
    `${formatNumber(doc.wordCount)} words`,
  ].filter(Boolean);
  const pill = livePillText(view);

  return (
    <header className="relative flex h-topbar shrink-0 items-center gap-6 border-b border-rule bg-surface px-7">
      <Logo name="Panel" />
      <div className="h-7 w-px bg-rule" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <Label tone="ink" className="truncate">
          {crumbs.join("  /  ")}
        </Label>
        <span className="truncate font-mono text-label text-text-muted">{meta.join(" · ")}</span>
      </div>

      {pill && (
        <div className="absolute left-1/2 -translate-x-1/2">
          <Pill variant="accent">
            <span aria-hidden="true">●</span>
            {pill}
          </Pill>
        </div>
      )}

      <div className="ml-auto flex items-center gap-3">
        <AvatarStack
          people={boardMembers}
          size="md"
          ringFor={(id) => (live?.reading?.assessorId === id ? "accent" : "ink")}
        />
        <div className="w-3" />
        <Button variant="outline" onClick={onUpload}>
          Upload v{doc.version + 1}
        </Button>
        <Button onClick={onRunAgain}>Run again</Button>
      </div>
    </header>
  );
}
