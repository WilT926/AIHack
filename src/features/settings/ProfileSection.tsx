"use client";

// User settings → Profile: your details (edit, then confirm or cancel) and
// your avatar (a quick picker popup). Both save to the database through the
// data layer, then the page refreshes so the top bar shows the change.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, TextInput } from "@/components/ui";
import { AvatarGrid } from "@/components/ui/AvatarGrid";
import { Segmented, SettingRow } from "@/components/ui/Controls";
import { Modal } from "@/components/ui/Modal";
import type { Profile } from "@/lib/schemas";
import { saveAvatar, saveProfileDetails } from "./actions";

const LEVELS = [
  { id: "UG", label: "Undergraduate" },
  { id: "PGT", label: "Postgraduate taught" },
  { id: "PGR", label: "Postgraduate research" },
] as const;
type Level = (typeof LEVELS)[number]["id"];
const levelName = (l: Level) => LEVELS.find((x) => x.id === l)?.label ?? l;

export function ProfileSection({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: profile.name, university: profile.university, course: profile.course, level: profile.level as Level });
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const edit = () => {
    setDraft({ name: profile.name, university: profile.university, course: profile.course, level: profile.level as Level });
    setError(null);
    setSavedNote(null);
    setEditing(true);
  };

  const confirm = () =>
    start(async () => {
      const res = await saveProfileDetails(draft);
      if (!res.ok) return setError(res.error);
      onSaved(res.profile);
      setEditing(false);
      setSavedNote("Your details are saved.");
      router.refresh();
    });

  const pick = (avatar: string) =>
    start(async () => {
      const res = await saveAvatar(avatar);
      if (!res.ok) return setError(res.error);
      onSaved(res.profile);
      setPicker(false);
      setSavedNote("Your avatar is saved.");
      router.refresh();
    });

  return (
    <>
      {editing ? (
        <form
          className="settings__form"
          onSubmit={(e) => {
            e.preventDefault();
            confirm();
          }}
        >
          <TextInput id="pf-name" label="Name" value={draft.name} autoComplete="name" onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <TextInput id="pf-university" label="University" value={draft.university} autoComplete="organization" onChange={(e) => setDraft({ ...draft, university: e.target.value })} />
          <TextInput id="pf-course" label="Course" value={draft.course} onChange={(e) => setDraft({ ...draft, course: e.target.value })} />
          <SettingRow title="Level" hint="Changes how demanding the board's expectations are">
            <Segmented label="Level" value={draft.level} onChange={(v) => setDraft({ ...draft, level: v })} options={[{ id: "UG", label: "UG" }, { id: "PGT", label: "PGT" }, { id: "PGR", label: "PGR" }]} />
          </SettingRow>
          <div className="settings__form-actions">
            <Button variant="create" type="submit" disabled={pending}>
              {pending ? "Saving…" : "Confirm changes"}
            </Button>
            <Button variant="secondary" onClick={() => setEditing(false)} disabled={pending}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <>
          <SettingRow title="Your details" hint="Who the board is marking">
            <Button variant="secondary" size="sm" onClick={edit}>
              Edit details
            </Button>
          </SettingRow>
          <SettingRow title="Name" hint={profile.name} />
          <SettingRow title="University" hint={profile.university || "Not set"} />
          <SettingRow title="Course" hint={profile.course || "Not set"} />
          <SettingRow title="Level" hint={levelName(profile.level as Level)} />
        </>
      )}

      <SettingRow title="Avatar" hint="How you appear across Panel">
        <span className="settings__avatar-row">
          <Avatar avatar={profile.avatar} size="md" alt="" />
          <Button variant="secondary" size="sm" onClick={() => setPicker(true)}>
            Edit avatar
          </Button>
        </span>
      </SettingRow>

      {error && (
        <p className="ps-error" role="alert">
          {error}
        </p>
      )}
      {savedNote && !error && (
        <p className="settings__saved" role="status">
          {savedNote}
        </p>
      )}

      <Modal open={picker} title="Choose your avatar" onClose={() => setPicker(false)}>
        <div className="settings__picker">
          <AvatarGrid value={profile.avatar} onPick={pick} disabled={pending} />
        </div>
      </Modal>
    </>
  );
}
