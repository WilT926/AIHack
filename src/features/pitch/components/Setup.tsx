import { Button, Chip, Label, Tabs } from "@/components/ui";
import type { PitchSetupData } from "../types";
import { BoardRow } from "./BoardRow";

export type SetupValue = {
  projectId: string | null;
  boardId: string | null;
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
            <Label>Table</Label>
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
              {data.boards.map((b) => (
                <Chip key={b.id} active={b.id === value.boardId} onClick={() => onChange({ ...value, boardId: b.id })}>
                  {b.name} · {b.seats.length}
                </Chip>
              ))}
            </div>
            {board && <BoardRow seats={board.seats} />}
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
            <Button variant="create" size="lg" disabled={!value.projectId || !value.boardId || busy} onClick={onStart}>
              {capture === "live" ? "Start presenting" : "Continue"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
