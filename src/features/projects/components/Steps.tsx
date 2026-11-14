"use client";

import type { Assessor } from "../../review/types";
import type { Criterion, ProjectDraft, TemplateId } from "../types";
import { GRADED_OPTIONS, TEMPLATES, getTemplate } from "../templates";
import { allWeakSpots } from "../context";
import { cn } from "../../review/ui/cn";
import { Label } from "../../review/ui/Label";
import { Pill } from "../../review/ui/Pill";
import { TextInput } from "../../review/ui/TextInput";
import { TextArea } from "../../review/ui/TextArea";
import { Avatar, AvatarStack } from "../../review/ui/Avatar";
import { Card } from "../../review/ui/Card";
import { TemplateIcon } from "./TemplateIcon";

function pick(ids: string[], assessors: Map<string, Assessor>): Assessor[] {
  return ids.map((id) => assessors.get(id)).filter((a): a is Assessor => Boolean(a));
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Label className="mb-2 block">{children}</Label>;
}

// ---- Step 1: template ----

export function TemplateStep({
  selected,
  assessors,
  onSelect,
}: {
  selected?: TemplateId;
  assessors: Map<string, Assessor>;
  onSelect: (id: TemplateId) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-6" role="radiogroup" aria-label="Template">
      {TEMPLATES.map((t) => {
        const active = t.id === selected;
        const blank = t.id === "blank";
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(t.id)}
            className={cn(
              "flex min-h-60 flex-col items-start gap-1 rounded-lg p-6 text-left transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              active ? "border-2 border-accent" : blank ? "border-2 border-dashed border-rule hover:border-graphite" : "border-2 border-ink hover:bg-paper",
            )}
          >
            <div className="flex w-full items-start justify-between">
              <TemplateIcon name={t.icon} active={active} />
              <div className="flex gap-2">
                {t.isNew && <Pill variant="outline">New</Pill>}
                {active && <Pill variant="accent">Selected</Pill>}
              </div>
            </div>
            <span className="mt-5 text-2xl font-bold tracking-heading text-ink">{t.title}</span>
            <span className="text-body text-text-muted">{t.description}</span>
            {t.boardIds.length > 0 && (
              <span className="mt-auto flex items-center gap-3 pt-4">
                <AvatarStack people={pick(t.boardIds, assessors)} size="md" />
                <Label>Suggested board</Label>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---- Steps 2-3: brief and weak spots, with the mark scheme beside them ----

export function BriefStep({ draft, onChange }: { draft: ProjectDraft; onChange: (d: ProjectDraft) => void }) {
  const template = getTemplate(draft.template);
  const toggle = (list: string[], item: string) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  return (
    <div className="grid grid-cols-[1fr_34rem] gap-14">
      <div className="flex flex-col gap-6">
        <div>
          <FieldLabel>Project name</FieldLabel>
          <TextInput value={draft.name} onChange={(name) => onChange({ ...draft, name })} ariaLabel="Project name" placeholder="e.g. Dissertation, chapter 3" />
        </div>
        <div>
          <FieldLabel>What is it, and what&apos;s your goal for this run?</FieldLabel>
          <TextArea
            value={draft.brief}
            onChange={(brief) => onChange({ ...draft, brief })}
            ariaLabel="What is it, and what's your goal for this run?"
            placeholder="e.g. The methods chapter of my thesis. Goal: find what my examiner will pick apart."
            rows={4}
          />
        </div>
        <div>
          <FieldLabel>What&apos;s graded</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {GRADED_OPTIONS.map((g) => {
              const on = draft.graded.includes(g);
              return (
                <Pill key={g} variant={on ? "ink" : "outline"} onClick={() => onChange({ ...draft, graded: toggle(draft.graded, g) })} title={on ? "Graded" : "Not graded"}>
                  {on && <span aria-hidden="true">✓</span>}
                  {g}
                </Pill>
              );
            })}
          </div>
        </div>
        <div>
          <FieldLabel>Weak spots · where should they probe?</FieldLabel>
          <div className="mb-3 flex flex-wrap gap-2">
            {template.weakSpotSuggestions.map((w) => {
              const on = draft.weakSpots.includes(w);
              return (
                <Pill key={w} variant={on ? "accent" : "outline"} onClick={() => onChange({ ...draft, weakSpots: toggle(draft.weakSpots, w) })}>
                  <span aria-hidden="true">{on ? "●" : "+"}</span>
                  {w}
                </Pill>
              );
            })}
          </div>
          <TextArea
            value={draft.ownWeakSpots}
            onChange={(ownWeakSpots) => onChange({ ...draft, ownWeakSpots })}
            ariaLabel="Your own weak spots, one per line"
            placeholder='Add your own, one per line… e.g. "I&apos;m not sure the method is clear."'
            rows={3}
          />
        </div>
      </div>

      <MarkSchemePanel draft={draft} />
    </div>
  );
}

function MarkSchemePanel({ draft }: { draft: ProjectDraft }) {
  const criteria = draft.markScheme?.criteria ?? [];
  const max = Math.max(1, ...criteria.map((c) => c.weight));
  const heaviest = criteria.reduce<Criterion | undefined>((b, c) => (!b || c.weight > b.weight ? c : b), undefined);
  const lightest = criteria.reduce<Criterion | undefined>((b, c) => (!b || c.weight < b.weight ? c : b), undefined);
  const top = heaviest?.id;

  return (
    <aside className="self-start rounded-lg bg-paper p-7" aria-label="Mark scheme">
      <Label tone="ink" className="block">Mark scheme</Label>
      <Label className="block">Optional · board marks against it</Label>

      {criteria.length === 0 ? (
        <p className="mt-6 rounded-md border-2 border-dashed border-rule px-5 py-8 text-center text-body text-text-muted">
          No mark scheme yet. The board will use the brief and what&apos;s graded.
        </p>
      ) : (
        <>
          <div className="mt-5 flex items-center gap-3 rounded-md border-2 border-ink bg-surface px-5 py-4">
            <TemplateIcon name="document" />
            <div className="flex flex-col">
              <span className="font-semibold text-ink">{draft.markScheme?.source}</span>
              <Label tone="accent">
                {criteria.length} criteria · {criteria.reduce((n, c) => n + c.weight, 0)}%
              </Label>
            </div>
          </div>
          <ul className="mt-5 flex flex-col gap-4">
            {criteria.map((c) => (
              <li key={c.id}>
                <div className="flex items-baseline justify-between text-body text-ink">
                  <span>{c.name}</span>
                  <span className="font-mono text-label">{c.weight}%</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-rule">
                  <div className={cn("h-full rounded-full", c.id === top ? "bg-accent" : "bg-ink")} style={{ width: `${(c.weight / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          {heaviest && lightest && heaviest !== lightest && (
            <p className="mt-5 text-body text-text-muted">
              The board will weight its comments by these. {heaviest.name} gets the most attention, {lightest.name.toLowerCase()} the
              least.
            </p>
          )}
        </>
      )}
    </aside>
  );
}

// ---- Step 4: board ----

export function BoardStep({
  draft,
  presets,
  onChange,
}: {
  draft: ProjectDraft;
  presets: Assessor[];
  onChange: (d: ProjectDraft) => void;
}) {
  const suggested = getTemplate(draft.template).boardIds;
  const toggle = (id: string) =>
    onChange({ ...draft, boardIds: draft.boardIds.includes(id) ? draft.boardIds.filter((x) => x !== id) : [...draft.boardIds, id] });

  return (
    <div className="grid grid-cols-3 gap-5">
      {presets.map((a) => {
        const seated = draft.boardIds.includes(a.id);
        return (
          <button
            key={a.id}
            type="button"
            role="checkbox"
            aria-checked={seated}
            onClick={() => toggle(a.id)}
            className={cn(
              "flex flex-col gap-3 rounded-lg p-5 text-left transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              seated ? "border-2 border-accent" : "border-2 border-rule hover:border-graphite",
            )}
          >
            <div className="flex items-start gap-3">
              <Avatar avatar={a.avatar} name={a.name} size="lg" ring={seated ? "accent" : "ink"} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-semibold text-ink">{a.name}</span>
                <Label tone="accent">{a.role}</Label>
              </div>
              {seated ? <Pill variant="accent">Seated</Pill> : <Pill variant="outline">+ Seat</Pill>}
            </div>
            <p className="text-body text-text-muted">{a.field}</p>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1" aria-label={`Harshness ${a.harshness} of 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={cn("size-2 rounded-full", n <= a.harshness ? "bg-ink" : "bg-rule")} />
                ))}
                <Label className="ml-2">Harshness</Label>
              </span>
              {suggested.includes(a.id) && <Label>Suggested</Label>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ---- Step 5: start ----

export function StartStep({ draft, assessors }: { draft: ProjectDraft; assessors: Map<string, Assessor> }) {
  const template = getTemplate(draft.template);
  const weakSpots = allWeakSpots(draft);
  const board = pick(draft.boardIds, assessors);
  const rows: [string, React.ReactNode][] = [
    ["Template", template.title],
    ["Project", draft.name],
    ["Brief", draft.brief],
    ["What's graded", draft.graded.length ? draft.graded.join(" · ") : "Not set"],
    ["Weak spots", weakSpots.length ? weakSpots.join(" · ") : "None flagged"],
    ["Mark scheme", draft.markScheme ? `${draft.markScheme.source} · ${draft.markScheme.criteria.length} criteria` : "None"],
  ];

  return (
    <div className="grid grid-cols-[1fr_24rem] gap-10">
      <Card className="p-7">
        <dl className="flex flex-col divide-y divide-rule">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[10rem_1fr] gap-4 py-3.5">
              <dt>
                <Label>{k}</Label>
              </dt>
              <dd className="text-body text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <Card variant="dark" className="self-start p-7">
        <Label tone="accent">Your board · {board.length} seated</Label>
        <ul className="mt-4 flex flex-col gap-3">
          {board.map((a) => (
            <li key={a.id} className="flex items-center gap-3">
              <Avatar avatar={a.avatar} name={a.name} size="md" />
              <div className="flex flex-col">
                <span className="font-semibold">{a.name}</span>
                <Label tone="accent">{a.role}</Label>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-body text-rule">Next: upload your document. Each assessor reads it on their own, then the board deliberates.</p>
      </Card>
    </div>
  );
}
