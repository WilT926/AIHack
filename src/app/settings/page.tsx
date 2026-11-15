import { Suspense } from "react";
import { connection } from "next/server";
import { SkeletonPage } from "@/components/ui";
import { PageFrame } from "@/components/ui/PageFrame";
import { getProfile } from "@/lib/data";
import { Settings } from "@/features/settings/Settings";
import { sectionFrom } from "@/features/settings/sections";

type Params = Promise<{ section?: string }>;

// User settings: profile (default), panel defaults, clips and camera,
// notifications, privacy, accessibility and account. ?section=… opens one.
async function SettingsFromData({ searchParams }: { searchParams: Params }) {
  await connection();
  const [p, { section }] = await Promise.all([getProfile(), searchParams]);
  if (!p) return <p className="ui-empty">No profile yet. Run npm run db:seed to add the demo student.</p>;
  const initial = sectionFrom(section);
  return <Settings key={initial} profile={p} initialSection={initial} />;
}

export default function SettingsPage({ searchParams }: { searchParams: Params }) {
  return (
    <PageFrame title="User settings" active="profile" bare>
      <Suspense fallback={<SkeletonPage label="Opening user settings" cards={0} />}>
        <SettingsFromData searchParams={searchParams} />
      </Suspense>
    </PageFrame>
  );
}
