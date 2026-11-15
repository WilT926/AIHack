"use client";

// User settings. Sections on the left, the chosen section in the middle;
// on Profile, a card on the right with your avatar, sign out and delete.
// Profile details and avatar save to the database (./actions.ts). The other
// sections' choices are kept on this device until the data layer can store
// them, and are not yet read by the review or pitch flows.
import { useState, useSyncExternalStore } from "react";
import { Avatar, Button, TextButton, cn } from "@/components/ui";
import { DotPicker, Segmented, SelectPill, SettingRow, Toggle } from "@/components/ui/Controls";
import type { Profile } from "@/lib/schemas";
import { ProfileSection } from "./ProfileSection";
import { SECTIONS, type SectionId } from "./sections";

type Prefs = {
  harshness: number;
  openOn: "panel" | "speaker";
  autoCut: boolean;
  captions: boolean;
  remember: boolean;
  fade: "instant" | "gentle" | "drawings";
  language: "en-GB" | "en-US";
  camera: boolean;
  mirror: boolean;
  media: "clips" | "portraits" | "drawings";
  voice: "natural" | "browser";
  notifyDone: boolean;
  notifyEscalation: boolean;
  weekly: boolean;
  keep: "always" | "30" | "never";
  motion: "system" | "reduce" | "full";
  bigCaptions: boolean;
  questionText: boolean;
};

const DEFAULTS: Prefs = {
  harshness: 3,
  openOn: "panel",
  autoCut: true,
  captions: true,
  remember: true,
  fade: "gentle",
  language: "en-GB",
  camera: true,
  mirror: true,
  media: "clips",
  voice: "natural",
  notifyDone: true,
  notifyEscalation: true,
  weekly: false,
  keep: "always",
  motion: "system",
  bigCaptions: false,
  questionText: true,
};

const KEY = "panel.settings";
const EVENT = "panel:settings";

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
function readRaw() {
  try {
    return window.localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}
function parse(raw: string): Prefs {
  try {
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}
function save(p: Prefs | null) {
  try {
    if (p) window.localStorage.setItem(KEY, JSON.stringify(p));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: choices last for this page only.
  }
  window.dispatchEvent(new Event(EVENT));
}


const LEVEL_SHORT = { UG: "Undergraduate", PGT: "Postgraduate taught", PGR: "Postgraduate research" } as const;

export function Settings({ profile: initial, initialSection = "profile" }: { profile: Profile; initialSection?: SectionId }) {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const prefs = parse(raw);
  const set = <K extends keyof Prefs>(k: K, v: Prefs[K]) => save({ ...prefs, [k]: v });
  const [section, setSection] = useState<SectionId>(initialSection);
  const [deleteNote, setDeleteNote] = useState(false);
  const [profile, setProfile] = useState<Profile>(initial);

  const body: Record<SectionId, { title: string; lede: string; rows: React.ReactNode }> = {
    profile: {
      title: "Profile",
      lede: "Who the board is marking. Your assessors use this to pitch their feedback.",
      rows: <ProfileSection profile={profile} onSaved={setProfile} />,
    },
    defaults: {
      title: "Panel defaults",
      lede: "Applies to new panels. Each panel can override these.",
      rows: (
        <>
          <SettingRow title="How tough" hint="Starting harshness for new assessors">
            <DotPicker label="How tough" value={prefs.harshness} max={5} onChange={(v) => set("harshness", v)} />
          </SettingRow>
          <SettingRow title="Open the room on" hint="First shot when a session starts">
            <Segmented label="Open the room on" value={prefs.openOn} onChange={(v) => set("openOn", v)} options={[{ id: "panel", label: "Whole panel" }, { id: "speaker", label: "Speaker" }]} />
          </SettingRow>
          <SettingRow title="Auto-cut to whoever speaks" hint="Switch to a close-up when an assessor talks">
            <Toggle label="Auto-cut to whoever speaks" checked={prefs.autoCut} onChange={(v) => set("autoCut", v)} />
          </SettingRow>
          <SettingRow title="Captions" hint="Show what each assessor says as a pill">
            <Toggle label="Captions" checked={prefs.captions} onChange={(v) => set("captions", v)} />
          </SettingRow>
          <SettingRow title="Remember what I fixed" hint="Assessors bring up unresolved points from earlier sessions">
            <Toggle label="Remember what I fixed" checked={prefs.remember} onChange={(v) => set("remember", v)} />
          </SettingRow>
          <SettingRow title="Line-to-video fade" hint="How assessors appear when they join">
            <Segmented label="Line-to-video fade" value={prefs.fade} onChange={(v) => set("fade", v)} options={[{ id: "instant", label: "Instant" }, { id: "gentle", label: "Gentle" }, { id: "drawings", label: "Stay as drawings" }]} />
          </SettingRow>
          <SettingRow title="Feedback language" hint="Spelling and tone for comments">
            <SelectPill label="Feedback language" value={prefs.language} onChange={(v) => set("language", v)} options={[{ id: "en-GB", label: "English (UK)" }, { id: "en-US", label: "English (US)" }]} />
          </SettingRow>
        </>
      ),
    },
    clips: {
      title: "Clips & camera",
      lede: "How the board looks and sounds in a presentation call.",
      rows: (
        <>
          <SettingRow title="Show my camera" hint="On this screen only. Never recorded or sent anywhere">
            <Toggle label="Show my camera" checked={prefs.camera} onChange={(v) => set("camera", v)} />
          </SettingRow>
          <SettingRow title="Mirror my camera" hint="Like looking in a mirror">
            <Toggle label="Mirror my camera" checked={prefs.mirror} onChange={(v) => set("mirror", v)} />
          </SettingRow>
          <SettingRow title="Assessors appear as" hint="Video clips, still portraits or the pen drawings">
            <Segmented label="Assessors appear as" value={prefs.media} onChange={(v) => set("media", v)} options={[{ id: "clips", label: "Clips" }, { id: "portraits", label: "Portraits" }, { id: "drawings", label: "Drawings" }]} />
          </SettingRow>
          <SettingRow title="Voices" hint="Natural voices need a connection; the browser voice works offline">
            <Segmented label="Voices" value={prefs.voice} onChange={(v) => set("voice", v)} options={[{ id: "natural", label: "Natural" }, { id: "browser", label: "Browser" }]} />
          </SettingRow>
        </>
      ),
    },
    notifications: {
      title: "Notifications",
      lede: "What Panel tells you about, while it is open.",
      rows: (
        <>
          <SettingRow title="A session has finished" hint="When the board's feedback report is ready">
            <Toggle label="A session has finished" checked={prefs.notifyDone} onChange={(v) => set("notifyDone", v)} />
          </SettingRow>
          <SettingRow title="Take it to your supervisor" hint="When the board cannot agree or a point is outside its field">
            <Toggle label="Take it to your supervisor" checked={prefs.notifyEscalation} onChange={(v) => set("notifyEscalation", v)} />
          </SettingRow>
          <SettingRow title="Weekly summary" hint="What improved and what is still open across your panels">
            <Toggle label="Weekly summary" checked={prefs.weekly} onChange={(v) => set("weekly", v)} />
          </SettingRow>
        </>
      ),
    },
    privacy: {
      title: "Privacy & data",
      lede: "Your speech is turned into text in the browser. Panel keeps the text, never the audio.",
      rows: (
        <>
          <SettingRow title="Keep transcripts" hint="Practice transcripts and the board's questions">
            <Segmented label="Keep transcripts" value={prefs.keep} onChange={(v) => set("keep", v)} options={[{ id: "always", label: "Until I delete" }, { id: "30", label: "30 days" }, { id: "never", label: "Don't keep" }]} />
          </SettingRow>
          <SettingRow title="Settings on this device" hint="Reset every choice on this page to its default">
            <Button variant="secondary" size="sm" onClick={() => save(null)}>
              Reset
            </Button>
          </SettingRow>
        </>
      ),
    },
    accessibility: {
      title: "Accessibility",
      lede: "Make sessions easier to follow.",
      rows: (
        <>
          <SettingRow title="Motion" hint="Follow your system setting, or reduce it here">
            <Segmented label="Motion" value={prefs.motion} onChange={(v) => set("motion", v)} options={[{ id: "system", label: "System" }, { id: "reduce", label: "Reduced" }, { id: "full", label: "Full" }]} />
          </SettingRow>
          <SettingRow title="Larger captions" hint="Bigger question text in calls">
            <Toggle label="Larger captions" checked={prefs.bigCaptions} onChange={(v) => set("bigCaptions", v)} />
          </SettingRow>
          <SettingRow title="Show questions as text" hint="Every spoken question also appears on screen">
            <Toggle label="Show questions as text" checked={prefs.questionText} onChange={(v) => set("questionText", v)} />
          </SettingRow>
        </>
      ),
    },
    account: {
      title: "Account",
      lede: "This version has one demo student, so there is nothing to sign up for.",
      rows: (
        <>
          <SettingRow title="Signed in as" hint={profile.name} />
          <SettingRow title="Sign out" hint="Back to the sign-in page">
            <Button variant="secondary" size="sm" href="/api/signout">
              Sign out
            </Button>
          </SettingRow>
        </>
      ),
    },
  };
  const current = body[section];

  return (
    <div className={cn("settings", section === "profile" && "settings--card")}>
      <nav className="settings__nav" aria-label="Settings sections">
        {SECTIONS.map((s) => (
          <button key={s.id} type="button" className={cn("settings__tab", s.id === section && "settings__tab--active")} aria-current={s.id === section ? "page" : undefined} onClick={() => {
              setSection(s.id);
              window.history.replaceState(null, "", `/settings?section=${s.id}`);
            }}>
            {s.label}
          </button>
        ))}
      </nav>

      <section className="settings__main" aria-labelledby="settings-title">
        <h1 id="settings-title" className="settings__title">
          {current.title}
        </h1>
        <p className="settings__lede">{current.lede}</p>
        <div className="settings__rows">{current.rows}</div>
      </section>

      {section === "profile" && (
        <aside className="settings__card" aria-label="Your profile">
          <Avatar avatar={profile.avatar} size="fill" className="settings__avatar" alt={`${profile.name}'s avatar`} />
          <span className="settings__name">{profile.name}</span>
          <span className="settings__sub">{[profile.university, profile.course].filter(Boolean).join(" · ")}</span>
          <span className="settings__sub">{LEVEL_SHORT[profile.level]}</span>
          <div className="settings__card-foot">
            <Button variant="quiet" block href="/api/signout">
              Sign out
            </Button>
            <TextButton className="settings__delete" onClick={() => setDeleteNote(true)}>
              Delete account
            </TextButton>
            {deleteNote && (
              <span className="settings__note" role="status">
                There is one demo account in this version, so there is nothing to delete.
              </span>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
