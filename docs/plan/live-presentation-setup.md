# Live presentation mode: what's in place and what's left

Goal: in presentation practice, the board **watches you present as looping video**, steps out, then comes back as a **live Synthesia avatar** that asks Claude's questions aloud in your own voices, with lip sync.

Written Sunday 15 Nov after reading `lane3/final` (the newest code; nothing has been merged into `staging` since 04:25). **Freeze 11:30.** Ownership: the pitch flow, voice code, API routes, schemas and config are **Lane 1's** (`src/features/pitch`, `src/lib/voice`, `src/app/api/*`, `src/lib/schemas`, `src/config`). Clips, drawings and call-stage design are Lane 3's.

---

## 1. How it fits together (own LLM, own voice)

```
Browser (Panel pitch screen)                Next.js server (Panel)                 Python agent (new)          Synthesia
────────────────────────────                ──────────────────────                 ──────────────────          ─────────
present → speech-to-text in browser  ──►    Claude writes the question (exists)
                                     ◄──    question text
join LiveKit room (token from server) ──►   /api/live/token mints token,  ──────►  joins room as a puppet
"say this as <judge>" (LiveKit RPC)  ───────────────────────────────────────────►  swap_avatar(judge)
                                                                                    ElevenLabs TTS (own voice) ──► lip-synced
◄──────────────────────────────── avatar video + audio tracks ◄───────────────────────────────────────────────── avatar video
answer → speech-to-text in browser   ──►    Claude routes the answer, next question (exists)
```

- **Your LLM stays Claude, in the app.** Lane 1's engine already writes each question and follow-up (`src/features/pitch/actions.ts`). The agent needs **no LLM and no speech-to-text**: it only says the text it's given.
- **Your voice:** the agent's text-to-speech is ElevenLabs (via the LiveKit ElevenLabs plugin), one voice per judge. Synthesia only animates the face to that audio.
- **One live avatar at a time.** One Synthesia session holds up to 5 avatars and switches with `swap_avatar(id)`. The speaking judge is live; the others play their looping clips. This also fits the free plan's limit of 1 concurrent session.
- **The Synthesia plugin is Python only** (Synthesia's FAQ: Python LiveKit Agents only for now), so the agent is a small Python program running beside the app. On demo day it can run on your laptop.

---

## 2. Already in place

| Piece | Where | State |
|---|---|---|
| Pitch flow: setup → listening (live transcript) → board steps out → Q&A call → feedback report | `src/features/pitch/PitchFlow.tsx`, `components/*` (Lane 1) | Works |
| Claude writes questions, routes answers, writes the report | `src/lib/engine`, `src/features/pitch/actions.ts` (Lane 1) | Works, **but no Claude key is set locally**, so it uses sample replies |
| Speaking with ElevenLabs, browser voice as fallback; loudness for the speaking ring | `src/lib/voice/useSpeaker.ts`, `src/app/api/voice/route.ts` (Lane 1) | Built, **switched off** (`features.elevenLabs: false`); assessors have no `voiceId` |
| Call stage that plays `talkingClip` / `idleClip`, else `portrait`, else the drawing | `src/features/pitch/components/CallStage.tsx` (Lane 1) | Works; no assessor has clips yet |
| Keys | `AIHack\lane3\.env.local` | Synthesia ✓, LiveKit ✓, fal ✓. **Anthropic ✗, ElevenLabs ✗** |
| Synthesia avatars: video and interactive IDs | `design/synthesia/avatars.json` | Ezra Cole, Hana Ito, Helen Leane, Martin Stevens ✓ |
| Looping clips | `C:\Users\josep\Documents\AI_hackathon\AIHack\AVATAR_VIDEOS\<Name>\*.mp4` | 14 listening and reaction clips, 1080p, about 3 MB each. **Outside the repo**; no talking clips (not needed if live works) |

---

## 3. What's left, in build order

### A. Decisions (you, 5 minutes)
1. **Who are Helen Leane and Martin Stevens?** The pitch-judges board in the app is Ezra Cole, Hana Ito, **Tom Achebe** and **Mira Santos**. Either rename those two seeded assessors to Helen and Martin (with new drawings), or seat Helen and Martin as new assessors. The seed data is in `fixtures/home-sample.ts` and `supabase/seed.ts`.
2. **Which clip per person** is the "listening" loop. Suggested: `*-listening-loop-*` for listening, `*-silent-listening-*` for idle between questions, `*reaction*` unused for now.

### B. Keys and switches (you, 5 minutes)
Add to `.env.local`, which stays out of git:
```
ANTHROPIC_API_KEY=...        # real questions instead of samples
ELEVENLABS_API_KEY=...       # your voices
```
- Then set `features.elevenLabs: true` in `src/config/index.ts` (Lane 1).
- Pick one ElevenLabs **voice ID per judge**, and set each assessor's `voiceId` in the seed.
- Confirm in the Synthesia dashboard that your API key's plan **includes Interactive Avatars**. Otherwise the agent fails with `FEATURE_NOT_IN_PLAN`.

### C. Looping clips into the app (Lane 3, about 20 minutes)
1. Copy one listening loop and one idle loop per judge into the repo:
   `public/avatars/real/<assessorId>/listen.mp4` and `idle.mp4`, plus `poster.jpg` (frame 0).
   They're about 3 MB each, which is fine. Leave the duplicates (`(1).mp4`) and the other revisions behind.
2. Set each judge's `idleClip` and `portrait` in the seed (the Assessor fields already exist).
3. **While you present:** `Listening.tsx` shows `BoardRow` with the drawings. Change `BoardRow` to play each judge's `listen.mp4` muted on a loop (with the drawing as fallback). That's Lane 1's file, so agree it with them.
4. Clips are muted, `playsInline`, `loop`, `preload="auto"`. For seamless loops, ping-pong them, or check that the clip's first and last frames match.

### D. The live avatar (Lane 1 + new agent, about 2 hours)
1. **Python agent** (new folder `agent/`, Python 3.10+):
   - `pip install "livekit-agents[synthesia,elevenlabs]~=1.8"`
   - `AgentSession(tts=elevenlabs.TTS(voice_id=...))`, with **no LLM, no STT, no turn detection**.
   - `synthesia.AvatarSession(synthesia.AvatarConfig(avatar_ids=[the 4 interactive IDs]))`, then `await avatar.start(session, room=ctx.room)` **before** `session.start(...)`.
   - Register an RPC method, e.g. `say`, taking `{ interactiveId, voiceId, text }`. It calls `swap_avatar(interactiveId)`, switches the TTS voice, `await session.say(text)`, then replies "done" so the browser knows when to listen for the answer.
   - Run it with `python agent.py dev` using the same `LIVEKIT_*` and `SYNTHESIA_API_KEY` from `.env.local`.
2. **Token route** `src/app/api/live/token/route.ts` (Lane 1):
   - `npm i livekit-server-sdk`
   - creates a room per pitch session, dispatches the agent by name, and returns a browser token.
   - Server only: secrets never reach the browser.
3. **Browser** (Lane 1, `QandA.tsx` and `CallStage.tsx`):
   - `npm i livekit-client`
   - On entering Q&A, join the room with `adaptiveStream: false` (otherwise the video goes soft).
   - Subscribe to the avatar participant (`synthesia-avatar-agent` by default) and attach its **video track to the speaking judge's tile** and its **audio track** to an `<audio>` element.
   - Replace `speaker.say(...)` with `room.localParticipant.performRpc({ destinationIdentity: <agent>, method: "say", payload })`, and resolve when it returns.
   - Take loudness from the avatar audio track (the same analyser idea as `useSpeaker`).
4. **Switch and fallback:**
   - Add `features.liveAvatar` in `src/config`.
   - If the room, token or RPC fails, or the agent isn't running, fall back to the existing path: ElevenLabs or the browser voice, with the judge's idle clip. **The demo must work with the agent off.**

### E. Line drawings for the new faces (Lane 3, if time)
Use the fal prompt in `design/synthesia/AVATAR_PROMPTS.md` §7 to turn each poster frame into a pen drawing. This is needed for Helen and Martin (who have no drawing), and for the line-to-video reveal.

---

## 4. Costs, limits and risks
- **Synthesia live:** 10 credits a minute (about $0.10). Free plan: 1 concurrent session, so 1 live judge at a time (by design).
- **Avatar IDs** the workspace can't access raise `UNKNOWN_AVATAR`; test each ID once.
- **Latency:** each question goes Claude → text → ElevenLabs → avatar. Time it on Sunday (the plan already says to keep whichever model answers within about 15 seconds).
- **Network in the judging room:** LiveKit needs a stable connection; have the phone hotspot ready, and keep the fallback switch.
- **Time:** D is about 2 hours of focused work for Lane 1 before an 11:30 freeze. If it isn't working by about 10:45, ship B + C (real questions, your voices, looping clips) and show live in the pitch only if it's stable.

---

## 5. Test plan
1. Agent running, then open `/pitch`, choose "Pitch judges", and present for 20 seconds. Tiles play their listening loops.
2. "Thank you" + pause → the board steps out → the first question is spoken by the live avatar, lip-synced, in the speaking tile.
3. Answer aloud → Next → the follow-up comes from a different judge (avatar swap).
4. Stop the agent mid-call → the next question falls back to ElevenLabs with the idle clip, and the call doesn't stall.
5. End Q&A → feedback report.

Sources:
- Synthesia plugin: https://docs.livekit.io/agents/models/avatar/plugins/synthesia
- Plugin reference: https://developers.synthesia.io/docs/ia-livekit-plugin-reference
- Limits and pricing: https://developers.synthesia.io/docs/ia-operational-trust
- Python module: https://docs.livekit.io/reference/python/livekit/plugins/synthesia/
