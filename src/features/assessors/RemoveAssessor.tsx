"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { removeAssessor } from "./actions";

export function RemoveAssessor({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return <>
    <Button variant="quiet" size="sm" onClick={() => setOpen(true)}>Remove this assessor</Button>
    <Modal open={open} title={`Remove ${name}?`} onClose={() => { if (!pending) setOpen(false); }}>
      <div className="as-form">
        <p className="as-quiet">This removes {name} from your boards and deletes their notes. Saved sessions and feedback stay. This cannot be undone.</p>
        <div className="as-choices">
          <Button disabled={pending} onClick={() => start(async () => {
            setError("");
            const result = await removeAssessor(id);
            if (!result.ok) { setError(result.error); return; }
            setOpen(false); router.replace("/assessors"); router.refresh();
          })}>{pending ? "Removing…" : "Remove assessor"}</Button>
          <Button variant="secondary" disabled={pending} onClick={() => setOpen(false)}>Keep assessor</Button>
        </div>
        {error && <p role="alert" className="as-message">{error}</p>}
      </div>
    </Modal>
  </>;
}
