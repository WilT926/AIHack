// TEMPORARY root layout for /review. There is no src/app/layout.tsx yet
// (Lane 1's foundation), and Next.js treats a layout with nothing above it as
// a root layout. When the foundation lands, drop <html>/<body> from here.
import type { Metadata } from "next";
import { fontVariables } from "@/features/review/styles/fonts";
import "@/features/review/styles/review.css";

export const metadata: Metadata = {
  title: "Review · Panel",
  description: "Report review by your board of assessors.",
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
