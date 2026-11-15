"use client";

import type { Assessor } from "../../review/types";
import type { Criterion, ProjectDraft, TemplateId } from "../types";
import { GRADED_OPTIONS, TEMPLATES, getTemplate } from "../templates";
import { allWeakSpots } from "../context";
import { cn } from "../../review/ui/cn";
import { Label } from "../../review/ui/Label";
import { Pill } from "../../review/ui/Pill";
import { Chip, DotRating } from "@/components/ui";
import { TextInput } from "../../review/ui/TextInput";
import { TextArea } from "../../review/ui/TextArea";
import { Avatar, AvatarStack } from "../../review/ui/Avatar";
import { Card } from "../../review/ui/Card";
import { SelectCard } from "../../review/ui/SelectCard";
import { TemplateIcon } from "./TemplateIcon";
import { RoundTable } from "./RoundTable";

function pick(ids: string[], assessors: Map<string, Assessor>): Assessor[] {
  return ids.map((id) => assessors.get(id)).filter((a): a is Assessor => Boolean(a));
}

/** §11: the two-letter project code is the initials of the title. */
function projectCode(title: string): string {
  const words = title.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  return (words.length >= 2 ? words[0][0] + words[1][0] : (words[0] ?? "NT").slice(0, 2)).toUpperCase();
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
          <SelectCard
            key={t.id}
            role="radio"
            checked={active}
            onSelect={() => onSelect(t.id)}
            dashed={blank}
            className="min-h-60 items-start gap-1 p-6"
          >
            <div className="flex w-full items-start justify-between">
              <TemplateIcon name={t.icon} active={active} />
              <div className="flex gap-2">
                {t.isNew && <Pill variant="outline">New</Pill>}
                {active && <Pill variant="accent">Selected</Pill>}
              </div>
            </div>
            <span className="mt-5 font-display text-h2 font-semibold tracking-h2 text-ink">{t.title}</span>
            <span className="text-body text-grey-700">{t.description}</span>
            {t.boardIds.length > 0 && (
              <span className="mt-auto flex items-center gap-3 pt-4">
                <AvatarStack people={pick(t.boardIds, assessors)} size="md" />
                <Label>Suggested board</Label>
              </span>
            )}
          </SelectCard>
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
    <div className="grid grid-cols-form-aside gap-14">
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
                <Chip key={g} active={on} onClick={() => onChange({ ...draft, graded: toggle(draft.graded, g) })}>
                  {on ? `✓ ${g}` : g}
                </Chip>
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
                <Chip key={w} active={on} onClick={() => onChange({ ...draft, weakSpots: toggle(draft.weakSpots, w) })}>
                  {on ? w : `+ ${w}`}
                </Chip>
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
    <aside className="self-start rounded-sheet bg-grey-50 p-7" aria-label="Mark scheme">
      <Label tone="ink" className="block">Mark scheme</Label>
      <Label className="block">Optional · board marks against it</Label>

      {criteria.length === 0 ? (
        <p className="mt-6 rounded-card border-2 border-dashed border-grey-250 px-5 py-8 text-center text-body text-grey-700">
          No mark scheme yet. The board will use the brief and what&apos;s graded.
        </p>
      ) : (
        <>
          <div className="mt-5 flex items-center gap-3 rounded-card-sm border-line border-ink bg-white px-5 py-4">
            <TemplateIcon name="document" />
            <div className="flex flex-col">
              <span className="font-display text-h3 font-semibold tracking-h3 text-ink">{draft.markScheme?.source}</span>
              <Label>
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
                <div className="mt-1.5 h-1.5 rounded-full bg-grey-100">
                  <div className={cn("h-full rounded-full", c.id === top ? "bg-orange" : "bg-ink")} style={{ width: `${(c.weight / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          {heaviest && lightest && heaviest !== lightest && (
            <p className="mt-5 text-body text-grey-700">
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
  const byId = new Map(presets.map((a) => [a.id, a]));
  const code = projectCode(draft.name);
  const toggle = (id: string) =>
    onChange({ ...draft, boardIds: draft.boardIds.includes(id) ? draft.boardIds.filter((x) => x !== id) : [...draft.boardIds, id] });

  return (
    <div className="grid grid-cols-table-aside items-start gap-10">
      <RoundTable label={draft.name} seated={pick(draft.boardIds, byId)} onRemove={toggle} />

      <div className="flex flex-col gap-3.5">
        <div className="flex items-center gap-3">
          <Label tone="ink">Add assessors</Label>
          <Label>{presets.length} presets · seat or unseat</Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {presets.map((a) => {
            const seated = draft.boardIds.includes(a.id);
            return (
              <SelectCard key={a.id} role="checkbox" checked={seated} onSelect={() => toggle(a.id)} direction="row" className="items-start gap-3.5 p-4.5">
                <Avatar avatar={a.avatar} name={a.name} size="xl" ring={seated ? "accent" : "none"} />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="font-display text-h3 font-semibold tracking-h3 text-ink">{a.name}</span>
                  <Label size="sm">{a.role}</Label>
                  <span className="line-clamp-2 text-small text-grey-700">{a.personality ?? a.field}</span>
                  <span className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-ink">
                      <DotRating value={a.harshness} max={5} label="Harshness" />
                      {suggested.includes(a.id) && <Label size="xs">Suggested</Label>}
                    </span>
                    <span className={cn("ui-btn ui-btn--sm", seated ? "ui-btn--secondary" : "ui-btn--primary")} aria-hidden="true">
                      {seated ? "Unseat" : `Seat at ${code}`}
                    </span>
                  </span>
                </span>
              </SelectCard>
            );
          })}
        </div>
      </div>
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
    <div className="grid grid-cols-summary-aside items-start gap-10">
      <Card className="p-7">
        <dl className="flex flex-col divide-y divide-grey-100">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-label-value gap-4 py-3.5">
              <dt>
                <Label>{k}</Label>
              </dt>
              <dd className="text-body text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <div className="flex flex-col gap-4">
        <RoundTable label={draft.name} seated={board} compact />
        <p className="text-body text-grey-700">
          Next: upload your document. Each assessor reads it on their own, then the board deliberates.
        </p>
      </div>
    </div>
  );
}
