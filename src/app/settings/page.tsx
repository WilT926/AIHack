import { PageFrame } from "@/components/ui/PageFrame";

// Page shell (step 1.1). Settings are minimal in v1 (§9).
export default function SettingsPage() {
  return (
    <PageFrame title="Settings">
      <p className="ui-empty">Nothing to set yet.</p>
    </PageFrame>
  );
}
