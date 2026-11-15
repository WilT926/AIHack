// The floor's bottom dock: the shared NavDock, with Desk and Assessors opening
// their sheets in place. The "+" menu is the same on every page (§9).
import { NavDock } from "@/components/ui/NavDock";
import type { Sheet } from "../Floor";
import type { FloorTable } from "../model";

/** Whether the "+" menu is open. The floor's "New table" circle opens it too. */
export type PlusState = "closed" | "menu";

export function Dock({
  sheet,
  openActions,
  plus,
  tables,
  newProjectHref,
  focusId,
  onSheet,
  onPlus,
}: {
  sheet: Sheet;
  openActions: number;
  plus: PlusState;
  tables: FloorTable[];
  newProjectHref: string;
  /** The focused table, which the "+" options open for. */
  focusId?: string;
  onSheet: (s: Sheet) => void;
  onPlus: (p: PlusState) => void;
}) {
  return (
    <div className="fl-dock">
      <NavDock
        active={sheet === "desk" ? "desk" : sheet === "assessors" ? "assessors" : "floor"}
        deskCount={openActions}
        on={{ floor: () => onSheet(null), desk: () => onSheet("desk"), assessors: () => onSheet("assessors") }}
        tables={tables.map((t) => ({ id: t.id, name: t.name, kind: t.kind }))}
        newProjectHref={newProjectHref}
        focusId={focusId}
        plusOpen={plus !== "closed"}
        onPlusOpen={(o) => onPlus(o ? "menu" : "closed")}
      />
    </div>
  );
}
