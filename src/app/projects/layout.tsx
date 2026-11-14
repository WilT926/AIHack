// TEMPORARY root layout for /projects (no src/app/layout.tsx yet; see
// src/app/review/layout.tsx). Drop <html>/<body> when the foundation lands.
import type { Metadata } from "next";
import { fontVariables } from "@/features/review/styles/fonts";
import "@/features/review/styles/review.css";

export const metadata: Metadata = {
  title: "New project · Panel",
  description: "Set up a project and the board that reviews it.",
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
