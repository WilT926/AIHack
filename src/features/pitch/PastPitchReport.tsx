"use client";

import { Button } from "@/components/ui";
import { FeedbackReport, type ReportPerson } from "@/features/feedback/FeedbackReport";
import { setActionDone } from "@/features/feedback/actions";
import type { PitchSession } from "@/lib/schemas";
import { SessionFrame } from "./components/SessionFrame";

/** A past pitch session's feedback report, reopened. No engine call. */
export function PastPitchReport({ session, seats, sample }: { session: PitchSession; seats: ReportPerson[]; sample: boolean }) {
  return (
    <SessionFrame step={3} sample={sample} sampleReplies={session.replySource === "sample"} preview={false}>
      <FeedbackReport
        report={session.report!}
        people={seats}
        questions={session.questions}
        sample={session.replySource === "sample"}
        onToggleAction={(actionId, done) => void setActionDone({ kind: "pitch", id: session.id, actionId, done })}
        footer={
          <div className="ps-actions">
            <Button variant="secondary" size="lg" href="/">
              Back to your floor
            </Button>
            <Button variant="primary" size="lg" href={`/pitch?project=${encodeURIComponent(session.projectId)}`}>
              Practise again
            </Button>
          </div>
        }
      />
    </SessionFrame>
  );
}
