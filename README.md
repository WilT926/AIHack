# Panel

Build a board of AI assessors modelled on the people who will mark you. The
board reviews your report or listens to your spoken pitch, deliberates, asks
its questions aloud, and gives you a feedback report with ranked actions.

Imperial AI Hack 2026: Reply Challenge (AI on Campus) and the Figma
Best-Designed AI Product prize.

## The problem

What a student is marked against and what their marker actually wants are not
the same thing. The mark scheme is written down; the rest is said in lectures,
in office hours and in feedback on earlier work. Students find out what their
markers care about after the mark comes back.

## What we are building

- **Assessors** modelled on real markers: a preset, renamed and given notes
  on what that lecturer has said they want.
- **Boards** of assessors, seated at a **project** (a thesis, a lab report, a
  pitch) with its brief, mark scheme and the student's own weak spots.
- **Report review:** each assessor reads the document and comments on specific
  paragraphs, then the board deliberates.
- **Presentation practice:** the board listens to a spoken pitch, steps out,
  and comes back as a video call to ask its questions aloud.
- A **feedback report** closes every session: a verdict, a rating against each
  marking criterion, ranked actions with evidence, and anything to take to a
  human supervisor.

## How it works

Next.js (App Router, TypeScript, Tailwind) on Vercel. Supabase holds the data
and uploads; only the server talks to it. Each assessor is a separate Claude
call with its own prompt; every reply is validated against a schema and
invalid items are dropped.

## APIs, models and libraries

| What | Used for |
|---|---|
| Anthropic Claude API (`@anthropic-ai/sdk`): `claude-haiku-5-5` while developing; `claude-opus-5-5` and `claude-sonnet-5-5` for judging | The assessors, deliberation, questions and feedback reports |
| ElevenLabs | Assessor voices (the browser's speech synthesis is the fallback) |
| Web Speech API (Chrome) | Listening to the spoken pitch |
| Supabase (`@supabase/supabase-js`) | Database and file storage |
| Next.js, React, Tailwind CSS | The app |
| Zod | Validating every Claude reply and database row |
| pdf.js (`pdfjs-dist`) | Reading uploaded PDFs |
| Figma | The design system and screens |

## Running it

```bash
npm install
cp .env.example .env.local      # fill in the keys
npm run db:migrate              # or paste supabase/migrations/*.sql into the SQL editor
npm run db:seed                 # add -- --sample for sample projects on the floor
npm run voices:assign           # once ELEVENLABS_API_KEY is set: a distinct voice per assessor
npm run dev
```

Without Supabase keys the home floor shows the sample data in `fixtures/`.

### Docker

```bash
docker build -t panel .
docker run --rm -p 3000:3000 --env-file .env.local panel
```

## Design

The design system is in [`design/DESIGN_SYSTEM.md`](design/DESIGN_SYSTEM.md);
the Figma file is
[AI_hackathon](https://www.figma.com/design/d0G58b8c7ESX0rw0qbXHcX/AI_hackathon).
