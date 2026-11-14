import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The one Supabase client. Server only: it uses the secret key, which
// bypasses row level security and must never reach the browser.

let client: SupabaseClient | null = null;

function secretKey(): string | undefined {
  // SUPABASE_SERVICE_ROLE_KEY is the legacy name; the new secret key is preferred.
  return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
}

/** True when the database is configured in this environment. */
export function hasDatabase(): boolean {
  return !!process.env.SUPABASE_URL && !!secretKey();
}

export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = secretKey();
  if (!url || !key) throw new Error("Supabase is not configured: set SUPABASE_URL and SUPABASE_SECRET_KEY.");
  client = createClient(url, key, {
    // No user sessions: one seeded demo user, no login.
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}

/** Name of the private storage bucket for uploads. */
export const UPLOADS_BUCKET = "uploads";
