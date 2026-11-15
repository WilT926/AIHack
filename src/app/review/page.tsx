import { Suspense } from "react";
import { connection } from "next/server";
import { Spinner } from "@/components/ui";
import { ReviewScreen } from "@/features/review/ReviewScreen";
import { SavedReview } from "@/features/review/SavedReview";
import { loadReviewView } from "@/features/review/load";
import { EmptyState } from "@/features/review/components/StatusCards";
import { sampleReview } from "../../../fixtures/review-sample";

type Params = Promise<{ review?: string }>;

// /review?review=<id> reopens a saved review from the data layer (no engine
// call). /review on its own shows the sample review, labelled as sample.
async function Review({ searchParams }: { searchParams: Params }) {
  await connection();
  const { review } = await searchParams;
  if (typeof review !== "string" || !review) return <ReviewScreen view={sampleReview} />;
  const view = await loadReviewView(review);
  if (!view) {
    return (
      <div className="mx-auto max-w-sheet px-6 py-24">
        <EmptyState title="That review was not found" body="It may have been made before the server restarted. Start a new review from your floor." />
      </div>
    );
  }
  return <SavedReview view={view} />;
}

export default function ReviewPage({ searchParams }: { searchParams: Params }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center">
          <Spinner label="Opening the review" />
        </div>
      }
    >
      <Review searchParams={searchParams} />
    </Suspense>
  );
}
