"use client";

// The bar across the top of every page: the logo, the search pill and the
// profile menu, all centred on one horizontal line (§9). Fixed to the
// viewport at its real size, so it fits any screen.
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { useGlide } from "./glide";
import { Avatar, Logo } from "./index";
import { MenuItem, MenuSection, Popover } from "./Popover";

export type AppBarProfile = { name: string; sub: string; avatar: string };

export function AppBar({ search, profile }: { search?: ReactNode; profile: ReactNode }) {
  return (
    <header className="ui-appbar">
      <Link href="/" className="ui-appbar__logo" aria-label="Panel, back to your floor">
        <Logo />
      </Link>
      <div className="ui-appbar__search">{search}</div>
      <div className="ui-appbar__profile">{profile}</div>
    </header>
  );
}

// ---------- Search pill ----------

export type SearchSegment = {
  key: string;
  /** What the filter is, read out and shown on hover, e.g. "Tables with Dr Cole". */
  label: string;
  icon: ReactNode;
  onRemove: () => void;
  /** Shown on hover: change this filter. */
  menu: ReactNode;
};

/**
 * One rounded pill split into parts with no gaps: find, then one part per
 * active filter (hover to change, click to remove), then the Filters button.
 */
export function SearchPill({
  onSearch,
  searchHref,
  segments = [],
  filterMenu,
  filterCount = 0,
}: {
  onSearch?: () => void;
  searchHref?: string;
  segments?: SearchSegment[];
  filterMenu?: ReactNode;
  filterCount?: number;
}) {
  const find = (
    <>
      <i className="ui-search__ring" aria-hidden />
      <span className="ui-search__text">Find a table, assessor or doc</span>
      <span className="ui-search__kbd" aria-hidden>
        ⌘K
      </span>
    </>
  );
  const ref = useRef<HTMLDivElement>(null);
  useGlide(ref, "search");
  return (
    <div ref={ref} className="ui-search" role="search">
      {searchHref ? (
        <Link href={searchHref} className="ui-search__find" aria-label="Find a table, assessor or doc (⌘K)">
          {find}
        </Link>
      ) : (
        <button type="button" className="ui-search__find" onClick={onSearch} aria-label="Find a table, assessor or doc (⌘K)">
          {find}
        </button>
      )}
      {segments.map((s) => (
        <Popover
          key={s.key}
          className="ui-search__part"
          triggerClassName="ui-search__seg"
          label={`${s.label}. Click to remove, hover to change`}
          onTriggerClick={s.onRemove}
          align="center"
          trigger={
            <>
              <span className="ui-search__seg-icon">{s.icon}</span>
              <i className="ui-search__seg-x" aria-hidden>
                ×
              </i>
            </>
          }
        >
          <span className="ui-menu__caption">{s.label}</span>
          {s.menu}
        </Popover>
      ))}
      {filterMenu && (
        <Popover
          className="ui-search__part"
          triggerClassName="ui-search__filters"
          label="Filters"
          trigger={
            <>
              <span className="ui-ico-filter" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              <span>Filters</span>
              {filterCount > 0 && <b className="ui-search__count">{filterCount}</b>}
            </>
          }
        >
          {filterMenu}
        </Popover>
      )}
    </div>
  );
}

// ---------- Profile menu ----------

/** The profile pill. Hover or click: profile settings and help, then sign out on its own. */
export function ProfileMenu({ profile }: { profile: AppBarProfile }) {
  const avatar = profile.avatar;
  return (
    <Popover
      triggerClassName="ui-profile"
      label={`${profile.name}: account menu`}
      trigger={
        <>
          <Avatar avatar={avatar} size="md" />
          <span className="ui-profile__text">
            <span className="ui-profile__name">{profile.name}</span>
            <span className="ui-profile__sub">{profile.sub}</span>
          </span>
          <i className="ui-profile__chev" aria-hidden />
        </>
      }
    >
      <MenuSection>
        <MenuItem href="/settings?section=profile" icon={<span className="ui-ico-avatar"><i /><i /></span>}>
          User settings
        </MenuItem>
        <MenuItem href="/help" icon={<i className="ui-ico-help">?</i>}>
          Help
        </MenuItem>
      </MenuSection>
      <MenuSection>
        <MenuItem href="/login" icon={<i className="ui-ico-signout" />}>
          Sign out
        </MenuItem>
      </MenuSection>
    </Popover>
  );
}
