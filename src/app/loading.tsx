import { SkeletonPage } from "@/components/ui";
import { LoadingChrome } from "@/components/ui/PageFrame";

// Shown while any page without its own loading state is on its way: the real
// top bar and dock (they stay steady), with placeholder content.
export default function Loading() {
  return (
    <div className="ui-frame">
      <LoadingChrome />
      <main className="ui-frame__main">
        <SkeletonPage />
      </main>
    </div>
  );
}
