import { cn } from "@/components/ui";

export type PillVariant = "ink" | "accent" | "outline" | "outline-inverse" | "quiet";

// Mono tags (§4 label type on a §5 pill). Text on orange is always ink (§3).
const variantClass: Record<PillVariant, string> = {
  ink: "bg-ink text-white border-line border-ink",
  accent: "bg-orange text-ink border-line border-orange",
  outline: "bg-white text-ink border-line border-ink",
  "outline-inverse": "bg-transparent text-white border-line border-white",
  quiet: "bg-grey-50 text-ink border-line border-grey-50",
};

/** Small mono pill: comment kinds, paragraph tags, status. */
export function Pill({
  variant = "outline",
  onClick,
  title,
  pressed,
  className,
  children,
}: {
  variant?: PillVariant;
  onClick?: () => void;
  title?: string;
  pressed?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const classes = cn(
    "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1",
    "font-mono text-label-sm font-medium uppercase tracking-label",
    variantClass[variant],
    onClick && "cursor-pointer transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange",
    className,
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} title={title} aria-pressed={pressed} className={classes}>
        {children}
      </button>
    );
  }
  return (
    <span title={title} className={classes}>
      {children}
    </span>
  );
}
