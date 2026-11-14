// Command palette (⌘K or /): jump to a table, an assessor or a document (§9).
import { useMemo, useState } from "react";
import type { FloorAssessor, FloorTable } from "../model";

type Result = {
  key: string;
  label: string;
  sub: string;
  kind: "TABLE" | "ASSESSOR" | "DOC";
  state: "live" | "table" | "assessor" | "doc";
  run: () => void;
};

export function CommandPalette({
  tables,
  assessors,
  onClose,
  onTable,
  onAssessor,
  onDoc,
}: {
  tables: FloorTable[];
  assessors: FloorAssessor[];
  onClose: () => void;
  onTable: (i: number) => void;
  onAssessor: (id: string) => void;
  onDoc: () => void;
}) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);

  const all = useMemo<Result[]>(
    () => [
      ...tables.map<Result>((t, i) => ({
        key: `t-${t.id}`,
        label: t.name,
        sub: t.line,
        kind: "TABLE",
        state: t.live ? "live" : "table",
        run: () => onTable(i),
      })),
      ...assessors.map<Result>((a) => ({
        key: `a-${a.id}`,
        label: a.name,
        sub: `${a.role} · ${a.field}`,
        kind: "ASSESSOR",
        state: "assessor",
        run: () => onAssessor(a.id),
      })),
      ...tables.flatMap((t) =>
        t.docs.map<Result>((d) => ({ key: `d-${d.id}`, label: d.title, sub: t.name, kind: "DOC", state: "doc", run: onDoc })),
      ),
    ],
    [tables, assessors, onTable, onAssessor, onDoc],
  );

  const ql = q.trim().toLowerCase();
  const results = (ql ? all.filter((r) => `${r.label} ${r.sub}`.toLowerCase().includes(ql)) : all.slice(0, 6)).slice(0, 7);
  const active = Math.min(sel, Math.max(0, results.length - 1));

  return (
    <div className="fl-pal-scrim" onClick={onClose}>
      <div className="fl-pal" role="dialog" aria-modal="true" aria-label="Search" onClick={(e) => e.stopPropagation()}>
        <div className="fl-pal__input-row">
          <i className="fl-pal__ring" aria-hidden />
          <input
            autoFocus
            className="fl-pal__input"
            value={q}
            placeholder="Type a table, assessor or document…"
            aria-label="Search tables, assessors and documents"
            aria-controls="fl-pal-results"
            aria-activedescendant={results[active] ? `fl-pal-${results[active].key}` : undefined}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSel(Math.min(results.length - 1, active + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSel(Math.max(0, active - 1));
              } else if (e.key === "Enter" && results[active]) {
                e.preventDefault();
                results[active].run();
              }
            }}
          />
          <span className="fl-kbd" aria-hidden>
            ESC
          </span>
        </div>
        <ul className="fl-pal__list" id="fl-pal-results" role="listbox">
          {results.map((r, i) => (
            <li key={r.key} id={`fl-pal-${r.key}`} role="option" aria-selected={i === active}>
              <button type="button" className="fl-pal__item" data-active={i === active} onClick={r.run} onMouseEnter={() => setSel(i)}>
                <span className={`fl-pal__state fl-pal__state--${r.state}`} aria-hidden />
                <span className="fl-pal__text">
                  <span className="fl-pal__label">{r.label}</span>
                  <span className="fl-pal__sub">{r.sub}</span>
                </span>
                <span className="fl-pal__kind">{r.kind}</span>
              </button>
            </li>
          ))}
        </ul>
        {results.length === 0 && <div className="fl-pal__empty">Nothing found. Try an assessor&rsquo;s name or a document title.</div>}
      </div>
    </div>
  );
}
