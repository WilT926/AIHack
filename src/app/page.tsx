import { Suspense } from "react";
import { connection } from "next/server";
import { SkeletonFloor } from "@/components/ui";
import { LoadingChrome } from "@/components/ui/PageFrame";
import { Floor } from "@/features/home/Floor";
import { loadWorkspace } from "@/features/home/load";
import { buildFloor } from "@/features/home/model";

// Home: the Floor, read fresh from the database on every request.
async function FloorFromData() {
  await connection();
  const { workspace, sample } = await loadWorkspace();
  const model = buildFloor(workspace);
  // A new or removed table remounts the floor, so it opens on the newest table.
  return <Floor key={model.tables.map((t) => t.id).join("|")} model={{ ...model, sample }} />;
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="fl-viewport">
          <LoadingChrome />
          <SkeletonFloor />
        </div>
      }
    >
      <FloorFromData />
    </Suspense>
  );
}
