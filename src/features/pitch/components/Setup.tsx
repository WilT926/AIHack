import { Button, Chip, Label, Tabs } from "@/components/ui";
import type { PitchSetupData } from "../types";
import { BoardRow } from "./BoardRow";

/** Board choices that are made on the spot rather than saved boards. */
export const SCRATCH = "__scratch";
export const PITCH_ASSESSORS = "__pitch";
/** The preset judges, by their roles. */
export const PITCH_ROLES = ["Technical Judge", "Education Lead", "Investor", "Design Judge"];

export type SetupValue = {
  projectId: string | null;
  /** A saved board's id, or SCRATCH / PITCH_ASSESSORS. */
  boardId: string | null;
  /** Start from scratch: who the student picked. */
  customIds: string[];
  questionCount: number;
  mode: "spoken" | "text";
  capture: "live" | "typed";
  conditions: "coaching" | "exam";
};

const COUNTS = ["1", "2", "3", "4", "5"] as const;

export function Setup({
  data,
  value,
  onChange,
  canListen,
  busy,
  error,
  onStart,
}: {
  data: PitchSetupData;
  value: SetupValue;
  onChange: (v: SetupValue) => void;
  canListen: boolean;
  busy: boolean;
  error: string | null;
  onStart: () => void;
}) {
  const board = data.boards.find((b) => b.id === value.boardId);
  const seats = boardSeats(data, value);
  const capture = canListen ? value.capture : "typed";
  const projects = [...data.projects].sort((a, b) => Number(b.isPitch) - Number(a.isPitch));

  return (
    <section className="ps-setup" aria-labelledby="ps-setup-title">
      <div className="ps-setup__intro">
        <h1 id="ps-setup-title" className="ps-title">
          Practise a presentation
        </h1>
        <p className="ps-lede">Present aloud. When you finish, the board steps out, then comes back with its questions.</p>
      </div>

      {projects.length === 0 ? (
        <p className="ui-empty">You have no tables yet. Start one from your floor first.</p>
      ) : (
        <>
          <div className="ps-field">
            <Label>Type</Label>
            <div className="ps-chips">
              {projects.map((p) => (
                <Chip
                  key={p.id}
                  active={p.id === value.projectId}
                  onClick={() => onChange({ ...value, projectId: p.id, boardId: p.boardId ?? value.boardId })}
                >
                  {p.title}
                </Chip>
              ))}
            </div>
          </div>

          <div className="ps-field">
            <Label>Board</Label>
            <div className="ps-chips">
              <Chip active={value.boardId === SCRATCH} onClick={() => onChange({ ...value, boardId: SCRATCH })}>
                Start from scratch
              </Chip>
              <Chip active={value.boardId === PITCH_ASSESSORS} onClick={() => onChange({ ...value, boardId: PITCH_ASSESSORS })}>
                Pitch assessors · {pitchAssessors(data).length}
              </Chip>
              {data.boards.map((b) => (
                <Chip key={b.id} active={b.id === value.boardId} onClick={() => onChange({ ...value, boardId: b.id })}>
                  {b.name} · {b.seats.length}
                </Chip>
              ))}
            </div>
            {value.boardId === SCRATCH ? (
              <div className="ps-chips" role="group" aria-label="Choose who sits on the board">
                {data.assessors.map((a) => {
                  const on = value.customIds.includes(a.id);
                  return (
                    <Chip key={a.id} active={on} onClick={() => onChange({ ...value, customIds: on ? value.customIds.filter((x) => x !== a.id) : [...value.customIds, a.id] })}>
                      {a.name}
                    </Chip>
                  );
                })}
              </div>
            ) : null}
            {seats.length > 0 && <BoardRow seats={seats} />}
            {board === undefined && value.boardId === SCRATCH && seats.length === 0 && <p className="ps-note">Choose who sits on your board.</p>}
          </div>

          <div className="ps-row">
            <div className="ps-field">
              <Label>Questions</Label>
              <Tabs
                label="How many questions"
                items={COUNTS.map((c) => ({ id: c, label: c }))}
                value={String(value.questionCount) as (typeof COUNTS)[number]}
                onChange={(c) => onChange({ ...value, questionCount: Number(c) })}
              />
            </div>
            <div className="ps-field">
              <Label>The board asks</Label>
              <Tabs
                label="How the board asks"
                items={[
                  { id: "spoken", label: "Aloud" },
                  { id: "text", label: "In writing" },
                ]}
                value={value.mode}
                onChange={(m) => onChange({ ...value, mode: m })}
              />
            </div>
            <div className="ps-field">
              <Label>Conditions</Label>
              <Tabs
                label="Conditions"
                items={[
                  { id: "coaching", label: "Coaching" },
                  { id: "exam", label: "Exam conditions" },
                ]}
                value={value.conditions}
                onChange={(c) => onChange({ ...value, conditions: c })}
              />
            </div>
            <div className="ps-field">
              <Label>You present</Label>
              <Tabs
                label="How you present"
                items={[
                  ...(canListen ? [{ id: "live" as const, label: "Speak" }] : []),
                  { id: "typed" as const, label: "Paste a transcript" },
                ]}
                value={capture}
                onChange={(c) => onChange({ ...value, capture: c })}
              />
            </div>
          </div>

          <p className="ps-note">
            {value.conditions === "exam"
              ? "Exam conditions: the board gives no hints. It still steers you back, holds its role and can pause. "
              : "Coaching: when you struggle, the board softens and breaks the question down. "}
            {canListen
              ? "Chrome turns your speech into text with its own speech service. Panel keeps only the text, never the audio."
              : "This browser cannot listen, so paste or type what you said. Chrome can listen live."}
          </p>

          {error && (
            <p className="ps-error" role="alert">
              {error}
            </p>
          )}

          <div className="ps-actions">
            <Button variant="create" size="lg" disabled={!value.projectId || seats.length === 0 || busy} onClick={onStart}>
              {capture === "live" ? "Start presenting" : "Continue"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

/** The preset pitch judges, by role. */
export function pitchAssessors(data: PitchSetupData) {
  return data.assessors.filter((a) => PITCH_ROLES.includes(roleOf(data, a.id)));
}
function roleOf(data: PitchSetupData, id: string): string {
  return data.roles?.[id] ?? "";
}

/** Who sits on the chosen board: a saved board, the pitch assessors, or the student's own picks. */
export function boardSeats(data: PitchSetupData, value: SetupValue) {
  if (value.boardId === PITCH_ASSESSORS) return pitchAssessors(data);
  if (value.boardId === SCRATCH) return value.customIds.map((id) => data.assessors.find((a) => a.id === id)).filter((a) => a !== undefined);
  return data.boards.find((b) => b.id === value.boardId)?.seats ?? [];
}
