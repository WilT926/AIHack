// Give every assessor without a voice a distinct ElevenLabs voice.
//   npm run voices:assign            (only assessors with no voice yet)
//   npm run voices:assign -- --all   (reassign everyone)
// Voice IDs are read from the account at run time, not hard-coded: the
// docs say the old default voices expire on 31 December 2026.
import { createClient } from "@supabase/supabase-js";

const API = "https://api.elevenlabs.io";
const key = process.env.ELEVENLABS_API_KEY;
const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key || !url || !secret) {
  console.error("Set ELEVENLABS_API_KEY, SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.");
  process.exit(1);
}
const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

type Voice = { voice_id: string; name: string; category?: string; labels?: Record<string, string> };

async function voices(): Promise<Voice[]> {
  const out: Voice[] = [];
  let token: string | undefined;
  for (let i = 0; i < 10; i++) {
    const q = new URLSearchParams({ page_size: "100", ...(token ? { next_page_token: token } : {}) });
    const res = await fetch(`${API}/v2/voices?${q}`, { headers: { "xi-api-key": key! } });
    if (!res.ok) throw new Error(`Listing voices failed: ${res.status}`);
    const body = (await res.json()) as { voices?: Voice[]; has_more?: boolean; next_page_token?: string };
    out.push(...(body.voices ?? []));
    if (!body.has_more || !body.next_page_token) break;
    token = body.next_page_token;
  }
  return out;
}

async function main() {
  const all = process.argv.includes("--all");
  const available = await voices();
  if (available.length === 0) throw new Error("The ElevenLabs account has no voices.");
  // Prefer British-English voices, then any English voice, then the rest.
  const rank = (v: Voice) => {
    const accent = (v.labels?.accent ?? "").toLowerCase();
    return accent.includes("british") ? 0 : (v.labels?.language ?? "en").startsWith("en") ? 1 : 2;
  };
  const pool = [...available].sort((a, b) => rank(a) - rank(b));

  const { data, error } = await db.from("assessors").select("id, name, voice_id").order("created_at");
  if (error) throw new Error(error.message);
  const taken = new Set((data ?? []).map((a) => a.voice_id).filter(Boolean));
  let next = 0;
  for (const a of data ?? []) {
    if (a.voice_id && !all) continue;
    let v = pool[next++ % pool.length];
    for (let tries = 0; tries < pool.length && taken.has(v.voice_id) && !all; tries++) v = pool[next++ % pool.length];
    taken.add(v.voice_id);
    const { error: e } = await db.from("assessors").update({ voice_id: v.voice_id }).eq("id", a.id);
    if (e) throw new Error(e.message);
    console.log(`  ${a.name}: ${v.name} (${v.labels?.accent ?? "no accent label"})`);
  }
  console.log("Done. Listen in a session and swap any voice that does not fit the avatar.");
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
