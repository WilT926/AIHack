"use client";

// The floor's top bar: the shared AppBar with the split search pill. Filters
// live in the pill: the Filters button opens status, assessors and recent
// tables; each active filter becomes its own part of the pill.
import { Avatar } from "@/components/ui";
import { AppBar, ProfileMenu, SearchPill, type SearchSegment } from "@/components/ui/AppBar";
import { MenuItem, MenuSection } from "@/components/ui/Popover";
import type { FloorAssessor, FloorFilter, FloorModel, FloorTable } from "../model";

export const STATUS_FILTERS: [Exclude<FloorFilter, "all">, string][] = [
  ["live", "In session"],
  ["open", "Actions open"],
  ["new", "Not started"],
];

const statusIcon = <i className="ui-ico-status" aria-hidden />;
const assessorIcon = (
  <span className="ui-ico-assessors" aria-hidden>
    <i />
    <i />
    <i />
  </span>
);

function StatusOptions({ filter, onFilter }: { filter: FloorFilter; onFilter: (f: FloorFilter) => void }) {
  return (
    <>
      <MenuItem selected={filter === "all"} onClick={() => onFilter("all")}>
        All panels
      </MenuItem>
      {STATUS_FILTERS.map(([id, label]) => (
        <MenuItem key={id} selected={filter === id} onClick={() => onFilter(id)}>
          {label}
        </MenuItem>
      ))}
    </>
  );
}

function AssessorOptions({
  assessors,
  selectedId,
  onAssessor,
}: {
  assessors: FloorAssessor[];
  selectedId: string | null;
  onAssessor: (id: string | null) => void;
}) {
  return (
    <div className="ui-menu__scroll">
      {assessors.map((a) => (
        <MenuItem
          key={a.id}
          selected={a.id === selectedId}
          icon={<Avatar avatar={a.avatar} size="xs" />}
          hint={a.short}
          onClick={() => onAssessor(a.id === selectedId ? null : a.id)}
        >
          {a.name}
        </MenuItem>
      ))}
    </div>
  );
}

export function TopBar({
  profile,
  onSearch,
  filter,
  onFilter,
  assessors,
  assessorId,
  onAssessor,
  tables,
  onTable,
}: {
  profile: FloorModel["profile"];
  onSearch: () => void;
  filter: FloorFilter;
  onFilter: (f: FloorFilter) => void;
  assessors: FloorAssessor[];
  assessorId: string | null;
  onAssessor: (id: string | null) => void;
  tables: FloorTable[];
  onTable: (i: number) => void;
}) {
  const assessor = assessors.find((a) => a.id === assessorId) ?? null;
  const segments: SearchSegment[] = [];
  if (filter !== "all") {
    const label = STATUS_FILTERS.find(([id]) => id === filter)?.[1] ?? "Filtered";
    segments.push({
      key: "status",
      label: `Panels: ${label}`,
      icon: statusIcon,
      onRemove: () => onFilter("all"),
      menu: <StatusOptions filter={filter} onFilter={onFilter} />,
    });
  }
  if (assessor) {
    segments.push({
      key: "assessor",
      label: `Panels with ${assessor.name}`,
      icon: assessorIcon,
      onRemove: () => onAssessor(null),
      menu: <AssessorOptions assessors={assessors} selectedId={assessorId} onAssessor={onAssessor} />,
    });
  }

  return (
    <AppBar
      search={
        <SearchPill
          onSearch={onSearch}
          segments={segments}
          filterCount={segments.length}
          filterMenu={
            <>
              <MenuSection title="Panels">
                <StatusOptions filter={filter} onFilter={onFilter} />
              </MenuSection>
              <MenuSection title="Assessors">
                <AssessorOptions assessors={assessors} selectedId={assessorId} onAssessor={onAssessor} />
              </MenuSection>
              {tables.length > 0 && (
                <MenuSection title="Recent">
                  {tables.map((t, i) => (
                    <MenuItem key={t.id} icon={<i className="ui-ico-table" aria-hidden />} hint={t.code} onClick={() => onTable(i)}>
                      {t.name}
                    </MenuItem>
                  ))}
                </MenuSection>
              )}
            </>
          }
        />
      }
      profile={<ProfileMenu profile={profile} />}
    />
  );
}
