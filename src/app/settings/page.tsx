import { Suspense } from "react";
import { connection } from "next/server";
import { SkeletonPage } from "@/components/ui";
import { PageFrame } from "@/components/ui/PageFrame";
import { getProfile } from "@/lib/data";
import { Settings } from "@/features/settings/Settings";

// Settings: profile, panel defaults, clips and camera, notifications, privacy,
// accessibility and account (design: "Panel defaults").
async function SettingsFromData() {
  await connection();
  const p = await getProfile();
  if (!p) return <p className="ui-empty">No profile yet. Run npm run db:seed to add the demo student.</p>;
  return <Settings profile={{ name: p.name, university: p.university, course: p.course, level: p.level, avatar: p.avatar }} />;
}

export default function SettingsPage() {
  return (
    <PageFrame title="Settings" bare>
      <Suspense fallback={<SkeletonPage label="Opening settings" cards={0} />}>
        <SettingsFromData />
      </Suspense>
    </PageFrame>
  );
}
