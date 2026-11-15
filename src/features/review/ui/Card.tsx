import { forwardRef } from "react";
import { cn } from "@/components/ui";

type Variant = "default" | "dark" | "live" | "failed" | "quiet" | "dashed";

// §5: cards 22–26px radius; 1.5px lines; dashed 2px means create / empty.
const variantClass: Record<Variant, string> = {
  default: "bg-white border-line border-grey-150",
  dark: "bg-ink text-white border-line border-ink",
  live: "bg-orange text-ink border-line border-orange",
  failed: "bg-white border-2 border-dashed border-grey-300",
  quiet: "bg-grey-50 border-line border-grey-50",
  dashed: "bg-white border-2 border-dashed border-grey-250",
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
      className={cn("rounded-card p-5 transition-colors", variantClass[variant], selected && "border-ink", className)}
    >
      {children}
    </div>
  );
});
