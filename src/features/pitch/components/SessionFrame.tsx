import Link from "next/link";
import type { ReactNode } from "react";
import { Label, Logo, cn } from "@/components/ui";

const STEPS = ["Present", "Board steps out", "Questions", "Feedback"];

/**
 * Frame for a presentation-practice session: logo, the four-step stepper
 * (§9 Call stage) and the dock collapsed to an exit bubble (§10).
 */
export function SessionFrame({
  step,
  sample,
  sampleReplies,
  preview,
  children,
}: {
  step: number;
  sample: boolean;
  sampleReplies?: boolean;
  preview: boolean;
  children: ReactNode;
}) {
  return (
    <div className="ps-frame">
      <header className="ps-head">
        <Link href="/" className="ps-head__logo" aria-label="Panel, back to your floor">
          <Logo />
        </Link>
        <ol className="ps-stepper" aria-label="Session steps">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={cn("ps-step", i < step && "ps-step--done", i === step && "ps-step--now")}
              aria-current={i === step ? "step" : undefined}
            >
              {s}
            </li>
          ))}
        </ol>
        <div className="ps-head__flags">
          {preview && <Label tone="ink">Preview</Label>}
          {sample && <Label tone="orange">Sample data</Label>}
          {sampleReplies && <Label tone="orange">Sample replies</Label>}
        </div>
      </header>
      <main className="ps-main">{children}</main>
      <Link href="/" className="ps-exit" aria-label="Leave the session and go back to your floor" title="Leave">
        ×
      </Link>
    </div>
  );
}
