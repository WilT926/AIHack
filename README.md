# Panel

**Meet your markers before they mark you.** Build a board of AI assessors modelled on the people who will mark you. The board reviews your report, or listens to your presentation and questions you live, then gives you a feedback report with ranked actions.

Imperial AI Hack 2026: Reply Challenge (AI on Campus) and the Figma Best-Designed AI Product prize.

- [The problem](#the-problem)
- [What Panel does](#what-panel-does)
- [Using Panel](#using-panel)
- [How it works](#how-it-works)
- [APIs, models and libraries](#apis-models-and-libraries)
- [Running it](#running-it)
- [Project layout](#project-layout)
- [Privacy and security](#privacy-and-security)
- [Not built yet](#not-built-yet)
- [Design](#design)

## The problem

What a student is marked against and what their marker actually wants are not the same thing. The mark scheme is written down; the rest is said in lectures, in office hours and in feedback on earlier work. Students find out what their markers care about after the mark comes back.

## What Panel does

Two main features, both ending in the same **feedback report** (a verdict, a rating against each marking criterion, ranked actions with the evidence behind each, and anything to take to a human supervisor).

### 1. Document review
Upload a report (PDF or pasted text). Every assessor reads it independently and pins comments, marked major, minor or praise, to specific paragraphs. The board then deliberates: where it agrees, where it doesn't, and what to do first. Filter the comments by severity or by assessor, and mark each one done as you fix it.

### 2. Live panel assessment
Present aloud. Panel listens and transcribes as you speak; say "thank you" and pause, or press Finish. The board steps out to confer, then comes back as a video call and asks its questions out loud, one at a time, with follow-ups that depend on your answer.
- **Coaching** is warm and unhurried, softens when you struggle and breaks questions down.
- **Exam conditions** are brisk and even, and give no hints.

The two conditions sound different, as well as asking differently. The report adds length, pace, structure and how well you answered each question, with a stronger answer.

### Around them
- **Panels on a floor.** Each piece of work (a thesis, a lab report, a pitch) is a round panel on your floor, with its board seated round it. Each report panel has one dot per assessor at its base: **solid** when all of that assessor's comments are reviewed, **outline** when not.
- **The side panel** for the focused panel:
  - when it was last reviewed, and any new feedback since you last looked;
  - per-assessor feedback scores and review progress;
  - who sits at the board;
  - previous attempts;
  - suggested actions.
- **Assessors modelled on real markers.** Copy a preset, rename it after your lecturer, and add notes on what they said they want. Next session, that assessor asks about it.
- **Edit board.** Seat and unseat assessors from the floor; the presentation set-up always uses the panel's own board.
- **The Desk.** Every panel's past sessions and uploads. Leaving a review or a presentation part-way still saves it there.
- **Memory.** The board remembers earlier attempts, and the next report says what improved and what was raised again.
- **User settings.** Edit your details and choose your avatar; these are saved to the database.
- **Landing page.** The app opens on a landing page with guides. Sign in to reach your floor; sign out returns you there.

## Using Panel

Guides are also on the landing page (`/welcome`).

**Make a new panel.**
1. On your floor, press the dashed **New panel** circle.
2. Choose the type, name it, and say what's graded.
3. Add your weak spots and the mark scheme.
4. Seat the board.

**Find things on your Desk.** Focus a panel, then press the **Desk** bubble in the dock. Past sessions and uploads are listed in two groups; orange counts show comments you haven't reviewed.

**Start a live panel assessment.**
1. Press the orange **+** and choose **Panel room**.
2. Pick the panel, the number of questions, aloud or in writing, coaching or exam conditions, and how you present.
3. Press **Start presenting**.
4. Answer each question aloud and press **Next**.
5. End the Q&A for the report.

**Review a document.**
1. Press the orange **+** and choose **Live doc review**.
2. Upload a PDF or paste the text, and check the numbered paragraphs.
3. Press **Start review**.
4. Read the comments, mark them done, then open the **Report** tab.

Panel works best in Chrome, which provides the speech recognition for presenting.

## How it works

Next.js (App Router, TypeScript, Tailwind). It runs locally or in Docker.

- **Specialised agents.** Each assessor is a separate Claude call with its own prompt, built from four layers:
  - the shared project context;
  - who the assessor is, including your notes on them;
  - what they said in earlier sessions;
  - a few focus points picked at random by the code, so repeat runs differ.

  Assessors review independently; a deliberation step then reports where they agree and disagree.
- **Session state and memory.** Each panel keeps a board memory: every attempt, what each assessor raised, which actions were ticked off, and the rating against each criterion over time. It is passed into every later call. Within a live Q&A the session tracks every question, answer, mode and struggle count, so questions are never repeated and later ones can build on earlier answers.
- **Guardrails and mode switching.** After each spoken answer a small router call labels the answer and your intent, and code (not the model) picks a mode: pressing, probing, coaching, steering, holding the line or paused. Each mode has its own prompt block.
  - A struggling student is coached.
  - A request for the answer is declined and steered.
  - An attempt to change the rules is refused.
  - Distress pauses the session and points to a human.
- **One integrity pipeline.** Input checks, router, assessor, output checks, escalation. Every Claude reply is validated against a schema; invalid items are dropped, never shown. Output checks remove anything that:
  - rewrites your work or predicts a mark;
  - comments on tone of voice or body language;
  - cites a paper that was not supplied;
  - reveals instructions.

  Text in an uploaded document that addresses the reviewer is ignored. Each event is recorded and shown in the report.
- **Human in the loop.** When the board cannot agree, or a point falls outside every assessor's field, the report says to take it to your supervisor.
- **Voices.** Each assessor speaks with ElevenLabs when it's switched on, otherwise with the browser's voice. Coaching and exam conditions use different voice settings (`src/lib/voice/tone.ts`) and a different opening line.
- **Live avatars (optional).** With `LIVE_AVATAR=1`, a small Python agent (`agent/`) joins a LiveKit room as the asking judge's Synthesia interactive avatar and speaks the question Claude wrote, lip-synced. If anything fails, the call falls back to the ordinary voice and the looping clips.
- **Leaving part-way.** Leaving a review sends what the board has finished so far to be saved. Leaving a presentation saves the transcript and writes the report (`/api/pitch/leave`). Both use requests that finish after the page has gone.
- **Honest about sample data.** With no Claude key the app runs on labelled sample replies, and every screen using them says so.

## APIs, models and libraries

| What | Used for |
|---|---|
| Anthropic Claude API (`@anthropic-ai/sdk`), `claude-haiku-5-5` while developing (set in `src/config`) | Assessors, deliberation, the answer router, questions and feedback reports |
| Web Speech API (Chrome) | Listening to the spoken presentation, and the built-in voice fallback |
| ElevenLabs (optional) | A distinct natural voice per assessor, with per-condition voice settings |
| LiveKit (`livekit-client`, `livekit-server-sdk`, LiveKit Agents) and Synthesia Interactive Avatars (optional) | The live, lip-synced judge on the video call |
| Synthesia | The looping listening clips of the judges in `AVATAR_VIDEOS/` |
| fal | Images for the avatar set and line-drawing experiments |
| Supabase (`@supabase/supabase-js`, optional) | Database and file storage. Without it the app uses an in-memory store that is lost on restart |
| Next.js, React, Tailwind CSS | The app |
| Zod | Validating every Claude reply and database row |
| pdf.js (`pdfjs-dist`) | Reading uploaded PDFs |
| Figma | The design system and screens |
| Claude Code, Codex CLI, Playwright | Writing and visually checking the code during the hackathon |

No datasets were used. The sample projects, documents and replies in `fixtures/` were written for this project and are labelled as samples in the app.

## Running it

```bash
npm install
cp .env.example .env.local      # ANTHROPIC_API_KEY is the only one needed for real replies
npm run dev
```

Open http://localhost:3000 in Chrome. The app starts on the landing page; **Sign in** (any route in) takes you to the floor.

Optional extras:

```bash
npm run db:migrate              # with Supabase keys set; or paste supabase/migrations/*.sql into the SQL editor
npm run db:seed                 # add -- --sample for sample panels on the floor
npm run voices:assign           # with ELEVENLABS_API_KEY set: a distinct voice per assessor
```

To use ElevenLabs voices, set `ELEVENLABS_API_KEY` and switch on `features.elevenLabs` in `src/config/index.ts`. For live avatars, see [`agent/README.md`](agent/README.md) (`LIVE_AVATAR=1`, LiveKit and Synthesia keys, and the agent running beside the app).

### Docker

```bash
docker build -t panel .
docker run --rm -p 3000:3000 --env-file .env.local panel
```

Keys are passed at run time and never baked into the image. Without `--env-file` the app runs on sample data.

### Checks

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

## Project layout

| Folder | What's there |
|---|---|
| `src/app` | Pages and API routes: the floor (`/`), `/welcome`, `/login`, `/settings`, `/assessors`, `/pitch`, `/review`, `/projects/new`, and `/api/*` |
| `src/features` | Each screen's components: `home` (floor), `landing`, `auth`, `settings`, `assessors`, `pitch`, `review`, `feedback`, `projects` |
| `src/components/ui` | Shared building blocks: top bar, dock, menus, buttons, controls, skeletons |
| `src/lib` | `engine` (Claude calls and the integrity pipeline), `data` (all database access), `schemas` (data shapes), `voice`, `live`, `documents` |
| `src/styles` | Style variables and all CSS; no raw colours outside here |
| `src/config` | Model names and feature switches |
| `supabase/` | Schema migrations and seed scripts |
| `agent/` | The optional live-avatar agent (Python) |
| `design/` | The design system, Figma references, avatar sets, Synthesia prompts and IDs |
| `docs/plan/` | The build plan and hand-over notes |
| `fixtures/` | Sample data used without a database |

## Privacy and security

In place:

- API keys are read only on the server. Nothing secret reaches the browser, and no key or `.env` file is in this repository.
- Uploaded documents are never committed. With Supabase configured, row-level security is on with no public policies, so only the server reads or writes.
- The presenter's camera is shown on screen only. It is not recorded or sent anywhere.
- Text inside an uploaded document that addresses the reviewer is treated as material to assess, never as instructions.
- Every reply passes the integrity pipeline described above, and each check that fires is shown in the feedback report.

Where your data goes:

- Report text, presentation transcripts and answers are sent to Anthropic's API to produce the feedback.
- Chrome's speech recognition sends microphone audio to Google to transcribe. Panel keeps the text, never the audio.
- With ElevenLabs on, each question's text is sent to ElevenLabs to be spoken.
- With the live avatar switched on, each question's text is sent to LiveKit (speech) and Synthesia (video).

Not in place yet:

- real accounts (planned as Google sign-in limited to university accounts);
- usage limits per person;
- automatic deletion of uploads;
- a notice before the first upload naming the services above.

## Not built yet

- **Accounts.** Sign-in is a demo: Google and email both sign you in as the one demo student, remembered in this browser until you sign out.
- **Feedback on tone of voice or body language.** The app only has your words, and says so.
- **Saved preferences.** Most user-settings preferences (panel defaults, notifications and so on) are kept in the browser, not the database, and the sessions don't read them yet. Your details and avatar are saved.

## Design

- The design system is in [`design/DESIGN_SYSTEM.md`](design/DESIGN_SYSTEM.md).
- The Figma file is [AI_hackathon](https://www.figma.com/design/d0G58b8c7ESX0rw0qbXHcX/AI_hackathon).
- The build plan and hand-over notes are in [`docs/plan/`](docs/plan/README.md).
