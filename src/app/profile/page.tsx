import { Suspense } from "react";
import { connection } from "next/server";
import { Avatar, Label, Spinner } from "@/components/ui";
import { PageFrame } from "@/components/ui/PageFrame";
import { getProfile, hasDatabase } from "@/lib/data";
import { sampleWorkspace } from "../../../fixtures/home-sample";

// Page shell (step 1.1). The editable profile sheet comes later (§15, tier 5).
async function ProfileDetails() {
  await connection();
  const profile = hasDatabase() ? await getProfile() : sampleWorkspace.profile;
  if (!profile) return <p className="ui-empty">No profile yet. Run npm run db:seed to add the demo student.</p>;
  return (
    <div className="shell-profile">
      <Avatar avatar={profile.avatar} size="2xl" />
      <div className="shell-profile__text">
        <span className="shell-card__name">{profile.name}</span>
        <span className="shell-card__sub">{profile.university}</span>
        <span className="shell-card__sub">{profile.course}</span>
        <Label>{profile.level}</Label>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <PageFrame title="Your profile" active="profile">
      <Suspense fallback={<Spinner label="Loading" />}>
        <ProfileDetails />
      </Suspense>
    </PageFrame>
  );
}
