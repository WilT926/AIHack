export function TextInput({
  value,
  onChange,
  placeholder,
  autoFocus,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  ariaLabel: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      aria-label={ariaLabel}
      className="w-full rounded-full border border-rule bg-surface px-4 py-2 text-sm text-ink placeholder:text-text-muted focus:border-ink focus:outline-none"
    />
  );
}
