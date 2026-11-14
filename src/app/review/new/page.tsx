import { IntakeScreen } from "@/features/review/intake/IntakeScreen";
import { sampleReview } from "../../../../fixtures/review-sample";

// Step 2.2: upload a PDF or paste text, preview the numbered paragraphs, then
// open the review screen. The project and board are sample data until step 2.4.
export default function NewReviewPage() {
  const { project, board, assessors } = sampleReview;
  return <IntakeScreen context={{ project, board, assessors }} />;
}
