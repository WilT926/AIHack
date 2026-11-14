import { Chip } from "@/components/ui";
import type { FloorFilter } from "../model";

const FILTERS: [FloorFilter, string][] = [
  ["all", "All tables"],
  ["live", "In session"],
  ["open", "Actions open"],
  ["new", "Not started"],
];

export function FilterBar({ filter, onFilter }: { filter: FloorFilter; onFilter: (f: FloorFilter) => void }) {
  return (
    <div className="fl-filters" role="group" aria-label="Filter tables">
      {FILTERS.map(([id, label]) => (
        <Chip key={id} active={filter === id} onClick={() => onFilter(id)}>
          {label}
        </Chip>
      ))}
    </div>
  );
}
