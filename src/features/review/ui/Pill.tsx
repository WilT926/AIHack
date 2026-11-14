import { cn } from "./cn";

export type PillVariant = "ink" | "accent" | "outline" | "outline-inverse";

const variantClass: Record<PillVariant, string> = {
  ink: "bg-ink text-surface border border-ink",
  accent: "bg-accent text-accent-contrast border border-accent",
  outline: "bg-surface text-ink border border-ink",
  "outline-inverse": "bg-transparent text-surface border border-surface",
};

/** Small mono pill: tags, tabs, the live status. */
export function Pill({
  variant = "outline",
  onClick,
  title,
  className,
  children,
}: {
  variant?: PillVariant;
  onClick?: () => void;
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const classes = cn(
    "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1",
    "font-mono text-label uppercase tracking-label",
    variantClass[variant],
    onClick && "cursor-pointer transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
    className,
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} title={title} className={classes}>
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
