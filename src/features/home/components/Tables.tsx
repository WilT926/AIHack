// Tables, rim dots, papers, seats and the speech bubble. Every position is
// derived from the polar geometry each frame (§13.5): no per-element CSS
// animation.
import { Avatar, RimDot } from "@/components/ui";
import { COMPACT, DIM_OPACITY, TABLE_R } from "@/styles/floor";
import { isFull, paperBox, questionExcerpt, quoteAnchor, rimDots, seatBoxes, toPoint, type Point, type Polar } from "../geometry";
import type { FloorTable } from "../model";

/** The likely question cycling beside the seat of the assessor who would ask it. */
function speechBubble(tables: FloorTable[], points: Point[], focus: number, anim: boolean, tick: number) {
  const t = tables[focus];
  const g = points[focus];
  if (!t || !g || anim || !isFull(g.r) || t.questions.length === 0) return null;
  const q = t.questions[tick % t.questions.length];
  const k = t.seats.findIndex((s) => s.assessorId === q.assessorId);
  if (k < 0) return null;
  const seat = seatBoxes(g, t.seats.length)[k];
  const neighbors = tables.flatMap((table, i) => seatBoxes(points[i], table.seats.length));
  return { ...quoteAnchor(seat, points, focus, neighbors), text: questionExcerpt(q.text), fullText: q.text, name: t.seats[k].name, key: `${t.id}-${tick}` };
}

export function Tables({
  tables,
  cur,
  focus,
  anim,
  matches,
  selectedAssessorId,
  quoteTick,
  fadeKey,
  onFocus,
  onNewTable,
  onQuotePause,
  deskOpen,
}: {
  tables: FloorTable[];
  cur: Polar[];
  focus: number;
  anim: boolean;
  matches: boolean[];
  selectedAssessorId: string | null;
  quoteTick: number;
  fadeKey: number;
  onFocus: (i: number) => void;
  onNewTable: () => void;
  onQuotePause: (paused: boolean) => void;
  deskOpen: boolean;
}) {
  const points = cur.map(toPoint);
  const quote = speechBubble(tables, points, focus, anim, quoteTick);

  const layers = tables.map((t, i) => {
    const g = points[i];
    if (!g) return null;
    const focused = i === focus;
    const op = matches[i] ? 1 : DIM_OPACITY;
    const detail = Math.max(0, Math.min(1, (g.r - TABLE_R.side) / (TABLE_R.focus - TABLE_R.side)));
    const seats = seatBoxes(g, t.seats.length);
    const paper = t.docs.length ? paperBox(g) : null;
    const rim = rimDots(g, t.sessions.length);

    return (
      <div key={t.id}>
        <button
          type="button"
          className="fl-table"
          aria-pressed={focused}
          aria-expanded={focused ? deskOpen : undefined}
          aria-controls={focused ? "floor-desk" : undefined}
          title={focused ? "Open the documents and feedback on this table" : undefined}
          aria-label={`${t.name} · ${t.status.replace("● ", "")}`}
          onClick={() => onFocus(i)}
          style={{
            left: g.x - g.r,
            top: g.y - g.r,
            width: g.r * 2,
            height: g.r * 2,
            zIndex: g.z,
            opacity: op,
          }}
        >
          <span className="fl-table__content" style={{ width: TABLE_R.focus * 2 - COMPACT.padFull * 2, marginTop: -detail * COMPACT.titleLift, transform: `translate(-50%, -50%) scale(${g.r / TABLE_R.focus})` }}>
            <span className="fl-table__status" style={{ opacity: detail }} aria-hidden={detail === 0}>{t.status}</span>
            <span className="fl-table__name">{t.name}</span>
            <span className="fl-table__line" style={{ opacity: detail }} aria-hidden={detail === 0}>{t.line}</span>
            <span className="fl-table__short" style={{ opacity: 1 - detail }} aria-hidden={detail === 1}>{t.short}</span>
          </span>
        </button>

        {rim.map((p, k) => (
          <RimDot key={k} state={t.sessions[k].state} style={{ position: "absolute", left: p.x, top: p.y, zIndex: g.z + 1, pointerEvents: "none", opacity: op * detail }} />
        ))}

        {paper && (
          <div
            className="fl-paper"
            aria-hidden
            style={{ left: paper.left, top: paper.top, width: paper.w, height: paper.h, zIndex: g.z + 1, opacity: op }}
          >
            <i />
            <i />
            <i />
            {t.openActions > 0 && <span className="fl-paper__badge">{t.openActions}</span>}
          </div>
        )}

        {t.seats.map((s, k) => (
          <div
            key={s.assessorId}
            className="fl-seat"
            style={{ left: seats[k].left, top: seats[k].top, width: seats[k].size, height: seats[k].size, zIndex: g.z + 1, opacity: op }}
          >
            <Avatar avatar={s.avatar} size="fill" alt={s.name} />
            {s.assessorId === selectedAssessorId && <i className="fl-seat__dot" />}
          </div>
        ))}
      </div>
    );
  });

  const q = quote;

  return (
    <div className="fl-layer" key={fadeKey} data-fade={fadeKey > 0}>
      <button type="button" className="fl-new-table" onClick={onNewTable} aria-label="New table">
        <span className="fl-new-table__plus" aria-hidden>
          +
        </span>
        <span className="fl-new-table__title">New table</span>
        <span className="fl-new-table__sub">report or presentation</span>
      </button>

      {tables.length === 0 && <div className="fl-empty-floor">Your floor is empty. Start a table for your first report or presentation.</div>}

      {layers}

      {q && (
        <div className="fl-quote" data-side={q.side} style={{ left: q.left, top: q.top }} role="note" tabIndex={0} aria-label={`${q.name} might ask: ${q.fullText}`} title={`${q.name}: ${q.fullText}`} onMouseEnter={() => onQuotePause(true)} onMouseLeave={() => onQuotePause(false)} onFocus={() => onQuotePause(true)} onBlur={() => onQuotePause(false)}>
          <span className="fl-quote__tail" style={{ left: q.tailLeft, top: q.tailTop }} aria-hidden />
          <span className="fl-quote__text" key={q.key}>
            {q.text}
          </span>
        </div>
      )}
    </div>
  );
}
