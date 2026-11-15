import { Suspense } from "react";
import { connection } from "next/server";
import { Button, Spinner } from "@/components/ui";
import { ReviewScreen } from "@/features/review/ReviewScreen";
import { SavedReview } from "@/features/review/SavedReview";
import { loadDocumentView, loadReviewView } from "@/features/review/load";
import { EmptyState } from "@/features/review/components/StatusCards";
import { sampleReview } from "../../../fixtures/review-sample";

type Params = Promise<{ review?: string; document?: string; tab?: string }>;

// /review?review=<id> reopens a saved review from the data layer (no engine
// call). /review on its own shows the sample review, labelled as sample.
async function Review({ searchParams }: { searchParams: Params }) {
  await connection();
  const { review, document, tab } = await searchParams;
  const initialTab = tab === "report" ? "report" : "comments";
  if (!review && !document) return <ReviewScreen key={initialTab} view={sampleReview} initialTab={initialTab} />;
  const loaded = typeof document === "string" && document ? await loadDocumentView(document) : null;
  const view = loaded?.view ?? (typeof review === "string" && review ? await loadReviewView(review) : null);
  if (!view) {
    return (
      <div className="mx-auto max-w-sheet px-6 py-24">
        <EmptyState title={document ? "That document was not found" : "That review was not found"} body="It may have been made before the server restarted. Return to your floor to choose another document or upload a new one." />
        <div className="mt-4 flex justify-center"><Button href="/">Back to your floor</Button></div>
      </div>
    );
  }
  return <SavedReview key={`${view.document.id}-${view.review.id}-${initialTab}`} view={view} initialTab={initialTab} canStart={loaded?.canStart} />;
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
