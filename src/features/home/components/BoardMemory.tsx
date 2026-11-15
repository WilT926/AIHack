import { DotRating, Label } from "@/components/ui";
import type { BoardMemory as Memory } from "@/lib/schemas";
import { ratingTrends } from "@/lib/engine/memory";
import { dateLabel } from "../model";

const RATING = { strong: 3, adequate: 2, weak: 1 } as const;

export function BoardMemory({ memory }: { memory: Memory }) {
  const latest = memory.attempts.at(-1);
  const open = latest?.actions.filter((a) => !a.done) ?? [];
  return (
    <section className="fl-panel__section fl-memory" aria-label="What the board remembers">
      <Label>What the board remembers</Label>
      {!latest ? (
        <div className="fl-empty-note">After your first session, the board will remember its feedback here.</div>
      ) : (
        <details>
          <summary className="fl-memory__summary">
            <span>{memory.attempts.length} remembered {memory.attempts.length === 1 ? "attempt" : "attempts"}</span>
            <Label size="xs" tone="quiet">{open.length} still open · view memory</Label>
          </summary>
          <div className="fl-memory__body">
            {[...memory.attempts].reverse().slice(0, 3).map((attempt) => (
              <div className="fl-memory__attempt" key={attempt.sessionId}>
                <Label size="xs" tone="ink">● {dateLabel(attempt.at)} · {attempt.kind === "report" ? "Report review" : "Presentation"}</Label>
                {attempt.replySource === "sample" && <Label size="xs" tone="orange">Sample replies · not real feedback</Label>}
                <span>{attempt.verdict || attempt.title}</span>
                <Label size="xs" tone="quiet">{attempt.actions.filter((a) => a.done).length} actions ticked done</Label>
              </div>
            ))}
            {open.length > 0 && <div className="fl-memory__attempt">
              <Label size="xs" tone="orange">Still open from last time</Label>
              <ul className="fl-memory__list">{open.map((a) => <li key={a.id}>{a.what}</li>)}</ul>
            </div>}
            {ratingTrends(memory).slice(0, 4).map((trend) => (
              <div className="fl-memory__trend" key={trend.criterion}>
                <Label size="xs">{trend.criterion}</Label>
                <span className="fl-memory__ratings">{trend.ratings.slice(-3).map((rating, i) => <DotRating key={i} value={RATING[rating]} max={3} label={`${trend.criterion}, remembered attempt ${i + 1}: ${rating}`} />)}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
