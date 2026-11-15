import { Suspense } from "react";
import { connection } from "next/server";
import { Spinner } from "@/components/ui";
import { IntakeScreen } from "@/features/review/intake/IntakeScreen";
import { loadIntakeContext } from "@/features/review/load";
import { EmptyState } from "@/features/review/components/StatusCards";
import { replySource } from "@/lib/engine/service";

type Params = Promise<{ project?: string; from?: string; fresh?: string }>;

/** Only a review page can be "back": anything else goes to the floor. */
const safeBack = (from: unknown) => (typeof from === "string" && /^\/review(\?|$)/.test(from) ? from : null);

// Upload a PDF or paste text, preview the numbered paragraphs, then start a
// live review for the project (?project=<id>, or the first report project).
async function Intake({ searchParams }: { searchParams: Params }) {
  await connection();
  const { project, from, fresh } = await searchParams;
  const context = await loadIntakeContext(typeof project === "string" ? project : null);
  if (!context) {
    return (
      <div className="mx-auto max-w-sheet px-6 py-24">
        <EmptyState title="No project yet" body="Start a panel from your floor first." />
      </div>
    );
  }
  // `fresh` (from the floor's "+") always opens a blank new-document form.
  return <IntakeScreen key={fresh ?? project ?? "intake"} context={context} sampleReplies={replySource() === "sample"} backHref={safeBack(from)} />;
}

export default function NewReviewPage({ searchParams }: { searchParams: Params }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center">
          <Spinner label="Loading" />
        </div>
      }
    >
      <Intake searchParams={searchParams} />
    </Suspense>
  );
}
