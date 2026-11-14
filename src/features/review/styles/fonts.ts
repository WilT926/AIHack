// TEMPORARY (Lane 2): font loading for the review screen until the shared
// foundation lands. Font names live only in this styles folder; components use
// the --font-* variables. Move to src/styles when Lane 3 owns it.
import { Inter, JetBrains_Mono } from "next/font/google";

const fontSans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const fontVariables = `${fontSans.variable} ${fontMono.variable}`;
