"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Chip, DotRating, Label, TextInput } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import type { Assessor } from "@/lib/schemas";
import { copyAssessor } from "./actions";

const AVATARS = Array.from({ length: 100 }, (_, i) => `avatar-${String(i + 1).padStart(3, "0")}`);
export function CopyAssessor({ assessors, initialId, label = "New assessor" }: { assessors: Assessor[]; initialId?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState(initialId ?? assessors[0]?.id ?? "");
  const source = assessors.find((a) => a.id === sourceId);
  return <>
    <Button variant="create" disabled={!assessors.length} onClick={() => setOpen(true)}>{label}</Button>
    <Modal open={open} title="Copy an assessor" onClose={() => setOpen(false)}>
      <div className="as-form">
        <Label>Start with an existing assessor</Label>
        <div className="as-choices">{assessors.map((a) => <Chip key={a.id} active={a.id === sourceId} onClick={() => setSourceId(a.id)}>{a.name}</Chip>)}</div>
        {source && <CopyForm key={source.id} source={source} onClose={() => setOpen(false)} />}
      </div>
    </Modal>
  </>;
}

function CopyForm({ source, onClose }: { source: Assessor; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(`${source.name} (copy)`);
  const [field, setField] = useState(source.field);
  const [harshness, setHarshness] = useState(source.harshness);
  const [focus, setFocus] = useState(source.focusAreas.join(", "));
  const [avatar, setAvatar] = useState(source.avatar);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return <form className="as-form" onSubmit={(e) => {
    e.preventDefault(); setError("");
    start(async () => {
      const result = await copyAssessor({ basedOn: source.id, name, field, harshness, focusAreas: focus.split(",").map((s) => s.trim()).filter(Boolean), avatar });
      if (!result.ok) { setError(result.error); return; }
      onClose(); router.push(`/assessors/${result.value.id}`); router.refresh();
    });
  }}>
    <TextInput id="copy-name" label="Name" value={name} maxLength={100} required onChange={(e) => setName(e.target.value)} />
    <TextInput id="copy-field" label="Field" value={field} maxLength={200} required onChange={(e) => setField(e.target.value)} />
    <fieldset className="as-fieldset"><legend className="ui-label">Harshness</legend><div className="as-choices">{[1, 2, 3, 4, 5].map((n) => <Chip key={n} active={harshness === n} aria-label={`Set harshness to ${n} of 5`} onClick={() => setHarshness(n)}><DotRating value={n} max={5} label="Harshness" /></Chip>)}</div></fieldset>
    <TextInput id="copy-focus" label="Focus areas" hint="Separate up to twelve areas with commas." value={focus} onChange={(e) => setFocus(e.target.value)} />
    <details className="as-avatar-picker"><summary><Avatar avatar={avatar} size="lg" /><Label>Choose a pen avatar · 100 available</Label></summary>
      <div className="as-avatar-grid">{AVATARS.map((a) => <Chip key={a} active={avatar === a} aria-label={`Choose ${a}`} onClick={() => setAvatar(a)}><Avatar avatar={a} size="lg" /></Chip>)}</div>
    </details>
    <p className="ui-field__hint">Copies their role and personality. Add your own lecture or handbook notes after creating the copy.</p>
    {error && <p role="alert" className="as-message">{error}</p>}
    <Button type="submit" disabled={pending}>{pending ? "Creating assessor…" : "Create assessor"}</Button>
  </form>;
}
