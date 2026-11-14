import type { Assessor, CommentKind } from "../types";
import { Pill } from "../ui/Pill";
import { Label } from "../ui/Label";
import { Avatar } from "../ui/Avatar";

const KINDS: (CommentKind | "all")[] = ["all", "critique", "question", "praise"];

/** Filter the comment rail (and the document highlights) by kind and by assessor. */
export function CommentFilters({
  kind,
  onKind,
  assessors,
  selected,
  onToggleAssessor,
}: {
  kind: CommentKind | "all";
  onKind: (kind: CommentKind | "all") => void;
  assessors: Assessor[];
  selected: Set<string>;
  onToggleAssessor: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 pb-1" aria-label="Filter comments">
      <div className="flex flex-wrap items-center gap-2">
        <Label className="w-12">Show</Label>
        {KINDS.map((k) => (
          <Pill key={k} variant={kind === k ? "ink" : "outline"} onClick={() => onKind(k)} pressed={kind === k}>
            {k}
          </Pill>
        ))}
      </div>
      {assessors.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <Label className="w-12">From</Label>
          {assessors.map((a) => {
            const on = selected.has(a.id);
            return (
              <Pill key={a.id} variant={on ? "ink" : "outline"} onClick={() => onToggleAssessor(a.id)} pressed={on} title={a.name}>
                <Avatar avatar={a.avatar} name={a.name} size="sm" className="-my-1 -ml-1.5" />
                {a.name.split(" ").at(-1)}
              </Pill>
            );
          })}
        </div>
      )}
    </div>
  );
}
