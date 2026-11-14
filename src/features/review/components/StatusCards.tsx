import type { Assessor } from "../types";
import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { Label } from "../ui/Label";
import { SkeletonLine } from "../ui/SkeletonLine";
import { Button } from "../ui/Button";
import { cn } from "../ui/cn";

/** Live state: an assessor is still reading. Step 2.3 drives this. */
export function ArrivingCard({ assessor, paragraphLabel }: { assessor: Assessor; paragraphLabel?: string }) {
  return (
    <Card variant="arriving">
      <div className="flex items-start gap-3" aria-live="polite">
        <Avatar avatar={assessor.avatar} name={assessor.name} size="lg" ring="accent" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-semibold text-ink">
            {assessor.name} is reading{paragraphLabel ? ` ${paragraphLabel}` : ""}…
          </span>
          <Label>{assessor.role} · next comment arriving</Label>
          <div className="mt-3 flex flex-col gap-2">
            <SkeletonLine width="long" />
            <SkeletonLine width="short" />
          </div>
        </div>
      </div>
    </Card>
  );
}

/** One assessor (or the deliberation) could not finish. The rest of the review still shows. */
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
        {assessor && <Avatar avatar={assessor.avatar} name={assessor.name} size="lg" className="opacity-50" />}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-semibold text-ink">{title ?? `${assessor?.name ?? "An assessor"} couldn't finish`}</span>
          <Label>{assessor ? `${assessor.role} · failed` : "Failed"}</Label>
          <p className="mt-2 text-body text-text-muted">{message}</p>
        </div>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    </Card>
  );
}

/**
 * The one orange card on the screen while a review is live: the board peeking
 * over the top edge, each face marked done, reading or failed.
 */
export function BoardLiveCard({
  board,
  status,
  doneIds,
  failedIds,
}: {
  board: Assessor[];
  status: "reviewing" | "deliberating";
  doneIds: string[];
  failedIds: string[];
}) {
  const reading = board.filter((a) => !doneIds.includes(a.id) && !failedIds.includes(a.id));
  const title = status === "reviewing" ? "Your board is reading" : "The board is comparing notes";
  const line =
    status === "deliberating"
      ? "Agreements, splits, the fix list and likely questions are on their way."
      : reading.length === 1
        ? `${reading[0].name} is still reading.`
        : `${reading.length} assessors are still reading. Comments appear as each one finishes.`;

  return (
    <div className="mt-8 rounded-lg bg-accent px-6 pt-1 pb-6 text-accent-contrast" aria-live="polite">
      <div className="-mt-9 flex items-end gap-2">
        {board.map((a) => {
          const state = doneIds.includes(a.id) ? "done" : failedIds.includes(a.id) ? "failed" : "reading";
          return (
            <span key={a.id} className="flex flex-col items-center gap-1">
              <Avatar avatar={a.avatar} name={a.name} size="xl" ring="none" className={state === "failed" ? "opacity-50 grayscale" : undefined} />
              <span
                className={cn(
                  "rounded-full px-1.5 font-mono text-label uppercase tracking-label",
                  state === "done" && "bg-ink text-surface",
                  state === "reading" && "animate-pulse bg-surface text-accent",
                  state === "failed" && "bg-surface text-ink",
                )}
              >
                {state === "done" ? "✓ read" : state === "reading" ? "reading" : "failed"}
              </span>
            </span>
          );
        })}
      </div>
      <Label tone="inverse" className="mt-4 block">
        ● {status === "reviewing" ? `Reviewing · ${doneIds.length} of ${board.length} read` : "Deliberating"}
      </Label>
      <h2 className="mt-1 text-2xl font-extrabold tracking-heading">{title}</h2>
      <p className="mt-1 text-body">{line}</p>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <Card className="flex flex-col items-center gap-1 py-10 text-center">
      <span className="font-semibold text-ink">{title}</span>
      {body && <p className="text-body text-text-muted">{body}</p>}
    </Card>
  );
}
