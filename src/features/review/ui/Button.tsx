import { Button as SharedButton } from "@/components/ui";

type Variant = "primary" | "outline" | "create" | "quiet";

const map = { primary: "primary", outline: "secondary", create: "create", quiet: "quiet" } as const;

/** §9 buttons: create (orange, ink text), primary (ink), secondary (outline), quiet. */
export function Button({
  variant = "primary",
  size = "md",
  onClick,
  disabled,
  type = "button",
  children,
}: {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  children: React.ReactNode;
}) {
  return (
    <SharedButton variant={map[variant]} size={size} onClick={onClick} disabled={disabled} type={type}>
      {children}
    </SharedButton>
  );
}
