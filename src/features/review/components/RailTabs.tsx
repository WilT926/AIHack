import type { Assessor, Deliberation, Document, FixItem, Question } from "../types";
import { paragraphLabel } from "../lib";
import { Card } from "../ui/Card";
import { Label } from "../ui/Label";
import { Avatar, AvatarStack } from "../ui/Avatar";
import { Pill } from "../ui/Pill";
import { DeliberationCard } from "./DeliberationCard";
import { EmptyState } from "./StatusCards";

/** Deliberation tab: the full agreement and disagreement view. */
export function DeliberationTab({
  deliberation,
  doc,
  assessors,
  onShowParagraph,
}: {
  deliberation?: Deliberation;
  doc: Document;
  assessors: Map<string, Assessor>;
  onShowParagraph: (paragraphId: string) => void;
}) {
  if (!deliberation) {
    return <EmptyState title="The board hasn't deliberated yet" body="This starts once every assessor has finished reading." />;
  }
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Label tone="accent">Where the board agrees · {deliberation.seconds} sec</Label>
        {deliberation.agreements.length === 0 ? (
          <p className="mt-3 text-body text-text-muted">No points of full agreement.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {deliberation.agreements.map((a, i) => (
              <li key={i} className="flex gap-3 text-body text-ink">
                <span className="font-mono text-label text-text-muted pt-1">{String(i + 1).padStart(2, "0")}</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {deliberation.splits.map((split, i) => {
        const first = split.paragraphIds[0];
        return (
          <DeliberationCard
            key={i}
            split={split}
            paragraphLabel={first ? paragraphLabel(doc, first) : ""}
            assessors={assessors}
            onShowParagraph={first ? () => onShowParagraph(first) : undefined}
          />
        );
      })}
    </div>
  );
}

/** Fix list tab: numbered, most important first. */
export function FixListTab({
  fixList,
  doc,
  assessors,
  onShowParagraph,
}: {
  fixList: FixItem[];
  doc: Document;
  assessors: Map<string, Assessor>;
  onShowParagraph: (paragraphId: string) => void;
}) {
  if (fixList.length === 0) {
    return <EmptyState title="No fixes yet" body="The fix list arrives with the deliberation." />;
  }
  const ordered = [...fixList].sort((a, b) => a.rank - b.rank);
  return (
    <ol className="flex flex-col gap-3">
      {ordered.map((item) => {
        const raisedBy = item.raisedBy.map((id) => assessors.get(id)).filter((a): a is Assessor => Boolean(a));
        return (
          <li key={item.rank}>
            <Card className="flex items-start gap-4">
              <span className="w-6 shrink-0 text-3xl font-extrabold leading-none text-accent">{item.rank}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <p className="text-body font-medium text-ink">{item.text}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {item.paragraphIds.map((pid) => (
                    <Pill key={pid} variant="outline" onClick={() => onShowParagraph(pid)} title="Show in text">
                      {paragraphLabel(doc, pid)}
                    </Pill>
                  ))}
                  {raisedBy.length > 0 && (
                    <span className="ml-auto flex items-center gap-2">
                      <Label>Raised by</Label>
                      <AvatarStack people={raisedBy} size="sm" />
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </li>
        );
      })}
    </ol>
  );
}

/** Likely questions tab: grouped by assessor, in board order. */
export function QuestionsTab({
  questions,
  boardOrder,
  assessors,
}: {
  questions: Question[];
  boardOrder: string[];
  assessors: Map<string, Assessor>;
}) {
  if (questions.length === 0) {
    return <EmptyState title="No likely questions yet" body="These arrive with the deliberation." />;
  }
  const groups = new Map<string, string[]>();
  for (const q of questions) {
    groups.set(q.assessorId, [...(groups.get(q.assessorId) ?? []), q.text]);
  }
  const rank = (id: string) => {
    const i = boardOrder.indexOf(id);
    return i === -1 ? Infinity : i;
  };
  const ids = [...groups.keys()].sort((a, b) => rank(a) - rank(b));

  return (
    <div className="flex flex-col gap-5">
      {ids.map((id) => {
        const a = assessors.get(id);
        const list = groups.get(id) ?? [];
        return (
          <div key={id} className="flex items-start gap-3">
            <div className="flex w-28 shrink-0 flex-col items-center gap-1 text-center">
              <Avatar avatar={a?.avatar ?? ""} name={a?.name ?? "Unknown assessor"} size="xl" ring="none" />
              <span className="text-xs font-bold text-ink">{a?.name ?? "Unknown assessor"}</span>
              {a && <Label tone="accent">{a.role}</Label>}
            </div>
            {/* What they are likely to ask, as speech bubbles. */}
            <ul className="flex min-w-0 flex-1 flex-col items-start gap-2 pt-2">
              {list.map((text, i) => (
                <li key={i} className="relative">
                  {i === 0 && (
                    <span className="absolute top-4 -left-3 size-2.5 rounded-full border-2 border-ink bg-surface" aria-hidden="true" />
                  )}
                  <p className="rounded-lg border-2 border-ink bg-surface px-4 py-2.5 text-body text-ink">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
