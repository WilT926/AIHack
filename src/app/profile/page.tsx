import { redirect } from "next/navigation";

// Your profile lives in User settings (Profile section), one page everywhere.
export default function ProfilePage() {
  redirect("/settings?section=profile");
}
