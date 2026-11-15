# Real Claude verification, 15 November 2026

`real-review.json` and `real-pitch.json` are genuine Claude outputs on invented,
publishable content. They record the initial run, before the fixes found by
that run. They are evidence for diagnosis, not guaranteed-safe display fixtures.
The normal app continues to label sample replies separately.

- Six report assessors: all returned 5–6 valid anchored comments. Calls took
  9.4–11.4 seconds in parallel. Deliberation took 60.8 seconds.
- Pitch finish to first question: 3,009 ms, excluding speech synthesis/playback.
- Answer submission to next question: 5,150 / 3,439 / 2,601 / 2,842 ms.
- Full server-side review and typed pitch/Q&A/report completed on Claude.
- Supabase is unconfigured; migrations, seed and persistent storage unverified.
- Native Chrome opened Panel but page accessibility content and screenshots
  were unavailable. Browser flow, microphone, voice playback and visual QA
  remain manual checks. These are server timings, not perceived audio latency.

Quality: comments identify concrete omissions (sample-size rationale,
randomisation, attrition, calibration). Some infer an active-ulcer population
not stated in the excerpt; the initial report has too many actions. Questions
are specific and challenge the evidence, but a repeated ordinary answer was
misclassified as asking for an answer. Stronger-answer outlines are guidance,
though they need the Part C boundary checks and point form.

Fixes: only direct requests force word-pattern overrides; router prompt
explicitly distinguishes ordinary/repeated answers from requests for answers.
A real three-answer router regression passed, including the supplied trigger
phrase example. Report prompts now include every routed turn, prohibit factual
assumptions from omissions, and consolidate review actions to at most six.
The first outputs are retained so their limitations remain inspectable.

Opt-in reruns (will spend API credit, uses `.env.local` without printing it):

```
PANEL_VERIFY_LIVE=1 npm test -- src/lib/engine/live-verification.test.ts
PANEL_VERIFY_LIVE=1 npm test -- src/lib/engine/live-router.test.ts
```

## Guarded rerun (Part C)

`guarded-real-review.json` and `guarded-real-pitch.json` record another real run
through the shared integrity pipeline. All six assessors returned usable
comments; the review consolidated its actions to six. Pitch guidance is now
stored as lists of points. The final report discusses the follow-up questions.
No boundary events fired on this benign content; injected failures and ignored
reviewer text are covered separately by `pipeline.test.ts`.

- Pitch finish to first question: 2,271 ms.
- Answer to next question: 2,535 / 2,734 / 3,723 / 2,475 ms.
- Review deliberation remains slow: 63.3 seconds. This does not affect live Q&A
  but the review needs its deliberating state throughout the wait.
- Router intents remained `answering` for the repeated ordinary answer.
- Boundary checks use conservative patterns plus prompt rules, not a guarantee
  against every semantic paraphrase. No-key fallback, microphone, voice,
  browser visual QA and the unconfigured database retain the limits above.

Guarded rerun:

```
PANEL_VERIFY_LIVE=1 PANEL_VERIFY_GUARDS=1 npm test -- src/lib/engine/live-verification.test.ts
```
