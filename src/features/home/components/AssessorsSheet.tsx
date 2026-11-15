// Assessors sheet: a carousel of assessor cards above the dock (§9).
import { features } from "@/config";
import { Avatar, Button, CodeChip, DotRating, IconButton } from "@/components/ui";
import { ASSESSOR_CARD } from "@/styles/floor";
import type { FloorAssessor } from "../model";

import { SEAT_DRAG_TYPE } from "./Tables";

export function AssessorsSheet({
  open,
  assessors,
  selectedId,
  focusCode,
  carIdx,
  onCarIdx,
  onSelect,
  onClose,
}: {
  open: boolean;
  assessors: FloorAssessor[];
  selectedId: string | null;
  focusCode: string | undefined;
  carIdx: number;
  onCarIdx: (i: number) => void;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const maxIdx = Math.max(0, assessors.length + (features.newAssessor ? 1 : 0) - ASSESSOR_CARD.visible);
  const step = ASSESSOR_CARD.width + ASSESSOR_CARD.gap;

  return (
    <section className="fl-sheet fl-sheet--assessors" data-open={open} aria-hidden={!open} aria-label="Assessors" inert={!open}>
      <div className="fl-sheet__head">
        <div className="fl-sheet__titles">
          <h2 className="fl-sheet__title">Assessors</h2>
          <span className="fl-sheet__sub">Select someone to see the panels they sit on</span>
        </div>
        <div className="fl-sheet__actions">
          <IconButton label="Previous assessors" disabled={carIdx <= 0} onClick={() => onCarIdx(Math.max(0, carIdx - 1))}>
            ←
          </IconButton>
          <IconButton label="Next assessors" disabled={carIdx >= maxIdx} onClick={() => onCarIdx(Math.min(maxIdx, carIdx + 1))}>
            →
          </IconButton>
          <IconButton label="Close" quiet onClick={onClose}>
            ×
          </IconButton>
        </div>
      </div>
      <div className="fl-cards">
        <div className="fl-cards__track" style={{ transform: `translateX(${-carIdx * step}px)` }}>
          {features.newAssessor && <div className="fl-card ui-card--dashed"><span className="fl-card__name">New assessor</span><p className="fl-card__focus">Build one from a preset and add what your marker wants.</p><Button variant="secondary" href="/assessors">Assessor studio</Button></div>}
          {assessors.map((a) => {
            const selected = a.id === selectedId;
            const seatedHere = !!focusCode && a.tables.includes(focusCode);
            return (
              <div
                key={a.id}
                role="button"
                tabIndex={0}
                className="fl-card"
                data-seated={seatedHere || undefined}
                draggable={features.editBoards}
                onDragStart={(e) => {
                  e.dataTransfer.setData(SEAT_DRAG_TYPE, a.id);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                aria-pressed={selected}
                onClick={(e) => { if (!(e.target as HTMLElement).closest("a")) onSelect(a.id); }}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(a.id);
                  }
                }}
              >
                <div className="fl-card__top">
                  <Avatar avatar={a.avatar} size="2xl" invert={selected} />
                  <div className="fl-card__codes">
                    {a.tables.map((c) => (
                      <CodeChip key={c} code={c} />
                    ))}
                  </div>
                </div>
                <span className="fl-card__name">{a.name}</span>
                <span className="fl-card__field">
                  {a.role} · {a.field}
                </span>
                <span className="fl-card__focus">{a.focus}</span>
                <div className="fl-card__meta">
                  <DotRating value={a.harshness} max={5} label="Harshness" />
                  <span className="fl-card__notes">
                    {a.notes} {a.notes === 1 ? "NOTE" : "NOTES"}
                  </span>
                </div>
                <Button variant={selected ? "on-ink" : "secondary"} size="sm" href={`/assessors/${a.id}`}>Profile and notes</Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
