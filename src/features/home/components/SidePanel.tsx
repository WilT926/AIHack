"use client";

// Side panel for the focused table (§9). Top to bottom: when it was last
// reviewed and what's new, the title and what's on the table, each assessor's
// feedback, who sits at the table (editable), previous attempts, suggested
// actions, and the table's main buttons.
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, DotRating, Label } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { saveBoardSeats } from "../actions";
import type { FloorAssessor, FloorTable } from "../model";

export function SidePanel({
  table,
  index,
  count,
  assessors,
  selectedAssessorId,
  newProjectHref,
  onPrev,
  onNext,
  onPerson,
}: {
  table: FloorTable | undefined;
  index: number;
  count: number;
  /** Everyone who can be seated, for "add to the board". */
  assessors: FloorAssessor[];
  selectedAssessorId: string | null;
  newProjectHref: string;
  onPrev: () => void;
  onNext: () => void;
  onPerson: (assessorId: string) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!table) {
    return (
      <aside className="fl-panel" aria-label="No table yet">
        <div className="fl-panel__head">
          <h1 className="fl-panel__title">No tables yet</h1>
          <span className="fl-panel__line">A table is one project: a report or a presentation, with the board that marks it.</span>
        </div>
        <div className="fl-panel__footer">
          <Button variant="create" size="lg" block href={newProjectHref}>
            New table
          </Button>
        </div>
      </aside>
    );
  }

  const byId = new Map(assessors.map((a) => [a.id, a]));
  const seatIds = editing ? draft : table.seats.map((s) => s.assessorId);
  const seated = seatIds.map((id) => {
    const seat = table.seats.find((s) => s.assessorId === id);
    const a = byId.get(id);
    return { id, short: seat?.short ?? a?.short ?? id, field: seat?.field ?? a?.field ?? "", avatar: seat?.avatar ?? a?.avatar ?? "avatar-001" };
  });
  const available = assessors.filter((a) => !seatIds.includes(a.id));

  const startEditing = () => {
    setDraft(table.seats.map((s) => s.assessorId));
    setError(null);
    setEditing(true);
  };
  const confirm = () =>
    start(async () => {
      if (!table.boardId) return setError("This table has no board to change.");
      const res = await saveBoardSeats(table.boardId, draft);
      if (!res.ok) return setError(res.error);
      setEditing(false);
      router.refresh();
    });

  return (
    <aside className="fl-panel" aria-label={`${table.name}, focused table`}>
      <div className="fl-panel__top">
        <Label tone="quiet">{table.lastReviewed}</Label>
        <span className="fl-panel__nav">
          <Label>
            {index + 1} / {count}
          </Label>
          <button type="button" className="fl-panel__arrow" onClick={onPrev} aria-label="Previous table">
            ←
          </button>
          <button type="button" className="fl-panel__arrow" onClick={onNext} aria-label="Next table">
            →
          </button>
        </span>
      </div>
      {table.updates && (
        <div className="fl-update" role="status">
          <i className="fl-update__dot" aria-hidden />
          <span>{table.updates}</span>
        </div>
      )}

      <div className="fl-panel__head">
        <h1 className="fl-panel__title">{table.name}</h1>
        <span className="fl-panel__line">{table.summary}</span>
        {table.deadline && <Label tone="quiet">{table.deadline}</Label>}
      </div>

      <section className="fl-panel__section" aria-label="Feedback">
        <Label>Feedback</Label>
        {table.feedback.every((f) => f.score === null) ? (
          <div className="fl-empty-note">No feedback yet. {table.kind === "pitch" ? "Practise the presentation" : "Run a review"} to hear from the board.</div>
        ) : (
          <ul className="fl-feedback">
            {table.feedback.map((f) => (
              <li key={f.assessorId} className="fl-feedback__row">
                <Avatar avatar={f.avatar} size="xs" />
                <span className="fl-feedback__name">{f.short}</span>
                {f.score === null ? <Label size="xs">No feedback yet</Label> : <DotRating value={f.score} max={5} label={`${f.short}'s score`} />}
                {f.reviewed && f.reviewed.total > 0 && (
                  <span className="fl-feedback__reviewed" title={`${f.reviewed.done} of ${f.reviewed.total} comments reviewed`}>
                    <span className="fl-feedback__progress">
                      <i style={{ width: `${(f.reviewed.done / f.reviewed.total) * 100}%` }} />
                    </span>
                    <span className="fl-feedback__count">
                      {f.reviewed.done}/{f.reviewed.total}
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="fl-panel__section" aria-label="At this table">
        <Label>At this table</Label>
        {seated.length === 0 && !editing ? (
          <div className="fl-empty-note">No assessors seated. Press Edit board to seat some.</div>
        ) : (
          <div className="fl-people-scroll">
            <div className="fl-people" data-editing={editing}>
              {seated.map((s) => (
                <div key={s.id} className="fl-person-slot">
                  <button
                    type="button"
                    className="fl-person"
                    data-selected={!editing && s.id === selectedAssessorId}
                    aria-pressed={!editing && s.id === selectedAssessorId}
                    disabled={editing}
                    onClick={() => onPerson(s.id)}
                  >
                    <Avatar avatar={s.avatar} size="xl" />
                    <span className="fl-person__name">{s.short}</span>
                    <span className="fl-person__field">{s.field}</span>
                  </button>
                  {editing && (
                    <button type="button" className="fl-person__remove" aria-label={`Remove ${s.short} from the board`} onClick={() => setDraft((d) => d.filter((x) => x !== s.id))}>
                      −
                    </button>
                  )}
                </div>
              ))}
              {editing && (
                <div className="fl-person-slot fl-person-slot--add">
                  <button type="button" className="fl-person-add" aria-label="Add someone to the board" onClick={() => setAdding(true)} disabled={available.length === 0}>
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="fl-panel__section" aria-label="Previous attempts">
        <Label>Previous attempts</Label>
        <div className="fl-list">
          {table.attempts.length === 0 ? (
            <p className="fl-list__empty">Nothing yet. Each finished {table.kind === "pitch" ? "practice" : "review"} appears here.</p>
          ) : (
            table.attempts.map((a) =>
              a.href ? (
                <Link key={a.id} href={a.href} className="fl-list__row">
                  <span className="fl-list__title">{a.title}</span>
                  <span className="fl-list__note">{a.note}</span>
                  <Label size="xs">{a.date}</Label>
                </Link>
              ) : (
                <div key={a.id} className="fl-list__row">
                  <span className="fl-list__title">{a.title}</span>
                  <span className="fl-list__note">{a.note}</span>
                  <Label size="xs">{a.date}</Label>
                </div>
              ),
            )
          )}
        </div>
      </section>

      <section className="fl-panel__section" aria-label="Suggested actions">
        <Label>Suggested actions</Label>
        <div className="fl-list">
          {table.actions.length === 0 ? (
            <p className="fl-list__empty">No actions yet. The board suggests what to do next after each session.</p>
          ) : (
            table.actions.map((a) => (
              <div key={a.id} className="fl-list__row fl-action" data-done={a.done}>
                <i className="fl-action__tick" aria-label={a.done ? "Done" : "To do"} />
                <span className="fl-list__title">{a.what}</span>
                <span className="fl-list__note">{a.by}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {error && (
        <p className="ps-error" role="alert">
          {error}
        </p>
      )}

      <div className="fl-panel__footer">
        {!editing && table.cta && (
          <Button variant={table.cta.tone === "orange" ? "create" : "primary"} size="lg" block href={table.cta.href}>
            {table.cta.label}
          </Button>
        )}
        {editing ? (
          <>
            <Button variant="secondary" size="lg" onClick={() => setEditing(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="create" size="lg" block onClick={confirm} disabled={pending}>
              {pending ? "Saving…" : "Confirm"}
            </Button>
          </>
        ) : (
          <Button variant="secondary" size="lg" block={!table.cta} onClick={startEditing} disabled={!table.boardId}>
            Edit board
          </Button>
        )}
      </div>

      <Modal open={adding} title="Add to the board" onClose={() => setAdding(false)}>
        {available.length === 0 ? (
          <p className="ui-empty">Everyone is already seated.</p>
        ) : (
          <ul className="fl-add-list">
            {available.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className="fl-add-list__item"
                  onClick={() => {
                    setDraft((d) => [...d, a.id]);
                    setAdding(false);
                  }}
                >
                  <Avatar avatar={a.avatar} size="lg" />
                  <span className="fl-add-list__name">{a.name}</span>
                  <Label size="xs">{a.role} · {a.field}</Label>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </aside>
  );
}
