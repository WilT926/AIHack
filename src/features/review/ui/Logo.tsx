/** Logo 6j, "Facing the panel": five dots (the board) and you (orange). */
export function Logo({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 64 64" className="size-8" aria-hidden="true">
        <circle cx="11.22" cy="26" r="4.6" className="fill-ink" />
        <circle cx="20" cy="17.22" r="4.6" className="fill-ink" />
        <circle cx="32" cy="14" r="4.6" className="fill-ink" />
        <circle cx="44" cy="17.22" r="4.6" className="fill-ink" />
        <circle cx="52.78" cy="26" r="4.6" className="fill-ink" />
        <circle cx="32" cy="48" r="7.5" className="fill-accent" />
      </svg>
      <span className="text-title font-bold tracking-heading">{name}</span>
    </span>
  );
}
