import { Suspense } from "react";
import { connection } from "next/server";
import { features } from "@/config";
import { Spinner } from "@/components/ui";
import { PageFrame } from "@/components/ui/PageFrame";
import { PitchFlow } from "@/features/pitch/PitchFlow";
import { loadPitchReport, loadPitchSetup } from "@/features/pitch/load";
import { PastPitchReport } from "@/features/pitch/PastPitchReport";

async function Pitch({ searchParams }: { searchParams: Promise<{ project?: string; session?: string }> }) {
  await connection();
  const { project, session } = await searchParams;
  if (typeof session === "string" && session) {
    const past = await loadPitchReport(session);
    if (!past) {
      return (
        <PageFrame title="Presentation practice">
          <p className="ui-empty">That session has no feedback report. It may not have finished, or the server restarted since.</p>
        </PageFrame>
      );
    }
    return <PastPitchReport session={past.session} seats={past.seats} sample={past.sample} />;
  }
  const data = await loadPitchSetup(typeof project === "string" ? project : null);
  return <PitchFlow data={data} />;
}

export default function PitchPage({ searchParams }: { searchParams: Promise<{ project?: string; session?: string }> }) {
  if (!features.pitch && !features.pitchPreview) {
    return (
      <PageFrame title="Presentation practice">
        <p className="ui-empty">Presentation practice is not switched on yet.</p>
      </PageFrame>
    );
  }
  return (
    <Suspense
      fallback={
        <div className="ps-frame ps-frame--loading">
          <Spinner label="Setting up the room" />
        </div>
      }
    >
      <Pitch searchParams={searchParams} />
    </Suspense>
  );
}
