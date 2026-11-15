"""Panel's live board: a puppet, not an assistant.

Claude (in the Next.js app) writes every question. This agent only says the
text it is given, through one Synthesia avatar that swaps between the judges.
No LLM, no speech-to-text, no personality.

RPC "say"  {interactiveId, voiceId, text} -> swap avatar, speak, reply "done"
RPC "stop" {}                             -> cut the current line short

Run:  agent/.venv/bin/python agent/agent.py dev   (reads ../.env.local)
"""

import asyncio
import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import Agent, AgentServer, AgentSession, inference, room_io
from livekit.plugins import synthesia

load_dotenv(Path(__file__).resolve().parent.parent / ".env.local")
log = logging.getLogger("panel-board")

AGENT_NAME = "panel-board"
AVATARS = json.loads((Path(__file__).resolve().parent.parent / "design/synthesia/avatars.json").read_text())["avatars"]
AVATAR_IDS = [a["interactiveId"] for a in AVATARS if a.get("interactiveId")]
DEFAULT_VOICE = os.environ.get("LIVE_DEFAULT_VOICE", "a167e0f3-df7e-4d52-a9c3-f949145efdab")
TTS_MODEL = "cartesia/sonic-3"

server = AgentServer()


@server.rtc_session(agent_name=AGENT_NAME)
async def board(ctx: agents.JobContext) -> None:
    await ctx.connect()
    tts = inference.TTS(model=TTS_MODEL, voice=DEFAULT_VOICE, language="en")
    session = AgentSession(tts=tts)
    avatar = synthesia.AvatarSession(synthesia.AvatarConfig(avatar_ids=AVATAR_IDS), join_timeout=90.0)
    try:
        await avatar.start(session, room=ctx.room)
    except synthesia.SynthesiaError as e:
        log.error("avatar failed to start: type=%s status=%s", getattr(e, "type", None), getattr(e, "status", None))
        await ctx.room.local_participant.set_attributes({"panel": "failed", "panel.error": str(getattr(e, "type", "error"))})
        return
    await session.start(
        agent=Agent(instructions="Say only the exact text you are given."),
        room=ctx.room,
        room_options=room_io.RoomOptions(audio_input=False, text_input=False),
    )

    active = {"id": AVATAR_IDS[0]}
    lock = asyncio.Lock()
    current: dict = {"handle": None}

    async def say(data: rtc.RpcInvocationData) -> str:
        req = json.loads(data.payload or "{}")
        text = str(req.get("text", "")).strip()
        target = req.get("interactiveId")
        voice = req.get("voiceId") or DEFAULT_VOICE
        if not text:
            return "done"
        async with lock:
            if target and target in AVATAR_IDS and target != active["id"]:
                await avatar.swap_avatar(target)
                active["id"] = target
            tts.update_options(voice=voice)
            handle = session.say(text, allow_interruptions=True)
            current["handle"] = handle
            await handle.wait_for_playout()
            current["handle"] = None
        return "done"

    async def stop(_: rtc.RpcInvocationData) -> str:
        h = current["handle"]
        if h is not None:
            h.interrupt()
        return "ok"

    ctx.room.local_participant.register_rpc_method("say", say)
    ctx.room.local_participant.register_rpc_method("stop", stop)
    await ctx.room.local_participant.set_attributes({"panel": "ready"})
    log.info("board ready with %d avatars", len(AVATAR_IDS))


if __name__ == "__main__":
    agents.cli.run_app(server)
