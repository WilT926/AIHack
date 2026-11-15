import type { Assessor } from "../types";
import { cn } from "../ui/cn";
import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { Label } from "../ui/Label";
import { ReadingDots } from "../ui/ReadingDots";

type SeatState = "read" | "reading" | "failed";

/** One assessor's seat in an AI state (§9): reading, done or did not finish. */
function Seat({ assessor, state, onRetry }: { assessor: Assessor; state: SeatState; onRetry?: () => void }) {
  return (
    <span className="flex w-24 flex-col items-center gap-1 text-center">
      <Avatar avatar={assessor.avatar} name={assessor.name} size="xl" className={cn(state === "failed" && "opacity-40")} />
      <span className="text-small font-semibold text-ink">{assessor.name.replace(/^(Prof\.|Dr)\s+/, "")}</span>
      {state === "reading" && (
        <span className="flex items-center gap-1.5 text-ink">
          <Label tone="ink" size="sm">
            Reading
          </Label>
          <ReadingDots />
        </span>
      )}
      {state === "read" && (
        <Label tone="ink" size="sm">
          ✓ Read
        </Label>
      )}
      {state === "failed" && (
        <>
          <Label tone="ink" size="sm">
            Did not finish
          </Label>
          {onRetry && (
            <button type="button" onClick={onRetry} className="ui-btn ui-btn--quiet ui-btn--sm mt-0.5">
              Try again
            </button>
          )}
        </>
      )}
    </span>
  );
}

/**
 * The one orange (live) surface while a review runs: the board's seats, each
 * reading, read or did not finish. Text on orange is ink (§3).
 */
export function BoardLiveCard({
  board,
  status,
  doneIds,
  failedIds,
  onRetry,
}: {
  board: Assessor[];
  status: "reviewing" | "deliberating";
  doneIds: string[];
  failedIds: string[];
  onRetry?: (assessorId: string) => void;
}) {
  const stillReading = board.filter((a) => !doneIds.includes(a.id) && !failedIds.includes(a.id)).length;
  return (
    <Card variant="live" className="p-6">
      <div aria-live="polite">
        <Label tone="ink">
          ● {status === "reviewing" ? `In session · ${doneIds.length} of ${board.length} read` : "The board is conferring"}
        </Label>
        <h2 className="mt-1.5 font-display text-h2 font-semibold tracking-h2 text-ink">
          {status === "reviewing" ? "Your board is reading" : "Comparing notes"}
        </h2>
        <p className="mt-1 text-body text-ink">
          {status === "deliberating"
            ? "Where they agree, where they split, the actions and the likely questions are on their way."
            : stillReading === 1
              ? "One assessor is still reading. Comments appear as each one finishes."
              : `${stillReading} assessors are still reading. Comments appear as each one finishes.`}
        </p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {board.map((a) => {
          const state: SeatState = doneIds.includes(a.id) ? "read" : failedIds.includes(a.id) ? "failed" : "reading";
          return <Seat key={a.id} assessor={a} state={state} onRetry={onRetry ? () => onRetry(a.id) : undefined} />;
        })}
      </div>
    </Card>
  );
}

/** §9 AI state "Failed": the seat at 0.4 opacity, DID NOT FINISH and a quiet Try again pill. */
export function FailedCard({
  assessor,
  title,
  message,
  onRetry,
}: {
  assessor?: Assessor;
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card variant="failed">
      <div className="flex items-start gap-3" role="alert">
        {assessor && <Avatar avatar={assessor.avatar} name={assessor.name} size="lg" className="opacity-40" />}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-display text-h3 font-semibold tracking-h3 text-ink">{title ?? assessor?.name ?? "An assessor"}</span>
          <Label>Did not finish</Label>
          <p className="mt-2 text-body text-grey-700">{message}</p>
        </div>
        {onRetry && (
          <button type="button" onClick={onRetry} className="ui-btn ui-btn--quiet ui-btn--sm">
            Try again
          </button>
        )}
      </div>
    </Card>
  );
}

/** §9 AI state "Empty": a dashed outline and one sentence saying what to do next. */
export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <Card variant="dashed" className="flex flex-col items-center gap-1 py-10 text-center">
      <span className="font-display text-h3 font-semibold tracking-h3 text-ink">{title}</span>
      {body && <p className="text-body text-grey-700">{body}</p>}
    </Card>
  );
}
