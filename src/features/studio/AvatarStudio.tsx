"use client";

// Pick your avatar from the pen set. Saves to your profile in the database
// (the same action as User settings → Profile → Edit avatar).
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Label } from "@/components/ui";
import { AvatarGrid } from "@/components/ui/AvatarGrid";
import { saveAvatar } from "@/features/settings/actions";

export function AvatarStudio({ profileAvatar, name }: { profileAvatar: string; name: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState(profileAvatar);
  const [picked, setPicked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const shown = picked ?? current;
  const changed = shown !== current;

  const save = () =>
    start(async () => {
      const res = await saveAvatar(shown);
      if (!res.ok) return setError(res.error);
      setCurrent(res.profile.avatar);
      setPicked(null);
      setError(null);
      router.refresh();
    });

  return (
    <div className="studio">
      <section className="studio__preview" aria-label="Preview">
        <Avatar avatar={shown} size="fill" className="studio__big" alt={`${name}'s avatar`} />
        <Label>{changed ? "Not saved yet" : "Your avatar"}</Label>
        <div className="studio__actions">
          <Button variant="create" disabled={!changed || pending} onClick={save}>
            {pending ? "Saving…" : "Save avatar"}
          </Button>
          {changed && (
            <Button variant="secondary" onClick={() => setPicked(null)} disabled={pending}>
              Cancel
            </Button>
          )}
        </div>
        {error && (
          <p className="ps-error" role="alert">
            {error}
          </p>
        )}
      </section>
      <AvatarGrid value={shown} onPick={setPicked} />
    </div>
  );
}
