import { Avatar as PenAvatar, cn } from "@/components/ui";

// Pen avatars from public/avatars (§6): transparent, never in a filled circle.
// `avatar` is the file stem, e.g. "avatar-006".

export type AvatarSize = "sm" | "md" | "lg" | "xl" | "2xl";
/** "accent" marks a highlighted person with an orange dot under them (§9). */
export type AvatarRing = "none" | "ink" | "accent";

export function Avatar({
  avatar,
  name,
  size = "md",
  ring = "none",
  invert = false,
  className,
}: {
  avatar: string;
  name: string;
  size?: AvatarSize;
  ring?: AvatarRing;
  invert?: boolean;
  className?: string;
}) {
  return (
    <span role="img" aria-label={name} title={name} className={cn("relative inline-flex shrink-0 flex-col items-center", className)}>
      <PenAvatar avatar={avatar} size={size} invert={invert} />
      {ring === "accent" && <i aria-hidden className="absolute -bottom-1.5 size-1.5 rounded-full bg-orange" />}
    </span>
  );
}

export function AvatarStack({
  people,
  size = "md",
  invert,
  ringFor,
}: {
  people: { id: string; avatar: string; name: string }[];
  size?: AvatarSize;
  invert?: boolean;
  ringFor?: (id: string) => AvatarRing;
}) {
  return (
    <span className="flex items-end">
      {people.map((p, i) => (
        <Avatar
          key={p.id}
          avatar={p.avatar}
          name={p.name}
          size={size}
          invert={invert}
          ring={ringFor?.(p.id) ?? "none"}
          className={i > 0 ? "-ml-1.5" : undefined}
        />
      ))}
    </span>
  );
}
