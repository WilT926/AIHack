import "server-only";
import avatars from "../../../design/synthesia/avatars.json";

/** Live avatar switch: LIVE_AVATAR=1 and LiveKit settings present. Off by default. */
export function hasLiveAvatar(): boolean {
  return (
    process.env.LIVE_AVATAR === "1" &&
    !!process.env.LIVEKIT_URL &&
    !!process.env.LIVEKIT_API_KEY &&
    !!process.env.LIVEKIT_API_SECRET
  );
}

/** The agent's name, as registered in agent/agent.py. */
export const LIVE_AGENT_NAME = "panel-board";

/** Synthesia interactive avatar for an assessor, if one was made for them. */
export function interactiveIdFor(assessorId: string): string | null {
  return avatars.avatars.find((a) => a.assessorId === assessorId)?.interactiveId ?? null;
}
