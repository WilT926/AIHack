// User settings sections, shared by the page (server) and the screen (client).

export const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "defaults", label: "Panel defaults" },
  { id: "clips", label: "Clips & camera" },
  { id: "notifications", label: "Notifications" },
  { id: "privacy", label: "Privacy & data" },
  { id: "accessibility", label: "Accessibility" },
  { id: "account", label: "Account" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

/** A section id from the URL, or Profile (the default). */
export function sectionFrom(value: string | undefined): SectionId {
  return SECTIONS.find((s) => s.id === value)?.id ?? "profile";
}
