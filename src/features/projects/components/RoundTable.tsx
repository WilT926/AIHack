import type { Assessor } from "../../review/types";
import { cn } from "../../review/ui/cn";
import { Avatar } from "../../review/ui/Avatar";
import { Label } from "../../review/ui/Label";

/** Seat angles in fill order: top, lower right, lower left, then the gaps. */
const SEAT_ANGLES = [-90, 30, 150, -30, 90, 210];
export const TABLE_SEATS = SEAT_ANGLES.length;

/** A line each preset might open with, for the speech bubble. */
const OPENERS: Record<string, string> = {
  "module-lead": "Does this meet the handbook?",
  methodologist: "How did you actually find this?",
  "literature-hawk": "Who else has done this?",
  communicator: "Can a reader follow it?",
  outsider: "Who pays for this?",
  sceptic: "What's your weakest claim?",
};

// Positions as percentages of the canvas (width 30 : height 32.5).
const CX = 50;
const CY = 52;
const SEAT_RX = 37.5;
const SEAT_RY = 34.6;

function seatPosition(i: number) {
  const rad = (SEAT_ANGLES[i] * Math.PI) / 180;
  return { left: `${CX + SEAT_RX * Math.cos(rad)}%`, top: `${CY + SEAT_RY * Math.sin(rad)}%` };
}

/**
 * The board as a round table: seated assessors around it with name pills,
 * empty seats dashed, the project in the middle. Clicking a face unseats it
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
  const opener = seated[0] ? OPENERS[seated[0].avatar] : undefined;

  return (
    <div
      className={cn("relative aspect-table w-full overflow-hidden rounded-xl bg-dots", compact ? "max-w-sm" : "max-w-table")}
      aria-label={`${label}: ${seated.length} of ${TABLE_SEATS} seats filled`}
    >
      {/* The table */}
      <div
        className="absolute flex aspect-square w-table-surface -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-full border-2 border-ink bg-surface px-6 text-center"
        style={{ left: `${CX}%`, top: `${CY}%` }}
      >
        <Label className="line-clamp-1">{label || "Your project"}</Label>
        <span className={cn("font-extrabold tracking-heading text-ink", compact ? "text-xl" : "text-3xl")}>
          {seated.length} of {TABLE_SEATS} seats
        </span>
        {!compact && (
          <span className="text-body text-text-muted">{onRemove ? "Click a face to unseat" : "Your board"}</span>
        )}
      </div>

      {/* Seats */}
      {SEAT_ANGLES.map((_, i) => {
        const a = seated[i];
        const pos = seatPosition(i);
        if (!a) {
          return (
            <span
              key={`empty-${i}`}
              className={cn(
                "absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-dashed border-rule bg-surface text-center",
                compact ? "size-12" : "size-16",
              )}
              style={pos}
            >
              <Label className="text-center leading-tight">
                Empty
                <br />
                seat
              </Label>
            </span>
          );
        }
        const face = (
          <>
            <Avatar avatar={a.avatar} name={a.name} size={compact ? "xl" : "2xl"} ring="none" />
            <span className="-mt-2 rounded-full bg-ink px-2.5 py-1 text-xs font-bold whitespace-nowrap text-surface">{a.name}</span>
          </>
        );
        return onRemove ? (
          <button
            key={a.id}
            type="button"
            onClick={() => onRemove(a.id)}
            aria-label={`Unseat ${a.name}`}
            title={`Unseat ${a.name}`}
            className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-focus"
            style={pos}
          >
            {face}
          </button>
        ) : (
          <span key={a.id} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={pos}>
            {face}
          </span>
        );
      })}

      {/* Speech bubble from the first seat */}
      {opener && !compact && (
        <span className="absolute bubble-anchor flex flex-col items-start">
          <span className="rounded-full border-2 border-ink bg-surface px-4 py-2 text-sm text-ink">{opener}</span>
          <span className="mt-1 ml-1 size-2.5 rounded-full border-2 border-ink bg-surface" aria-hidden="true" />
        </span>
      )}

      {/* Legend */}
      {!compact && (
        <div className="absolute bottom-5 left-6 flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="size-2 shrink-0 rounded-full bg-ink" />
            <Label>Seated</Label>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 shrink-0 rounded-full border border-dashed border-graphite" />
            <Label>Empty seat</Label>
          </span>
        </div>
      )}
    </div>
  );
}
