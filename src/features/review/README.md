# Lane 2: report review, document intake, project setup

Steps 2.1–2.4 from the Lane 2 brief. Everything lives in Lane 2 folders; the
few root files it needed are listed under "Shared changes" so Lane 1 can merge
them with the foundation.

## Routes

| Route | What it is |
|---|---|
| `/projects/new` | 2.4 project setup: template → brief + weak spots → board → start, then upload and a live review |
| `/review/new` | 2.2 upload a PDF or paste text, preview the numbered paragraphs, then a live review (sample project) |
| `/review` | 2.1 the review screen on sample data (`fixtures/review-sample.ts`) |
| `POST /review/api/assessor` | 2.3 one assessor reads the document and returns comments |
| `POST /review/api/deliberate` | 2.3 the board compares notes: agreements, splits, fix list, likely questions |

## Running it

```bash
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local   # never commit this
npm run dev
npm test        # splitter, PDF layout, reply checking, project context
```

| Variable | Default | Use |
|---|---|---|
| `ANTHROPIC_API_KEY` | none | Server only. Without it every assessor shows a clear "no API key" failure. |
| `PANEL_REVIEW_MODEL` | `claude-haiku-5-5` | Set `claude-opus-5-5` for rehearsal and judging (also turns on the server-side refusal fallback). |
| `PANEL_REVIEW_EFFORT` | `medium` | `low` … `max`. |
| `PANEL_ENGINE_MOCK` | off | `1` returns canned `[mock]` feedback with realistic delays, without calling Claude. A document whose title contains "fail" makes the Sceptic fail, to test the retry. |

## How a live review runs

1. The screen sends one request per board member, all in parallel (`live/useLiveReview.ts`).
2. Each route call validates the body (zod, size limits), calls Claude with structured output, and checks the reply (`engine/sanitize.ts`): comments on unknown paragraphs, unknown assessors and one-sided splits are dropped.
3. Comments appear assessor by assessor; a failed assessor gets a Retry.
4. When everyone has finished or failed, the deliberation runs once.

The engine sits behind `reviewAsAssessor` and `deliberate` in `engine/run.ts`, so Lane 1's engine (step 1.2) can replace it without touching the screen.

## Temporary stand-ins (swap when the shared versions land)

| Here | Replace with |
|---|---|
| `src/app/review/layout.tsx`, `src/app/projects/layout.tsx` act as root layouts | Lane 1's `src/app/layout.tsx`; then drop `<html>`/`<body>` from these |
| `src/features/review/styles` (style variables, fonts, named grid layouts) | Lane 3's `src/styles` (same variable names) |
| `src/features/review/ui` (Button, Pill, Card, Avatar, Tabs, …) | `src/components/ui` |
| `src/features/review/types.ts`, `engine/schemas.ts`, `projects/types.ts` (brief's data shapes) | `src/lib/schemas` |
| `src/features/review/engine/config.ts` | `src/config` |
| Preset assessors in `fixtures/review-sample.ts` | Seeded assessors via `src/lib/data` |

## Not done yet

- Nothing is saved (no database yet): reopening a review re-runs it; refreshing project setup loses it.
- Mark-scheme upload and editing, and the second run ("Run again", hidden until then): step 2.5.
- The pitch template goes to report review; it should also offer Lane 1's `/pitch` once that exists.

## Shared changes outside Lane 2 folders

- `package.json` / lockfile: Next.js app scaffold, `pdfjs-dist`, `@anthropic-ai/sdk`, `zod`, `vitest`, a `test` script.
- `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts`, `.gitignore`.
- `next.config.ts`: scaffold defaults plus `agentRules: false`, so `next dev` doesn't rewrite the team's `AGENTS.md`.
