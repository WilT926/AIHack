import { Avatar, Label } from "@/components/ui";
import type { PitchSeat } from "../types";

/** The board in a row, as the student sees them while presenting. */
export function BoardRow({ seats, dim }: { seats: PitchSeat[]; dim?: boolean }) {
  if (seats.length === 0) return <p className="ui-empty">No one is seated at this board yet.</p>;
  return (
    <ul className="ps-board" data-dim={dim} aria-label="The board">
      {seats.map((s) => (
        <li key={s.id} className="ps-board__seat">
          <Avatar avatar={s.avatar} size="xl" alt="" />
          <span className="ps-board__name">{s.short}</span>
          <Label size="xs">{s.field}</Label>
        </li>
      ))}
    </ul>
  );
}
