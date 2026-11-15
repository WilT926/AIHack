import { forwardRef } from "react";
import type { Assessor, Comment, CommentKind } from "../types";
import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { Label } from "../ui/Label";
import { Pill, type PillVariant } from "../ui/Pill";
import { TextButton } from "../ui/TextButton";

const kindPill: Record<CommentKind, PillVariant> = {
  critique: "accent",
  question: "outline",
  praise: "quiet",
};

/**
 * One comment (§9): the assessor's 24px avatar, name, mono role, the comment.
 * No Reply in v1; a comment can be marked done (§1.1).
 */
export const CommentCard = forwardRef<
  HTMLDivElement,
  {
    comment: Comment;
    assessor?: Assessor;
    paragraphLabels: { id: string; label: string }[];
    /** The marking criterion this comment is tagged with (step 2.5). */
    criterionName?: string;
    selected: boolean;
    onShowInText: () => void;
    onShowParagraph: (paragraphId: string) => void;
    onDone: () => void;
  }
>(function CommentCard({ comment, assessor, paragraphLabels, criterionName, selected, onShowInText, onShowParagraph, onDone }, ref) {
  const name = assessor?.name ?? "Unknown assessor";

  return (
    <Card ref={ref} selected={selected} className="scroll-mt-4">
      <div className="flex items-center gap-2.5">
        <Avatar avatar={assessor?.avatar ?? ""} name={name} size="md" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-body font-semibold text-ink">{name}</span>
          {assessor && <Label size="sm">{assessor.role}</Label>}
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

      <p className="mt-3.5 text-body text-grey-900">{comment.text}</p>

      {criterionName && (
        <div className="mt-3">
          <Pill variant="quiet" title="Marking criterion">
            {criterionName}
          </Pill>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3 text-grey-500">
        <TextButton onClick={onDone}>Mark done</TextButton>
        <span aria-hidden="true">·</span>
        <TextButton onClick={onShowInText}>Show in text</TextButton>
      </div>
    </Card>
  );
});
