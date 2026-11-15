// Floor geometry (design/DESIGN_SYSTEM.md §7 and §8), ported from
// design/Panel Home Final.dc.html. All numbers are stage pixels on the
// 1440×900 canvas, which is scaled to fit the viewport.

export const STAGE = { width: 1440, height: 900 } as const;

/** Floor plan: centre 520,455, ellipse 420×280. */
export const FLOOR = { cx: 520, cy: 455, rx: 420, ry: 280 } as const;

/** Focused table radius and side-table radius. */
export const TABLE_R = { focus: 140, side: 92 } as const;

/** Ring slots, in degrees: upper-left, lower-left, upper-right. */
export const RING_SLOTS = [215, 152, 325] as const;

/** Most tables the floor shows: the focus slot plus the ring slots. */
export const MAX_TABLES = RING_SLOTS.length + 1;

/** The focused table's angle advances by this much on every focus change. */
export const FOCUS_SPIN = 50;

/** A table leaving the centre starts from (target angle − this) so it swings out. */
export const SWING_OUT = 90;

export const MOTION = {
  focusMs: 1000,
  /** easeOutBack overshoot (§8: c1 = 1.5). */
  c1: 1.5,
  quoteMs: 3000,
  toastMs: 2400,
} as const;

/** Tables at or above this radius show full content. */
export const FULL_CONTENT_R = 120;

export const SEAT = {
  /** Avatar size = table radius × this. */
  scale: 0.64,
  /** First seat angle in degrees, then evenly spaced. */
  startDeg: -110,
  /** Gap between the table edge and the avatar box. */
  gap: 2,
} as const;

export const RIM = {
  size: 11,
  /** Inset from the table edge to the dot centre line. */
  inset: 17,
  stepDeg: 12,
} as const;

export const PAPER = {
  widthScale: 0.34,
  aspect: 1.25,
  /** Paper centre offset from the table centre, × radius. */
  dx: 0.5,
  dy: -0.78,
  /** Smallest table that still shows its paper. */
  minR: 80,
} as const;

export const QUOTE = {
  /** Bounded two-line preview; the full question stays in the feedback report. */
  width: 280,
  height: 64,
  maxCharacters: 68,
  gap: 18,
  tailSize: 10,
  /** Thought dots sit off-centre while still pointing back to the speaker. */
  tailAcross: 0.28,
  tailDown: 0.72,
} as const;

/** The dashed "New table" circle: centre and radius. */
export const NEW_TABLE = { cx: 850, cy: 640, r: 78 } as const;

/**
 * Wide windows: the floor spreads sideways by up to this factor (table centres
 * and the "New panel" circle move apart; sizes stay the same), keeping
 * `marginShare` of the width free as margins either side.
 */
export const SPREAD = { max: 1.4, marginShare: 0.1 } as const;

/** The floor's usable area at spread 1; the side panel starts at x 1056. */
export const FLOOR_BOUNDS = { left: 16, top: 96, right: 1040, bottom: 800 } as const;

export const COMPACT = {
  /** Compact name size = radius × this, clamped. */
  nameScale: 0.19,
  nameMin: 11,
  nameMax: 19,
  /** Smallest table that still shows its short status. */
  statusMinR: 78,
  padFull: 30,
  padCompact: 10,
  titleLift: 8,
} as const;

/** Opacity of tables that do not match the filter. */
export const DIM_OPACITY = 0.18;

/**
 * Adaptive layout, in real pixels (src/styles/shell.css). The top bar and the
 * dock keep their size; the side panel is pinned to the right edge; the floor
 * band of the stage (x 0..fitRight, y fitTop..fitBottom) scales to fill the
 * main area left of the panel.
 */
export const CHROME = { top: 84, bottom: 100, gutter: 28, fitTop: 92, fitBottom: 800, fitRight: 1040 } as const;

/**
 * The side panel keeps its original inner layout: it is laid out at its design
 * size (358px wide; 768px tall on a 1440x900 screen) and scaled as one piece,
 * as the original stage did. `top`/`bottom` are its real distances from the
 * window edges; `gap` is the space between the floor and the panel.
 */
export const PANEL = { width: 358, height: 768, top: 104, bottom: 28, gap: 20, minScale: 0.6, maxScale: 1.25 } as const;

export const ASSESSOR_CARD = { width: 228, gap: 16, visible: 4 } as const;
