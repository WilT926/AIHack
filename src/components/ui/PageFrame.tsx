import Link from "next/link";
import type { ReactNode } from "react";
import { Logo, cn } from "./index";

export type NavId = "home" | "assessors" | "profile";

const NAV: { id: NavId; label: string; href: string; icon: ReactNode }[] = [
  { id: "home", label: "Floor", href: "/", icon: <span className="ui-ico-floor"><i /><i /></span> },
  { id: "assessors", label: "Assessors", href: "/assessors", icon: <span className="ui-ico-assessors"><i /><i /><i /></span> },
  { id: "profile", label: "Your profile", href: "/profile", icon: <span className="ui-ico-avatar"><i /><i /></span> },
];

/**
 * Frame for every page other than the floor: the logo, a title, the content,
 * and the bubble dock with Home, Assessors and Profile (§9, §10). No top nav.
 */
export function PageFrame({
  title,
  active,
  aside,
  children,
}: {
  title: string;
  active?: NavId;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="ui-frame">
      <header className="ui-frame__head">
        <Link href="/" className="ui-frame__logo" aria-label="Panel, back to your floor">
          <Logo />
        </Link>
        {aside}
      </header>
      <main className="ui-frame__main">
        <h1 className="ui-frame__title">{title}</h1>
        {children}
      </main>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id="ui-goo" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={6} result="b" />
            <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" />
          </filter>
        </defs>
      </svg>
      <nav className="ui-dock" aria-label="Main">
        <div className="ui-dock__goo" aria-hidden>
          {NAV.map((n) => (
            <i key={n.id} />
          ))}
          <i />
        </div>
        <ul className="ui-dock__list">
          {NAV.map((n) => (
            <li key={n.id}>
              <Link
                href={n.href}
                className={cn("ui-dock__item", n.id === active && "ui-dock__item--active")}
                aria-current={n.id === active ? "page" : undefined}
                aria-label={n.label}
                title={n.label}
              >
                {n.icon}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
