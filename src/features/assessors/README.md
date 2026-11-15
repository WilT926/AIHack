# Assessors and notes

`/assessors` groups the gallery by field. View a profile to see traits and manage
lecture/handbook/other notes. Copy a preset to rename it, change field, harshness,
focus areas and choose any of the 100 pen avatars. Copies inherit role and
personality, with an empty notes list. The floor sheet links to these profiles.

Server actions validate and save only through `src/lib/data`. A temporary-store
notice is visible when Supabase is unconfigured. The gallery and home counts are
revalidated after writes. Lecture transcripts are stored as lecture notes, capped
at 20,000 characters. Real lecturer notes must never be committed to this repo.

Hand check: copy Module Lead, rename it, pick avatar 100, add a lecture note,
edit its tag and text, delete it, then paste a transcript. Reopen the profile and
check the saved notes. Playwright MCP browser verification passed at 1440×900: copying, choosing
avatar 100 and four-dot harshness, adding a lecture note, editing its source
and text, deleting it, and saving/reopening a pasted lecture transcript.
The copy dialog was corrected to stay centred and scroll inside the viewport.
Gallery, profile and dialog screenshots were inspected against the mono
labels, pen avatars, dot levels and single orange highlight in §9.

Real Claude evidence: `fixtures/engine/real-note-intervention.json`. It uses only
an invented timetable-search report, invented assessor identity and the requested
synthetic note. The copied assessor did not mention safety before the note. After
the note it explicitly raised the lecture expectation; the other five assessors
did not mention safety. No mark scheme or private student material was supplied.

Rerun (spends API credit):

```
PANEL_VERIFY_LIVE=1 npm test -- src/lib/engine/live-notes.test.ts
```
