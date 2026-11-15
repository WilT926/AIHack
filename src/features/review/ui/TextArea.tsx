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
      className="w-full resize-y rounded-card-sm border-line border-grey-150 bg-white px-4.5 py-3.5 text-body text-ink placeholder:text-grey-500 focus:border-ink focus:outline-none"
    />
  );
}
