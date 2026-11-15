import { Label as SharedLabel, cn } from "@/components/ui";

type Tone = "muted" | "accent" | "ink" | "inverse";

/** Mono label (§4): JetBrains Mono 500, 11px, capitals. */
export function Label({
  tone = "muted",
  size = "md",
  className,
  children,
}: {
  tone?: Tone;
  size?: "md" | "sm" | "xs";
  className?: string;
  children: React.ReactNode;
}) {
  const shared = tone === "accent" ? "orange" : tone === "ink" ? "ink" : "grey";
  return (
    <SharedLabel tone={shared} size={size} className={cn(tone === "inverse" && "lane2-label-inverse", className)}>
      {children}
    </SharedLabel>
  );
}
