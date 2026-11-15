import type { Metadata } from "next";
import { Landing } from "@/features/landing/Landing";

export const metadata: Metadata = {
  title: "Panel: meet your markers before they mark you",
  description: "Build a board of AI assessors modelled on the people who will mark you. Get your report reviewed, or practise your presentation live.",
};

export default function WelcomePage() {
  return <Landing />;
}
