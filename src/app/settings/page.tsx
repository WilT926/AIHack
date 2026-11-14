import Link from "next/link";
import { Label, Logo } from "@/components/ui";

// Empty shell (step 1.1). Settings are minimal in v1 (DESIGN_SYSTEM §9).
export default function SettingsPage() {
  return (
    <main className="shell">
      <Link href="/" aria-label="Back to your floor">
        <Logo />
      </Link>
      <Label>Settings</Label>
      <p className="shell__note">Nothing to set yet.</p>
    </main>
  );
}
