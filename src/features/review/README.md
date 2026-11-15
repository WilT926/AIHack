# Lane 2: report review, document intake, project setup

Steps 2.1–2.5 from the Lane 2 brief, plus the two "if time" items (written-questions mode, copy the fix list). Everything lives in Lane 2 folders; the
few root files it needed are listed under "Shared changes" so Lane 1 can merge
them with the foundation.

## Routes

| Route | What it is |
|---|---|
| `/projects/new` | 2.4 project setup: template → brief + weak spots + mark scheme → board → start, then upload and a live review; "Upload v2" starts run 2 |
| `/review/new` | 2.2 upload a PDF or paste text, preview the numbered paragraphs, then a live review (sample project) |
| `/review` | 2.1 the review screen on sample data (`fixtures/review-sample.ts`) |
| `POST /review/api/assessor` | 2.3 one assessor reads the document and returns comments |
| `POST /review/api/deliberate` | 2.3 the board compares notes: agreements, splits, fix list, likely questions; on run 2+ also "since last time", in written mode also add/cut |
| `POST /review/api/markscheme` | 2.5 a photographed mark scheme → weighted criteria (PDF and text are parsed in the browser) |

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

## Mark scheme and second run (2.5)

- **Mark scheme**: upload a PDF, text file or photo, or paste it (`projects/components/MarkSchemeEditor.tsx`). `src/lib/documents/markScheme.ts` turns text into criteria ("Method 30%", "Results: 30 marks"); photos go to Claude. Names and weights are editable, shown as bars, and scaled to 100. Every assessor gets the criteria, tags each comment with one (`criterionId`, dropped if it isn't a real criterion) and spends attention by weight.
- **Second run**: "Upload v2" on the review screen keeps run 1 and starts the intake for version 2. The engine gets each assessor's earlier comments (with the start of the paragraph they were about, since paragraph numbers change) and the earlier fix list (`engine/previous.ts`). Assessors say which points are fixed, partly fixed or ignored; the deliberation returns "since last time", shown at the top of the rail.
- **Written-questions mode** (brief step, "After the review"): questions are for the text, and the report adds "What to add or cut".
- **Copy fix list**: Feedback report → "Copy fix list" copies clean numbered text (`fixListText`).

The engine sits behind `reviewAsAssessor` and `deliberate` in `engine/run.ts`, so Lane 1's engine (step 1.2) can replace it without touching the screen.

## Temporary stand-ins (swap when the shared versions land)

| Here | Replace with |
|---|---|
| `src/features/review/types.ts`, `engine/schemas.ts`, `projects/types.ts` (the Lane 2 brief's data shapes) | `src/lib/schemas` (Lane 1's contract: `severity`, `suggestion`, one `paragraphId` per comment, `disagreements` with views) |
| `src/features/review/engine/config.ts` | `models.review` in `src/config` |
| Preset assessors in `fixtures/review-sample.ts` | Seeded assessors via `src/lib/data` |

## Design

Follows `design/DESIGN_SYSTEM.md` and uses the shared foundation directly:

- Tokens, fonts and base components come from `src/styles` and `src/components/ui`. `styles/review.css` only gives Tailwind names to the shared tokens (`@theme inline`, nothing redefined on `:root`); `ui/` holds thin wrappers over the shared components.
- People are the pen avatars from `public/avatars` (same file per preset as the home floor), transparent, inverted on black.
- Report review (§9, §10): numbered disc anchors in the margin (orange = open critique), two tabs (Comments, Feedback report), no Reply (a comment is marked done), AI states Reading, Did not finish (Try again) and Empty, and an exit bubble back to the floor.
- New project (§15): steps as pills joined by lines; the board step shows the new table focused (orange) with its seats around it from −110°, no empty seats; assessor cards with harshness as dots and Seat / Unseat pills.

## Not done yet

- Nothing is saved (no database yet): reopening a review re-runs it; refreshing project setup loses it.
- Run history lives in the page only: reopening loses earlier runs until `src/lib/data` stores them.
- The full feedback report (2.3b) stays off behind `features.feedbackReport`.
- The pitch template goes to report review; it should also offer Lane 1's `/pitch` once that exists.

## Shared changes outside Lane 2 folders

- `package.json` / lockfile: Next.js app scaffold, `pdfjs-dist`, `@anthropic-ai/sdk`, `zod`, `vitest`, a `test` script.
- `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts`, `.gitignore`.
- `next.config.ts`: scaffold defaults plus `agentRules: false`, so `next dev` doesn't rewrite the team's `AGENTS.md`.
