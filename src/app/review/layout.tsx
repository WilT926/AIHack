// Lane 2 layout. The root layout (src/app/layout.tsx) now owns <html> and
// <body>; this keeps the review styles and fonts for this section.
import type { Metadata } from "next";
import "@/features/review/styles/review.css";

export const metadata: Metadata = {
  title: "Review · Panel",
  description: "Report review by your board of assessors.",
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full antialiased">{children}</div>
  );
}
