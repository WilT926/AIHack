"use client";

import type { Assessor, Document, ReviewView, Run } from "../types";
import type { PreviousRun, ReviewContext } from "../engine/schemas";
import { ReviewScreen } from "../ReviewScreen";
import { useLiveReview } from "./useLiveReview";

/** The review screen, filled in live by the engine. */
export function LiveReview({
  project,
  board,
  assessors,
  context,
  document,
  runNumber = 1,
  previous,
  onUpload,
}: {
  project: ReviewView["project"];
  board: ReviewView["board"];
  assessors: Assessor[];
  context: ReviewContext;
  document: Document;
  runNumber?: number;
  /** The previous run, for a second look at a new version (step 2.5). */
  previous?: PreviousRun;
  /** "Upload next version", with the run as it stands, so the next run can compare against it. */
  onUpload?: (current: Run) => void;
}) {
  const boardMembers = board.assessorIds
    .map((id) => assessors.find((a) => a.id === id))
    .filter((a): a is Assessor => Boolean(a));

  const { run, live, retryAssessor, retryDeliberation } = useLiveReview({
    context,
    document,
    assessors: boardMembers,
    previous,
    runId: `run-${document.id}-${runNumber}`,
    runNumber,
  });

  return (
    <ReviewScreen
      view={{ project, board, assessors, run, live, criteria: context.criteria, qaMode: context.qaMode }}
      onUpload={onUpload ? () => onUpload(run) : undefined}
      onRetryAssessor={retryAssessor}
      onRetryDeliberation={retryDeliberation}
    />
  );
}
