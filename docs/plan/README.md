# Build plan

Three people, three lanes, one repo. Each lane file is a list of steps to run one at a time in your own agent session.

- [Lane 1: foundation, engine, pitch practice](lane-1.md) (critical path)
- [Lane 2: documents, report review, project setup](lane-2.md)
- [Lane 3: design system, assessors, boards, home](lane-3.md) (design lead, Figma prize)

## How to run a step
Start a fresh agent session and say:

> Read CLAUDE.md, docs/plan/README.md and docs/plan/lane-N.md. Do step N.X only. Stop when its "Done when" check passes and tell me what to test.

Test it yourself, merge to `staging`, then start a new session for the next step.

## Hours we really have

| Block | When | Where |
|---|---|---|
| A | Saturday until 21:00 (dinner 19:00–20:00) | Building |
| B | Saturday evening, optional | Home |
| C | Sunday before 10:00, optional | Home |
| D | Sunday 10:00–11:30 | Building |
| Freeze | Sunday 11:30 | |
| Submit | Sunday 11:45, deadline 12:00 | Devpost |
| Rehearse | Sunday 12:00–13:00, no code changes | |
| Judging | Sunday 13:00–16:30, live presentation, no video | |

Lane 1 needs about 4.5 hours for foundation, engine and the full pitch flow. Blocks A and D give about 3.5. So either some of block B or C is used, or pitch practice ships with the browser voice and typed fallback only.

## Priority tiers
Work down the tiers. Never start a lower tier while a higher one in your lane is unfinished.

| Tier | Lane 1 | Lane 2 | Lane 3 |
|---|---|---|---|
| 0 | 1.1 Foundation | Figma: review and project setup screens | Figma: system, pitch screen, assessor profile |
| 1 | 1.2 Engine | 2.1 Review screen on sample data | 3.1 Style variables and base components |
| 2 | 1.3 Pitch: listen and questions | 2.2 Document intake, 2.3 Wire to engine | 3.2 Avatars, 3.2b Call stage, 3.2c Realistic versions, 3.3 Assessors and notes |
| 3 | 1.4 Pitch: voices, answers, feedback | 2.3b Feedback report screen, 2.4 Project setup and pitch template | 3.4 Boards, 3.5 Home |
| 4 | 1.5 Escalation flag, 1.6 Memory | 2.5 Mark scheme upload, second run | 3.6 Visual check and design evidence |
| 5, only if time | Board recommender, research check, real-time lip sync for one assessor | From-scratch project options | From-scratch assessor creator, phone layout |

**Cut rule:** at each checkpoint, anything in tier 4 or 5 that has not been started is dropped and switched off.

## Checkpoints

| When | What happens |
|---|---|
| Foundation pushed (target Saturday 19:45) | Lane 1 pushes 1.1 to `main` and `staging`. Lanes 2 and 3 start coding. |
| Saturday 20:45 | Everyone merges working steps into `staging`. Agree who does what at home. |
| Sunday 10:00 | Everyone merges. Test on the screen outside the judging room: picture, sound, microphone. |
| Sunday 11:30 | Freeze. Lane 1 merges `staging` into `main`. README and Devpost finished. |

## What we will demo
1. **Live pitch test (centrepiece):** the app listens to our own pitch to the judges, the board "steps out", then comes back as a video call and asks its questions aloud before the judges do.
2. **Report review:** a real thesis with highlighted comments from each assessor, a deliberation, a fix list and likely questions.
3. **The differentiator:** type what a lecturer said in a lecture under their profile, run again, and that assessor now asks about it.

Both sessions end in the same feedback report: a verdict, a rating against each marking criterion, and a ranked list of actions with the evidence behind each. The pitch version also covers delivery and how each question was answered.

All demo set-up is done through the app's own screens, so it can be done after the freeze.

## How this answers the Reply brief

| Reply asks for | What we show |
|---|---|
| A real university problem | The gap between the mark scheme and what the marker says they want |
| Specialised agent roles | The board of assessors |
| Real-time interaction | Live voiced Q&A |
| Session state and memory | Per-project remembered attempts, assessor points, criterion trends and action ticks; every later call receives earlier feedback, and the report shows Since last time |
| Guardrails and mode switching | One integrity pipeline checks input, routes intent, chooses an assessor mode, checks output and escalates; the report shows ordered mode shifts and counted events with reasons |
| Human-in-the-loop escalation | The board flags "take this to your supervisor" when it cannot agree or the point is outside its field |

## Figma prize
We must show in the presentation how we qualify. Lane 3 owns this:
- A real design system in Figma: variables, components and the key screens.
- The coded app uses the same variable names and matches the Figma screens.
- Designed AI states: reading, deliberating, speaking, listening, failed, empty.
- One consistent set of pen-drawn assessor avatars, and a single highlight colour used sparingly.
- Each illustrated avatar has a realistic counterpart that appears when the board joins the live call.
- The Figma file linked in the README and shown for a few seconds in the pitch.

## Credits and usage

| Resource | Use it for | Rule |
|---|---|---|
| Anthropic, $50 each on separate accounts | The app's assessors | The deployed site uses Lane 3's key, since that lane spends least on development. Keep $25 or more on it for rehearsal and judging. |
| Your coding agent | Building | Use a mid-tier model at medium effort. Use the top model only when stuck on a hard bug. One step per session. |
| Codex | Building | Give it the mechanical steps (seed data, README, simple forms) to spread the load. |
| ElevenLabs Creator | Assessor voices | Claim tonight. Text-only while developing; switch voices on for testing and the demo. |
| fal, $25 each | Realistic portraits and short clips of the assessors for the live call (the pen avatars are already drawn) | Generate once, save the files in the repo. Test one clip before making the rest. |
| Figma | Design system | Lane 3. |
| Supabase and Vercel free tiers | Database and hosting | One shared project each. |

App model settings, in `src/config`:
- Developing: `claude-haiku-5-5`.
- Rehearsal and judging: `claude-opus-5-5` for reviews. For the live pitch questions, time `claude-opus-5-5` against `claude-sonnet-5-5` on Sunday and keep whichever answers within about 15 seconds.
- Full six-assessor runs on the top model happen only at checkpoints.

## Data shapes (the shared contract)
Lane 1 defines these once in `src/lib/schemas`. Everyone builds against them. Only Lane 1 changes them, and announces it.

- **Profile:** id, name, university, course, level.
- **Assessor:** id, name, field, role (one line), personality, harshness (1–5), focusAreas (list), avatar (illustrated), portrait (realistic, optional), idleClip and talkingClip (optional), voiceId, isPreset, basedOn (optional id).
- **AssessorNote:** id, assessorId, text, source (lecture, handbook, other), createdAt.
- **Board:** id, name, assessorIds.
- **Project:** id, memory (BoardMemory, defaults to no attempts), title, template (masters-report, lab-report, pitch), brief (what it is, topic, what is graded, goal), deadline (optional), markSchemeText, weakSpots, boardId.
- **BoardMemory:** attempts (oldest first, capped at 30); each attempt has sessionId, replySource (claude/sample; legacy attempts default to sample), kind, at, title, verdict, raised (assessorId and points), actions (id, what, done, raisedBy), and criteria (criterion and strong/adequate/weak rating). Prompt context uses the last three earlier attempts and excludes the current session. Saved on session completion and updated when an action is ticked. Sample attempts are labelled and excluded from real-Claude comparisons. Without a database this memory is temporary and labelled sample data.
- **GuardrailEvent:** rule (reviewer-instruction, rewriting, grade-prediction, unobservable-delivery, unsupplied-citation, instruction-disclosure), stage (input/output), action (ignored/dropped/trimmed), location, reason and count. Never contains the ignored text. Server records add id, sessionId and createdAt in engine_events; parallel assessor events are appended independently.
- **Document:** id, projectId, title, paragraphs (list of id such as "p1", and text).
- **Comment:** id, assessorId, paragraphId, quote (optional exact words from that paragraph), category, severity (praise, minor, major), text, suggestion.
- **Review:** id, projectId, documentId, createdAt, status, assessorResults (list of assessorId, status, comments), deliberation, report (a FeedbackReport).
- **Deliberation:** summary, agreements, disagreements (topic, each assessor's view, advice).
- **PitchSession:** id, projectId, transcript, startedAt, endedAt, qa (mode, struggle count, turns with assessments/modes/timings, escalations), settings (questionCount 1–5, spoken or text), questions (id, assessorId, text, reason, answerTranscript, followUp), report (a FeedbackReport).
- **FeedbackReport** (the same form closes both a report review and a pitch):
  - kind (report or pitch) and verdict (two or three sentences).
  - criteria: each marking criterion from the mark scheme, a rating of strong, adequate or weak, and the evidence for it.
  - strengths: what to keep.
  - actions, ranked: what to do, why it matters, which assessors raised it, the evidence (paragraph ids or a transcript quote), and effort (quick, moderate, substantial).
  - assessorVerdicts: one line from each assessor.
  - escalations: reason and who to ask.
  - sinceLastTime, optional: improved and raisedAgain points from the board; stillOpen from the previous attempt's unticked actions, calculated in code.
  - behavior, optional for older reports: modeShifts (turnId, mode, reason, in order) and guardrailEvents. Modes: pressing, probing, coaching, steering, holding-the-line, paused. The router returns answerQuality and studentIntent; code chooses the mode. Clear direct-request rules override classification; ordinary mentions of trigger phrases do not. Exam conditions use probing instead of coaching. Multiple output boundary removals add a human escalation.
  - Report only: likelyQuestions (assessorId, question).
  - Pitch only: delivery (length, words per minute, notes on structure and clarity) and questionReview (for each question: how well it was answered, and strongerAnswer, a list of points a stronger answer would cover, with no copyable wording).
- **CallLog:** id, kind, model, startedAt, durationMs, inputTokens, outputTokens, ok, error.

## Style variable names (shared with Figma)
The names and values are set by the design system: [`design/DESIGN_SYSTEM.md`](../../design/DESIGN_SYSTEM.md), §3 (colour), §4 (type) and §5 (shape, line and space). Figma and code use those names exactly, for example `--ink`, `--paper`, `--orange` and the `--grey-*` scale.

There is one highlight colour. Assessors do not get a colour each, and there are no red, amber or green states: levels are shown as rows of dots (design system §9).

## Seeded content
- **Report board:** Module Lead, Methodologist, Literature Hawk, Communicator, Outsider, Sceptic.
- **Pitch judges board:** Technical Judge, Education Lead, Investor, Design Judge.
- **Templates:** master's report, lab report, hackathon pitch (judging criteria go in as the mark scheme).

## Submission checklist (Sunday 11:30)
- [ ] `staging` merged into `main`, demo site working.
- [ ] README: the problem, what we built, how it works, and every API, model and library used.
- [ ] Figma file linked in the README.
- [ ] No keys, thesis, mark scheme or lecturer notes anywhere in the repo history.
- [ ] Devpost entry submitted with the repo link.
- [ ] Pitch project, judges board and question count set up through the app.
- [ ] Fallbacks ready: saved rehearsal transcript, phone hotspot, question text shown on screen.
