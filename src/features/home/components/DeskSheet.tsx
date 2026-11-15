// Desk sheet: every document and feedback report (§9).
import Link from "next/link";
import { useRef, useState } from "react";
import { Button, Card, Chip, IconButton, Label } from "@/components/ui";
import type { FloorModel, FloorTable } from "../model";

export function DeskSheet({
  open,
  desk,
  table,
  allTables,
  onScope,
  onClose,
}: {
  open: boolean;
  desk: FloorModel["desk"];
  table?: FloorTable;
  allTables: boolean;
  onScope: (allTables: boolean) => void;
  onClose: () => void;
}) {
  const docs = desk.docs.filter((d) => allTables || !table || d.projectId === table.id);
  const reports = desk.reports.filter((r) => allTables || !table || r.projectId === table.id);
  const reviewHref = !allTables && table ? `/review/new?project=${encodeURIComponent(table.id)}` : desk.reviewHref;
  const scope = `${table?.id ?? "none"}-${allTables}`;
  const grid = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ scope, bottom: false });
  const bottom = position.scope === scope && position.bottom;
  const moreRows = docs.length + reports.length + (reviewHref ? 1 : 0) > 4;
  return (
    <section id="floor-desk" className="fl-sheet fl-sheet--desk" data-open={open} aria-hidden={!open} aria-label="Your desk" inert={!open}>
      <div className="fl-sheet__head">
        <div className="fl-sheet__titles">
          <h2 className="fl-sheet__title">Your desk</h2>
          <span className="fl-sheet__sub">{allTables || !table ? "Every table" : table.name} · documents and feedback</span>
        </div>
        <div className="fl-sheet__actions">
          {table && <><Chip active={!allTables} onClick={() => onScope(false)}>This table</Chip><Chip active={allTables} onClick={() => onScope(true)}>All tables</Chip></>}
        <IconButton label="Close" quiet onClick={onClose}>
          ×
        </IconButton>
        </div>
      </div>
      <div key={scope} ref={grid} className="fl-desk-grid" tabIndex={0} aria-label="Documents and feedback, scroll to see more" onScroll={(event) => {
        const el = event.currentTarget;
        setPosition({ scope, bottom: el.scrollTop + el.clientHeight >= el.scrollHeight - 2 });
      }}>
        {docs.length === 0 && reports.length === 0 && <Card dashed className="fl-desk-empty"><Label>Nothing here yet</Label><p>Upload a report or finish a session to add documents and feedback to this table.</p></Card>}
        {docs.map((d) => (
          <Link key={d.id} href={d.href} className="fl-desk-card">
            <div className="fl-desk-card__paper" aria-hidden>
              <i />
              <i />
              <i />
            </div>
            <span className="fl-desk-card__title">{d.title}</span>
            <span className="fl-desk-card__sub">
              {d.project} · {d.code}
            </span>
            <span className="fl-desk-card__count" data-open={d.open > 0}>
              {d.open ? `${d.open} OPEN ${d.open === 1 ? "ACTION" : "ACTIONS"}` : "NOTHING OPEN"}
            </span>
          </Link>
        ))}

        {reports.map((r) => {
          const body = (
            <>
              <i className={`ui-state ui-state--rim ui-state--${r.state}`} aria-hidden />
              <span className="fl-desk-card__title">{r.title}</span>
              <span className="fl-desk-card__sub">Feedback report · {r.code}</span>
              <Label size="sm" tone="quiet" className="fl-desk-card__date">
                {r.date}
              </Label>
            </>
          );
          return r.href ? (
            <Link key={r.id} href={r.href} className="fl-desk-card">
              {body}
            </Link>
          ) : (
            <div key={r.id} className="fl-desk-card" data-static="true">
              {body}
            </div>
          );
        })}

        {reviewHref && (
          <Link href={reviewHref} className="fl-desk-new">
            <span className="fl-new-table__plus" aria-hidden>
              +
            </span>
            Review a report
          </Link>
        )}
      </div>
      <div className="fl-desk-scroll">
        <Label>{docs.length} {docs.length === 1 ? "document" : "documents"} · {reports.length} feedback {reports.length === 1 ? "report" : "reports"}</Label>
        {moreRows && <Button variant="quiet" size="sm" onClick={() => {
          const el = grid.current;
          if (!el) return;
          el.scrollTo({ top: bottom ? 0 : el.scrollTop + el.clientHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        }}><Label tone="ink">{bottom ? "Back to top ↑" : "More below ↓"}</Label></Button>}
      </div>
    </section>
  );
}
