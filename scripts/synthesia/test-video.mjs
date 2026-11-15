#!/usr/bin/env node
// Make a short Synthesia test video and download it, to see what an avatar
// looks like before wiring anything into the app.
//
//   node --env-file=.env.local scripts/synthesia/test-video.mjs
//   node --env-file=.env.local scripts/synthesia/test-video.mjs --avatar anna_costume1_cameraA --text "Hello"
//   node --env-file=.env.local scripts/synthesia/test-video.mjs --real --background green_screen
//   node --env-file=.env.local scripts/synthesia/test-video.mjs --id <video id>   (download one made earlier)
//   node --env-file=.env.local scripts/synthesia/list-videos.mjs                 (recent videos and status)
//
// Needs SYNTHESIA_API_KEY in .env.local (git-ignored). Test videos (the
// default) are free and watermarked, and Synthesia swaps in its own
// background. Pass --real for a full render that uses credits.
// Output: design/media/synthesia/<time>-<avatar>.mp4 (+ .jpg thumbnail, .json reply).
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const API = "https://api.synthesia.io/v2";
const OUT = join("design", "media", "synthesia");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : true;
}

const key = process.env.SYNTHESIA_API_KEY;
if (!key) {
  console.error("SYNTHESIA_API_KEY is empty. Add it to .env.local, then run with: node --env-file=.env.local scripts/synthesia/test-video.mjs");
  process.exit(1);
}

const options = {
  avatar: arg("avatar", "anna_costume1_cameraA"),
  background: arg("background", "off_white"),
  text: arg("text", "Thanks for presenting. I have one question about how your evaluation was designed."),
  aspect: arg("aspect", "1:1"),
  test: !arg("real", false),
};

let authHeader = key;

async function call(path, init = {}) {
  const send = () =>
    fetch(`${API}${path}`, {
      ...init,
      headers: { Authorization: authHeader, "Content-Type": "application/json", Accept: "application/json", ...(init.headers ?? {}) },
    });
  let res = await send();
  // The docs name the header but not a prefix; try "Bearer" once if the plain key is refused.
  if (res.status === 401 && !authHeader.startsWith("Bearer ")) {
    authHeader = `Bearer ${key}`;
    res = await send();
  }
  const body = await res.text();
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${body.slice(0, 400)}`);
  return body ? JSON.parse(body) : {};
}

async function download(url, file) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}) for ${file}`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

const body = {
  test: options.test,
  title: `panel-${options.test ? "test" : "real"}-${options.avatar}`,
  visibility: "private",
  aspectRatio: options.aspect,
  input: [
    {
      avatar: options.avatar,
      background: options.background,
      scriptText: options.text,
      avatarSettings: { style: "rectangular", horizontalAlign: "center", scale: 1 },
    },
  ],
};

const resumeId = arg("id", null);
let created;
if (typeof resumeId === "string") {
  // Pick up a video made earlier (e.g. one that took longer than the wait below).
  created = await call(`/videos/${resumeId}`);
  console.log(`Resuming video ${resumeId}, status ${created.status}.`);
} else {
  console.log(`Creating a ${options.test ? "TEST (free, watermarked)" : "REAL (uses credits)"} video:`, { avatar: options.avatar, background: options.background, aspect: options.aspect });
  created = await call("/videos", { method: "POST", body: JSON.stringify(body) });
  console.log(`Video id ${created.id}, status ${created.status}. Waiting for it to render…`);
}

const started = Date.now();
let video = created;
while (video.status !== "complete") {
  if (["error", "rejected", "deleted"].includes(video.status)) throw new Error(`Render ended with status "${video.status}"`);
  if (Date.now() - started > 15 * 60_000) throw new Error(`Still "${video.status}" after 15 minutes. Run again later with --id ${created.id} to download it.`);
  await new Promise((r) => setTimeout(r, 10_000));
  video = await call(`/videos/${created.id}`);
  process.stdout.write(`  ${Math.round((Date.now() - started) / 1000)}s: ${video.status}\n`);
}

await mkdir(OUT, { recursive: true });
const stem = join(OUT, `${new Date().toISOString().replace(/[:.]/g, "-")}-${options.avatar}`);
await writeFile(`${stem}.json`, JSON.stringify(video, null, 2));
if (video.download) console.log("Saved", await download(video.download, `${stem}.mp4`));
else console.log("No download link yet (it may be held for moderation). Reply saved to", `${stem}.json`);
const thumb = typeof video.thumbnail === "string" ? video.thumbnail : video.thumbnail?.image;
if (thumb) console.log("Saved", await download(thumb, `${stem}.jpg`));
console.log(`Done in ${Math.round((Date.now() - started) / 1000)}s. Duration ${video.duration ?? "?"}.`);
