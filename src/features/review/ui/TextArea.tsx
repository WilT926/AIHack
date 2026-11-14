export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 12,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  ariaLabel: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      aria-label={ariaLabel}
      className="w-full resize-y rounded-md border border-rule bg-surface px-4 py-3 text-body text-ink placeholder:text-text-muted focus:border-ink focus:outline-none"
    />
  );
}
