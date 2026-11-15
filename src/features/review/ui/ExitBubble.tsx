import Link from "next/link";

/** §10: inside a session the dock collapses to an exit bubble back to the floor. */
export function ExitBubble({ href = "/", label = "Back to the floor" }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="group fixed bottom-7 left-7 z-20 flex size-14 items-center justify-center rounded-full bg-ink text-xl text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
    >
      <span aria-hidden>←</span>
      <span className="pointer-events-none absolute -top-9 left-0 rounded-full bg-ink px-3 py-1.5 font-mono text-label-sm whitespace-nowrap text-white uppercase opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {label}
      </span>
    </Link>
  );
}
