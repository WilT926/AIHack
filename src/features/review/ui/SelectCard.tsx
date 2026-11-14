import { cn } from "./cn";

/**
 * A large selectable card: template choice (radio) or seating an assessor
 * (checkbox). Selected cards get the accent border.
 */
export function SelectCard({
  role,
  checked,
  onSelect,
  dashed,
  className,
  children,
}: {
  role: "radio" | "checkbox";
  checked: boolean;
  onSelect: () => void;
  /** Quiet dashed style, e.g. "Start blank". */
  dashed?: boolean;
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
        "flex flex-col rounded-lg border-2 text-left transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        checked ? "border-accent" : dashed ? "border-dashed border-rule hover:border-graphite" : "border-ink hover:bg-paper",
        className,
      )}
    >
      {children}
    </button>
  );
}
