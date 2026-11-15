# Live board agent (optional)

A puppet: it speaks the text the app sends it, as a Synthesia avatar. No LLM, no speech-to-text.
The app works without it; with `LIVE_AVATAR` unset nothing here is used.

```
python3.11 -m venv agent/.venv
agent/.venv/bin/pip install -r agent/requirements.txt
agent/.venv/bin/python agent/agent.py dev      # reads ../.env.local
```

Needs `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `SYNTHESIA_API_KEY` in `.env.local`,
and `LIVE_AVATAR=1` for the Next.js server. Speech uses LiveKit Inference (Cartesia), so no
ElevenLabs key is needed. The avatar takes about 30 s to join; the browser connects when the
student starts presenting. If anything fails, the call uses the ordinary voice.
