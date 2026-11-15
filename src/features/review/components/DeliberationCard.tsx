import type { Assessor, Split } from "../types";
import { Card } from "../ui/Card";
import { Label } from "../ui/Label";
import { AvatarStack } from "../ui/Avatar";
import { Pill } from "../ui/Pill";

function people(ids: string[], assessors: Map<string, Assessor>): Assessor[] {
  return ids.map((id) => assessors.get(id)).filter((a): a is Assessor => Boolean(a));
}

/** One split: headline, consensus bar, faces on each side and the advice. */
export function DeliberationCard({
  split,
  seconds,
  paragraphLabel,
  assessors,
  onShowParagraph,
}: {
  split: Split;
  seconds?: number;
  paragraphLabel: string;
  assessors: Map<string, Assessor>;
  onShowParagraph?: () => void;
}) {
  const approve = people(split.approve, assessors);
  const object = people(split.object, assessors);

  return (
    <Card variant="dark" className="p-6">
      <div className="flex items-start justify-between gap-3">
        <Label tone="accent">
          {seconds !== undefined ? `The board deliberated · ${seconds} sec` : "Where the board split"}
        </Label>
        {onShowParagraph && (
          <Pill variant="outline-inverse" onClick={onShowParagraph} title="Show in text">
            {paragraphLabel}
          </Pill>
        )}
      </div>
      <h2 className="mt-2 font-display text-h3-lg font-semibold tracking-h3">
        Split on {paragraphLabel}: {split.topic}
      </h2>

      <div className="mt-4 flex h-2.5 gap-1" aria-label={`${approve.length} keep it, ${object.length} object`}>
        {approve.length > 0 && <div className="rounded-full bg-surface" style={{ flexGrow: approve.length }} />}
        {object.length > 0 && <div className="rounded-full bg-orange" style={{ flexGrow: object.length }} />}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AvatarStack people={approve} size="md" invert />
          <Label tone="inverse">{approve.length} keep it</Label>
        </div>
        <div className="flex items-center gap-2.5">
          <Label tone="accent">
            {object.length} {object.length === 1 ? "objects" : "object"}
          </Label>
          <AvatarStack people={object} size="md" invert ringFor={() => "accent"} />
        </div>
      </div>

      <p className="mt-4 text-body text-grey-200">{split.advice}</p>
    </Card>
  );
}

/** When the board deliberated and nobody split: say so, rather than showing nothing. */
export function ConsensusCard({
  seconds,
  agreements,
  fixCount,
  onShowFixes,
}: {
  seconds: number;
  agreements: string[];
  fixCount: number;
  onShowFixes: () => void;
}) {
  return (
    <Card variant="dark" className="p-6">
      <Label tone="accent">The board deliberated · {seconds} sec</Label>
      <h2 className="mt-2 font-display text-h3-lg font-semibold tracking-h3">No splits: the board agrees.</h2>
      {agreements[0] && <p className="mt-3 text-body text-grey-200">{agreements[0]}</p>}
      {fixCount > 0 && (
        <div className="mt-4">
          <Pill variant="outline-inverse" onClick={onShowFixes}>
            See the fix list · {fixCount}
          </Pill>
        </div>
      )}
    </Card>
  );
}
