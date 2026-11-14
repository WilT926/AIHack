import type { Assessor } from "../types";
import { Card } from "../ui/Card";
import { Avatar, AvatarStack } from "../ui/Avatar";
import { Label } from "../ui/Label";
import { SkeletonLine } from "../ui/SkeletonLine";
import { Button } from "../ui/Button";

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

/** Everyone has read; the board is comparing notes. */
export function DeliberatingCard({ people }: { people: Assessor[] }) {
  return (
    <Card variant="arriving">
      <div className="flex items-start gap-3" aria-live="polite">
        <AvatarStack people={people} size="md" ringFor={() => "accent"} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-semibold text-ink">The board is comparing notes…</span>
          <Label>Deliberation · fix list and questions arriving</Label>
          <div className="mt-3 flex flex-col gap-2">
            <SkeletonLine width="long" />
            <SkeletonLine width="short" />
          </div>
        </div>
      </div>
    </Card>
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
