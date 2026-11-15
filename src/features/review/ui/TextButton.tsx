/** A quiet mono text action, e.g. "MARK DONE · SHOW IN TEXT". */
export function TextButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-mono text-label font-medium uppercase tracking-label text-grey-500 transition-colors hover:text-ink focus-visible:text-ink focus-visible:underline focus-visible:outline-none"
    >
      {children}
    </button>
  );
}
