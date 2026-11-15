# Synthesia avatars and clips for Panel

How to create Panel's assessors as Synthesia avatars, render their looping clips, and hand the IDs over so someone else can wire them into the app, both as pre-made clips and as live avatars.

**Freeze: Sunday 11:30.** Do the **four pitch judges first** (they are in the live demo). The six report assessors only if there is time.

Related: `docs/plan/lane-3-handoff.md` (where things run, keys, app changes), section 3.

---

## 0. Quick answers

| Question | Answer |
|---|---|
| Can one avatar be used for rendered videos **and** live? | Yes, if you build it yourself in Synthesia's **Avatar Builder** (from a prompt or a reference image). Live (Interactive Avatars) **only accepts synthetic or personal avatars, never stock ones**, so don't use the 240+ stock avatars for the judges. |
| Is the ID the same in both? | Not guaranteed. The live plugin's examples use IDs starting `av_`; the video API takes "your custom avatar ID". Record whatever Synthesia shows in **both** places (sheet in section 6). |
| Can I set the background live? | No. Live sessions have no background setting and only head-and-shoulders ("bust") framing. **The background must be baked into the avatar itself**, so every prompt below uses the same backdrop. |
| Why not render through the API? | Free test renders sat in Synthesia's queue for over 25 minutes. Render the clips in the **Synthesia app** instead (non-test renders are usually minutes) and download them. |
| What does live cost? | 10 credits a minute (about $0.10). Free plan: 1 live session at a time, which is enough because only the speaking judge is live. |

---

## 1. Workflow in the Synthesia app (per assessor)

1. **Avatars → Create avatar → Avatar Builder** (text prompt or reference image).
2. Upload the reference image from `design/synthesia/refs/` (e.g. `technical-judge-avatar-027.png`). These are the assessors' Panel drawings on the Panel grey backdrop. Paste the **shared style block** (section 2) plus that person's lines (section 3) into the prompt.
3. Generate. Pick the result that best matches the drawing: hair, glasses, facial hair, clothing. **Regenerate rather than accept a close miss**; resemblance to the drawing is what makes the line-to-video moment work.
4. Name it exactly as in section 3 (e.g. `Panel · Ezra Cole`) and pair it with a voice (section 4).
5. Copy the avatar's ID into the sheet (section 6). Check that it appears for Interactive Avatars as well, and copy that ID too.
6. Render the clips (section 5) and download them.

These are invented people. Never upload a photo of a real lecturer, and never prompt for a real person's likeness.

---

## 2. Shared style block (paste into every avatar prompt)

> Photorealistic head-and-shoulders portrait of an adult, framed like a high-quality webcam call: centred, eye level, looking straight into the camera, shoulders square, a little space above the head. Neutral, attentive, friendly expression, mouth closed. **Background: a plain, flat, evenly lit warm light-grey wall, colour #F3F2EF, with no texture, no objects, no pictures, no windows and no plants.** Soft, even, diffuse front lighting, with no hard shadows on the face or the wall. Natural skin, muted colours, slightly desaturated, calm and professional. Clothing in ink black, charcoal, white, grey, navy or oatmeal. **No orange anywhere**, no logos, no jewellery other than what is listed. Sharp focus on the face. Match the person in the reference drawing: same hairstyle, glasses, facial hair and clothing.

Why each part matters:
- The **#F3F2EF wall** is Panel's floor colour (`--grey-50`), so every judge sits in the same "room" as the app.
- **No orange:** orange is the UI's only highlight colour (the speaking ring).
- **Bust framing, eye level, centred:** live sessions only support bust framing, and every tile needs the same crop.

---

## 3. Per-assessor lines (add after the style block)

Skin tone and ethnicity: the drawings are ink only, so choose these yourself and keep the panel varied. Describe them plainly if you set them, e.g. "medium-brown skin".

### Pitch judges (do these first)

| Name in Synthesia | Reference image | Add to the prompt |
|---|---|---|
| `Panel · Ezra Cole` (Technical Judge) | `technical-judge-avatar-027.png` | A man in his mid-40s with very short cropped light-brown hair, thin rectangular metal-framed glasses and a short goatee. Dark charcoal blazer over a white shirt with a slim dark tie. Thoughtful, slightly sceptical engineer. |
| `Panel · Hana Ito` (Education Lead) | `education-lead-avatar-048.png` | A woman in her late 40s with a straight, shoulder-length bob and a short, choppy fringe. No glasses. A warm, encouraging smile. Black-and-white horizontally striped crew-neck top. |
| `Panel · Tom Achebe` (Investor) | `investor-avatar-064.png` | A man in his late 30s with short dark hair and a full, neatly trimmed dark beard. No glasses. Navy blazer over a white shirt with a dark tie. Confident, direct. |
| `Panel · Mira Santos` (Design Judge) | `design-judge-avatar-035.png` | A woman in her early 30s with long straight black hair and a blunt fringe, thick black rectangular glasses and a single small stud earring. Oatmeal knit crew-neck jumper. Observant, precise. |

### Report assessors (only if time allows)

| Name in Synthesia | Reference image | Add to the prompt |
|---|---|---|
| `Panel · Alan Marsh` (Module Lead) | `module-lead-avatar-006.png` | A man in his early 60s with grey-white hair swept back, small thin-framed glasses, clean-shaven. Dark blazer, white shirt, dark tie. Calm, authoritative. |
| `Panel · Raj Patel` (Methodologist) | `methodologist-avatar-012.png` | A man in his early 40s with short dark side-parted hair and thick dark rectangular glasses, clean-shaven. Charcoal blazer, white shirt, dark tie. Precise, exacting. |
| `Panel · Amara Osei` (Literature Hawk) | `literature-hawk-avatar-008.png` | A woman in her 40s with a large, rounded natural afro and thin oval metal glasses. A slight smile. Dark blazer over a white shirt. Well-read, quick. |
| `Panel · Sophie Lang` (Communicator) | `communicator-avatar-014.png` | A woman in her early 30s with a dark chin-length bob and a centre parting, smiling openly. No glasses. Plain white V-neck top. Warm, clear. |
| `Panel · Marcus Reid` (Outsider) | `outsider-avatar-016.png` | A man in his late 30s with short curly dark hair held back by a thin dark headband, and a full dark beard. No glasses. Dark blazer, white shirt, dark tie. Practical, commercial. |
| `Panel · Nina Volkova` (Sceptic) | `sceptic-avatar-004.png` | A woman in her mid-40s with dark hair in a high bun, thick black rectangular glasses and large simple hoop earrings. Plain white V-neck top. Serious, probing. |

---

## 4. Voices

Pick a calm, natural British-English voice for each in Synthesia's voice library, and keep the same voice for clips and live. Suggested character:
- **Cole:** measured, low, dry.
- **Ito:** warm, encouraging.
- **Achebe:** confident, brisk.
- **Santos:** clear, precise.

The app can also speak through **ElevenLabs** (Lane 1 has `src/lib/voice`). If you'd rather keep ElevenLabs voices, still pick a Synthesia voice for the clips: the talking clips play **muted** in the app (section 5).

---

## 5. Clips for the app (render in the Synthesia app)

### Scene settings (the same for every clip)
- **Aspect ratio 16:9, 1080p.** The app crops to its tile shape, so keep the face centred.
- **Avatar:** full-size, centred, no circle or shape mask.
- **Scene background: solid colour `#F3F2EF`**, the same as the wall baked into the avatar, so any edge blends.
- **Off:** no captions, music, intro or outro, branding, transitions or extra text.
- **Export:** MP4, then download.

### Clips per judge
| Clip | Length | Script | Used for |
|---|---|---|---|
| `listen.mp4`: listening | 8 s | **A pause only.** In the script box, add one 8-second pause with Synthesia's pause tool, or type `<break time="8s"/>` if your script box accepts break tags. If it insists on text, use "Mm." at the very end and trim it off. | While the student presents: the board watching and listening. |
| `idle.mp4`: waiting | 6 s | A 6-second pause, as above. Also fine to reuse `listen.mp4`. | Tiles of judges who aren't speaking during Q&A. |
| `talk.mp4`: speaking | 8 s | "That's an interesting approach. I'd like to understand how you tested it, and what you would do differently with more time." | The speaking judge's tile when live isn't available. It plays **muted** under the real voice. |
| `poster.jpg`: first frame | — | Screenshot or export of frame 0 of `listen.mp4`. | The image the line drawing is traced from, and the still before the video plays. |

Optional, if the questions are fixed for the demo: one clip per question, with the exact question as the script, named `q1.mp4`, `q2.mp4` and so on. These lip-sync properly with no live session.

### Loops
The app plays clips on a loop. For a seamless loop, **ping-pong** them (play forwards, then backwards); the implementer can do this in the app with no re-render. Avoid big head turns in the script so the loop isn't noticeable.

### Where the files go
Save downloads as:

```
public/avatars/real/<app id>/listen.mp4
public/avatars/real/<app id>/idle.mp4
public/avatars/real/<app id>/talk.mp4
public/avatars/real/<app id>/poster.jpg
```

where `<app id>` is the assessor's id in the app: `technical-judge`, `education-lead`, `investor`, `design-judge`, `module-lead`, `methodologist`, `literature-hawk`, `communicator`, `outsider` or `sceptic`. Keep each MP4 under about 5 MB; the repo is public and these ship with the site.

---

## 6. ID sheet (fill in, then hand over)

| App id | Drawing | Synthesia name | Avatar ID (video) | Interactive ID (`av_…`) | Voice | Clips done |
|---|---|---|---|---|---|---|
| technical-judge | avatar-027 | Panel · Ezra Cole | | | | ☐ listen ☐ idle ☐ talk ☐ poster |
| education-lead | avatar-048 | Panel · Hana Ito | | | | ☐ listen ☐ idle ☐ talk ☐ poster |
| investor | avatar-064 | Panel · Tom Achebe | | | | ☐ listen ☐ idle ☐ talk ☐ poster |
| design-judge | avatar-035 | Panel · Mira Santos | | | | ☐ listen ☐ idle ☐ talk ☐ poster |
| module-lead | avatar-006 | Panel · Alan Marsh | | | | ☐ |
| methodologist | avatar-012 | Panel · Raj Patel | | | | ☐ |
| literature-hawk | avatar-008 | Panel · Amara Osei | | | | ☐ |
| communicator | avatar-014 | Panel · Sophie Lang | | | | ☐ |
| outsider | avatar-016 | Panel · Marcus Reid | | | | ☐ |
| sceptic | avatar-004 | Panel · Nina Volkova | | | | ☐ |

IDs are not secret, so they can go in the repo. Keys are secret: they stay in `.env.local`.

---

## 7. For whoever implements it

**Keys** (all in `AIHack/lane3/.env.local`, git-ignored; server code only):
- `SYNTHESIA_API_KEY`: must have Interactive Avatar access for live, or Synthesia returns `FEATURE_NOT_IN_PLAN`.
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.
- `FAL_KEY`, for the line-drawing step.

**Pre-made clips:**
- The Assessor shape already has `portrait`, `idleClip` and `talkingClip` (`src/lib/schemas`). Point them at the files above, e.g. `portrait: /avatars/real/investor/poster.jpg`.
- Lane 1's `CallStage` (`src/features/pitch/components/CallStage.tsx`) already plays `talkingClip` while speaking and `idleClip` otherwise, falling back to the portrait, then the drawing.
- Add `listen.mp4` for the presenting phase.

**Line drawing → video:**
1. Trace `poster.jpg` into a pen SVG matching `public/avatars/` (fal image-to-image with an existing avatar as the style reference, then vectorise).
2. Show the SVG over the paused poster, wipe the video in underneath, and fade the lines out. Steps are in `docs/plan/lane-3-handoff.md` §3, steps 4–5.

**Live questions (Interactive Avatars):**
1. Run a small **agent worker** using LiveKit Agents with `livekit-plugins-synthesia`, with `AvatarConfig(avatar_ids=[up to 5 av_ IDs])`. Use `swap_avatar(id)` to switch to whichever judge is asking.
2. The app's server sends the question text (from Lane 1's engine) to the worker, which speaks it (Synthesia built-in TTS, or ElevenLabs).
3. A Next.js server route mints a LiveKit token for the browser.
4. The browser joins with `livekit-client` (room option `adaptiveStream: false`, or the video goes soft) and attaches the avatar's video track to the speaking tile.
5. Keep the pre-made clips and voices as the fallback, switched in `src/config`.

Docs:
- Interactive Avatars: https://developers.synthesia.io/docs/interactive-avatars
- Plugin reference: https://developers.synthesia.io/docs/ia-livekit-plugin-reference
- Limits and pricing: https://developers.synthesia.io/docs/ia-operational-trust
- LiveKit plugin: https://docs.livekit.io/agents/models/avatar/plugins/synthesia
