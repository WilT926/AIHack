import { SkeletonChrome, SkeletonPage } from "@/components/ui";

// Shown while any page without its own loading state is on its way.
export default function Loading() {
  return (
    <div className="ui-frame">
      <SkeletonChrome />
      <main className="ui-frame__main">
        <SkeletonPage />
      </main>
    </div>
  );
}
