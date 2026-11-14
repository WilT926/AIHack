// Tables, rim dots, papers, seats and the speech bubble. Every position is
// derived from the polar geometry each frame (§13.5): no per-element CSS
// animation.
import { Avatar, RimDot } from "@/components/ui";
import { COMPACT, DIM_OPACITY } from "@/styles/floor";
import { compactNameSize, isFull, paperBox, quoteAnchor, rimDots, seatBoxes, toPoint, type Point, type Polar } from "../geometry";
import type { FloorTable } from "../model";

/** The likely question cycling beside the seat of the assessor who would ask it. */
function speechBubble(t: FloorTable | undefined, points: Point[], focus: number, anim: boolean, tick: number) {
  const g = points[focus];
  if (!t || !g || anim || !isFull(g.r) || t.questions.length === 0) return null;
  const q = t.questions[tick % t.questions.length];
  const k = t.seats.findIndex((s) => s.assessorId === q.assessorId);
  if (k < 0) return null;
  const seat = seatBoxes(g, t.seats.length)[k];
  return { ...quoteAnchor(seat, q.text, points, focus), text: q.text, key: `${t.id}-${tick}` };
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
}) {
  const points = cur.map(toPoint);
  const quote = speechBubble(tables[focus], points, focus, anim, quoteTick);

  const layers = tables.map((t, i) => {
    const g = points[i];
    if (!g) return null;
    const focused = i === focus;
    const op = matches[i] ? 1 : DIM_OPACITY;
    const full = isFull(g.r);
    const seats = seatBoxes(g, t.seats.length);
    const paper = t.docs.length ? paperBox(g) : null;
    const rim = focused ? rimDots(g, t.sessions.length) : [];

    return (
      <div key={t.id}>
        <button
          type="button"
          className="fl-table"
          aria-pressed={focused}
          aria-label={`${t.name} · ${t.status.replace("● ", "")}`}
          onClick={() => onFocus(i)}
          style={{
            left: g.x - g.r,
            top: g.y - g.r,
            width: g.r * 2,
            height: g.r * 2,
            zIndex: g.z,
            opacity: op,
            paddingInline: full ? COMPACT.padFull : COMPACT.padCompact,
          }}
        >
          {full ? (
            <>
              <span className="fl-table__status">{t.status}</span>
              <span className="fl-table__name">{t.name}</span>
              <span className="fl-table__line">{t.line}</span>
            </>
          ) : (
            <>
              <span className="fl-table__cname" style={{ fontSize: compactNameSize(g.r) }}>
                {t.name}
              </span>
              {g.r >= COMPACT.statusMinR && <span className="fl-table__short">{t.short}</span>}
            </>
          )}
        </button>

        {rim.map((p, k) => (
          <RimDot key={k} state={t.sessions[k].state} style={{ position: "absolute", left: p.x, top: p.y, zIndex: g.z + 1, pointerEvents: "none" }} />
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
        <div className="fl-quote" data-side={q.side} style={{ left: q.left, top: q.top }} aria-live="polite">
          <span className="fl-quote__tail" aria-hidden />
          <span className="fl-quote__text" key={q.key}>
            {q.text}
          </span>
        </div>
      )}
    </div>
  );
}
