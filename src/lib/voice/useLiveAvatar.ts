"use client";

// The live board (Synthesia avatar via LiveKit). The agent in agent/ is a
// puppet: it says the text Claude already wrote. Every failure resolves to
// `false` so the caller falls back to the ordinary voice; nothing here can
// stall the call.
import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track, type RemoteParticipant, type RemoteTrack } from "livekit-client";

const AVATAR_IDENTITY = "synthesia-avatar-agent";
const SAY_TIMEOUT_MS = 60_000;

export function useLiveAvatar(enabled: boolean) {
  const roomRef = useRef<Room | null>(null);
  const boardRef = useRef<string | null>(null);
  const audioElRef = useRef<HTMLMediaElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const mutedRef = useRef(false);
  const [active, setActive] = useState(false);
  const [boardReady, setBoardReady] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [loudness, setLoudness] = useState(0);

  const ready = boardReady && stream !== null;

  const teardownAudio = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    void ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    audioElRef.current?.remove();
    audioElRef.current = null;
  };

  const disconnect = useCallback(() => {
    const room = roomRef.current;
    roomRef.current = null;
    boardRef.current = null;
    setActive(false);
    setBoardReady(false);
    setStream(null);
    setSpeaking(false);
    teardownAudio();
    void room?.disconnect().catch(() => {});
  }, []);

  const connect = useCallback(async () => {
    if (!enabled || roomRef.current) return;
    const room = new Room({ adaptiveStream: false, dynacast: false });
    roomRef.current = room;
    setActive(true);
    try {
      const res = await fetch("/api/live/token", { method: "POST" });
      if (!res.ok) throw new Error("no token");
      const { url, token } = (await res.json()) as { url: string; token: string };
      // A newer connect (or a disconnect) replaced this room while we waited: drop it.
      if (roomRef.current !== room) return;
      const mine = () => roomRef.current === room;

      const checkBoard = (p: RemoteParticipant) => {
        if (!mine()) return;
        const state = p.attributes?.panel;
        if (state === "ready") {
          boardRef.current = p.identity;
          setBoardReady(true);
        } else if (state === "failed") disconnect();
      };
      room.on(RoomEvent.ParticipantConnected, checkBoard);
      room.on(RoomEvent.ParticipantAttributesChanged, (_changed, p) => {
        if (p !== room.localParticipant) checkBoard(p as RemoteParticipant);
      });
      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub, p: RemoteParticipant) => {
        if (!mine() || p.identity !== AVATAR_IDENTITY) return;
        if (track.kind === Track.Kind.Video) setStream(new MediaStream([track.mediaStreamTrack]));
        if (track.kind === Track.Kind.Audio) {
          teardownAudio();
          const el = track.attach();
          el.muted = mutedRef.current;
          el.style.display = "none";
          document.body.appendChild(el);
          audioElRef.current = el;
          try {
            const ctx = new AudioContext();
            ctxRef.current = ctx;
            void ctx.resume().catch(() => {});
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            ctx.createMediaStreamSource(new MediaStream([track.mediaStreamTrack])).connect(analyser);
            const buf = new Uint8Array(analyser.fftSize);
            const tick = () => {
              analyser.getByteTimeDomainData(buf);
              let sum = 0;
              for (const v of buf) sum += ((v - 128) / 128) ** 2;
              setLoudness(Math.min(1, Math.sqrt(sum / buf.length) * 4));
              rafRef.current = requestAnimationFrame(tick);
            };
            tick();
          } catch {
            // Loudness is decoration; the voice still plays.
          }
        }
      });
      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, _pub, p: RemoteParticipant) => {
        if (!mine() || p.identity !== AVATAR_IDENTITY) return;
        if (track.kind === Track.Kind.Video) setStream(null);
        track.detach();
      });
      room.on(RoomEvent.ParticipantDisconnected, (p) => {
        if (!mine()) return;
        if (p.identity === AVATAR_IDENTITY) setStream(null);
        if (p.identity === boardRef.current) {
          boardRef.current = null;
          setBoardReady(false);
        }
      });
      room.on(RoomEvent.Disconnected, () => {
        if (roomRef.current === room) disconnect();
      });

      await room.connect(url, token, { autoSubscribe: true });
      if (!mine()) {
        void room.disconnect().catch(() => {});
        return;
      }
      room.remoteParticipants.forEach(checkBoard);
    } catch {
      if (roomRef.current === room) disconnect();
    }
  }, [enabled, disconnect]);

  /** Speak through the live avatar. Resolves true when said, false to fall back. */
  const say = useCallback(async (interactiveId: string | null | undefined, text: string, voiceId?: string | null): Promise<boolean> => {
    const room = roomRef.current;
    const board = boardRef.current;
    if (!room || !board || !interactiveId) return false;
    setSpeaking(true);
    try {
      const reply = await room.localParticipant.performRpc({
        destinationIdentity: board,
        method: "say",
        payload: JSON.stringify({ interactiveId, voiceId: voiceId ?? null, text }),
        responseTimeout: SAY_TIMEOUT_MS,
      });
      return reply === "done";
    } catch {
      return false;
    } finally {
      setSpeaking(false);
      setLoudness(0);
    }
  }, []);

  const stop = useCallback(() => {
    const room = roomRef.current;
    const board = boardRef.current;
    if (!room || !board) return;
    void room.localParticipant.performRpc({ destinationIdentity: board, method: "stop", payload: "{}" }).catch(() => {});
  }, []);

  const setMuted = useCallback((m: boolean) => {
    mutedRef.current = m;
    if (audioElRef.current) audioElRef.current.muted = m;
  }, []);

  useEffect(() => () => disconnect(), [disconnect]);

  return { enabled, active, connect, disconnect, ready, stream, speaking, loudness, say, stop, setMuted };
}

export type LiveAvatar = ReturnType<typeof useLiveAvatar>;
