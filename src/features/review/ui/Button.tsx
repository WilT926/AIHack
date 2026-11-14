import { cn } from "./cn";

type Variant = "primary" | "outline";

const variantClass: Record<Variant, string> = {
  primary: "bg-ink text-surface border-2 border-ink",
  outline: "bg-surface text-ink border-2 border-ink",
};

export function Button({
  variant = "primary",
  onClick,
  disabled,
  type = "button",
  children,
}: {
  variant?: Variant;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  children: React.ReactNode;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4.5 py-2 text-sm font-semibold",
        "transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        variantClass[variant],
      )}
    >
      {children}
    </button>
  );
}
