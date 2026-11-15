"use client";

// Pick your avatar from the pen set. Saved on this device until the profile
// can be updated through src/lib/data (Lane 1).
import { useState } from "react";
import { Avatar, Button, Label } from "@/components/ui";
import { chooseAvatar, useChosenAvatar } from "@/components/ui/avatarChoice";

const SET = Array.from({ length: 100 }, (_, i) => `avatar-${String(i + 1).padStart(3, "0")}`);

export function AvatarStudio({ profileAvatar, name }: { profileAvatar: string; name: string }) {
  const current = useChosenAvatar(profileAvatar);
  const [picked, setPicked] = useState<string | null>(null);
  const shown = picked ?? current;
  const changed = shown !== current;

  return (
    <div className="studio">
      <section className="studio__preview" aria-label="Preview">
        <Avatar avatar={shown} size="fill" className="studio__big" alt={`${name}'s avatar`} />
        <Label>{changed ? "Not saved yet" : "Your avatar"}</Label>
        <div className="studio__actions">
          <Button
            variant="create"
            disabled={!changed}
            onClick={() => {
              chooseAvatar(shown === profileAvatar ? null : shown);
              setPicked(null);
            }}
          >
            Save avatar
          </Button>
          {changed && (
            <Button variant="secondary" onClick={() => setPicked(null)}>
              Cancel
            </Button>
          )}
        </div>
      </section>
      <ul className="studio__grid" aria-label="Avatars">
        {SET.map((a) => (
          <li key={a}>
            <button type="button" className="studio__pick" aria-pressed={a === shown} aria-label={`Avatar ${a.slice(-3)}`} onClick={() => setPicked(a)}>
              <Avatar avatar={a} size="fill" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
