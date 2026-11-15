"use client";

// Sign in (design: "Your panel is waiting"): Google, or email and password.
// v1 has one seeded demo student and no accounts (plan: "One seeded demo
// user, no login"), so both routes take you to your floor. Real Google
// sign-in needs an OAuth client (e.g. Supabase Auth's Google provider).
// Nothing typed here is stored or sent anywhere.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, Button, Divider, Label, Logo, TextButton, TextInput } from "@/components/ui";

const SEATED = ["avatar-070", "avatar-064", "avatar-100", "avatar-092"];

export function SignIn() {
  const router = useRouter();
  const [note, setNote] = useState(false);
  // Demo sign-in: remember it for this browser, so the app opens on the floor
  // instead of the landing page. Sign out (/api/signout) clears it.
  const enter = () => {
    document.cookie = "panel_signed_in=1; path=/; max-age=2592000; samesite=lax";
    router.push("/");
  };

  return (
    <div className="auth">
      <span className="auth__logo">
        <Logo />
      </span>

      <div className="auth__art" aria-hidden>
        <div className="auth__stage">
          <div className="auth__circle">
            <Label tone="ink">{SEATED.length} assessors · ready</Label>
            <p className="auth__headline">
              Your panel
              <br />
              is waiting.
            </p>
          </div>
          {SEATED.map((a, i) => (
            <Avatar key={a} avatar={a} size="fill" className={`auth__seat auth__seat--${i + 1}`} />
          ))}
        </div>
      </div>

      <div className="auth__side">
        <form
          className="auth__form"
          onSubmit={(e) => {
            e.preventDefault();
            enter();
          }}
        >
          <h1 className="auth__title">Sign in</h1>
          <p className="auth__lede">Pick up where your panel left off.</p>
          <Button variant="primary" size="lg" onClick={enter}>
            <i className="auth__google" aria-hidden>
              G
            </i>
            Continue with Google
          </Button>
          <Divider>Or with email</Divider>
          <TextInput id="email" label="Email" type="email" autoComplete="email" placeholder="you@example.com" />
          <TextInput
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••"
            action={<TextButton onClick={() => setNote(true)}>Forgot?</TextButton>}
          />
          <Button variant="create" size="lg" type="submit">
            Take your seat
          </Button>
          <p className="auth__alt">
            New here? <TextButton onClick={() => setNote(true)}>Create an account</TextButton>
          </p>
          {note && (
            <p className="auth__note" role="status">
              This version has one demo student, so there is nothing to reset or create. Take your seat to go in.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
