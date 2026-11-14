import type { Assessor } from "../types";
import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { Label } from "../ui/Label";
import { SkeletonLine } from "../ui/SkeletonLine";

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

/** One assessor could not finish. The rest of the review still shows. */
export function FailedCard({ assessor, message }: { assessor: Assessor; message: string }) {
  return (
    <Card variant="failed">
      <div className="flex items-start gap-3">
        <Avatar avatar={assessor.avatar} name={assessor.name} size="lg" className="opacity-50" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-semibold text-ink">{assessor.name} couldn&apos;t finish</span>
          <Label>{assessor.role} · failed</Label>
          <p className="mt-2 text-body text-text-muted">{message}</p>
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
