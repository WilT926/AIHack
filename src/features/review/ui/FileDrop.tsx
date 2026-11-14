"use client";

import { useState } from "react";
import { cn } from "./cn";

/** Drag-and-drop or click-to-choose file area. */
export function FileDrop({
  accept,
  onFile,
  title,
  hint,
}: {
  accept: string;
  onFile: (file: File) => void;
  title: React.ReactNode;
  hint?: React.ReactNode;
}) {
  const [dragging, setDragging] = useState(false);
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) onFile(file);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-14 text-center transition-colors",
        "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus",
        dragging ? "border-accent bg-critique-tint" : "border-rule hover:border-ink",
      )}
    >
      <span className="font-semibold text-ink">{title}</span>
      {hint}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}
