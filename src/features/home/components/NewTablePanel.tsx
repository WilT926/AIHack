"use client";

// New table: a blank side panel where every field is editable. Pick the
// details and who sits at the table (a saved board, or start from scratch),
// then Create table saves it to the database and the floor opens on it.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Chip, Label } from "@/components/ui";
import { createTable } from "../actions";
import type { FloorAssessor, FloorModel } from "../model";
import { BLANK_DETAILS, TableDetailsForm, type TableDetails } from "./TableDetailsForm";

export function NewTablePanel({ assessors, boards, onCancel }: { assessors: FloorAssessor[]; boards: FloorModel["boards"]; onCancel: () => void }) {
  const router = useRouter();
  const [details, setDetails] = useState<TableDetails>(BLANK_DETAILS);
  const [boardId, setBoardId] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const byId = new Map(assessors.map((a) => [a.id, a]));
  const seated = boardId ? (boards.find((b) => b.id === boardId)?.assessorIds ?? []) : picked;

  const create = () =>
    start(async () => {
      const res = await createTable({ ...details, boardId, assessorIds: boardId ? [] : picked });
      if (!res.ok) return setError(res.error);
      router.refresh();
    });

  return (
    <aside className="fl-panel" aria-label="New table">
      <div className="fl-panel__top">
        <Label tone="orange">New table</Label>
      </div>
      <div className="fl-panel__head">
        <h1 className="fl-panel__title">{details.title.trim() || "Untitled table"}</h1>
        <span className="fl-panel__line">Fill in what you know; you can change it later.</span>
      </div>

      <TableDetailsForm value={details} onChange={setDetails} idPrefix="new" />

      <section className="fl-panel__section" aria-label="Board">
        <Label>Board</Label>
        <div className="fl-chips">
          <Chip active={boardId === null} onClick={() => setBoardId(null)}>
            Start from scratch
          </Chip>
          {boards.map((b) => (
            <Chip key={b.id} active={b.id === boardId} onClick={() => setBoardId(b.id)}>
              {b.name} · {b.assessorIds.length}
            </Chip>
          ))}
        </div>
        {boardId === null ? (
          <div className="fl-pick" role="group" aria-label="Choose who sits at the table">
            {assessors.map((a) => {
              const on = picked.includes(a.id);
              return (
                <button key={a.id} type="button" className="fl-pick__item" aria-pressed={on} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== a.id) : [...p, a.id]))}>
                  <Avatar avatar={a.avatar} size="md" />
                  <span className="fl-pick__name">{a.short}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="fl-pick fl-pick--static">
            {seated.map((id) => {
              const a = byId.get(id);
              return a ? (
                <span key={id} className="fl-pick__item" data-static>
                  <Avatar avatar={a.avatar} size="md" />
                  <span className="fl-pick__name">{a.short}</span>
                </span>
              ) : null;
            })}
          </div>
        )}
      </section>

      {error && (
        <p className="ps-error" role="alert">
          {error}
        </p>
      )}

      <div className="fl-panel__footer">
        <Button variant="secondary" size="lg" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button variant="create" size="lg" block onClick={create} disabled={pending || !details.title.trim() || seated.length === 0}>
          {pending ? "Making…" : "Create table"}
        </Button>
      </div>
    </aside>
  );
}
