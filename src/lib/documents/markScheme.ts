// Turns a mark scheme (pasted text, or text extracted from a PDF) into
// weighted criteria. Pure, so it is unit tested. Images go through the engine
// instead (src/app/review/api/markscheme).

export type ParsedCriterion = { id: string; name: string; weight: number };

const PERCENT = /(\d{1,3}(?:\.\d+)?)\s*%/;
const MARKS = /(\d{1,3}(?:\.\d+)?)\s*(?:marks?|pts?|points?)\b/i;
const TRAILING_NUMBER = /[\s:\-–—|(]+(\d{1,3}(?:\.\d+)?)\s*\)?\s*$/;

function slug(name: string, used: Set<string>): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "criterion";
  let id = base;
  for (let i = 2; used.has(id); i++) id = `${base}-${i}`;
  used.add(id);
  return id;
}

function cleanName(raw: string): string {
  return raw
    .replace(PERCENT, "")
    .replace(MARKS, "")
    .replace(TRAILING_NUMBER, "")
    .replace(/\(\s*\)/g, "") // brackets left empty by removing "(10%)"
    .replace(/^[\s\-–—•*·\d.)]+/, "") // bullets and numbering
    .replace(/[\s:\-–—|(]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Scale weights to whole numbers that sum to exactly 100. */
export function normaliseWeights<T extends { weight: number }>(items: T[]): T[] {
  const total = items.reduce((n, c) => n + Math.max(0, c.weight), 0);
  if (items.length === 0) return items;
  if (total <= 0) {
    const even = Math.floor(100 / items.length);
    return items.map((c, i) => ({ ...c, weight: i === 0 ? 100 - even * (items.length - 1) : even }));
  }
  const scaled = items.map((c) => ({ ...c, weight: (Math.max(0, c.weight) / total) * 100 }));
  const rounded = scaled.map((c) => ({ ...c, weight: Math.floor(c.weight) }));
  let left = 100 - rounded.reduce((n, c) => n + c.weight, 0);
  // Hand the remainder to the largest fractional parts.
  const order = scaled.map((c, i) => ({ i, frac: c.weight - Math.floor(c.weight) })).sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (left <= 0) break;
    rounded[i].weight += 1;
    left -= 1;
  }
  return rounded;
}

/**
 * Lines with a weight become criteria ("Originality 30%", "Methods — 20 marks",
 * "Presentation: 10"). If no line carries a weight, short heading-like lines
 * become criteria with equal weights. Weights are scaled to 100.
 */
export function parseMarkScheme(text: string): ParsedCriterion[] {
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 1 && l.length < 160);

  const used = new Set<string>();
  const weighted: ParsedCriterion[] = [];
  for (const line of lines) {
    if (/^total\b/i.test(line)) continue;
    const m = line.match(PERCENT) ?? line.match(MARKS) ?? line.match(TRAILING_NUMBER);
    if (!m) continue;
    const weight = parseFloat(m[1]);
    const name = cleanName(line);
    if (!name || weight <= 0 || weight > 100 || name.length > 80) continue;
    weighted.push({ id: slug(name, used), name, weight });
  }
  if (weighted.length > 0) return normaliseWeights(weighted.slice(0, 12));

  // No weights: take short lines that look like criteria.
  const plain = lines
    .map(cleanName)
    .filter((l) => l && l.split(/\s+/).length <= 8 && !/[.!?]$/.test(l))
    .slice(0, 8);
  return normaliseWeights(plain.map((name) => ({ id: slug(name, used), name, weight: 1 })));
}

/**
 * Named criteria with optional weights (from the image reader) to criteria
 * with ids and weights summing to 100. A missing weight takes the mean of the
 * given ones, so a half-labelled scheme still splits sensibly.
 */
export function toCriteria(items: { name: string; weight: number | null }[]): ParsedCriterion[] {
  const used = new Set<string>();
  const valid = (w: number | null): w is number => w !== null && w > 0 && w <= 100;
  const kept: { name: string; weight: number | null }[] = [];
  for (const c of items) {
    const name = cleanName(c.name).slice(0, 80);
    if (!name || kept.some((k) => k.name.toLowerCase() === name.toLowerCase())) continue;
    kept.push({ name, weight: valid(c.weight) ? c.weight : null });
    if (kept.length >= 12) break;
  }
  const given = kept.map((c) => c.weight).filter(valid);
  const fill = given.length ? given.reduce((a, b) => a + b, 0) / given.length : 1;
  return normaliseWeights(kept.map((c) => ({ id: slug(c.name, used), name: c.name, weight: c.weight ?? fill })));
}
