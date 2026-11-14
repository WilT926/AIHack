// Lane 2 layout. The root layout (src/app/layout.tsx) now owns <html> and
// <body>; this keeps the review styles and fonts for this section.
import type { Metadata } from "next";
import "@/features/review/styles/review.css";

export const metadata: Metadata = {
  title: "New project · Panel",
  description: "Set up a project and the board that reviews it.",
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full antialiased">{children}</div>
  );
}
