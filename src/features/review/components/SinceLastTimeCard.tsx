import type { Run } from "../types";
import { Card } from "../ui/Card";
import { Label } from "../ui/Label";

const GROUPS = [
  { key: "improved", label: "Improved" },
  { key: "stillWeak", label: "Still weak" },
  { key: "ignored", label: "Ignored" },
] as const;

/**
 * Step 2.5: top of the rail on run 2 and later. What the board says changed
 * since the last version. No traffic lights: counts in ink, and only "ignored"
 * (what still needs doing) gets the highlight colour.
 */
export function SinceLastTimeCard({
  since,
  previousNumber,
}: {
  since: NonNullable<Run["sinceLastTime"]>;
  previousNumber: number;
}) {
  return (
    <Card className="p-6" variant="quiet">
      <Label tone="ink">Since run {previousNumber}</Label>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {GROUPS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-0.5">
            <span className="flex items-center gap-2 font-display text-h2 font-semibold leading-none tracking-h2 text-ink">
              {since[key].length}
              {key === "ignored" && since[key].length > 0 && <span aria-hidden="true" className="size-2 rounded-full bg-orange" />}
            </span>
            <Label size="sm">{label}</Label>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {GROUPS.filter(({ key }) => since[key].length > 0).map(({ key, label }) => (
          <section key={key} aria-label={label}>
            <Label size="sm" className="block">{label}</Label>
            <ul className="mt-1 flex flex-col gap-1">
              {since[key].map((item, i) => (
                <li key={i} className="flex gap-2 text-body text-grey-900">
                  <span aria-hidden="true" className="text-grey-500">–</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Card>
  );
}
