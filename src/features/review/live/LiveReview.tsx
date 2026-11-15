"use client";

import { useRef } from "react";
import type { ReplySource } from "@/lib/schemas";
import { setActionDone } from "@/features/feedback/actions";
import type { Assessor, Document, ReviewView } from "../types";
import { ReviewScreen } from "../ReviewScreen";
import { markCommentDone } from "../actions";
import { useLiveReview } from "./useLiveReview";

/** The review screen, filled in live by the engine. */
export function LiveReview({
  project,
  board,
  assessors,
  document,
  documentId,
  reviewId,
  replySource,
  onUpload,
}: {
  project: ReviewView["project"];
  board: ReviewView["board"];
  assessors: Assessor[];
  document: Document;
  documentId: string;
  reviewId: string;
  replySource: ReplySource;
  onUpload?: () => void;
}) {
  const doneIds = useRef(new Set<string>());
  const { review, live, retryAssessor, retryDeliberation } = useLiveReview({
    projectId: project.id,
    documentId,
    reviewId,
    assessorIds: board.assessorIds,
    replySource,
    doneCommentIds: () => [...doneIds.current],
  });

  return (
    <ReviewScreen
      view={{ project, board, assessors, document, review, live }}
      onUpload={onUpload}
      onRetryAssessor={retryAssessor}
      onRetryDeliberation={retryDeliberation}
      onCommentDone={(commentId) => {
        doneIds.current.add(commentId);
        void markCommentDone(reviewId, commentId);
      }}
      onActionDone={(actionId, done) => void setActionDone({ kind: "review", id: reviewId, actionId, done })}
    />
  );
}
