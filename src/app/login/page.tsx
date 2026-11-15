import type { Metadata } from "next";
import { SignIn } from "@/features/auth/SignIn";

export const metadata: Metadata = { title: "Sign in · Panel" };

export default function LoginPage() {
  return <SignIn />;
}
