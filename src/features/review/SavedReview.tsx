"use client";

import { setActionDone } from "@/features/feedback/actions";
import { ReviewScreen } from "./ReviewScreen";
import { markCommentDone } from "./actions";
import type { ReviewView } from "./types";

/** A saved review, reopened from the data layer. Never calls the engine. */
export function SavedReview({ view }: { view: ReviewView }) {
  const id = view.review.id;
  return (
    <ReviewScreen
      view={view}
      onCommentDone={id ? (commentId) => void markCommentDone(id, commentId) : undefined}
      onActionDone={id ? (actionId, done) => void setActionDone({ kind: "review", id, actionId, done }) : undefined}
    />
  );
}
