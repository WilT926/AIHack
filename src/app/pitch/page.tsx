import { Suspense } from "react";
import { connection } from "next/server";
import { features } from "@/config";
import { Spinner } from "@/components/ui";
import { PageFrame } from "@/components/ui/PageFrame";
import { PitchFlow } from "@/features/pitch/PitchFlow";
import { loadPitchSetup } from "@/features/pitch/load";

async function Pitch({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  await connection();
  const { project } = await searchParams;
  const data = await loadPitchSetup(typeof project === "string" ? project : null);
  return <PitchFlow data={data} />;
}

export default function PitchPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
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
