# Lane 2: report review, document intake, project setup

Steps 2.1–2.4 from the Lane 2 brief. Everything lives in Lane 2 folders; the
few root files it needed are listed under "Shared changes" so Lane 1 can merge
them with the foundation.

## Routes

| Route | What it is |
|---|---|
| `/projects/new` | 2.4 project setup: template → brief + weak spots → board → start. Saves the project and board, then upload and a live review (or `/pitch` for the hackathon template) |
| `/review/new?project=<id>` | 2.2 upload a PDF or paste text, preview the numbered paragraphs, then a live review for that project |
| `/review?review=<id>` | A saved review, reopened from the data layer without calling the engine |
| `/review` | The sample review (`fixtures/review-sample.ts`), labelled as sample |

The engine is Lane 1's: `POST /api/engine/assessor` (one per assessor, in parallel) and `POST /api/engine/deliberate` (saves the review). Without `ANTHROPIC_API_KEY` both return labelled sample replies.

## Running it

See the root README. `npm test` covers the splitter, PDF layout and project helpers.

## How a live review runs

1. "Start review" saves the document and a running review (`actions.ts`), so the floor shows the table in session.
2. The screen sends one request per board member to `/api/engine/assessor`, all in parallel (`live/useLiveReview.ts`). Each seat shows Reading, then Read or Did not finish with Try again.
3. Comments appear assessor by assessor.
4. When everyone has finished or failed, `/api/engine/deliberate` runs once and saves the whole review. The address bar then points at `/review?review=<id>`, so a refresh reopens it without calling the engine.
5. The Feedback report tab is the shared `src/features/feedback/FeedbackReport.tsx`; its actions link back to their paragraphs.

## Temporary stand-ins

`ui/` still holds thin wrappers that are not direct swaps for `src/components/ui` (different props or variants): Avatar (name and ring), Card (dark, live, failed variants), Label (inverse tone), Tabs (chip style), TextInput and TextArea (value-based onChange, no visible label), Pill, TextButton, SelectCard, FileDrop, ExitBubble.

## Design

Follows `design/DESIGN_SYSTEM.md` and uses the shared foundation directly:

- Tokens, fonts and base components come from `src/styles` and `src/components/ui`. `styles/review.css` only gives Tailwind names to the shared tokens (`@theme inline`, nothing redefined on `:root`); `ui/` holds thin wrappers over the shared components.
- People are the pen avatars from `public/avatars` (same file per preset as the home floor), transparent, inverted on black.
- Report review (§9, §10): numbered disc anchors in the margin (orange = open critique), two tabs (Comments, Feedback report), no Reply (a comment is marked done), AI states Reading, Did not finish (Try again) and Empty, and an exit bubble back to the floor.
- New project (§15): steps as pills joined by lines; the board step shows the new table focused (orange) with its seats around it from −110°, no empty seats; assessor cards with harshness as dots and Seat / Unseat pills.

## Not done yet

- Mark-scheme upload and editing, and the second run ("Run again", hidden until then): step 2.5.
- The pitch template goes to report review; it should also offer Lane 1's `/pitch` once that exists.

## Shared changes outside Lane 2 folders

- `package.json` / lockfile: Next.js app scaffold, `pdfjs-dist`, `@anthropic-ai/sdk`, `zod`, `vitest`, a `test` script.
- `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts`, `.gitignore`.
- `next.config.ts`: scaffold defaults plus `agentRules: false`, so `next dev` doesn't rewrite the team's `AGENTS.md`.
