# Lane 3 handoff: where things run, what's left, and the Synthesia trial

First written Sunday 15 Nov, about 05:45; "Start here" updated about 10:00. **Freeze 11:30, submission 12:00.**
Read `CLAUDE.md`, `docs/plan/README.md` and `docs/plan/lane-3.md` first. Lane 3 owns `design/`, `src/styles`, `src/components/ui`, `public/avatars`, `src/features/{assessors,boards,home}` and `src/app/{assessors,boards,profile,page.tsx}`.

---

## Start here (current state of `lane3/final`)

**Branch:** `lane3/final` on GitHub, built on `staging` as of 04:25 (nothing newer is on `staging`). **Not merged into `staging` yet.** The build, lint and 107 tests passed at the last commit.

### Documents
| File | What it's for |
|---|---|
| `docs/plan/lane-3-handoff.md` (this file) | Where things run (Docker, dev server, folders, keys), the file map of every Lane 3 change, small fixes left |
| `docs/plan/live-presentation-setup.md` | **The next big job:** looping clips while presenting, and live Synthesia avatars with Claude questions and ElevenLabs voices. What's in place, what's missing, build order, owners, test plan |
| `design/synthesia/AVATAR_PROMPTS.md` | How the Synthesia avatars were made: style block, per-person prompts, clip recipes, fal line-drawing prompt (§7), ID sheet (§6) |
| `design/synthesia/avatars.json` | Video and Interactive Avatar IDs for Ezra Cole, Hana Ito, Helen Leane and Martin Stevens (IDs are not secret) |
| `design/synthesia/refs/` | The ten assessors' drawings as 1024px PNGs, for Synthesia and fal references |
| `AVATAR_VIDEOS/<Name>/*.mp4` | The Synthesia listening and reaction loops, 1080p. Source files: copy the chosen ones into `public/avatars/real/<assessorId>/` (see `live-presentation-setup.md` §3C) |
| `scripts/synthesia/` | `test-video.mjs` (render a video; `--id` to download one) and `list-videos.mjs` (status) |

### Done on this branch
- **Sign-in page**; sign-out returns to it.
- **Shared top bar** on every page:
  - logo;
  - split search pill with Filters (status, assessors, recent tables);
  - profile menu (Profile settings, Help, Sign out).
- **Dock:** gooey ink bubbles, with a larger orange "+" in the middle (**Panel room** / **Live doc review**, click only). Floor, Desk, Assessors and Profile.
- **Adaptive floor:** tables scale to the space; the side panel is pinned to the right and scaled so all of it fits.
- **Settings page** (Panel defaults and the other sections), **avatar studio**, **help page**, **skeleton loaders**.
- **Synthesia** avatars, IDs, guides and scripts.

### Next, in order
1. **Decide** whether Helen Leane and Martin Stevens replace Tom Achebe and Mira Santos on the pitch judges board, or join as new judges.
2. **Keys** in `.env.local` (git-ignored): add `ANTHROPIC_API_KEY` and `ELEVENLABS_API_KEY`. They're missing locally, so the app uses sample questions and the browser voice. Then switch on `features.elevenLabs` and set each judge's `voiceId`.
3. **Clips into the app:** listening loop while presenting, idle loop in the call (`live-presentation-setup.md` §3C).
4. **Live avatar:** Python agent, token route, browser (`live-presentation-setup.md` §3D). Lane 1's code; fall back to steps 2–3 if it isn't stable by about 10:45.
5. **Merge** `lane3/final` into `staging` once the build and lint pass (CLAUDE.md rule). Only Lane 1 merges `staging` into `main`.

---

## 1. Where everything runs

### Folders on this machine
Everything lives under `C:\Users\josep\Documents\AI_hackathon`. Each branch has its own folder (git worktrees sharing one repo).

| Folder | Branch | Use |
|---|---|---|
| `AI_hackathon\` (root) | `actual-final` | Original clone. Leave it alone. |
| `AIHack\main\` | `main` | The demo site. Only Lane 1 merges into it. |
| `AIHack\staging\` | `staging` | Shared test branch. The Docker container is built from here. |
| `AIHack\foundation\` | `lane1/foundation` | Old Lane 1 work, already merged into staging. Not needed. |
| **`AIHack\lane3\`** | **`lane-three`** | **Lane 3 work in progress (section 2). Not committed yet.** |

`AIHack/` is ignored by git in the root repo (`.git/info/exclude`), so the folders never get committed by accident.

### Docker container (what is on port 3000)
| | |
|---|---|
| Container name | `panel` |
| Image | **`panel:lane3`**, built from `AIHack\lane3` (the `lane-three` branch, including uncommitted work) |
| Address | http://localhost:3000 |
| Data | Sample data (the image never contains `.env.local`, so no Supabase or Claude keys) |
| Dockerfile | `AIHack\lane3\Dockerfile` (the same file on every branch) |
| Also available | `panel:staging`, an older image built from `AIHack\staging` |

Docker Desktop must be running (whale icon says "Engine running"). To ship your latest Lane 3 edits to port 3000:

```bash
cd /c/Users/josep/Documents/AI_hackathon/AIHack/lane3
```

```bash
docker build -t panel:lane3 .
```

```bash
docker rm -f panel && docker run -d --name panel -p 3000:3000 panel:lane3
```

To show `staging` instead: `cd` into `AIHack\staging`, `git pull --ff-only`, `docker build -t panel:staging .`, then run with `panel:staging`.

With real keys: add `--env-file .env.local` to `docker run`. Keys are read at run time and never baked into the image.

| Task | Command |
|---|---|
| See what's running | `docker ps` |
| Logs | `docker logs -f panel` |
| Stop | `docker stop panel` |
| Remove old images | `docker image prune` |

### Dev server (live reload, for design work)
- Lane 3 branch: `npm run dev -- -p 3001` in `AIHack\lane3`, so http://localhost:3001. Docker keeps 3000.
- In the Claude desktop app, the browser pane starts it from `C:\Users\josep\Documents\AI_hackathon\.claude\launch.json`, entry `lane3-dev`.
- First time in a folder: `npm ci`.

### Local secrets
`AIHack\lane3\.env.local` (git-ignored by `.env*`; never commit it) holds:
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, for Synthesia Interactive Avatars (live Q&A). These were pasted into a chat, so rotate them in the LiveKit dashboard after the hackathon.
- `SYNTHESIA_API_KEY`: key named `AI_hackathon_synth_plus` in the Synthesia dashboard. Confirmed working.
- `FAL_KEY`: key named `AI_hackathon_fal_plus` in the fal dashboard, in the form `key id:secret`.
- All of these were pasted into a chat, so rotate them after the hackathon.

To use these in Docker, copy the file next to the Dockerfile you build from and add `--env-file .env.local` to `docker run`.

### Testing in the Claude browser pane
When the pane is hidden, the browser pauses animation frames. React then never swaps streamed content in, so pages look stuck on their skeletons (profile pill, dock). This isn't an app bug: check in a visible window or a normal browser.

### Checks before merging (CLAUDE.md rule)
Run in `AIHack\lane3`: `npx eslint src`, `npx tsc --noEmit -p .`, `npx vitest run`, `npx next build`. All four passed at 05:35.

---

## 2. What is on `lane-three` (uncommitted)

### Done and checked in the browser at desktop and laptop sizes
| Change | Files |
|---|---|
| Sign-in page from the mockup. No real accounts: every route in goes to the floor, nothing typed is stored or sent | `src/app/login/page.tsx`, `src/features/auth/SignIn.tsx` |
| Shared top bar: logo, search pill and profile pill on one centre line, at real size on every page | `src/components/ui/AppBar.tsx` |
| Split search pill: find, then one part per active filter (hover to change, click to remove), then a merged **Filters** button with a dropdown (status, assessors, recent tables) | `AppBar.tsx` (`SearchPill`), `src/features/home/components/TopBar.tsx` |
| Hover or click menus, with keyboard and Escape support | `src/components/ui/Popover.tsx` |
| Profile menu: Profile settings and Help, then Sign out in its own section, which goes to `/login` | `AppBar.tsx` (`ProfileMenu`) |
| Dock: the original 56px ink bubbles joined by goo, with one larger (72px) orange "+" bubble in the middle with no outline. Order: Floor, Desk, **+**, Assessors, Profile (far right). The "+" opens its menu (what to start, then which table) on hover or click on every page, without changing page | `src/components/ui/NavDock.tsx`, `src/features/home/components/Dock.tsx`, `.ui-nav*` in `shell.css` |
| Assessors: on the floor the bubble opens the Assessors sheet, which now has **Avatar studio** and **All assessors** buttons. On other pages it opens a small menu with the same two links | `src/features/home/components/AssessorsSheet.tsx`, `NavDock.tsx` |
| Same bar and dock on every page built with `PageFrame`. The dock's "+" gets the table list from `loadPlusTables()` | `src/components/ui/PageFrame.tsx`, `src/features/home/load.ts` |
| Floor fits the screen: side panel pinned 28px from the right edge at real size (26% of the width, 324–372px); the floor's tables scale to fill the main area left of it; the search pill and the dock are centred on that main area (`--nav-center`), not the whole page | `src/features/home/Floor.tsx` (`fit`), `src/styles/floor.ts` (`CHROME`, `PANEL`), `.fl-panel` in `home.css` |
| Filters part of the search pill is light (paper, same as the pill), with a grey hover | `.ui-search__filters` in `shell.css` |
| "+" opens on **click only** (no hover) and rotates at the original speed (0.45s spring). Its options follow the final home design (`design/Panel Home Final.dc.html`): **Panel room** (presentation practice, `/pitch`) and **Live doc review** (report review, `/review/new`). On the floor both open for the focused table; on other pages they ask "Which table?" first. This puts back labels that `DESIGN_SYSTEM.md` §1.1 had replaced, so tell the team | `NavDock.tsx` (`PlusMenu`, `focusId`, `hover={false}`), `.ui-nav__plus` in `shell.css` |
| Smaller search pill (42px tall, about 270px for the search text) and dock (50px bubbles, 64px "+") | `--search-h`, `--nav-h`, `--nav-gap`, `--nav-plus` in `shell.css`; `B`, `GAP`, `PLUS` in `NavDock.tsx` (keep the two in step) |
| Side panel: content and inner layout identical to `staging` (`SidePanel.tsx` unchanged). Pinned 104px from the top and 28px from the right and bottom, then scaled as one piece so all of its content fits: no scrollbar, nothing cut off. Its content (857px tall at design size) is taller than the original 768px panel, which is why the old version scrolled, so at 1440×900 it shows at 320px wide rather than 358px | `fit()` and the panel measurement in `Floor.tsx`, `PANEL` in `floor.ts`, `.fl-panel` in `home.css` |
| Settings page from the design: sections on the left (Profile, Panel defaults, Clips & camera, Notifications, Privacy & data, Accessibility, Account); "Panel defaults" with the dot picker, segmented controls, switches and a language picker; a profile card on the right with level, Edit avatar, Sign out and Delete account. "Profile settings" in the profile menu opens it | `src/app/settings/page.tsx`, `src/features/settings/Settings.tsx`, `src/components/ui/Controls.tsx` (`Toggle`, `Segmented`, `DotPicker`, `SelectPill`, `SettingRow`), `PageFrame` `bare` prop |
| Bottom filter chips removed | `FilterBar.tsx` deleted |
| Logo has no sub text anywhere | `src/components/ui/index.tsx` (`Logo`) |
| Skeleton loaders: floor, generic page and app-wide `loading.tsx` | `index.tsx` (`Skeleton`, `SkeletonPage`, `SkeletonFloor`, `SkeletonChrome`), `src/app/loading.tsx`, fallbacks in `src/app/page.tsx`, `profile`, `assessors` |
| Avatar studio: pick from the 100-avatar set | `src/app/studio/page.tsx`, `src/features/studio/AvatarStudio.tsx`, `src/components/ui/avatarChoice.ts` |
| Help page | `src/app/help/page.tsx` |
| All new styles | `src/styles/shell.css` (imported in `globals.css`); old rules removed from `home.css`, `ui.css` |

### To do next on this branch (in order)
1. **Commit and push `lane-three`**, then merge into `staging` after the four checks pass. The branch is already over the 90-minute guideline.
2. **Check phone width** (375px) on the floor and sign-in page. Not verified; the browser pane was hidden. Phone layout is tier 5, so only fix anything broken.
3. **Tell the team:**
   - `/login` and `/help` are new folders that aren't in the ownership table.
   - `/settings` is no longer linked from the dock; Settings now opens `/studio`.
4. **Ask Lane 1** for `profiles.update` (or similar) and a settings store in `src/lib/data`. Until then these are saved in this browser only:
   - the studio's avatar choice (`localStorage` key `panel.avatar`);
   - every setting on the settings page (`panel.settings`). The review and pitch flows don't read the settings yet; wiring them in (e.g. captions, auto-cut, line-to-video fade) is Lane 1's call.
   - `src/app/settings` isn't in the ownership table either.
5. **Ask Lane 2 and Lane 1** to switch their own top bars to the shared `AppBar` and their spinners to the skeletons. These screens still use their own top bar and loading state:
   - `src/features/review/components/TopBar.tsx`
   - `src/features/review/intake/IntakeScreen.tsx`
   - `src/features/projects/ProjectSetup.tsx`
   - `src/features/pitch/components/SessionFrame.tsx`
   - the fallback in `src/app/pitch/page.tsx`
   - Lane 2's private components in `src/features/review/ui/` should move to `src/components/ui`.
6. **Small fixes:**
   - At some window heights the floor's side panel runs slightly past the bottom edge. It scrolls, but `.fl-panel` in `home.css` could end above the dock.
   - At about 1024px wide the search text is cut off ("Find a table, assessor or …"). Consider shorter text below 1100px.
   - "Recent" in Filters lists tables in floor order, because `FloorTable` has no last-opened date. Sort it properly once Lane 1 exposes one.
   - `src/components/ui/DockMotion.tsx` is now unused and can be deleted.

### Remaining Lane 3 plan steps (`docs/plan/lane-3.md`)
3.1 `/styleguide` page · 3.2b call stage (Lane 1 has a plain one in `src/features/pitch/components/CallStage.tsx`) · 3.2c realistic versions (section 3 below) · 3.4 boards · 3.6 polish and Figma evidence in the README.

---

## 3. Synthesia trial: from line drawing to a listening person at the table

### The goal
In the live pitch, each judge first appears as a **pen line drawing** in the Panel style. It then **morphs into a realistic person** sitting at the table, listening on a background that matches the app. Later the same person asks questions. Pre-made video now; the live Q&A later uses Synthesia's Interactive Avatars, so one service does both.

### The trick that makes the morph work
Don't try to make Synthesia morph anything. Instead:
1. Render the **realistic clip first** with Synthesia.
2. Take the clip's **first frame** and turn it into a **pen-style SVG**. That SVG becomes the assessor's illustrated avatar.
3. In the browser, show the SVG exactly on top of the paused first frame. Then wipe the video in under the lines while the lines fade out, and start playback.

Because the SVG is traced from frame 0, the outlines line up exactly, so it reads as one person turning real. It costs no extra generation, can be re-timed in CSS, and falls back to the SVG alone if the video fails.

### Step 0: the key (do this first)
- **Never paste the key into chat, code or a commit.** The repo is public.
- Put it in `AIHack\lane3\.env.local`, which git already ignores (`.env*`):
  ```
  SYNTHESIA_API_KEY=...
  ```
- Check which kind of key it is. Video creation (`api.synthesia.io/v2`) needs the standard API key; an Interactive Avatars key won't work there.
- **Header:** `Authorization: <key>`. The docs name the header but not whether it needs a prefix such as `Bearer`; check the quickstart if the first call returns 401.
- Reference: https://docs.synthesia.io/reference/create-video · index of all pages: https://docs.synthesia.io/llms.txt

### The ready-made test script
`scripts/synthesia/test-video.mjs` does steps 2 and 3 in one command: it creates the video, polls until it's rendered, and downloads the MP4, thumbnail and JSON reply to `design/media/synthesia/`. That folder is git-ignored; copy finished files into `public/avatars`. Run from `AIHack\lane3`:

```bash
node --env-file=.env.local scripts/synthesia/test-video.mjs
```

Options: `--avatar <id>` (default `anna_costume1_cameraA`, the docs' example), `--text "..."`, `--background off_white|green_screen|<asset id or URL>`, `--aspect 1:1|16:9`, and `--real` for a full render that uses credits. Without `--real` it makes a free, watermarked test.

### Step 1: pick a stock avatar
- Stock avatar IDs: https://docs.synthesia.io/reference/avatars (or the Synthesia app). Pick one per judge; start with **one**.
- Choose people in plain, muted clothes (no orange: orange is the UI's only highlight colour), head-and-shoulders framing.

### Step 2: a free test render (watermarked)
```bash
curl -s -X POST https://api.synthesia.io/v2/videos \
  -H "Authorization: $SYNTHESIA_API_KEY" -H "Content-Type: application/json" \
  -d '{
    "test": true,
    "title": "panel-trial-listen",
    "visibility": "private",
    "aspectRatio": "1:1",
    "input": [{
      "avatar": "<stock-avatar-id>",
      "background": "off_white",
      "scriptText": "Thank you. Please go ahead.",
      "avatarSettings": { "style": "rectangular", "horizontalAlign": "center", "scale": 1 }
    }]
  }'
```
- The reply contains an `id`. Poll `GET https://api.synthesia.io/v2/videos/<id>` until `status` is `complete`, then download from its `download` link (time-limited for private videos).
- **Test mode is free and watermarked, and Synthesia replaces the background with its own branded one.** Use test renders only to check the avatar, framing and timing.

### Step 3: the real render (uses credits)
- **Background that matches the app.** Two options:
  1. **Custom background (preferred):** upload a flat PNG in the Panel floor grey (`--grey-50`, #f3f2ef, optionally with the 28px dot grid) as an asset, and pass its asset ID as `background`. There's no keying and no edge flicker.
  2. **`green_screen`**, then key it out. This gives more flexibility but needs an extra processing step, and leaves edges around hair.
- **Listening clip:** the avatar needs to sit quietly. `scriptText` has no documented pause syntax, so upload a **silent audio file** (about 6 s) as `scriptAudio` with `scriptLanguage: "en-GB"`. The upload API is at `https://upload.api.synthesia.io/v2`. Check that the avatar still blinks and moves slightly.
- **Talking clip:** a short neutral line (or a real question), for while a judge asks.
- Make them seamless loops: play forwards, then backwards (ping-pong), or trim to matching frames.

### Step 4: first frame → pen SVG
Tools: `ffmpeg` and `potrace` aren't installed on this machine. Use `pip install imageio-ffmpeg vtracer` in the Anaconda Python, or the `jrottenberg/ffmpeg` Docker image.
1. Extract frame 0: `ffmpeg -i listen.mp4 -frames:v 1 frame0.png`.
2. Turn it into a pen drawing that matches the existing set in `public/avatars/` (ink lines only, transparent, same stroke weight). The best route is an image-to-image model on **fal**, given `frame0.png` plus one existing avatar as the style reference. A plain edge-detection filter looks noisy and off-brand.
3. Vectorise to SVG (`vtracer`), simplify, and save as `public/avatars/avatar-1xx.svg`. Keep the `avatar-NNN` naming; `Avatar` in `src/components/ui/index.tsx` only accepts that pattern.
4. Check the SVG lines up with `frame0.png` at the same size. That is what makes the morph seamless.

### Step 5: the morph in the app (Lane 3 builds, Lane 1 uses)
- New base component, e.g. `src/components/ui/AvatarMorph.tsx`:
  - inputs: `svg`, `poster` (frame 0 image), `idleClip`, `talkingClip`, `state` (`drawn | revealing | idle | speaking`);
  - reveal: a radial or upward mask wipe of the poster and video under the SVG over about 0.8 s, with the SVG lines fading out over the last half. Use `prefers-reduced-motion` to fall back to a plain crossfade.
- Files go in `public/avatars/real/<avatar>/`: `poster.jpg`, `idle.mp4`, `talk.mp4`.
- The Assessor shape already has `portrait`, `idleClip` and `talkingClip` (`src/lib/schemas`). Fill them for the judges; no schema change is needed.
- **Where it plays:**
  - while the student presents, the board is shown as drawings;
  - when "the board steps out" ends, each tile morphs into its person, who listens;
  - the speaker's tile plays the talking clip.
  - The call stage is in Lane 1's `src/features/pitch/components/CallStage.tsx`, so agree with Lane 1 before wiring it in.

### Step 6: live Q&A later (Interactive Avatars)
- Same service: Synthesia's Interactive Avatar API gives a real-time, lip-synced version of the same stock avatar, rendered through LiveKit. It needs a **separate Interactive Avatars key** and Lane 1's pitch code.
- Plan for one live speaker at a time; everyone else keeps playing their pre-made idle clips.
- Keep the pre-made path as the fallback behind a switch in `src/config` (Lane 1's file).

### Check before relying on it
- **Likeness rights:** stock avatars are real actors. Synthesia's terms may limit using their faces outside Synthesia-rendered video, including a traced SVG of an actor. Check the terms, or use a custom avatar, before shipping the traced SVGs.
- **Credits and moderation:** non-test renders use credits and can be held for moderation (`status` stays `in_progress`). Do one judge first, then the other three.
- **Time:** this is tier 2 (step 3.2c). If it isn't working by about 10:00, keep the existing illustrated avatars with the pulsing speaking border. The plan already treats that as the fallback.

### Done when
One judge appears as a pen drawing, morphs into the realistic person listening on a Panel-grey background, and plays the talking clip while speaking. Deleting the video files falls back cleanly to the drawing.
