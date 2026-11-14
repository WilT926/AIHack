import { cn } from "./cn";

export function SkeletonLine({ width = "full" }: { width?: "full" | "long" | "short" }) {
  const widthClass = { full: "w-full", long: "w-2/3", short: "w-2/5" }[width];
  return <div className={cn("h-1.5 animate-pulse rounded-full bg-rule", widthClass)} />;
}
