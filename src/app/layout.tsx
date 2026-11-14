import type { Metadata } from "next";
import { fontVariables } from "@/styles/fonts";
// TEMPORARY: Lane 2's review and project screens still use their own fonts,
// whose variables must sit on <html>. Remove once they use src/styles tokens.
import { fontVariables as laneTwoFonts } from "@/features/review/styles/fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Panel",
  description: "Build a board of AI assessors modelled on the people who will mark you.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontVariables} ${laneTwoFonts}`}>
      <body>{children}</body>
    </html>
  );
}
