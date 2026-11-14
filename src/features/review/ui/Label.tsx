import { cn } from "./cn";

type Tone = "muted" | "accent" | "ink" | "inverse";

const toneClass: Record<Tone, string> = {
  muted: "text-text-muted",
  accent: "text-accent",
  ink: "text-ink",
  inverse: "text-surface",
};

/** Mono, capitals, wide tracking: labels and meta ("IN SESSION · 18 MIN"). */
export function Label({
  tone = "muted",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("font-mono text-label uppercase tracking-label", toneClass[tone], className)}>
      {children}
    </span>
  );
}
