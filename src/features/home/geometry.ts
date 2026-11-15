// Floor geometry and focus motion, ported from design/Panel Home Final.dc.html
// (slotsA, ease, focusTable, geo, renderVals). Tables live in polar space:
// angle a (degrees), distance d (0 = centre, 1 = on the ellipse), radius r.
import {
  COMPACT,
  FLOOR,
  FLOOR_BOUNDS,
  NEW_TABLE,
  FOCUS_SPIN,
  FULL_CONTENT_R,
  MOTION,
  PAPER,
  QUOTE,
  RIM,
  RING_SLOTS,
  SEAT,
  SWING_OUT,
  TABLE_R,
} from "@/styles/floor";

export type Polar = { a: number; d: number; r: number };
export type Point = { x: number; y: number; r: number; z: number };

const DEG = Math.PI / 180;

/** Target slots when `focus` is centred. `cur` carries the focused table's spin. */
export function slots(n: number, focus: number, cur: Polar[] | null): Polar[] {
  return Array.from({ length: n }, (_, i) => {
    const rel = (i - focus + n) % n;
    return rel === 0
      ? { a: (cur ? cur[i].a : 0) + FOCUS_SPIN, d: 0, r: TABLE_R.focus }
      : { a: RING_SLOTS[rel - 1], d: 1, r: TABLE_R.side };
  });
}

/** easeOutBack, c1 = 1.5 (§8). */
export function ease(t: number): number {
  const c1 = MOTION.c1;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * Start and end polar positions for a focus change. A table leaving the centre
 * starts from (target angle − 90°) so it swings out; angles take the shortest
 * path.
 */
export function focusPath(cur: Polar[], focus: number): { from: Polar[]; to: Polar[] } {
  const from = cur.map((c) => ({ ...c }));
  const to = slots(cur.length, focus, from);
  to.forEach((t, k) => {
    if (Math.abs(from[k].d) < 1e-6 && t.d > 0.5) from[k].a = t.a - SWING_OUT;
    t.a = from[k].a + ((((t.a - from[k].a) % 360) + 540) % 360) - 180;
  });
  return { from, to };
}

export function lerpPolar(from: Polar[], to: Polar[], e: number): Polar[] {
  return from.map((f, k) => ({
    a: f.a + (to[k].a - f.a) * e,
    d: f.d + (to[k].d - f.d) * e,
    r: f.r + (to[k].r - f.r) * e,
  }));
}

export function toPoint(c: Polar): Point {
  return {
    x: FLOOR.cx + c.d * FLOOR.rx * Math.cos(c.a * DEG),
    y: FLOOR.cy + c.d * FLOOR.ry * Math.sin(c.a * DEG),
    r: c.r,
    z: c.d < 0.5 ? 6 : 4,
  };
}

export const isFull = (r: number) => r >= FULL_CONTENT_R;

export function compactNameSize(r: number): number {
  return Math.max(COMPACT.nameMin, Math.min(COMPACT.nameMax, r * COMPACT.nameScale));
}

/** Rim dots along the bottom inner rim, 12° apart, oldest on the left. */
export function rimDots(g: Point, count: number): { x: number; y: number }[] {
  const rr = g.r - RIM.inset;
  return Array.from({ length: count }, (_, k) => {
    const a = (90 - (k - (count - 1) / 2) * RIM.stepDeg) * DEG;
    return { x: g.x + rr * Math.cos(a) - RIM.size / 2, y: g.y + rr * Math.sin(a) - RIM.size / 2 };
  });
}

/** Seat boxes around the rim, starting at −110°, evenly spaced. */
export function seatBoxes(g: Point, count: number): { left: number; top: number; size: number; cx: number; cy: number }[] {
  const av = g.r * SEAT.scale;
  const dist = g.r + av * 0.5 + SEAT.gap;
  return Array.from({ length: count }, (_, k) => {
    const a = (SEAT.startDeg + (k * 360) / count) * DEG;
    const cx = g.x + dist * Math.cos(a);
    const cy = g.y + dist * Math.sin(a);
    return { left: cx - av / 2, top: cy - av / 2, size: av, cx, cy };
  });
}

/** The paper sheet near the top right of the table. */
export function paperBox(g: Point): { left: number; top: number; w: number; h: number } | null {
  if (g.r < PAPER.minR) return null;
  const w = g.r * PAPER.widthScale;
  return { left: g.x + g.r * PAPER.dx - w / 2, top: g.y + g.r * PAPER.dy, w, h: w * PAPER.aspect };
}

export type QuoteSide = "right" | "left" | "above" | "below";

/** How far a rectangle reaches into a circle (0 when it does not). */
function overlapDepth(x: number, y: number, w: number, h: number, c: { x: number; y: number; r: number }) {
  const nx = Math.max(x, Math.min(c.x, x + w));
  const ny = Math.max(y, Math.min(c.y, y + h));
  return Math.max(0, c.r - Math.hypot(nx - c.x, ny - c.y));
}

/**
 * Keep a bounded bubble beside its speaker. Only slide perpendicular to the
 * tail so it still points at that person's seat when avoiding the floor edge.
 */
export function quoteAnchor(
  seat: { cx: number; cy: number; size: number },
  tables: Point[],
  focus: number,
  neighbors: { cx: number; cy: number; size: number }[] = [],
): { left: number; top: number; side: QuoteSide; tailLeft: number; tailTop: number } {
  const w = QUOTE.width;
  const h = QUOTE.height;
  const s = seat.size;
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  const top = clamp(seat.cy - h * QUOTE.tailDown, FLOOR_BOUNDS.top, FLOOR_BOUNDS.bottom - h);
  const left = clamp(seat.cx - w * QUOTE.tailAcross, FLOOR_BOUNDS.left, FLOOR_BOUNDS.right - w);
  const options: { left: number; top: number; side: QuoteSide }[] = [
    { left: seat.cx + s / 2 + QUOTE.gap, top, side: "right" },
    { left: seat.cx - s / 2 - QUOTE.gap - w, top, side: "left" },
    { left, top: seat.cy - s / 2 - h - QUOTE.gap, side: "above" },
    { left, top: seat.cy + s / 2 + QUOTE.gap, side: "below" },
  ];
  const circles = [
    ...tables.map((t, i) => ({ x: t.x, y: t.y, r: t.r, weight: i === focus ? 3 : 1 })),
    { x: NEW_TABLE.cx, y: NEW_TABLE.cy, r: NEW_TABLE.r, weight: 1 },
    ...neighbors.filter((n) => n.cx !== seat.cx || n.cy !== seat.cy).map((n) => ({ x: n.cx, y: n.cy, r: n.size / 2, weight: 3 })),
  ];
  const cost = (o: { left: number; top: number }) => {
    const outside =
      Math.max(0, FLOOR_BOUNDS.left - o.left) +
      Math.max(0, o.left + w - FLOOR_BOUNDS.right) +
      Math.max(0, FLOOR_BOUNDS.top - o.top) +
      Math.max(0, o.top + h - FLOOR_BOUNDS.bottom);
    if (outside > 0) return Infinity;
    return circles.reduce((n, c) => n + c.weight * overlapDepth(o.left, o.top, w, h, c), 0);
  };
  let best = options[0];
  let bestCost = Infinity;
  for (const o of options) {
    const c = cost(o);
    if (c < bestCost) [best, bestCost] = [o, c];
    if (c === 0) break;
  }
  const halfDot = QUOTE.tailSize / 2;
  const horizontal = best.side === "right" || best.side === "left";
  return {
    ...best,
    tailLeft: horizontal ? (best.side === "right" ? -QUOTE.gap / 2 : w + QUOTE.gap / 2) - halfDot : seat.cx - best.left - halfDot,
    tailTop: horizontal ? seat.cy - best.top - halfDot : (best.side === "above" ? h + QUOTE.gap / 2 : -QUOTE.gap / 2) - halfDot,
  };
}

/** An exact excerpt, never an invented paraphrase of the assessor's question. */
export function questionExcerpt(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= QUOTE.maxCharacters) return clean;
  const cut = clean.slice(0, QUOTE.maxCharacters - 1);
  const wordEnd = cut.lastIndexOf(" ");
  return `${wordEnd > 0 ? cut.slice(0, wordEnd) : cut}…`;
}
