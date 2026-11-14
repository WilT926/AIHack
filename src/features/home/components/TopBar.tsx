import Link from "next/link";
import { Avatar, Logo } from "@/components/ui";
import type { FloorAssessor, FloorModel } from "../model";

export function TopBar({
  profile,
  onSearch,
  assessor,
  onClearAssessor,
}: {
  profile: FloorModel["profile"];
  onSearch: () => void;
  assessor: FloorAssessor | null;
  onClearAssessor: () => void;
}) {
  return (
    <>
      <div className="fl-brand">
        <Logo sub="Your floor" />
      </div>

      <button type="button" className="fl-search" onClick={onSearch} aria-label="Find a table, assessor or doc (⌘K)">
        <i className="fl-search__ring" aria-hidden />
        <span className="fl-search__text">Find a table, assessor or doc</span>
        <span className="fl-kbd" aria-hidden>
          ⌘K
        </span>
      </button>

      {assessor && (
        <div className="fl-filter-chip">
          <span>
            Tables with <b>{assessor.name}</b>
          </span>
          <button type="button" className="fl-filter-chip__x" onClick={onClearAssessor} aria-label="Show all tables">
            ×
          </button>
        </div>
      )}

      <Link href="/profile" className="fl-profile">
        <Avatar avatar={profile.avatar} size="lg" />
        <span className="fl-profile__text">
          <span className="fl-profile__name">{profile.name}</span>
          <span className="fl-profile__sub">{profile.sub}</span>
        </span>
      </Link>
    </>
  );
}
