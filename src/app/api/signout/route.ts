// Sign out: clear the demo "signed in" cookie and go to the landing page.
import { NextResponse } from "next/server";

export function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/welcome", req.url));
  res.cookies.delete("panel_signed_in");
  return res;
}
