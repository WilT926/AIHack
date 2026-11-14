// Side panel for the focused table (§9).
import Link from "next/link";
import { Avatar, Button, Label, StateBead } from "@/components/ui";
import type { FloorTable } from "../model";

export function SidePanel({
  table,
  index,
  count,
  beadIndex,
  selectedAssessorId,
  newProjectHref,
  onBead,
  onPrev,
  onNext,
  onPerson,
  onDocs,
  onEditBoard,
}: {
  table: FloorTable | undefined;
  index: number;
  count: number;
  beadIndex: number;
  selectedAssessorId: string | null;
  newProjectHref: string;
  onBead: (k: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onPerson: (assessorId: string) => void;
  onDocs: () => void;
  onEditBoard: () => void;
}) {
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

  const bead = table.sessions[beadIndex];

  return (
    <aside className="fl-panel" aria-label={`${table.name}, focused table`}>
      <div className="fl-panel__top">
        <Label tone={table.live ? "orange" : "quiet"}>{table.status}</Label>
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

      <div className="fl-panel__head">
        <h1 className="fl-panel__title">{table.name}</h1>
        <span className="fl-panel__line">{table.line}</span>
        {table.deadline && <Label tone="quiet">{table.deadline}</Label>}
      </div>

      <section className="fl-panel__section fl-panel__section--sessions" aria-label="Sessions">
        <Label>Sessions</Label>
        {table.sessions.length === 0 ? (
          <div className="fl-empty-note">No sessions yet. Run a review or a presentation practice to see feedback here.</div>
        ) : (
          <>
            <div className="fl-beads">
              {table.sessions.map((s, k) => (
                <StateBead key={s.id} state={s.state} selected={k === beadIndex} label={`${s.type}: ${s.title}, ${s.date}`} onSelect={() => onBead(k)} />
              ))}
            </div>
            {bead && (
              <div className="fl-bead-card">
                <div className="fl-bead-card__top">
                  <span className="fl-bead-card__title">{bead.type === bead.title ? bead.type : bead.title}</span>
                  <Label tone="quiet">{bead.date}</Label>
                </div>
                <span className="fl-bead-card__note">
                  {bead.type === bead.title ? "" : `${bead.type} · `}
                  {bead.note}
                </span>
                {bead.reportHref && (
                  <Link className="fl-bead-card__link" href={bead.reportHref}>
                    Open feedback report →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <section className="fl-panel__section" aria-label="At this table">
        <Label>At this table</Label>
        {table.seats.length === 0 ? (
          <div className="fl-empty-note">No assessors seated. Edit the board to seat some.</div>
        ) : (
          <div className="fl-people">
            {table.seats.map((s) => (
              <button
                type="button"
                key={s.assessorId}
                className="fl-person"
                data-selected={s.assessorId === selectedAssessorId}
                onClick={() => onPerson(s.assessorId)}
              >
                <Avatar avatar={s.avatar} size="xl" />
                <span className="fl-person__name">{s.short}</span>
                <span className="fl-person__field">{s.field}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="fl-panel__section" aria-label="On the table">
        <Label>On the table</Label>
        {table.docs.length === 0 && !table.hasMarkScheme ? (
          <div className="fl-empty-note">Nothing on the table yet.</div>
        ) : (
          <div className="fl-docs">
            {table.docs.map((d) => (
              <button type="button" key={d.id} className="fl-doc" onClick={onDocs}>
                <i className="fl-doc__icon" aria-hidden />
                <span className="fl-doc__title">{d.title}</span>
                <span className="fl-doc__count" data-open={d.open > 0}>
                  {d.open ? `${d.open} OPEN` : "CLEAN"}
                </span>
              </button>
            ))}
            {table.hasMarkScheme && (
              <div className="fl-doc" data-static>
                <i className="fl-doc__icon" aria-hidden />
                <span className="fl-doc__title">{table.docs.length ? "Mark scheme" : "Judging criteria"}</span>
                <Label size="sm">Mark scheme</Label>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="fl-panel__footer">
        {table.cta && (
          <Button variant={table.cta.tone === "orange" ? "create" : "primary"} size="lg" block href={table.cta.href}>
            {table.cta.label}
          </Button>
        )}
        <Button variant="secondary" size="lg" block={!table.cta} onClick={onEditBoard}>
          Edit board
        </Button>
      </div>
    </aside>
  );
}
