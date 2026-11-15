"use client";

// The pen avatar set (avatar-001 … avatar-100) as a grid to pick from.
// Used by the avatar popup in user settings and by the avatar studio.
import { Avatar } from "./index";

export const AVATAR_SET = Array.from({ length: 100 }, (_, i) => `avatar-${String(i + 1).padStart(3, "0")}`);

export function AvatarGrid({ value, onPick, disabled }: { value: string; onPick: (avatar: string) => void; disabled?: boolean }) {
  return (
    <ul className="studio__grid" aria-label="Avatars">
      {AVATAR_SET.map((a) => (
        <li key={a}>
          <button type="button" className="studio__pick" aria-pressed={a === value} aria-label={`Avatar ${a.slice(-3)}`} disabled={disabled} onClick={() => onPick(a)}>
            <Avatar avatar={a} size="fill" />
          </button>
        </li>
      ))}
    </ul>
  );
}
