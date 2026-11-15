"use client";

// The bottom dock on every page (§9): ink bubbles joined by a gooey bridge,
// with one larger orange bubble for "+" in the middle. Floor and Desk on the
// left; Assessors and your profile on the right. The "+" opens its menu on
// click, on every page, without leaving the page (same options and motion as
// the original floor dock).
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { dockMemory, useGlide } from "./glide";
import { features } from "@/config";
import { Button, cn } from "./index";
import { MenuItem, MenuSection, Popover } from "./Popover";

export type NavDockId = "floor" | "desk" | "assessors" | "profile";
export type PlusTable = { id: string; name: string; kind: "review" | "pitch" };

/** Bubble geometry, in px; matches --nav-h, --nav-gap and --nav-plus in shell.css. */
const B = 50;
const GAP = 5;
const PLUS = 64;
const X = { floor: 0, desk: B + GAP, plus: 2 * (B + GAP), assessors: 2 * (B + GAP) + PLUS + GAP, profile: 3 * (B + GAP) + PLUS + GAP };
const WIDTH = X.profile + B;

const ICON: Record<NavDockId, ReactNode> = {
  floor: <span className="ui-ico-floor"><i /><i /></span>,
  desk: <span className="ui-ico-desk" />,
  assessors: <span className="ui-ico-assessors"><i /><i /><i /></span>,
  profile: <span className="ui-ico-avatar"><i /><i /></span>,
};
const LABEL: Record<NavDockId, string> = { floor: "Floor", desk: "Desk", assessors: "Assessors", profile: "User settings" };
const HREF: Record<NavDockId, string> = { floor: "/", desk: "/?sheet=desk", assessors: "/assessors", profile: "/settings?section=profile" };

/**
 * The "+" menu, as in the final home design (design/Panel Home Final.dc.html):
 * "Panel room" (presentation practice, /pitch) and "Live doc review" (report
 * review, /review/new). On the floor both open for the focused table; on other
 * pages they ask which table first.
 */
function PlusMenu({ tables, newProjectHref, focusId }: { tables: PlusTable[]; newProjectHref: string; focusId?: string }) {
  const [kind, setKind] = useState<"menu" | "review" | "pitch">("menu");
  const kinds: { kind: "pitch" | "review"; label: string }[] = [];
  if (features.pitch) kinds.push({ kind: "pitch", label: "Panel room" });
  if (features.review) kinds.push({ kind: "review", label: "Live doc review" });
  const hrefFor = (k: "pitch" | "review", id: string) => (k === "pitch" ? `/pitch?project=${id}` : `/review/new?project=${id}`);

  if (kind === "menu") {
    return (
      <div className="ui-plus-menu">
        {kinds.map((k, i) =>
          focusId ? (
            <Button key={k.kind} variant={i === 0 ? "primary" : "secondary"} href={hrefFor(k.kind, focusId)}>
              {k.label}
            </Button>
          ) : (
            <Button key={k.kind} variant={i === 0 ? "primary" : "secondary"} onClick={() => setKind(k.kind)}>
              {k.label}
            </Button>
          ),
        )}
        <Button variant="secondary" href={newProjectHref}>
          New panel
        </Button>
      </div>
    );
  }
  return (
    <div className="ui-plus-menu" key={kind}>
      <span className="ui-plus-menu__label">Which panel?</span>
      {tables
        .filter((t) => t.kind === kind)
        .map((t) => (
          <Button key={t.id} variant="secondary" href={hrefFor(kind, t.id)}>
            {t.name}
          </Button>
        ))}
      <Button variant="primary" href={newProjectHref}>
        New panel
      </Button>
    </div>
  );
}

export function NavDock({
  active,
  deskCount = 0,
  on = {},
  tables = [],
  newProjectHref = "/projects/new",
  focusId,
  plusOpen,
  onPlusOpen,
}: {
  /** The current page; `undefined` keeps the last page's (while a page loads). */
  active: NavDockId | null | undefined;
  deskCount?: number;
  /** Handlers that replace an item's link (the floor opens its sheets in place). */
  on?: Partial<Record<NavDockId, () => void>>;
  tables?: PlusTable[];
  newProjectHref?: string;
  /** The floor's focused table: the "+" options open straight for it. */
  focusId?: string;
  /** Optional control of the "+" menu (the floor's "New table" circle opens it). */
  plusOpen?: boolean;
  onPlusOpen?: (open: boolean) => void;
}) {
  const gooId = useId();
  const navRef = useRef<HTMLElement>(null);
  useGlide(navRef, "nav");
  const [hover, setHover] = useState<NavDockId | null>(null);
  const [menuKey, setMenuKey] = useState(0);

  const item = (id: NavDockId) => {
    const label = id === "desk" && deskCount > 0 ? `Desk · ${deskCount} open` : LABEL[id];
    const common = {
      className: cn("ui-nav__item", id === active && "ui-nav__item--active"),
      style: { left: X[id] },
      "aria-label": label,
      "aria-current": id === active ? ("page" as const) : undefined,
      onMouseEnter: () => setHover(id),
      onMouseLeave: () => setHover(null),
      onFocus: () => setHover(id),
      onBlur: () => setHover(null),
    };
    const content = (
      <>
        {ICON[id]}
        {id === "desk" && deskCount > 0 && <b className="ui-nav__badge">{deskCount}</b>}
      </>
    );
    const handler = on[id];
    return (
      <li key={id}>
        {handler ? (
          <button type="button" {...common} onClick={handler}>
            {content}
          </button>
        ) : (
          <Link href={HREF[id]} {...common}>
            {content}
          </Link>
        )}
      </li>
    );
  };

  /** Off the floor, Assessors opens a small menu: the full page or the avatar studio. */
  const assessorsItem = on.assessors ? (
    item("assessors")
  ) : (
    <li key="assessors" className="ui-nav__slot" style={{ left: X.assessors }}>
      <Popover
        side="top"
        align="center"
        label="Assessors"
        triggerClassName={cn("ui-nav__item ui-nav__item--static", active === "assessors" && "ui-nav__item--active")}
        trigger={ICON.assessors}
      >
        <MenuSection title="Assessors">
          <MenuItem href="/assessors" icon={ICON.assessors}>
            All assessors
          </MenuItem>
          <MenuItem href="/studio" icon={<i className="ui-ico-settings" />}>
            Avatar studio
          </MenuItem>
        </MenuSection>
      </Popover>
    </li>
  );

  const targetX = active === undefined ? dockMemory.activeX : active ? X[active] : null;
  // Start where the last page's circle was, then slide to this page's item.
  const [activeX, setActiveX] = useState<number | null>(() => dockMemory.activeX ?? targetX);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setActiveX(targetX));
    if (active !== undefined) dockMemory.activeX = targetX;
    return () => cancelAnimationFrame(raf);
  }, [targetX, active]);

  return (
    <nav ref={navRef} className="ui-nav" aria-label="Main" style={{ width: WIDTH }}>
      <svg width={0} height={0} className="ui-nav__defs" aria-hidden>
        <defs>
          <filter id={gooId} x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={6} result="b" />
            <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" />
          </filter>
        </defs>
      </svg>
      <div className="ui-nav__goo" style={{ filter: `url("#${gooId}")` }} aria-hidden>
        <i style={{ left: X.floor }} />
        <i style={{ left: X.desk }} />
        <i className="ui-nav__goo-plus" style={{ left: X.plus }} />
        <i style={{ left: X.assessors }} />
        <i style={{ left: X.profile }} />
        <i className="ui-nav__goo-bridge" />
      </div>
      {activeX !== null && <i className="ui-nav__active" style={{ left: activeX + 6 }} aria-hidden />}
      <ul className="ui-nav__list">
        {item("floor")}
        {item("desk")}
        {assessorsItem}
        {item("profile")}
      </ul>
      {hover && (
        <div className="ui-nav__tip" style={{ left: X[hover] + B / 2 }} role="tooltip">
          {hover === "desk" && deskCount > 0 ? `Desk · ${deskCount} open` : LABEL[hover]}
        </div>
      )}
      <Popover
        className="ui-nav__plus-slot"
        bare
        hover={false}
        side="top"
        align="center"
        label="Start something new"
        triggerClassName="ui-nav__plus"
        trigger={<span aria-hidden>+</span>}
        open={plusOpen}
        onOpenChange={(o) => {
          if (!o) setMenuKey((k) => k + 1);
          onPlusOpen?.(o);
        }}
      >
        <PlusMenu key={menuKey} tables={tables} newProjectHref={newProjectHref} focusId={focusId} />
      </Popover>
    </nav>
  );
}
