import { Avatar, Label } from "@/components/ui";
import type { PitchSeat } from "../types";
import { LoopClip } from "./LoopClip";

/**
 * The board in a row, as the student sees them while presenting. With
 * `clips`, each judge plays their listening loop (the drawing if it fails).
 */
export function BoardRow({ seats, dim, clips }: { seats: PitchSeat[]; dim?: boolean; clips?: boolean }) {
  if (seats.length === 0) return <p className="ui-empty">No one is seated at this board yet.</p>;
  return (
    <ul className="ps-board" data-dim={dim} aria-label="The board">
      {seats.map((s) => (
        <li key={s.id} className="ps-board__seat">
          {clips ? (
            <LoopClip src={s.listenClip} className="ps-board__clip" fallback={<Avatar avatar={s.avatar} size="xl" alt="" />} />
          ) : (
            <Avatar avatar={s.avatar} size="xl" alt="" />
          )}
          <span className="ps-board__name">{s.short}</span>
          <Label size="xs">{s.field}</Label>
        </li>
      ))}
    </ul>
  );
}
