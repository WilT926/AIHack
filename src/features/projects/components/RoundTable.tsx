import type { Assessor } from "../../review/types";
import { cn } from "@/components/ui";
import { Avatar } from "../../review/ui/Avatar";
import { Label } from "../../review/ui/Label";

// §7 Table geometry, as percentages of a 30 : 32.5 canvas. The table is the
// focused one (orange, no border); seats sit at r + ½·avatar + 2 from the
// centre, starting at −110° and evenly spaced. No empty "your seat" seats.
const CX = 50;
const CY = 46;
const SEAT_RX = 37;
const SEAT_RY = 34;
const START_DEG = -110;

function seatPosition(i: number, n: number) {
  const rad = ((START_DEG + (360 / Math.max(n, 1)) * i) * Math.PI) / 180;
  return { left: `${CX + SEAT_RX * Math.cos(rad)}%`, top: `${CY + SEAT_RY * Math.sin(rad)}%` };
}

/**
 * The board as it will sit on the floor: the new project's table, focused
 * (orange), with its seats around it. Clicking a seat unseats that assessor
 * when `onRemove` is given.
 */
export function RoundTable({
  label,
  seated,
  onRemove,
  compact,
}: {
  label: string;
  seated: Assessor[];
  onRemove?: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative aspect-table w-full overflow-hidden rounded-sheet border-line border-grey-100 bg-floor",
        compact ? "max-w-sm" : "max-w-table",
      )}
      aria-label={`${label || "New panel"}: ${seated.length} ${seated.length === 1 ? "assessor" : "assessors"} seated`}
    >
      {/* The focused table: orange, ink text (§3, §7) */}
      <div
        className="absolute flex aspect-square w-table-surface -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-full bg-orange px-6 text-center text-ink"
        style={{ left: `${CX}%`, top: `${CY}%` }}
      >
        <Label tone="ink" size="sm">
          ● Setting up
        </Label>
        <span className={cn("line-clamp-2 font-display font-semibold text-ink", compact ? "text-h3-lg tracking-h3" : "text-h2 tracking-h2")}>
          {label || "New panel"}
        </span>
        <span className="text-small text-ink">
          {seated.length === 0 ? "No one seated yet" : `${seated.length} ${seated.length === 1 ? "assessor" : "assessors"} seated`}
        </span>
      </div>

      {/* Seats */}
      {seated.map((a, i) => {
        const pos = seatPosition(i, seated.length);
        const face = (
          <>
            <Avatar avatar={a.avatar} name={a.name} size={compact ? "lg" : "xl"} />
            <span className="text-small leading-tight font-semibold whitespace-nowrap text-ink">{a.name.replace(/^(Prof\.|Dr)\s+/, "")}</span>
            <Label size="xs">{a.role}</Label>
          </>
        );
        const cls = "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 bg-transparent text-center";
        return onRemove ? (
          <button
            key={a.id}
            type="button"
            onClick={() => onRemove(a.id)}
            aria-label={`Unseat ${a.name}`}
            title={`Unseat ${a.name}`}
            className={cn(cls, "transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange")}
            style={pos}
          >
            {face}
          </button>
        ) : (
          <span key={a.id} className={cls} style={pos}>
            {face}
          </span>
        );
      })}

      {!compact && onRemove && seated.length > 0 && (
        <Label className="absolute bottom-4 left-0 w-full text-center">Click a seat to unseat</Label>
      )}
    </div>
  );
}
