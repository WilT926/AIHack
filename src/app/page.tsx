import { Suspense } from "react";
import { connection } from "next/server";
import { SkeletonChrome, SkeletonFloor } from "@/components/ui";
import { Floor } from "@/features/home/Floor";
import { loadWorkspace } from "@/features/home/load";
import { buildFloor } from "@/features/home/model";

// Home: the Floor, read fresh from the database on every request.
async function FloorFromData() {
  await connection();
  const { workspace, sample } = await loadWorkspace();
  return <Floor model={{ ...buildFloor(workspace), sample }} />;
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="fl-viewport">
          <SkeletonChrome />
          <SkeletonFloor />
        </div>
      }
    >
      <FloorFromData />
    </Suspense>
  );
}
