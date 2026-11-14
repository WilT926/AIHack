"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { IconButton } from "./index";

/**
 * A sheet-style dialog (§9): native <dialog>, so focus is trapped and Esc
 * closes it. Controlled by `open`.
 */
export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="ui-modal"
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ui-modal__head">
        <h2 className="ui-modal__title">{title}</h2>
        <IconButton label="Close" quiet onClick={onClose}>
          ×
        </IconButton>
      </div>
      {children}
    </dialog>
  );
}
