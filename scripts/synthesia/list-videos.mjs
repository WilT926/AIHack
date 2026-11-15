#!/usr/bin/env node
// List your most recent Synthesia videos and their status.
//   node --env-file=.env.local scripts/synthesia/list-videos.mjs
const key = process.env.SYNTHESIA_API_KEY;
if (!key) {
  console.error("SYNTHESIA_API_KEY is empty in .env.local.");
  process.exit(1);
}
let res = await fetch("https://api.synthesia.io/v2/videos?limit=5", { headers: { Authorization: key, Accept: "application/json" } });
if (res.status === 401) res = await fetch("https://api.synthesia.io/v2/videos?limit=5", { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } });
const text = await res.text();
if (!res.ok) {
  console.error(`${res.status}: ${text.slice(0, 300)}`);
  process.exit(1);
}
const body = JSON.parse(text);
for (const v of body.videos ?? body.items ?? []) {
  console.log(`${v.createdAt ? new Date(v.createdAt * 1000).toISOString() : ""}  ${v.status.padEnd(12)} ${v.title}  ${v.id}  ${v.duration ?? ""}`);
}
