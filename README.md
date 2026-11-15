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

## What we built

- **Assessors** modelled on real markers: copy a preset, rename it, and add
  notes on what that lecturer has said they want. The notes change what that
  assessor looks for.
- **Boards** of assessors, seated at a **project** (a thesis, a lab report, a
  pitch) with its brief, mark scheme and the student's own weak spots.
- **Report review:** each assessor reads the document independently and
  comments on specific paragraphs, then the board deliberates.
- **Presentation practice:** the board listens to a spoken pitch, steps out,
  and comes back as a video call to ask its questions aloud, one at a time,
  with follow-ups that depend on the answer.
- A **feedback report** closes every session: a verdict, a rating against each
  marking criterion, ranked actions with evidence, and anything to take to a
  human supervisor.

## How it works

Next.js (App Router, TypeScript, Tailwind). The app runs locally or in Docker.

- **Specialised agents.** Each assessor is a separate Claude call with its own
  prompt, built from four layers: the shared project context, who the assessor
  is (including the student's notes on them), what they said in earlier
  sessions, and a few focus points picked at random by the code so repeat runs
  differ. Assessors review independently; a deliberation step then reports
  where they agree and disagree.
- **Session state and memory.** Each project keeps a board memory: every
  attempt, what each assessor raised, which actions were ticked off, and the
  rating against each criterion over time. It is passed into every later call,
  and the next report says what improved and what was raised again. Within a
  live Q&A the session tracks every question, answer, mode and struggle count,
  so questions are never repeated and later ones can refer to earlier answers.
- **Guardrails and mode switching.** After each spoken answer a small router
  call labels the answer and the student's intent, and code (not the model)
  picks a mode: pressing, probing, coaching, steering, holding the line or
  paused. Each mode has its own prompt block. A struggling student is coached;
  a request for the answer is declined and steered; an attempt to change the
  rules is refused; distress pauses the session and points to a human.
- **One integrity pipeline.** Input checks, router, assessor, output checks,
  escalation. Every Claude reply is validated against a schema. Output checks
  remove anything that rewrites the student's work, predicts a mark, comments
  on tone of voice or body language, cites a paper that was not supplied, or
  reveals instructions. Text in an uploaded document that addresses the
  reviewer is ignored. Each event is recorded and shown in the report.
- **Human in the loop.** When the board cannot agree, or a point falls outside
  every assessor's field, the report says to take it to a supervisor.
- **Honest about sample data.** With no API key the app runs on labelled
  sample replies, and every screen using them says so.

## APIs, models and libraries

| What | Used for |
|---|---|
| Anthropic Claude API (`@anthropic-ai/sdk`), model `claude-haiku-5-5` (set in `src/config`) | The assessors, deliberation, answer router, questions and feedback reports |
| Web Speech API (Chrome) | Listening to the spoken pitch, and the built-in voice that reads questions aloud |
| ElevenLabs (optional) | A distinct natural voice per assessor. Built and switched off by default; the browser voice is the fallback |
| Supabase (`@supabase/supabase-js`, optional) | Database and file storage. Without it the app uses an in-memory store that is lost on restart |
| Synthesia | Rendering the looping video clips of the pitch judges in `AVATAR_VIDEOS/` |
| Next.js, React, Tailwind CSS | The app |
| Zod | Validating every Claude reply and database row |
| pdf.js (`pdfjs-dist`) | Reading uploaded PDFs |
| Figma | The design system and screens |
| Claude Code, Codex CLI, Playwright | Writing and visually checking the code during the hackathon |

No datasets were used. The sample projects, documents and replies in
`fixtures/` were written for this project and are labelled as samples in the
app.

## Running it

```bash
npm install
cp .env.example .env.local      # ANTHROPIC_API_KEY is the only one needed
npm run dev
```

Open the app in Chrome; listening to a spoken pitch uses Chrome's speech
recognition. Optional extras:

```bash
npm run db:migrate              # with Supabase keys set; or paste supabase/migrations/*.sql into the SQL editor
npm run db:seed                 # add -- --sample for sample projects on the floor
npm run voices:assign           # with ELEVENLABS_API_KEY set: a distinct voice per assessor
```

### Docker

```bash
docker build -t panel .
docker run --rm -p 3000:3000 --env-file .env.local panel
```

## Privacy and security

In place:

- API keys are read only on the server. Nothing secret reaches the browser,
  and no key or `.env` file is in this repository.
- Uploaded documents are never committed. With Supabase configured, row-level
  security is on with no public policies, so only the server reads or writes.
- The presenter's camera is shown on screen only. It is not recorded or sent
  anywhere.
- Text inside an uploaded document that addresses the reviewer is treated as
  material to assess, never as instructions.
- Every reply passes the integrity pipeline described above, and each check
  that fires is shown in the feedback report.

Where your data goes:

- Report text, pitch transcripts and answers are sent to Anthropic's API to
  produce the feedback.
- Chrome's speech recognition sends microphone audio to Google to transcribe.
- With the live avatar switched on, each question's text is sent to LiveKit
  (speech) and Synthesia (video).

Not in place yet: accounts (planned as Google sign-in limited to university
accounts), usage limits per person, automatic deletion of uploads, and a
notice before the first upload naming the services above.

## Not built yet

- Live lip-synced video assessors. The plan is in
  [`docs/plan/live-presentation-setup.md`](docs/plan/live-presentation-setup.md).
- Accounts. The sign-in page is a screen only; there is one demo user.
- Feedback on tone of voice or body language. The app only has the student's
  words, and says so.

## Design

The design system is in [`design/DESIGN_SYSTEM.md`](design/DESIGN_SYSTEM.md);
the Figma file is
[AI_hackathon](https://www.figma.com/design/d0G58b8c7ESX0rw0qbXHcX/AI_hackathon).
The build plan is in [`docs/plan/`](docs/plan/README.md).
