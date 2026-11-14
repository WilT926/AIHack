// Base components. Pages and features are built from these. Plain styling
// through the style variables only (src/styles/ui.css).
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

// ---------- Logo ----------

export function Logo({ sub }: { sub?: string }) {
  return (
    <div className="ui-logo" aria-label="Panel">
      <div className="ui-logo__mark" aria-hidden>
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="ui-logo__text">
        <span className="ui-logo__word">Panel</span>
        {sub && <span className="ui-logo__sub">{sub}</span>}
      </div>
    </div>
  );
}

// ---------- Avatar ----------

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "fill";

/** A pen avatar from public/avatars (§6). `avatar` is the file stem, e.g. "avatar-006". */
export function Avatar({
  avatar,
  size = "md",
  invert = false,
  alt = "",
  className,
}: {
  avatar: string;
  size?: AvatarSize;
  invert?: boolean;
  alt?: string;
  className?: string;
}) {
  const safe = /^avatar-\d{3}$/.test(avatar) ? avatar : "avatar-001";
  return (
    // Plain <img>: the avatars are small static SVGs and need no optimisation.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/avatars/${safe}.svg`}
      alt={alt}
      draggable={false}
      className={cn("ui-avatar", `ui-avatar--${size}`, invert && "ui-avatar--invert", className)}
    />
  );
}

// ---------- Buttons ----------

export type ButtonVariant = "create" | "primary" | "secondary" | "quiet" | "on-ink";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  block?: boolean;
  href?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export function Button({ variant = "primary", size = "md", block, href, className, children, ...rest }: ButtonProps) {
  const cls = cn(
    "ui-btn",
    `ui-btn--${variant}`,
    size !== "md" && `ui-btn--${size}`,
    block && "ui-btn--block",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}

export function IconButton({
  label,
  quiet,
  className,
  children,
  ...rest
}: { label: string; quiet?: boolean; children: ReactNode } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">) {
  return (
    <button type="button" aria-label={label} className={cn("ui-icon-btn", quiet && "ui-icon-btn--quiet", className)} {...rest}>
      {children}
    </button>
  );
}

// ---------- Chips ----------

export function Chip({
  active,
  children,
  ...rest
}: { active?: boolean; children: ReactNode } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">) {
  return (
    <button type="button" aria-pressed={active} className={cn("ui-chip", active && "ui-chip--active")} {...rest}>
      {children}
    </button>
  );
}

/** A two-letter project code chip, e.g. MT. Takes the text colour. */
export function CodeChip({ code }: { code: string }) {
  return <span className="ui-code-chip">{code}</span>;
}

// ---------- Mono label ----------

export function Label({
  tone = "grey",
  size = "md",
  className,
  children,
}: {
  tone?: "grey" | "ink" | "orange" | "quiet";
  size?: "md" | "sm" | "xs";
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cn("ui-label", tone !== "grey" && `ui-label--${tone}`, size !== "md" && `ui-label--${size}`, className)}>
      {children}
    </span>
  );
}

// ---------- Dot rating ----------

/** Levels as dots, never colours or numbers (§9). */
export function DotRating({ value, max, label }: { value: number; max: number; label: string }) {
  return (
    <span className="ui-dots" role="img" aria-label={`${label}: ${value} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <i key={i} data-on={i < value} />
      ))}
    </span>
  );
}

// ---------- Session state ----------

export type SessionStateName = "done" | "live" | "ready" | "deadline";

const STATE_LABEL: Record<SessionStateName, string> = {
  done: "Done",
  live: "In session",
  ready: "Ready to run",
  deadline: "Deadline",
};

/** A session bead (side panel). Selectable. */
export function StateBead({
  state,
  selected,
  label,
  onSelect,
}: {
  state: SessionStateName;
  selected: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${label}, ${STATE_LABEL[state]}`}
      onClick={onSelect}
      className={cn("ui-state", "ui-state--bead", `ui-state--${state}`)}
    />
  );
}

/** A rim dot on the focused table. Positioned by the caller. */
export function RimDot({ state, style }: { state: SessionStateName; style?: React.CSSProperties }) {
  return <i aria-hidden className={cn("ui-state", "ui-state--rim", `ui-state--${state}`)} style={style} />;
}

// ---------- Toast ----------

export function Toast({ message, className }: { message: string; className?: string }) {
  return (
    <div role="status" className={cn("ui-toast", className)}>
      {message}
    </div>
  );
}
