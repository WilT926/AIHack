"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Chip, Label, TextArea, TextInput } from "@/components/ui";
import type { AssessorNote } from "@/lib/schemas";
import { deleteAssessorNote, saveAssessorNote } from "./actions";

type Source = AssessorNote["source"];
const SOURCES: Source[] = ["lecture", "handbook", "other"];
function Sources({ value, onChange }: { value: Source; onChange: (value: Source) => void }) {
  return <div className="as-choices" aria-label="Note source">{SOURCES.map((s) => <Chip key={s} active={value === s} onClick={() => onChange(s)}>{s}</Chip>)}</div>;
}

export function Notes({ assessorId, notes }: { assessorId: string; notes: AssessorNote[] }) {
  return <section className="as-notes" aria-labelledby="assessor-notes">
    <div className="as-notes__heading"><h2 id="assessor-notes">Their notes</h2>
    <p className="as-quiet">What this marker wants, from lectures, the handbook or your own observations. Only this assessor receives these notes.</p></div>
    {notes.length ? <ul className="as-note-list">{notes.map((note) => <Note key={`${note.id}-${note.text}-${note.source}`} note={note} />)}</ul> : <p className="as-notes__empty">No notes yet. Add something your marker has said they look for.</p>}
    <NewNote assessorId={assessorId} />
    <NewNote assessorId={assessorId} transcript />
  </section>;
}
function NewNote({ assessorId, transcript = false }: { assessorId: string; transcript?: boolean }) {
  const router = useRouter();
  const [source, setSource] = useState<Source>(transcript ? "lecture" : "other");
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  return <form className={transcript ? "as-form as-transcript" : "as-form"} onSubmit={(e) => {
    e.preventDefault(); setMessage("");
    start(async () => {
      const r = await saveAssessorNote({ assessorId, text, source: transcript ? "lecture" : source });
      if (!r.ok) { setMessage(r.error); return; }
      setText(""); setMessage("Note saved. It will be included in this assessor's next review."); router.refresh();
    });
  }}>
    {transcript ? <TextArea id="lecture-transcript" label="Paste a lecture transcript" hint="Up to 20,000 characters. Saved as a lecture note for this assessor." rows={6} maxLength={20000} value={text} required placeholder="Paste the transcript here…" onChange={(e) => setText(e.target.value)} /> : <TextInput id="new-assessor-note" label="Add a note" placeholder="Something this marker looks for…" maxLength={20000} value={text} required onChange={(e) => setText(e.target.value)} />}
    <div className="as-note-actions">
      {!transcript && <Sources value={source} onChange={setSource} />}
      <Button type="submit" disabled={pending || !text.trim()}>{pending ? "Saving…" : transcript ? "Save lecture transcript" : "Add note"}</Button>
    </div>
    {message && <p role="status" className="as-message">{message}</p>}
  </form>;
}
function Note({ note }: { note: AssessorNote }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.text);
  const [source, setSource] = useState(note.source);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return <li className="as-note">
    <Label tone="ink" size="sm">{note.source}</Label>
    {editing ? <form className="as-form" onSubmit={(e) => { e.preventDefault(); start(async () => {
      const r = await saveAssessorNote({ ...note, text, source });
      if (!r.ok) { setError(r.error); return; }
      setEditing(false); router.refresh();
    }); }}>
      <TextArea id={`note-${note.id}`} label="Edit note" rows={4} value={text} required maxLength={20000} onChange={(e) => setText(e.target.value)} />
      <Sources value={source} onChange={setSource} />
      <div className="as-choices"><Button type="submit" disabled={pending}>Save changes</Button><Button variant="quiet" onClick={() => setEditing(false)}>Cancel</Button></div>
    </form> : <p className="as-note__text">{note.text}</p>}
    {!editing && <div className="as-choices"><Button variant="quiet" size="sm" onClick={() => setEditing(true)}>Edit</Button><Button variant="quiet" size="sm" disabled={pending} onClick={() => start(async () => {
      const r = await deleteAssessorNote({ id: note.id, assessorId: note.assessorId });
      if (!r.ok) setError(r.error); else router.refresh();
    })}>{pending ? "Deleting…" : "Delete"}</Button></div>}
    {error && <p role="alert" className="as-message">{error}</p>}
  </li>;
}
