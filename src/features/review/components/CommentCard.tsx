import { forwardRef } from "react";
import type { Assessor, Comment, CommentSeverity } from "../types";
import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { Label } from "../ui/Label";
import { Pill, type PillVariant } from "../ui/Pill";
import { TextButton } from "../ui/TextButton";

const severityPill: Record<CommentSeverity, PillVariant> = {
  major: "accent",
  minor: "outline",
  praise: "quiet",
};

/**
 * One comment (§9): the assessor's avatar, name, mono field, the comment and
 * its suggestion. No Reply in v1; a comment can be marked done (§1.1).
 */
export const CommentCard = forwardRef<
  HTMLDivElement,
  {
    comment: Comment;
    assessor?: Assessor;
    paragraphLabel: string;
    selected: boolean;
    onShowInText: () => void;
    onDone: () => void;
  }
>(function CommentCard({ comment, assessor, paragraphLabel, selected, onShowInText, onDone }, ref) {
  const name = assessor?.name ?? "Unknown assessor";

  return (
    <Card ref={ref} selected={selected} className="scroll-mt-4">
      <div className="flex items-center gap-2.5">
        <Avatar avatar={assessor?.avatar ?? ""} name={name} size="md" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-body font-semibold text-ink">{name}</span>
          {assessor && <Label size="sm">{assessor.field}</Label>}
        </div>
        <div className="flex items-center gap-2">
          <Pill variant={severityPill[comment.severity]}>{comment.severity}</Pill>
          <Pill variant="outline" onClick={onShowInText} title="Show in text">
            {paragraphLabel}
          </Pill>
        </div>
      </div>

      <Label size="sm" className="mt-3 block">
        {comment.category}
      </Label>
      <p className="mt-1.5 text-body text-grey-900">{comment.text}</p>
      {comment.suggestion && <p className="mt-2 text-small text-grey-700">{comment.suggestion}</p>}

      <div className="mt-4 flex items-center gap-3 text-grey-500">
        <TextButton onClick={onDone}>Mark done</TextButton>
        <span aria-hidden="true">·</span>
        <TextButton onClick={onShowInText}>Show in text</TextButton>
      </div>
    </Card>
  );
});
