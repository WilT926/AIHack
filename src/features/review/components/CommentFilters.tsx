import type { Assessor, CommentSeverity } from "../types";
import { Chip } from "@/components/ui";
import { Label } from "../ui/Label";
import { Avatar } from "../ui/Avatar";

const KINDS: { id: CommentSeverity | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "major", label: "Major" },
  { id: "minor", label: "Minor" },
  { id: "praise", label: "Praise" },
];

/** Filter chips (§9): by severity and by assessor. They narrow the rail and the anchors. */
export function CommentFilters({
  kind,
  onKind,
  assessors,
  selected,
  onToggleAssessor,
  onAllAssessors,
}: {
  kind: CommentSeverity | "all";
  onKind: (kind: CommentSeverity | "all") => void;
  assessors: Assessor[];
  selected: Set<string>;
  onToggleAssessor: (id: string) => void;
  /** Show every assessor's comments again. */
  onAllAssessors?: () => void;
}) {
  return (
    <div className="rv-filters flex flex-col gap-2.5 pb-1" aria-label="Filter comments">
      <div className="flex flex-wrap items-center gap-1.5">
        <Label className="w-12">Show</Label>
        {KINDS.map((k) => (
          <Chip key={k.id} active={kind === k.id} onClick={() => onKind(k.id)}>
            {k.label}
          </Chip>
        ))}
      </div>
      {assessors.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Label className="w-12">From</Label>
          <Chip active={selected.size === 0} onClick={onAllAssessors}>
            All
          </Chip>
          {assessors.map((a) => {
            const on = selected.has(a.id);
            return (
              <Chip key={a.id} active={on} onClick={() => onToggleAssessor(a.id)} title={a.name}>
                <span className="inline-flex items-center gap-1.5">
                  <Avatar avatar={a.avatar} name={a.name} size="sm" invert={on} className="-my-1.5" />
                  {a.name.split(" ").at(-1)}
                </span>
              </Chip>
            );
          })}
        </div>
      )}
    </div>
  );
}
