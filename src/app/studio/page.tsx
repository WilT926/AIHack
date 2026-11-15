import { Suspense } from "react";
import { connection } from "next/server";
import { SkeletonPage } from "@/components/ui";
import { PageFrame } from "@/components/ui/PageFrame";
import { getProfile } from "@/lib/data";
import { AvatarStudio } from "@/features/studio/AvatarStudio";

// Avatar studio (Settings in the dock). v1: pick your avatar from the set (§1.1).
async function Studio() {
  await connection();
  const profile = await getProfile();
  return <AvatarStudio profileAvatar={profile?.avatar ?? "avatar-001"} name={profile?.name ?? "You"} />;
}

export default function StudioPage() {
  return (
    <PageFrame title="Avatar studio" active="studio">
      <Suspense fallback={<SkeletonPage label="Opening the studio" cards={8} />}>
        <Studio />
      </Suspense>
    </PageFrame>
  );
}
