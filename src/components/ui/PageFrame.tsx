import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { getProfile } from "@/lib/data";
import { loadPlusTables } from "@/features/home/load";
import { Skeleton } from "./index";
import { AppBar, ProfileMenu, SearchPill } from "./AppBar";
import { NavDock, type NavDockId } from "./NavDock";

export type NavId = "home" | "assessors" | "profile" | "studio";

/** The dock, with the tables its "+" menu offers. */
async function FrameDock({ active }: { active: NavDockId | null }) {
  await connection();
  const { tables, newProjectHref } = await loadPlusTables();
  return <NavDock active={active} tables={tables} newProjectHref={newProjectHref} />;
}

const LEVEL: Record<string, string> = { UG: "Undergraduate", PGT: "PGT", PGR: "PGR" };

async function FrameProfile() {
  await connection();
  const p = await getProfile();
  if (!p) return null;
  return <ProfileMenu profile={{ name: p.name, sub: `${p.course} · ${LEVEL[p.level] ?? p.level}`, avatar: p.avatar }} />;
}

/** The profile pill while it loads. */
export function ProfileSkeleton() {
  return (
    <span className="ui-profile ui-profile--loading" aria-hidden>
      <Skeleton shape="avatar" />
      <span className="ui-profile__text">
        <Skeleton shape="line-short" />
        <Skeleton shape="line-short" />
      </span>
    </span>
  );
}

/**
 * Frame for every page other than the floor: the same top bar (logo, search,
 * profile menu) and the same bottom dock as the floor, with the content in a
 * fluid column between them (§9, §10).
 */
export function PageFrame({
  title,
  active,
  aside,
  bare,
  children,
}: {
  title: string;
  active?: NavId;
  aside?: ReactNode;
  /** The page lays itself out (no title row or centred column), e.g. Settings. */
  bare?: boolean;
  children: ReactNode;
}) {
  const dockActive: NavDockId | null = active === "home" ? "floor" : active === "studio" ? "assessors" : (active ?? null);
  return (
    <div className="ui-frame">
      <AppBar
        search={<SearchPill searchHref="/?find=1" />}
        profile={
          <Suspense fallback={<ProfileSkeleton />}>
            <FrameProfile />
          </Suspense>
        }
      />
      {bare ? (
        <main className="ui-frame__bare" aria-label={title}>
          {children}
        </main>
      ) : (
        <main className="ui-frame__main">
          <div className="ui-frame__titlebar">
            <h1 className="ui-frame__title">{title}</h1>
            {aside}
          </div>
          {children}
        </main>
      )}
      <Suspense fallback={<NavDock active={dockActive} />}>
        <FrameDock active={dockActive} />
      </Suspense>
    </div>
  );
}

/**
 * The real top bar and dock while a page loads (no grey placeholders), so
 * they stay put and glide instead of flickering between pages.
 */
export function LoadingChrome() {
  return (
    <>
      <AppBar search={<SearchPill searchHref="/?find=1" />} profile={<ProfileSkeleton />} />
      <NavDock active={undefined} />
    </>
  );
}
