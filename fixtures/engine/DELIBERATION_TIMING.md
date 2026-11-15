# Deliberation timing and quality, 15 November 2026

All calls use Claude Haiku 5.5 through the existing structured-output caller.
The six-assessor comments are frozen from `guarded-real-review.json`; the
invented document, brief, criteria and board stay the same. All results are
validated and pass through the integrity pipeline before use. The prompt was
then tightened to remove repetition while preserving the same concerns.

| Run | Complete response | Output tokens | Thinking tokens | Approx. visible tokens |
|---|---:|---:|---:|---:|
| Original high effort, measured again | 60.2 s | 14,323 | 9,607 | 4,716 |
| Original prompt, medium | 28.2 s | 6,722 | 2,368 | 4,354 |
| Original prompt, low | 22.0 s | 5,057 | 1,578 | 3,479 |
| Concise prompt, medium | 30.6 s | 7,117 | 4,918 | 2,199 |
| Concise prompt, low | 16.5 s | 3,649 | 1,505 | 2,144 |
| Low + explicit clinical handoff | 17.1 s | 3,590 | 1,458 | 2,132 |
| Selected release prompt + deterministic handoff | 19.6 s | 4,353 | 2,056 | 2,297 |

The API accounts for effectively all the delay: local prompt assembly,
validation and integrity checks took about 14 ms. High effort spent roughly
two thirds of its output tokens thinking. The app now uses low effort and
compact synthesis instructions, keeping the complete document and comments.
No streaming or second model call was needed to reach about 20 seconds.

A Playwright MCP run through the actual UI with the four-assessor thesis board
returned `/api/engine/deliberate` in **20,418 ms**, including route/network time,
then displayed the board discussion and the shared feedback report. That run
used the concise prompt before the final source-attribution rule. Do not treat
these few observations as a production latency guarantee. Database latency and
Vercel cold starts remain unmeasured.

Quality checks and manual comparison:
- All three criteria, six assessor verdicts, six ranked actions with paragraph
  evidence and real board ids, and likely viva questions remain present.
- Actions cover sample-size rationale, threshold sensitivity, randomisation /
  carryover, ordinal analysis, missing data, calibration and writing.
- The initial low-effort answer omitted a useful writing action; the concise
  prompt now explicitly preserves it through consolidation.
- Different emphases are not fabricated into disagreements.
- Safety/ethics handoffs proved unstable across model repeats. Code now always
  adds a human handoff when non-praise assessor comments raise safety concerns
  in clinical material. Tests cover a model reply with an empty escalation list.
- A lecturer's preference must not be presented as a handbook requirement; the
  release prompt explicitly distinguishes those sources.
- All candidates and the selected output are saved alongside this note. No
  private student work, real lecture notes or keys were used.

Re-run the selected comparison (spends API credit):

```
PANEL_BENCHMARK_LIVE=1 PANEL_BENCHMARK_EFFORT=low PANEL_BENCHMARK_VARIANT=release npm test -- src/lib/engine/live-deliberation-benchmark.test.ts
```
