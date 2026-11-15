"use client";

import { setActionDone } from "@/features/feedback/actions";
import { useState, useTransition } from "react";
import { Button, Card, Label } from "@/components/ui";
import { ReviewScreen, type RailTab } from "./ReviewScreen";
import { markCommentDone, startStoredReview, type StartedReview } from "./actions";
import { LiveReview } from "./live/LiveReview";
import type { ReviewView } from "./types";

/** A saved review, reopened from the data layer. Never calls the engine. */
export function SavedReview({ view, initialTab, canStart = false }: { view: ReviewView; initialTab?: RailTab; canStart?: boolean }) {
  const id = view.review.id;
  const [started, setStarted] = useState<StartedReview>();
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const hasText = view.document.paragraphs.some((p) => p.type !== "heading" && p.text.trim());
  if (started) return <LiveReview project={view.project} board={{ ...view.board, assessorIds: started.boardIds }} assessors={view.assessors} document={view.document} documentId={started.documentId} reviewId={started.reviewId} replySource={started.replySource} />;
  return (
    <ReviewScreen
      view={view}
      initialTab={initialTab}
      startControl={canStart ? <Card dashed className="flex flex-col gap-3">
        <Label tone="ink">{id ? "Unfinished review" : "Ready to review"}</Label>
        <p className="text-body text-grey-700">{!hasText ? "This document has no saved text to review. Upload a new version to use your own document." : id ? "The previous run did not finish. Start a new review of this saved document when you are ready." : "The board will read this saved document when you start the review."}</p>
        {hasText && <Button disabled={pending || view.board.assessorIds.length === 0} onClick={() => start(async () => {
          setError("");
          const result = await startStoredReview(view.document.id);
          if (!result.ok) { setError(result.error); return; }
          window.history.replaceState(null, "", `/review?review=${encodeURIComponent(result.value.reviewId)}`);
          setStarted(result.value);
        })}>{pending ? "Starting…" : id ? "Start a new review" : "Start review"}</Button>}
        {view.board.assessorIds.length === 0 && <p className="text-body text-grey-700">Add assessors to this project’s board before starting.</p>}
        {error && <p role="alert" className="text-body text-ink">{error}</p>}
      </Card> : undefined}
      onCommentDone={id ? (commentId) => void markCommentDone(id, commentId) : undefined}
      onActionDone={id ? (actionId, done) => void setActionDone({ kind: "review", id, actionId, done }) : undefined}
    />
  );
}
