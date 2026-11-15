"use client";

// The Floor, the product's home screen (DESIGN_SYSTEM §7–§9). Ported from
// design/Panel Home Final.dc.html: a 1440×900 stage scaled to fit, tables
// tweened in polar space with easeOutBack, a side panel for the focused
// table, the bubble dock, sheets and the command palette.
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ASSESSOR_CARD, MOTION, STAGE } from "@/styles/floor";
import { ease, focusPath, lerpPolar, slots, type Polar } from "./geometry";
import type { FloorFilter, FloorModel } from "./model";
import { TopBar } from "./components/TopBar";
import { Tables } from "./components/Tables";
import { FilterBar } from "./components/FilterBar";
import { SidePanel } from "./components/SidePanel";
import { AssessorsSheet } from "./components/AssessorsSheet";
import { DeskSheet } from "./components/DeskSheet";
import { Dock, type PlusState } from "./components/Dock";
import { CommandPalette } from "./components/CommandPalette";

export type Sheet = null | "desk" | "assessors";

// ---------- Viewport scale and reduced motion, read without effects ----------

function subscribeResize(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}
const readScale = () => Math.min(window.innerWidth / STAGE.width, window.innerHeight / STAGE.height);
const serverScale = () => 0;

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
  const router = useRouter();
  const n = model.tables.length;
  const scale = useSyncExternalStore(subscribeResize, readScale, serverScale);
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
  const [beads, setBeads] = useState<Record<string, number>>({});

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
  const selectedAssessor = model.assessors.find((a) => a.id === assessorId) ?? null;
  const beadIndex = table
    ? (beads[table.id] ??
      (() => {
        const i = table.sessions.findIndex((s) => s.state !== "done");
        return i < 0 ? Math.max(0, table.sessions.length - 1) : i;
      })())
    : 0;

  return (
    <div className="fl-viewport" style={{ "--floor-scale": scale || 1 } as React.CSSProperties}>
      <div
        className="fl-stage"
        data-ready={scale > 0}
        style={{ transform: `scale(${scale || 1})` }}
        aria-label="Your floor"
      >
        <TopBar
          profile={model.profile}
          onSearch={() => setPalette(true)}
          assessor={selectedAssessor}
          onClearAssessor={() => setAssessorId(null)}
          sample={model.sample}
        />

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

        <FilterBar filter={filter} onFilter={setFilter} />

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

        <SidePanel
          table={table}
          index={focus}
          count={n}
          beadIndex={beadIndex}
          selectedAssessorId={assessorId}
          newProjectHref={model.newProjectHref}
          onBead={(k) => table && setBeads((b) => ({ ...b, [table.id]: k }))}
          onPrev={() => focusTable((focus + n - 1) % n)}
          onNext={() => focusTable((focus + 1) % n)}
          onPerson={(id) => openAssessor(id)}
          onEditBoard={() => openAssessor(null)}
        />

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
      </div>
      <Dock
        sheet={sheet}
        openActions={model.openActions}
        plus={plus}
        tables={model.tables}
        newProjectHref={model.newProjectHref}
        onSheet={(s) => {
          setSheet((cur) => (s === null ? null : cur === s ? null : s));
          setPlus("closed");
        }}
        onProfile={() => router.push("/profile")}
        onSettings={() => router.push("/settings")}
        onPlus={(p) => {
          setPlus(p);
          if (p !== "closed") setSheet(null);
        }}
      />
    </div>
  );
}
