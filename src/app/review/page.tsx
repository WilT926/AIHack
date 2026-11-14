import { ReviewScreen } from "@/features/review/ReviewScreen";
import { sampleReview } from "../../../fixtures/review-sample";

// Step 2.1: the review screen on sample data. Step 2.3 swaps in a live run.
export default function ReviewPage() {
  return <ReviewScreen view={sampleReview} />;
}
