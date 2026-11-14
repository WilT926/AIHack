import { cn } from "../../review/ui/cn";

export const STEP_LABELS = ["Template", "Brief", "Weak spots", "Board", "Start"];

/** TEMPLATE → BRIEF → WEAK SPOTS → BOARD → START. `current` may cover two steps (2–3 share a screen). */
export function Stepper({ current }: { current: number[] }) {
  const first = Math.min(...current);
  return (
    <ol className="flex items-center gap-3" aria-label="Setup progress">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done = n < first;
        const active = current.includes(n);
        return (
          <li key={label} className="flex items-center gap-3" aria-current={active ? "step" : undefined}>
            {i > 0 && <span className={cn("h-px w-6", done || active ? "bg-ink" : "bg-rule")} aria-hidden="true" />}
            <span
              className={cn(
                "flex size-6.5 items-center justify-center rounded-full font-mono text-label",
                done && "bg-ink text-surface",
                active && "bg-accent text-accent-contrast",
                !done && !active && "border border-graphite text-text-muted",
              )}
            >
              {done ? "✓" : n}
            </span>
            <span className={cn("font-mono text-label uppercase tracking-label", done || active ? "text-ink" : "text-text-muted")}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
