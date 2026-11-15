/** §5 pill input with the 1.5px line. */
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
      className="w-full rounded-full border-line border-grey-150 bg-white px-4.5 py-3 text-body text-ink placeholder:text-grey-500 focus:border-ink focus:outline-none"
    />
  );
}
