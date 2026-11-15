// Desk sheet: every document and feedback report (§9).
import Link from "next/link";
import { useRef, useState } from "react";
import { Button, Chip, IconButton, Label } from "@/components/ui";
import type { FloorModel, FloorTable } from "../model";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
/** Mono date and time, e.g. "5 NOV · 14:30" (UTC, so server and browser agree). */
function dateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} · ${hh}:${mm}`;
}

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
    <section id="floor-desk" className="fl-sheet fl-sheet--desk" data-open={open} aria-hidden={!open} aria-label="Past sessions and uploads" inert={!open}>
      <div className="fl-sheet__head">
        <div className="fl-sheet__titles">
          <h2 className="fl-sheet__title">Past sessions and uploads</h2>
          <span className="fl-sheet__sub">{allTables || !table ? "Every panel" : table.name} · documents and feedback</span>
        </div>
        <div className="fl-sheet__actions">
          {table && <><Chip active={!allTables} onClick={() => onScope(false)}>This panel</Chip><Chip active={allTables} onClick={() => onScope(true)}>All panels</Chip></>}
        <IconButton label="Close" quiet onClick={onClose}>
          ×
        </IconButton>
        </div>
      </div>
      <div key={scope} ref={grid} className="fl-desk-grid" tabIndex={0} aria-label="Documents and feedback, scroll to see more" onScroll={(event) => {
        const el = event.currentTarget;
        setPosition({ scope, bottom: el.scrollTop + el.clientHeight >= el.scrollHeight - 2 });
      }}>
        <div className="fl-desk-group">
          <Label tone="ink">Feedback reports · {reports.length}</Label>
        </div>
        {reports.length === 0 && <p className="fl-desk-group__empty">No feedback reports yet. Finish a review or a presentation practice.</p>}
        {reports.map((r) => {
          const body = (
            <>
              <span className="fl-desk-card__type">
                <i className={`ui-state ui-state--rim ui-state--${r.state}`} aria-hidden />
                <Label size="sm">Feedback report</Label>
                {r.sample && <Label size="sm" tone="orange">Sample</Label>}
              </span>
              <span className="fl-desk-card__title">Attempt {r.attempt} · {r.kind}</span>
              <span className="fl-desk-card__sub">{r.verdict}</span>
              <Label size="sm" tone="quiet" className="fl-desk-card__date">
                {dateTime(r.at)} · {r.code}
              </Label>
              <span className="fl-desk-card__count" data-open={r.open > 0}>
                {r.open} open
              </span>
            </>
          );
          return r.href ? (
            <Link key={r.id} href={r.href} className="fl-desk-card" aria-label={`Feedback report, attempt ${r.attempt}, ${r.kind}`}>
              {body}
            </Link>
          ) : (
            <div key={r.id} className="fl-desk-card" data-static="true">
              {body}
            </div>
          );
        })}

        <div className="fl-desk-group">
          <Label tone="ink">Uploads · {docs.length}</Label>
        </div>
        {docs.length === 0 && <p className="fl-desk-group__empty">No uploads yet. Upload a report to have the board review it.</p>}
        {docs.map((d) => (
          <Link key={d.id} href={d.href} className="fl-desk-card" aria-label={`Upload, ${d.title}`}>
            <span className="fl-desk-card__type">
              <span className="fl-desk-card__paper fl-desk-card__paper--small" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              <Label size="sm">Upload</Label>
            </span>
            <span className="fl-desk-card__title">{d.title}</span>
            <Label size="sm" tone="quiet" className="fl-desk-card__date">
              {d.at ? `${dateTime(d.at)} · ` : ""}{d.code}
            </Label>
            <span className="fl-desk-card__sub">{d.usedBy ? `Used in ${d.usedBy}` : "Not reviewed yet"}</span>
          </Link>
        ))}

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
        <Label>{reports.length} feedback {reports.length === 1 ? "report" : "reports"} · {docs.length} {docs.length === 1 ? "upload" : "uploads"}</Label>
        {moreRows && <Button variant="quiet" size="sm" onClick={() => {
          const el = grid.current;
          if (!el) return;
          el.scrollTo({ top: bottom ? 0 : el.scrollTop + el.clientHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        }}><Label tone="ink">{bottom ? "Back to top ↑" : "More below ↓"}</Label></Button>}
      </div>
    </section>
  );
}
