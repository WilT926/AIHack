# Rules for every agent session in this repo

## What we are building
A student builds a board of AI assessors modelled on the people who will mark them. The board reviews a report or listens to a spoken pitch, deliberates, asks questions aloud, and gives feedback.

Entered in Imperial AI Hack: Reply Challenge (AI on Campus) plus the Figma Best-Designed AI Product prize.

**Hard freeze: Sunday 11:30. Submission: Sunday 12:00. Nothing changes after that.**

## Before you do anything
1. Read `docs/plan/README.md` (shared plan and data shapes).
2. Read the lane file you were pointed at (`docs/plan/lane-1.md`, `lane-2.md` or `lane-3.md`).
3. Do only the step you were asked to do. Stop when its "Done when" check passes. Do not start the next step unasked.

## Stack
- Next.js (App Router), TypeScript in strict mode, Tailwind.
- Supabase for the database and file storage. One seeded demo user, no login.
- Claude through the official `@anthropic-ai/sdk`. Model names come from `src/config`, never hard-coded.
- ElevenLabs for assessor voices, with the browser's built-in voice as fallback.
- Deployed on Vercel. `main` is the demo site, `staging` is the shared test site.

## Folder ownership
Only edit folders your lane owns. If you need a change elsewhere, tell the human; do not make it.

| Folder | Owner |
|---|---|
| `src/lib/schemas`, `src/lib/data`, `src/config`, `supabase/` | Lane 1 |
| `src/lib/engine`, `src/lib/voice`, `src/features/pitch`, `src/app/pitch`, `src/app/api/engine`, `src/app/api/pitch`, `src/app/api/voice` | Lane 1 |
| `src/lib/documents`, `src/features/review`, `src/features/projects`, `src/app/review`, `src/app/projects`, `src/app/api/documents` | Lane 2 |
| `src/styles`, `src/components/ui`, `public/avatars`, `src/features/assessors`, `src/features/boards`, `src/features/home`, `src/app/assessors`, `src/app/boards`, `src/app/profile`, `src/app/page.tsx` | Lane 3 |

## Code rules
- Pages and features are built only from the base components in `src/components/ui`.
- No raw colours, font names or pixel spacing outside `src/styles`. Use the named style variables.
- All database access goes through `src/lib/data`, and only on the server.
- API keys are read only in server code. Nothing secret reaches the browser.
- Every reply from Claude is checked against its data shape before use. Invalid items are dropped, not shown.
- Never commit keys, `.env` files, the thesis, mark schemes or lecturer notes. The repo is public.
- Before writing any code that calls Claude, load the `claude-api` skill and follow it.
- Before using ElevenLabs, Supabase or a PDF library, read its current docs rather than relying on memory.
- Unfinished features are switched off in `src/config`, not left half-visible.

## Branches
- One branch per step, named `lane1/engine`, `lane2/review-screen`, and so on.
- Pull `staging` before starting a step.
- Before merging: the build and lint must pass locally.
- Merge your branch into `staging`. Only Lane 1 merges `staging` into `main`, at the checkpoints in the plan.
- Keep branches short. Merge within about 90 minutes of starting.

## Keeping usage low
- One step per session. Start a fresh session (or `/clear`) for the next step.
- Do not explore the whole repo. Read the files named in your step.
- Screen work uses the sample data in `fixtures/`. Do not call Claude to build a screen.
- While developing, the app's model setting stays on `claude-haiku-5-5`.
