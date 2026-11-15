"use client";

import { useState } from "react";
import type { Assessor, Deliberation, Document, FixItem, Question, Run } from "../types";
import { paragraphLabel } from "../lib";
import { fixListText } from "../engine/previous";
import { TextButton } from "../ui/TextButton";
import { SinceLastTimeCard } from "./SinceLastTimeCard";
import { Label } from "../ui/Label";
import { Avatar, AvatarStack } from "../ui/Avatar";
import { Pill } from "../ui/Pill";
import { DeliberationCard } from "./DeliberationCard";
import { EmptyState } from "./StatusCards";

function Section({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Label tone="ink">{label}</Label>
        {action}
      </div>
      {children}
    </section>
  );
}

/** "If time": one button copies the fix list as clean text. */
function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2000);
  };
  return (
    <span aria-live="polite">
      <TextButton onClick={() => void copy()}>
        {state === "copied" ? "Copied ✓" : state === "failed" ? "Couldn't copy" : "Copy fix list"}
      </TextButton>
    </span>
  );
}

/**
 * The Feedback report tab (§9, §10), in the report's order: where the board
 * agrees and splits, the ranked actions, then the likely questions. The full
 * report (verdict, criteria ratings, effort, ticks) is step 2.3b.
 */
export function FeedbackTab({
  run,
  projectName,
  written,
  deliberation,
  fixList,
  questions,
  doc,
  boardOrder,
  assessors,
  onShowParagraph,
}: {
  run: Run;
  projectName: string;
  /** Written-questions mode: no live Q&A, so questions are for the text, plus what to add or cut. */
  written?: boolean;
  deliberation?: Deliberation;
  fixList: FixItem[];
  questions: Question[];
  doc: Document;
  boardOrder: string[];
  assessors: Map<string, Assessor>;
  onShowParagraph: (paragraphId: string) => void;
}) {
  if (!deliberation && fixList.length === 0 && questions.length === 0) {
    return <EmptyState title="No feedback report yet" body="It is written once every assessor has read and the board has compared notes." />;
  }
  const names = new Map([...assessors].map(([id, a]) => [id, a.name]));
  return (
    <div className="flex flex-col gap-8">
      {run.sinceLastTime && run.previousNumber && (
        <SinceLastTimeCard since={run.sinceLastTime} previousNumber={run.previousNumber} />
      )}

      {deliberation && (
        <Section label={`The board deliberated · ${deliberation.seconds} sec`}>
          {deliberation.agreements.length > 0 && (
            <ul className="flex flex-col gap-2">
              {deliberation.agreements.map((a, i) => (
                <li key={i} className="flex gap-3 text-body text-grey-900">
                  <span className="pt-0.5 font-mono text-label text-grey-500">Agree</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          )}
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
        </Section>
      )}

      {fixList.length > 0 && (
        <ActionsSection
          fixList={fixList}
          doc={doc}
          assessors={assessors}
          onShowParagraph={onShowParagraph}
          copyText={fixListText(run, names, projectName)}
        />
      )}

      {run.addOrCut && <AddOrCutSection addOrCut={run.addOrCut} />}

      {questions.length > 0 && (
        <QuestionsSection questions={questions} boardOrder={boardOrder} assessors={assessors} label={written ? "Questions to answer in the text" : "Likely questions"} />
      )}
    </div>
  );
}

/** Actions, ranked: numbered rows, what to do, who raised it, and where. */
function ActionsSection({
  fixList,
  doc,
  assessors,
  onShowParagraph,
  copyText,
}: {
  fixList: FixItem[];
  doc: Document;
  assessors: Map<string, Assessor>;
  onShowParagraph: (paragraphId: string) => void;
  copyText: string;
}) {
  const ordered = [...fixList].sort((a, b) => a.rank - b.rank);
  return (
    <Section label="Actions, ranked" action={<CopyButton text={copyText} />}>
      <ol className="flex flex-col divide-y divide-grey-100 rounded-card border-line border-grey-150">
        {ordered.map((item) => {
          const raisedBy = item.raisedBy.map((id) => assessors.get(id)).filter((a): a is Assessor => Boolean(a));
          return (
            <li key={item.rank} className="flex items-start gap-4 px-5 py-4">
              <span className="font-display text-h2 font-semibold leading-none tracking-h2 text-ink">{item.rank}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <p className="text-body font-semibold text-ink">{item.text}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {item.paragraphIds.map((pid) => (
                    <Pill key={pid} variant="outline" onClick={() => onShowParagraph(pid)} title="Show in text">
                      {paragraphLabel(doc, pid)}
                    </Pill>
                  ))}
                  {raisedBy.length > 0 && (
                    <span className="ml-auto flex items-center gap-2">
                      <Label size="sm">Raised by</Label>
                      <AvatarStack people={raisedBy} size="sm" />
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

/** Written-questions mode: what to add before it is marked, and what to cut. */
function AddOrCutSection({ addOrCut }: { addOrCut: NonNullable<Run["addOrCut"]> }) {
  const groups = [
    { label: "Add", items: addOrCut.add },
    { label: "Cut", items: addOrCut.cut },
  ].filter((g) => g.items.length > 0);
  return (
    <Section label="What to add or cut">
      <div className="grid grid-cols-2 gap-3">
        {groups.map((g) => (
          <div key={g.label} className="rounded-card-sm border-line border-grey-150 px-5 py-4">
            <Label tone="ink" size="sm">{g.label}</Label>
            <ul className="mt-2 flex flex-col gap-1.5">
              {g.items.map((t, i) => (
                <li key={i} className="flex gap-2 text-body text-grey-900">
                  <span aria-hidden="true" className="font-mono text-label text-grey-500">{g.label === "Add" ? "+" : "−"}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}

/** Likely questions, each beside the assessor who would ask it (a speech bubble with a ring tail). */
function QuestionsSection({
  questions,
  boardOrder,
  assessors,
  label,
}: {
  questions: Question[];
  boardOrder: string[];
  assessors: Map<string, Assessor>;
  label: string;
}) {
  const groups = new Map<string, string[]>();
  for (const q of questions) groups.set(q.assessorId, [...(groups.get(q.assessorId) ?? []), q.text]);
  const rank = (id: string) => {
    const i = boardOrder.indexOf(id);
    return i === -1 ? Infinity : i;
  };
  const ids = [...groups.keys()].sort((a, b) => rank(a) - rank(b));

  return (
    <Section label={label}>
      <div className="flex flex-col gap-5">
        {ids.map((id) => {
          const a = assessors.get(id);
          return (
            <div key={id} className="flex items-start gap-3">
              <div className="flex w-28 shrink-0 flex-col items-center gap-0.5 text-center">
                <Avatar avatar={a?.avatar ?? ""} name={a?.name ?? "Unknown assessor"} size="xl" />
                <span className="text-small font-semibold text-ink">{a?.name ?? "Unknown assessor"}</span>
                {a && <Label size="sm">{a.role}</Label>}
              </div>
              <ul className="flex min-w-0 flex-1 flex-col items-start gap-2 pt-3">
                {(groups.get(id) ?? []).map((text, i) => (
                  <li key={i} className="relative">
                    {i === 0 && (
                      <span className="absolute top-4 -left-3.5 size-2.5 rounded-full border-line border-ink bg-white" aria-hidden="true" />
                    )}
                    <p className="rounded-card-sm border-line border-ink bg-white px-4 py-2.5 text-body text-ink">{text}</p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
