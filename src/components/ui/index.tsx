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

// ---------- Card ----------

export function Card({
  dashed,
  inverted,
  className,
  children,
}: {
  dashed?: boolean;
  inverted?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("ui-card", dashed && "ui-card--dashed", inverted && "ui-card--inverted", className)}>{children}</div>;
}

// ---------- Badge ----------

/** A small orange count (open actions, comments). Text on orange is always ink. */
export function Badge({ count, label }: { count: number; label?: string }) {
  if (count <= 0) return null;
  return (
    <span className="ui-badge" aria-label={label ? `${count} ${label}` : undefined}>
      {count}
    </span>
  );
}

// ---------- Text input and text area ----------

type FieldProps = { label: string; hint?: string; id: string };

export function TextInput({
  label,
  hint,
  id,
  className,
  ...rest
}: FieldProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id">) {
  return (
    <label className={cn("ui-field", className)} htmlFor={id}>
      <span className="ui-label">{label}</span>
      <input id={id} className="ui-input" {...rest} />
      {hint && <span className="ui-field__hint">{hint}</span>}
    </label>
  );
}

export function TextArea({
  label,
  hint,
  id,
  className,
  ...rest
}: FieldProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id">) {
  return (
    <label className={cn("ui-field", className)} htmlFor={id}>
      <span className="ui-label">{label}</span>
      <textarea id={id} className="ui-textarea" {...rest} />
      {hint && <span className="ui-field__hint">{hint}</span>}
    </label>
  );
}

// ---------- Tabs ----------

export type TabItem<T extends string> = { id: T; label: string; count?: number };

/** Segmented tabs in a pill track (§9). Controlled. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div className="ui-tabs" role="tablist" aria-label={label}>
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === value}
          className={cn("ui-tab", t.id === value && "ui-tab--active")}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count !== undefined && <span className="ui-tab__count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ---------- Comment bubble ----------

/** One assessor's comment: avatar, name, mono field, the comment and its suggestion (§9). */
export function CommentBubble({
  avatar,
  name,
  field,
  text,
  suggestion,
  anchor,
  major,
  done,
}: {
  avatar: string;
  name: string;
  field: string;
  text: string;
  suggestion?: string;
  anchor?: number;
  major?: boolean;
  done?: boolean;
}) {
  return (
    <article className={cn("ui-comment", done && "ui-comment--done")}>
      <header className="ui-comment__head">
        {anchor !== undefined && (
          <span className={cn("ui-anchor", major && !done && "ui-anchor--major", done && "ui-anchor--done")}>{anchor}</span>
        )}
        <Avatar avatar={avatar} size="sm" />
        <span className="ui-comment__name">{name}</span>
        <Label size="sm">{field}</Label>
      </header>
      <p className="ui-comment__text">{text}</p>
      {suggestion && <p className="ui-comment__suggestion">{suggestion}</p>}
    </article>
  );
}

// ---------- Spinner (the Reading state) ----------

/**
 * A designed waiting state, never a bare spinner (§9): a mono label and three
 * ink dots that fill left to right.
 */
export function Spinner({ label = "Reading" }: { label?: string }) {
  return (
    <span className="ui-spinner" role="status">
      <span className="ui-label ui-label--ink">{label}</span>
      <span className="ui-spinner__dots" aria-hidden>
        <i />
        <i />
        <i />
      </span>
    </span>
  );
}
