import { Avatar, Button, Label } from "@/components/ui";
import type { PitchSeat } from "../types";

/**
 * Board steps out (§9 AI states): the seats swing in from the row and gather
 * into one gooey blob, with mono THE BOARD IS CONFERRING. No looping motion.
 */
export function Conferring({ seats, label, error, onRetry }: { seats: PitchSeat[]; label: string; error: string | null; onRetry: () => void }) {
  const pitch = 110;
  return (
    <section className="ps-confer" aria-live="polite" aria-label={label}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id="ps-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation={10} result="b" />
            <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" />
          </filter>
        </defs>
      </svg>
      <div className="ps-confer__room" data-failed={!!error}>
        <div className="ps-confer__goo" aria-hidden>
          {seats.map((s, i) => (
            <i key={s.id} style={{ ["--from" as string]: `${(i - (seats.length - 1) / 2) * pitch}px`, animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
        <div className="ps-confer__seats" aria-hidden>
          {seats.map((s, i) => (
            <span key={s.id} className="ps-confer__seat" style={{ ["--from" as string]: `${(i - (seats.length - 1) / 2) * pitch}px`, animationDelay: `${i * 60}ms` }}>
              <Avatar avatar={s.avatar} size="xl" />
            </span>
          ))}
        </div>
      </div>
      <Label tone="ink">{label}</Label>
      {error && (
        <>
          <p className="ps-error" role="alert">
            {error}
          </p>
          <Button variant="quiet" onClick={onRetry}>
            Try again
          </Button>
        </>
      )}
    </section>
  );
}
