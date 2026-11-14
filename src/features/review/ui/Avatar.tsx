import { cn } from "./cn";

// Placeholder line-drawn avatars, one per preset key. Lane 3 owns the real set
// (public/avatars); swap this component for theirs when it lands.

export type AvatarSize = "sm" | "md" | "lg";
export type AvatarRing = "ink" | "accent";

const sizeClass: Record<AvatarSize, string> = {
  sm: "size-6.5",
  md: "size-8.5",
  lg: "size-10",
};

const ringClass: Record<AvatarRing, string> = {
  ink: "stroke-ink",
  accent: "stroke-accent",
};

const line = "fill-none stroke-ink";
const solid = "fill-ink stroke-ink";
const face = "fill-surface stroke-ink";

function Features({ variant }: { variant: string }) {
  switch (variant) {
    case "module-lead": // receding hair, glasses
      return (
        <>
          <path d="M13.8 15.5 C14 10.5 26 10.5 26.2 15.5" className={line} />
          <circle cx="17.4" cy="17.4" r="1.8" className={line} />
          <circle cx="22.6" cy="17.4" r="1.8" className={line} />
          <path d="M19.2 17.4 H20.8" className={line} />
        </>
      );
    case "methodologist": // neat short hair, tie
      return (
        <>
          <path d="M13.5 16 C13 9.5 27 9.5 26.5 16 C24.5 12.8 16 12.8 13.5 16 Z" className={solid} />
          <path d="M20 27.5 L18.8 31 L20 35 L21.2 31 Z" className={solid} />
        </>
      );
    case "literature-hawk": // big curly hair
      return (
        <path d="M11.5 19 C8.5 7 31.5 7 28.5 19 C27 12.5 13 12.5 11.5 19 Z" className={solid} />
      );
    case "communicator": // fringe
      return <path d="M13.6 16 C13.6 10.5 26.4 10.5 26.4 16 C23 14.5 18 12.5 13.6 16 Z" className={solid} />;
    case "outsider": // short hair, beard
      return (
        <>
          <path d="M13.6 15 C14 10 26 10 26.4 15 C24 13 16 13 13.6 15 Z" className={solid} />
          <path d="M14.2 18.5 C14.5 25.5 25.5 25.5 25.8 18.5 C24 21.5 16 21.5 14.2 18.5 Z" className={solid} />
        </>
      );
    case "sceptic": // bun, centre parting
      return (
        <>
          <circle cx="20" cy="8.8" r="2.6" className={solid} />
          <path d="M13.6 16.5 C13.4 10.6 26.6 10.6 26.4 16.5 C24 14 21 12.5 20 11.5 C19 12.5 16 14 13.6 16.5 Z" className={solid} />
        </>
      );
    default:
      return <path d="M13.6 15.5 C14 10.5 26 10.5 26.4 15.5" className={line} />;
  }
}

export function Avatar({
  avatar,
  name,
  size = "md",
  ring = "ink",
  className,
}: {
  avatar: string;
  name: string;
  size?: AvatarSize;
  ring?: AvatarRing;
  className?: string;
}) {
  const longHair = avatar === "communicator";
  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-label={name}
      className={cn("shrink-0 rounded-full", sizeClass[size], className)}
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>{name}</title>
      {/* Same id in every avatar on purpose: the clip shape is identical. */}
      <defs>
        <clipPath id="panel-avatar-clip">
          <circle cx="20" cy="20" r="18.3" />
        </clipPath>
      </defs>
      <circle cx="20" cy="20" r="19" className="fill-surface stroke-none" />
      <g clipPath="url(#panel-avatar-clip)">
        {longHair && <path d="M12.8 27 C10.5 13 15 9.6 20 9.6 C25 9.6 29.5 13 27.2 27 Z" className={solid} />}
        <path d="M8.5 38 C9.5 30 14.5 27.3 20 27.3 C25.5 27.3 30.5 30 31.5 38" className={face} />
        <path d="M17.6 23.2 V27.4 M22.4 23.2 V27.4" className={line} />
        <circle cx="20" cy="17.5" r="6.5" className={face} />
        <Features variant={avatar} />
      </g>
      <circle cx="20" cy="20" r="19" className={cn("fill-none", ringClass[ring])} strokeWidth={1.6} />
    </svg>
  );
}

export function AvatarStack({
  people,
  size = "md",
  ringFor,
}: {
  people: { id: string; avatar: string; name: string }[];
  size?: AvatarSize;
  ringFor?: (id: string) => AvatarRing;
}) {
  return (
    <span className="flex items-center">
      {people.map((p, i) => (
        <Avatar
          key={p.id}
          avatar={p.avatar}
          name={p.name}
          size={size}
          ring={ringFor?.(p.id) ?? "ink"}
          className={i > 0 ? "-ml-2" : undefined}
        />
      ))}
    </span>
  );
}
