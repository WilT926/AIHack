"use client";

import { forwardRef, useState } from "react";
import type { Assessor, Comment, CommentKind } from "../types";
import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { Label } from "../ui/Label";
import { Pill, type PillVariant } from "../ui/Pill";
import { TextInput } from "../ui/TextInput";

const kindPill: Record<CommentKind, PillVariant> = {
  critique: "accent",
  question: "ink",
  praise: "outline",
};

function ActionLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-mono text-label uppercase tracking-label text-text-muted transition-colors hover:text-ink focus-visible:text-ink focus-visible:outline-none"
    >
      {children}
    </button>
  );
}

export const CommentCard = forwardRef<
  HTMLDivElement,
  {
    comment: Comment;
    assessor?: Assessor;
    paragraphLabels: { id: string; label: string }[];
    replies: string[];
    selected: boolean;
    onShowInText: () => void;
    onShowParagraph: (paragraphId: string) => void;
    onResolve: () => void;
    onReply: (text: string) => void;
  }
>(function CommentCard(
  { comment, assessor, paragraphLabels, replies, selected, onShowInText, onShowParagraph, onResolve, onReply },
  ref,
) {
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState("");
  const name = assessor?.name ?? "Unknown assessor";

  return (
    <Card ref={ref} selected={selected} className="scroll-mt-4">
      <div className="flex items-start gap-3">
        <Avatar
          avatar={assessor?.avatar ?? ""}
          name={name}
          size="lg"
          ring={comment.kind === "critique" ? "accent" : "ink"}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-semibold text-ink">{name}</span>
          {assessor && <Label tone="accent">{assessor.role}</Label>}
        </div>
        <div className="flex items-center gap-2">
          <Pill variant={kindPill[comment.kind]}>{comment.kind}</Pill>
          {paragraphLabels.map((p) => (
            <Pill key={p.id} variant="outline" onClick={() => onShowParagraph(p.id)} title="Show in text">
              {p.label}
            </Pill>
          ))}
        </div>
      </div>

      <p className="mt-4 text-body text-ink">{comment.text}</p>

      {replies.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2 border-l-2 border-rule pl-3">
          {replies.map((r, i) => (
            <li key={i} className="text-body text-ink">
              <Label className="mr-2">You</Label>
              {r}
            </li>
          ))}
        </ul>
      )}

      {replying && (
        <form
          className="mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            const text = draft.trim();
            if (text) onReply(text);
            setDraft("");
            setReplying(false);
          }}
        >
          <TextInput
            value={draft}
            onChange={setDraft}
            placeholder="Reply, then press Enter"
            ariaLabel={`Reply to ${name}`}
            autoFocus
          />
        </form>
      )}

      <div className="mt-4 flex items-center gap-3 text-text-muted">
        <ActionLink onClick={() => setReplying((v) => !v)}>Reply</ActionLink>
        <span aria-hidden="true">·</span>
        <ActionLink onClick={onResolve}>Resolve</ActionLink>
        <span aria-hidden="true">·</span>
        <ActionLink onClick={onShowInText}>Show in text</ActionLink>
      </div>
    </Card>
  );
});
