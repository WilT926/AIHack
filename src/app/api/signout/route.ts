// Sign out: clear the demo "signed in" cookie and go to the landing page.
// A relative redirect, so it works behind Docker and any host name.
export function GET() {
  return new Response(null, {
    status: 307,
    headers: { Location: "/welcome", "Set-Cookie": "panel_signed_in=; Path=/; Max-Age=0; SameSite=Lax" },
  });
}
