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
