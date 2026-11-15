// Mints a browser token for one live pitch call and dispatches the board
// agent into that room. LiveKit secrets stay here on the server. With the
// switch off, it answers 503 and the call uses the ordinary voice path.
import { NextResponse } from "next/server";
import { AccessToken, RoomAgentDispatch, RoomConfiguration } from "livekit-server-sdk";
import { hasLiveAvatar, LIVE_AGENT_NAME } from "@/lib/live/config";

export async function POST() {
  if (!hasLiveAvatar()) return NextResponse.json({ fallback: true }, { status: 503 });
  try {
    const room = `panel-${crypto.randomUUID().slice(0, 8)}`;
    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, { identity: "student", ttl: "30m" });
    at.addGrant({ roomJoin: true, room, canPublish: false, canSubscribe: true, canPublishData: true });
    at.roomConfig = new RoomConfiguration({ agents: [new RoomAgentDispatch({ agentName: LIVE_AGENT_NAME })] });
    return NextResponse.json({ url: process.env.LIVEKIT_URL, token: await at.toJwt(), room }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ fallback: true }, { status: 503 });
  }
}
