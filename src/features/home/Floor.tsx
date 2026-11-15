"use client";

// The Floor, the product's home screen (DESIGN_SYSTEM §7–§9). Ported from
// design/Panel Home Final.dc.html: a 1440×900 stage, tables tweened in polar
// space with easeOutBack, a side panel for the focused table and its sheets.
// The top bar, dock and command palette sit outside the stage at their real
// size; the stage scales to fill the space between them, so it fits any screen.
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ASSESSOR_CARD, CHROME, MOTION, PANEL } from "@/styles/floor";
import { ease, focusPath, lerpPolar, slots, type Polar } from "./geometry";
import type { FloorFilter, FloorModel } from "./model";
import { TopBar } from "./components/TopBar";
import { Tables } from "./components/Tables";
import { SidePanel } from "./components/SidePanel";
import { AssessorsSheet } from "./components/AssessorsSheet";
import { DeskSheet } from "./components/DeskSheet";
import { Dock, type PlusState } from "./components/Dock";
import { CommandPalette } from "./components/CommandPalette";
import { markTableViewed } from "./actions";

export type Sheet = null | "desk" | "assessors";

// ---------- Viewport scale and reduced motion, read without effects ----------

function subscribeResize(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}
const readSize = () => `${window.innerWidth}x${window.innerHeight}`;
const serverSize = () => "";

/**
 * The adaptive layout. The side panel is pinned to the right edge and scaled
 * as one piece (its inner layout never changes); the stage's floor band is
 * scaled to fill the main area left of it, between the top bar and the dock.
 * `center` is the main area's middle, where the search pill and the dock sit.
 */
function fit(size: string, panelContent: number) {
  if (!size) return { scale: 0, x: 0, y: 0, panel: PANEL.width, panelK: 1, panelH: PANEL.height, center: 0 };
  const [w, h] = size.split("x").map(Number);
  const room = h - PANEL.top - PANEL.bottom;
  const baseK = Math.max(PANEL.minScale, Math.min(PANEL.maxScale, w / 1440, room / PANEL.height));
  /** Shortest design height: scaled by baseK it reaches PANEL.bottom from the window's bottom edge. */
  const panelH = Math.round(room / baseK);
  /** When the content is taller than that, scale a little further so all of it fits: no scrollbar, nothing cut off. */
  const panelK = panelContent > panelH ? room / panelContent : baseK;
  const panel = Math.round(PANEL.width * panelK);
  const left = CHROME.gutter;
  const right = w - CHROME.gutter - panel - PANEL.gap;
  const mainW = Math.max(200, right - left);
  const mainH = Math.max(200, h - CHROME.top - CHROME.bottom);
  const bandW = CHROME.fitRight;
  const bandH = CHROME.fitBottom - CHROME.fitTop;
  const scale = Math.max(0.3, Math.min(mainW / bandW, mainH / bandH));
  return {
    scale,
    x: left + (mainW - bandW * scale) / 2,
    y: CHROME.top + (mainH - bandH * scale) / 2 - CHROME.fitTop * scale,
    panel,
    panelK,
    panelH,
    center: Math.round(left + mainW / 2),
  };
}

const REDUCED = "(prefers-reduced-motion: reduce)";
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const readReduced = () => window.matchMedia(REDUCED).matches;
const serverReduced = () => false;

// ---------- Component ----------

export function Floor({ model }: { model: FloorModel }) {
  const n = model.tables.length;
  const size = useSyncExternalStore(subscribeResize, readSize, serverSize);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelContent, setPanelContent] = useState(0);
  const { scale, x: stageX, y: stageY, panelK, panelH, center } = fit(size, panelContent);

  // The side panel's natural height (unscaled), so it can be scaled to fit whole.
  useEffect(() => {
    const aside = panelRef.current?.querySelector<HTMLElement>(".fl-panel");
    if (!aside) return;
    const measure = () => setPanelContent(aside.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(aside);
    return () => ro.disconnect();
  }, []);
  const reduced = useSyncExternalStore(subscribeReduced, readReduced, serverReduced);

  const [focus, setFocus] = useState(() => Math.min(model.initialFocus, Math.max(0, n - 1)));
  const [cur, setCur] = useState<Polar[]>(() => slots(n, Math.min(model.initialFocus, Math.max(0, n - 1)), null));
  const [anim, setAnim] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const [filter, setFilter] = useState<FloorFilter>("all");
  const [assessorId, setAssessorId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [allDeskTables, setAllDeskTables] = useState(false);
  const [carIdx, setCarIdx] = useState(0);
  const [plus, setPlus] = useState<PlusState>("closed");
  const [palette, setPalette] = useState(false);
  const [quoteTick, setQuoteTick] = useState(0);
  const [quotePaused, setQuotePaused] = useState(false);

  const curRef = useRef(cur);
  const focusRef = useRef(focus);
  const animRef = useRef(false);
  const rafRef = useRef(0);

  const applyCur = useCallback((next: Polar[]) => {
    curRef.current = next;
    setCur(next);
  }, []);

  /** Focus a table: 1000ms easeOutBack in polar space (§8). */
  const focusTable = useCallback(
    (i: number) => {
      if (n === 0) return;
      if (i === focusRef.current && !animRef.current) return;
      focusRef.current = i;
      setFocus(i);
      setAllDeskTables(false);
      setQuoteTick(0);
      setQuotePaused(false);
      setPlus("closed");
      cancelAnimationFrame(rafRef.current);
      if (reduced) {
        applyCur(slots(n, i, curRef.current));
        setFadeKey((k) => k + 1);
        return;
      }
      const { from, to } = focusPath(curRef.current, i);
      const t0 = performance.now();
      animRef.current = true;
      setAnim(true);
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / MOTION.focusMs);
        applyCur(lerpPolar(from, to, ease(t)));
        if (t < 1) rafRef.current = requestAnimationFrame(step);
        else {
          animRef.current = false;
          setAnim(false);
        }
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [n, reduced, applyCur],
  );

  const openAssessor = useCallback(
    (id: string | null) => {
      const idx = id ? model.assessors.findIndex((a) => a.id === id) : 0;
      const maxIdx = Math.max(0, model.assessors.length - ASSESSOR_CARD.visible);
      setAssessorId(id);
      setCarIdx(Math.max(0, Math.min(maxIdx, idx - 1)));
      setSheet("assessors");
      setPalette(false);
      setPlus("closed");
    },
    [model.assessors],
  );

  // Links from other pages: /?find=1 opens search, /?sheet=desk the Desk, /?plus=menu the "+".
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (![...q.keys()].length) return;
    const t = window.setTimeout(() => {
      if (q.get("find")) setPalette(true);
      const s = q.get("sheet");
      if (s === "desk" || s === "assessors") setSheet(s);
      if (q.get("plus") === "menu") setPlus("menu");
      window.history.replaceState(null, "", "/");
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  // Give each excerpt three seconds; pause while reading or using another surface.
  useEffect(() => {
    if (quotePaused || sheet || palette || plus !== "closed" || anim || reduced) return;
    const t = setInterval(() => setQuoteTick((q) => q + 1), MOTION.quoteMs);
    return () => clearInterval(t);
  }, [quotePaused, sheet, palette, plus, anim, reduced, focus]);

  useEffect(() => {
    if (!sheet) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Element && !event.target.closest(".fl-sheet, .fl-dock")) setSheet(null);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [sheet]);

  // Keyboard: ⌘K or / opens the palette, Esc closes, ← → cycle the focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !palette && !typing)) {
        e.preventDefault();
        setPalette(true);
      } else if (e.key === "Escape") {
        setPalette(false);
        setSheet(null);
        setPlus("closed");
      } else if (!palette && !typing && n > 0 && e.key === "ArrowRight") {
        focusTable((focusRef.current + 1) % n);
      } else if (!palette && !typing && n > 0 && e.key === "ArrowLeft") {
        focusTable((focusRef.current + n - 1) % n);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [palette, n, focusTable]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const table = model.tables[focus];
  const matches = useMemo(
    () =>
      model.tables.map(
        (t) => t.tags.includes(filter) && (!assessorId || t.seats.some((s) => s.assessorId === assessorId)),
      ),
    [model.tables, filter, assessorId],
  );
  // Opening a table (focusing it for a moment) records the visit, so the next
  // visit only calls feedback "new" if it arrived after this one.
  const focusedId = table?.id;
  useEffect(() => {
    if (!focusedId) return;
    const t = window.setTimeout(() => void markTableViewed(focusedId), 1500);
    return () => window.clearTimeout(t);
  }, [focusedId]);

  return (
    <div
      className="fl-viewport"
      style={center ? ({ "--nav-center": `${center}px`, "--panel-k": panelK, "--panel-h": `${panelH}px` } as React.CSSProperties) : undefined}
    >
      <TopBar
        profile={model.profile}
        onSearch={() => setPalette(true)}
        filter={filter}
        onFilter={setFilter}
        assessors={model.assessors}
        assessorId={assessorId}
        onAssessor={setAssessorId}
        tables={model.tables}
        onTable={(i) => {
          setSheet(null);
          focusTable(i);
        }}
      />
      <div
        className="fl-stage"
        data-ready={scale > 0}
        style={{ transform: `translate(${stageX}px, ${stageY}px) scale(${scale || 1})` }}
        aria-label="Your floor"
      >

        <Tables
          tables={model.tables}
          cur={cur}
          focus={focus}
          anim={anim}
          matches={matches}
          selectedAssessorId={assessorId}
          quoteTick={quoteTick}
          fadeKey={fadeKey}
          onQuotePause={setQuotePaused}
          deskOpen={sheet === "desk"}
          onFocus={(i) => {
            if (i === focusRef.current && !animRef.current) {
              setAllDeskTables(false);
              setSheet(sheet === "desk" ? null : "desk");
              setPlus("closed");
            } else focusTable(i);
          }}
          onNewTable={() => {
            setSheet(null);
            setPlus((p) => (p === "closed" ? "menu" : "closed"));
          }}
        />

        <AssessorsSheet
          open={sheet === "assessors"}
          assessors={model.assessors}
          selectedId={assessorId}
          focusCode={table?.code}
          carIdx={carIdx}
          onCarIdx={setCarIdx}
          onSelect={(id) => setAssessorId((cur) => (cur === id ? null : id))}
          onClose={() => setSheet(null)}
        />

        <DeskSheet
          open={sheet === "desk"}
          desk={model.desk}
          table={table}
          allTables={allDeskTables}
          onScope={setAllDeskTables}
          onClose={() => setSheet(null)}
        />


      </div>
      <div ref={panelRef} className="fl-panel-slot">
      <SidePanel
        key={table?.id ?? "none"}
        table={table}
        index={focus}
        count={n}
        assessors={model.assessors}
        selectedAssessorId={assessorId}
        newProjectHref={model.newProjectHref}
        onPrev={() => focusTable((focus + n - 1) % n)}
        onNext={() => focusTable((focus + 1) % n)}
        onPerson={(id) => {
          // Clicking the selected person again clears the filter.
          if (id === assessorId) {
            setAssessorId(null);
            setSheet(null);
          } else openAssessor(id);
        }}
      />
      </div>
      {palette && (
          <CommandPalette
            tables={model.tables}
            assessors={model.assessors}
            onClose={() => setPalette(false)}
            onTable={(i) => {
              setPalette(false);
              setSheet(null);
              focusTable(i);
            }}
            onAssessor={(id) => openAssessor(id)}
            onDoc={() => {
              setPalette(false);
              setAllDeskTables(true);
              setSheet("desk");
            }}
          />
        )}
      <Dock
        sheet={sheet}
        openActions={model.openActions}
        plus={plus}
        tables={model.tables}
        newProjectHref={model.newProjectHref}
        focusId={table?.id}
        onSheet={(s) => {
          setSheet((cur) => (s === null ? null : cur === s ? null : s));
          setPlus("closed");
        }}
        onPlus={(p) => {
          setPlus(p);
          if (p !== "closed") setSheet(null);
        }}
      />
    </div>
  );
}
