import { cn } from "@/components/ui";

export const STEP_LABELS = ["Template", "Brief", "Weak spots", "Board", "Start"];

/**
 * §15 New project: steps as pills joined by 2px lines. Done = ink, current =
 * white with the ink line, upcoming = white with a hairline. No orange here:
 * orange stays for the one create button and live states (§3).
 * `current` may cover two steps (2–3 share a screen).
 */
export function Stepper({ current }: { current: number[] }) {
  const first = Math.min(...current);
  return (
    <ol className="flex items-center" aria-label="Setup progress">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done = n < first;
        const active = current.includes(n);
        return (
          <li key={label} className="flex items-center" aria-current={active ? "step" : undefined}>
            {i > 0 && <span className={cn("h-0.5 w-5", done || active ? "bg-ink" : "bg-grey-100")} aria-hidden="true" />}
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full border-line px-3.5 py-2 text-chip leading-none font-medium whitespace-nowrap",
                done && "border-ink bg-ink text-white",
                active && "border-ink bg-white font-semibold text-ink",
                !done && !active && "border-grey-100 bg-white text-grey-500",
              )}
            >
              {done && <span aria-hidden="true">✓</span>}
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
