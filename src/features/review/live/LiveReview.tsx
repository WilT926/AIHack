"use client";

import type { Assessor, Document, ReviewView } from "../types";
import type { ReviewContext } from "../engine/schemas";
import { ReviewScreen } from "../ReviewScreen";
import { useLiveReview } from "./useLiveReview";

/** The review screen, filled in live by the engine. */
export function LiveReview({
  project,
  board,
  assessors,
  context,
  document,
  onUpload,
}: {
  project: ReviewView["project"];
  board: ReviewView["board"];
  assessors: Assessor[];
  context: ReviewContext;
  document: Document;
  onUpload?: () => void;
}) {
  const boardMembers = board.assessorIds
    .map((id) => assessors.find((a) => a.id === id))
    .filter((a): a is Assessor => Boolean(a));

  const { run, live, retryAssessor, retryDeliberation } = useLiveReview({
    context,
    document,
    assessors: boardMembers,
    runId: `run-${document.id}`,
    runNumber: 1,
  });

  return (
    <ReviewScreen
      view={{ project, board, assessors, run, live }}
      onUpload={onUpload}
      onRetryAssessor={retryAssessor}
      onRetryDeliberation={retryDeliberation}
    />
  );
}
