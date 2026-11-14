import Link from "next/link";
import { Label, Logo } from "@/components/ui";

// Empty shell (step 1.1). The profile sheet is built later (DESIGN_SYSTEM §15).
export default function ProfilePage() {
  return (
    <main className="shell">
      <Link href="/" aria-label="Back to your floor">
        <Logo />
      </Link>
      <Label>Your profile</Label>
      <p className="shell__note">University, course, level and your avatar will be set here.</p>
    </main>
  );
}
