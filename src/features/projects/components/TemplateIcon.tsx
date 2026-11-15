import type { TemplateIcon as IconName } from "../types";
import { cn } from "../../review/ui/cn";

/** Line icons for the template cards. */
export function TemplateIcon({ name, active }: { name: IconName; active?: boolean }) {
  const paths: Record<IconName, React.ReactNode> = {
    document: (
      <>
        <rect x="9" y="5" width="22" height="30" rx="2" />
        <path d="M14 13h12M14 18h12M14 23h12M14 28h7" />
      </>
    ),
    flask: (
      <>
        <path d="M16 5h8M17 5v10L9 32a2 2 0 0 0 2 3h18a2 2 0 0 0 2-3l-8-17V5" />
        <path d="M12.5 25h15" />
      </>
    ),
    presentation: (
      <>
        <rect x="5" y="7" width="30" height="20" rx="2" />
        <path d="M20 27v6M14 35h12M10 22l7-7 5 4 8-8" />
      </>
    ),
    microphone: (
      <>
        <rect x="15" y="5" width="10" height="18" rx="5" />
        <path d="M10 19a10 10 0 0 0 20 0M20 29v6M15 35h10" />
      </>
    ),
    coin: (
      <>
        <circle cx="20" cy="20" r="14" />
        <path d="M24.5 14.5c-1-1.2-2.6-1.8-4.5-1.8-2.6 0-4.5 1.3-4.5 3.4 0 4.6 9.5 2.3 9.5 7.6 0 2.1-2 3.6-5 3.6-2 0-3.8-.8-4.8-2M20 10v3M20 27v3" />
      </>
    ),
    plus: <path d="M20 9v22M9 20h22" />,
  };
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={cn("size-10 fill-none", active ? "stroke-orange" : "stroke-ink")}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
