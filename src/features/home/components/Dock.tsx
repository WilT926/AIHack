// Bubble dock with the orange "+" (§9).
import { useId, useState } from "react";
import { DockMotion } from "@/components/ui/DockMotion";
import { features } from "@/config";
import { Button } from "@/components/ui";
import { DOCK } from "@/styles/floor";
import type { Sheet } from "../Floor";
import type { FloorTable } from "../model";

/** closed → menu (two pills) → which table, for a review or a presentation. */
export type PlusState = "closed" | "menu" | "review" | "pitch";

export function Dock({
  sheet,
  openActions,
  plus,
  tables,
  newProjectHref,
  onSheet,
  onProfile,
  onSettings,
  onPlus,
}: {
  sheet: Sheet;
  openActions: number;
  plus: PlusState;
  tables: FloorTable[];
  newProjectHref: string;
  onSheet: (s: Sheet) => void;
  onProfile: () => void;
  onSettings: () => void;
  onPlus: (p: PlusState) => void;
}) {
  const gooId = useId();
  const [hover, setHover] = useState(-1);
  const active = sheet === "desk" ? 1 : sheet === "assessors" ? 2 : 0;

  const items = [
    { label: "Floor", icon: <span className="fl-ico-floor"><i /><i /></span>, onClick: () => onSheet(null) },
    {
      label: openActions ? `Desk · ${openActions} open` : "Desk",
      icon: <span className="fl-ico-desk">{openActions > 0 && <b>{openActions}</b>}</span>,
      onClick: () => onSheet("desk"),
    },
    { label: "Assessors", icon: <span className="fl-ico-assessors"><i /><i /><i /></span>, onClick: () => onSheet("assessors") },
    { label: "Your profile", icon: <span className="fl-ico-avatar"><i /><i /></span>, onClick: onProfile },
    { label: "Settings", icon: <i className="fl-ico-settings" />, onClick: onSettings },
  ];

  const kinds: { kind: "pitch" | "review"; label: string }[] = [];
  if (features.pitch) kinds.push({ kind: "pitch", label: "Practise a presentation" });
  if (features.review) kinds.push({ kind: "review", label: "Review a report" });

  const hrefFor = (kind: "pitch" | "review", projectId: string) =>
    kind === "pitch" ? `/pitch?project=${projectId}` : `/review/new?project=${projectId}`;
  const choices = tables.filter((t) => t.kind === plus);

  return (
    <DockMotion className="fl-dock">
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs><filter id={gooId} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={6} result="b" />
          <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" />
        </filter></defs>
      </svg>
      <div className="fl-dock__goo" style={{ filter: `url("#${gooId}")` }} aria-hidden>
        {items.map((_, k) => (
          <i key={k} style={{ left: k * DOCK.pitch }} />
        ))}
        <i />
      </div>
      <div className="fl-dock__active" style={{ left: (DOCK.bubble - DOCK.activeSize) / 2 + active * DOCK.pitch }} aria-hidden />
      <nav aria-label="Main">
        <ul className="fl-dock__nav">
          {items.map((it, k) => (
            <li key={it.label}>
              <button
                type="button"
                className="fl-dock__item"
                style={{ left: k * DOCK.pitch }}
                aria-label={it.label}
                aria-current={k === active ? "page" : undefined}
                onClick={it.onClick}
                onMouseEnter={() => setHover(k)}
                onMouseLeave={() => setHover(-1)}
                onFocus={() => setHover(k)}
                onBlur={() => setHover(-1)}
              >
                {it.icon}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      {hover >= 0 && (
        <div className="fl-dock__tip" style={{ left: DOCK.bubble / 2 + hover * DOCK.pitch }} role="tooltip">
          {items[hover].label}
        </div>
      )}

      <button
        type="button"
        className="fl-plus"
        aria-label={plus === "closed" ? "Start something new" : "Close"}
        aria-expanded={plus !== "closed"}
        onClick={() => onPlus(plus === "closed" ? "menu" : "closed")}
      >
        +
      </button>

      {plus === "menu" && (
        <div className="fl-plus-menu">
          {kinds.map((k, i) => (
            <Button key={k.kind} variant={i === 0 && kinds.length > 1 ? "primary" : "secondary"} onClick={() => onPlus(k.kind)}>
              {k.label}
            </Button>
          ))}
        </div>
      )}

      {(plus === "review" || plus === "pitch") && (
        <div className="fl-plus-menu" key={plus}>
          <span className="fl-plus-menu__label">Which table?</span>
          {choices.map((t) => (
            <Button key={t.id} variant="secondary" href={hrefFor(plus, t.id)}>
              {t.name}
            </Button>
          ))}
          <Button variant="primary" href={newProjectHref}>
            New table
          </Button>
        </div>
      )}
    </DockMotion>
  );
}
