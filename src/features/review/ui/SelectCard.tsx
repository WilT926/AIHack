import { cn } from "@/components/ui";

/**
 * A large selectable card: a template (radio) or an assessor (checkbox).
 * 26px radius, 1.5px line; the chosen card takes the ink line.
 */
export function SelectCard({
  role,
  checked,
  onSelect,
  dashed,
  direction = "col",
  className,
  children,
}: {
  role: "radio" | "checkbox";
  checked: boolean;
  onSelect: () => void;
  /** Dashed 2px grey: "create / empty", e.g. "Start blank". */
  dashed?: boolean;
  direction?: "row" | "col";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        "flex rounded-card bg-white text-left transition-colors",
        direction === "row" ? "flex-row" : "flex-col",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange",
        dashed && !checked ? "border-2 border-dashed border-grey-250 hover:border-grey-300" : "border-line",
        !dashed && (checked ? "border-ink" : "border-grey-150 hover:border-grey-300"),
        dashed && checked && "border-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}
