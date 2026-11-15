import type { Assessor, ReviewView } from "../types";
import { formatNumber, formatShortDate, shortChapter } from "../lib";
import { Logo } from "@/components/ui";
import { Label } from "../ui/Label";
import { Pill } from "../ui/Pill";
import { AvatarStack } from "../ui/Avatar";
import { Button } from "../ui/Button";

function livePillText(view: ReviewView): string | undefined {
  const { live, board } = view;
  if (!live) return undefined;
  if (live.status === "reviewing") {
    return `In session · ${live.doneAssessorIds.length} of ${board.assessorIds.length} read`;
  }
  if (live.status === "deliberating") return "The board is conferring";
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
    <header className="relative flex h-topbar shrink-0 items-center gap-6 bg-white px-8">
      <Logo />
      <div className="h-8 w-px bg-grey-100" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <Label tone="ink" className="truncate">
          {crumbs.join("  /  ")}
        </Label>
        <Label className="truncate">{meta.join(" · ")}</Label>
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
          ringFor={(id) => (live?.reading?.some((r) => r.assessorId === id) ? "accent" : "none")}
        />
        <div className="w-3" />
        <Button variant="outline" onClick={onUpload}>
          Upload v{doc.version + 1}
        </Button>
        {/* Switched off until step 2.5 (second run) gives it something to do. */}
        {onRunAgain && <Button onClick={onRunAgain}>Run again</Button>}
      </div>
    </header>
  );
}
