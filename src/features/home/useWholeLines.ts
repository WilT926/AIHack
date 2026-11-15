"use client";

// Keeps the side panel a fixed size. When its content is taller than the
// panel, the scrollable sections ([data-lines]) are trimmed one whole line at
// a time (the busiest section first) until everything fits, so a section
// never shows half a line. Each trimmed section then scrolls on its own.
import { useLayoutEffect, type RefObject } from "react";

/** The top of each visual line in a scroll body, relative to the body's top edge. */
function lineTops(body: HTMLElement): number[] {
  const sel = body.dataset.linesItems;
  const items = sel ? [...body.querySelectorAll<HTMLElement>(sel)] : ([...body.children] as HTMLElement[]);
  const top = body.getBoundingClientRect().top - body.scrollTop;
  const tops = new Set<number>();
  for (const el of items) tops.add(Math.round(el.getBoundingClientRect().top - top));
  return [...tops].sort((a, b) => a - b);
}

export function useWholeLines(panelRef: RefObject<HTMLElement | null>, deps: unknown[]) {
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    let frame = 0;
    const fit = () => {
      const bodies = [...panel.querySelectorAll<HTMLElement>("[data-lines]")];
      // Natural heights first.
      for (const b of bodies) b.style.height = "";
      let excess = panel.scrollHeight - panel.clientHeight;
      if (excess <= 0) return;
      // Each body: its line tops, and how many lines are showing.
      const state = bodies.map((b) => ({ b, tops: lineTops(b), shown: lineTops(b).length }));
      // Height a body needs to show its first `n` lines (up to the top of line n+1).
      const heightFor = (s: (typeof state)[number], n: number) => (n >= s.tops.length ? s.b.scrollHeight : s.tops[n]);
      while (excess > 0) {
        const busiest = state.filter((s) => s.shown > 1).sort((a, z) => z.shown - a.shown)[0];
        if (!busiest) break;
        const before = heightFor(busiest, busiest.shown);
        busiest.shown -= 1;
        excess -= before - heightFor(busiest, busiest.shown);
      }
      for (const s of state) if (s.shown < s.tops.length) s.b.style.height = `${heightFor(s, s.shown)}px`;
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };
    fit();
    const mo = new MutationObserver(schedule);
    mo.observe(panel, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      mo.disconnect();
      window.removeEventListener("resize", schedule);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
