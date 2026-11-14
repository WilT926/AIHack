// Desk sheet: every document and feedback report (§9).
import Link from "next/link";
import { IconButton, Label } from "@/components/ui";
import type { FloorModel } from "../model";

export function DeskSheet({
  open,
  desk,
  onOpenDoc,
  onClose,
}: {
  open: boolean;
  desk: FloorModel["desk"];
  onOpenDoc: (code: string) => void;
  onClose: () => void;
}) {
  return (
    <section className="fl-sheet fl-sheet--desk" data-open={open} aria-hidden={!open} aria-label="Your desk" inert={!open}>
      <div className="fl-sheet__head">
        <div className="fl-sheet__titles">
          <h2 className="fl-sheet__title">Your desk</h2>
          <span className="fl-sheet__sub">Documents and feedback reports</span>
        </div>
        <IconButton label="Close" quiet onClick={onClose}>
          ×
        </IconButton>
      </div>
      <div className="fl-desk-grid">
        {desk.docs.map((d) => (
          <button type="button" key={d.id} className="fl-desk-card" onClick={() => onOpenDoc(d.code)}>
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
          </button>
        ))}

        {desk.reports.map((r) => {
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

        {desk.reviewHref && (
          <Link href={desk.reviewHref} className="fl-desk-new">
            <span className="fl-new-table__plus" aria-hidden>
              +
            </span>
            Review a report
          </Link>
        )}
      </div>
    </section>
  );
}
