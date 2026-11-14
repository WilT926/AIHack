import Image, { type StaticImageData } from "next/image";
import { cn } from "./cn";
import moduleLead from "./avatars/module-lead.svg";
import methodologist from "./avatars/methodologist.svg";
import literatureHawk from "./avatars/literature-hawk.svg";
import communicator from "./avatars/communicator.svg";
import outsider from "./avatars/outsider.svg";
import sceptic from "./avatars/sceptic.svg";

// The illustrated assessor set from the Figma file ("Desktop · Assessors").
// TEMPORARY home until Lane 3's public/avatars lands; keys are the preset ids.
const ILLUSTRATED: Record<string, StaticImageData> = {
  "module-lead": moduleLead,
  methodologist,
  "literature-hawk": literatureHawk,
  communicator,
  outsider,
  sceptic,
};

export type AvatarSize = "sm" | "md" | "lg" | "xl" | "2xl";
export type AvatarRing = "none" | "ink" | "accent";

const sizeClass: Record<AvatarSize, string> = {
  sm: "size-6.5",
  md: "size-8.5",
  lg: "size-10",
  xl: "size-16",
  "2xl": "size-19",
};

const ringClass: Record<AvatarRing, string> = {
  none: "",
  ink: "",
  accent: "ring-2 ring-accent ring-offset-1 ring-offset-surface",
};

/** Fallback for assessors without an illustration (custom ones): initials in a circle. */
function Initials({ name }: { name: string }) {
  const initials = name
    .replace(/^(prof\.?|dr\.?)\s+/i, "")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className="flex size-full items-center justify-center rounded-full border border-ink bg-paper font-mono text-label text-ink">
      {initials}
    </span>
  );
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
  const src = ILLUSTRATED[avatar];
  return (
    <span
      role="img"
      aria-label={name}
      title={name}
      className={cn("inline-block shrink-0 rounded-full bg-surface", sizeClass[size], ringClass[ring], className)}
    >
      {src ? <Image src={src} alt="" unoptimized className="size-full" draggable={false} /> : <Initials name={name} />}
    </span>
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
