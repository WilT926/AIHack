import { forwardRef } from "react";
import { cn } from "./cn";

type Variant = "default" | "dark" | "arriving" | "failed";

const variantClass: Record<Variant, string> = {
  default: "bg-surface border border-rule",
  dark: "bg-ink text-surface border border-ink",
  arriving: "bg-surface border-2 border-dashed border-accent",
  failed: "bg-surface border-2 border-dashed border-graphite",
};

export const Card = forwardRef<
  HTMLDivElement,
  {
    variant?: Variant;
    selected?: boolean;
    className?: string;
    children: React.ReactNode;
  }
>(function Card({ variant = "default", selected, className, children }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg p-5 transition-shadow",
        variantClass[variant],
        selected && "ring-2 ring-inset ring-ink",
        className,
      )}
    >
      {children}
    </div>
  );
});
