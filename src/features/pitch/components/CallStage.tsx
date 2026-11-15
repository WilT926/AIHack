"use client";

// A plain call stage for the board's questions (DESIGN_SYSTEM §9 Call stage;
// Lane 3 step 3.2b will replace it). Same inputs as 3.2b: the board, who is
// speaking, the loudness, the caption and each tile's state. No calls here.
import { useEffect, useRef, useState } from "react";
import { Avatar, Button, Label, cn } from "@/components/ui";
import type { PitchSeat } from "../types";
import { LoopClip } from "./LoopClip";

export type TileState = "idle" | "speaking" | "listening" | "thinking";

const STATE_LABEL: Record<TileState, string | null> = { idle: null, speaking: "Speaking", listening: "Listening", thinking: "Thinking" };

function LiveFace({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <video ref={ref} className="ps-tile__media" autoPlay muted playsInline aria-hidden />;
}

function Face({ seat, speaking }: { seat: PitchSeat; speaking: boolean }) {
  const clip = (speaking && seat.talkingClip) || seat.idleClip;
  const drawing = seat.portrait ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="ps-tile__media" src={seat.portrait} alt="" />
  ) : (
    <Avatar avatar={seat.avatar} size="fill" className="ps-tile__avatar" />
  );
  return <LoopClip src={clip} className="ps-tile__media" fallback={drawing} />;
}

export function CallStage({
  seats,
  speakerId,
  states,
  modeLabel,
  loudness,
  caption,
  presenter,
  controls,
  live = null,
}: {
  seats: PitchSeat[];
  speakerId: string | null;
  states: Record<string, TileState>;
  /** The mode the speaking judge is in (router, Part A), shown under their tile. */
  modeLabel?: string | null;
  loudness: number;
  caption: string | null;
  presenter: { initials: string; answering: boolean };
  /** The live avatar's video, shown in this seat's tile while it speaks. */
  live?: { seatId: string; stream: MediaStream } | null;
  controls: {
    muted: boolean;
    onMute: () => void;
    onNext: () => void;
    nextLabel: string;
    nextDisabled: boolean;
    onEnd: () => void;
    endDisabled: boolean;
  };
}) {
  const [camera, setCamera] = useState<"off" | "on" | "refused">("off");
  const [cameraNote, setCameraNote] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const toggleCamera = async () => {
    if (camera === "on") {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCamera("off");
      return;
    }
    setCameraNote(true);
    try {
      // Shown on this screen only. Never recorded, never sent anywhere.
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setCamera("on");
    } catch {
      setCamera("refused");
    }
  };

  useEffect(() => {
    if (camera === "on" && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  }, [camera]);
  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  const speaker = seats.find((s) => s.id === speakerId);

  return (
    <section className="ps-call" aria-label="The board, as a video call">
      <div className="ps-stage" data-has-speaker={!!speaker}>
        {seats.map((s) => {
          const state = states[s.id] ?? "idle";
          const isSpeaker = s.id === speakerId;
          return (
            <article key={s.id} className={cn("ps-tile", isSpeaker && "ps-tile--speaker")} data-state={state} aria-label={`${s.name}, ${STATE_LABEL[state] ?? "listening quietly"}`}>
              <div className="ps-tile__face">
                {live?.seatId === s.id ? <LiveFace stream={live.stream} /> : <Face seat={s} speaking={state === "speaking"} />}
              </div>
              <div className="ps-tile__meta">
                <span className="ps-tile__name">{s.name}</span>
                <Label size="xs">{s.field}</Label>
                {isSpeaker && modeLabel && (
                  <Label size="xs" tone="ink" className="ps-tile__mode">
                    Mode · {modeLabel}
                  </Label>
                )}
              </div>
              {STATE_LABEL[state] && <Label size="xs" tone={state === "speaking" ? "orange" : "ink"} className="ps-tile__state">{STATE_LABEL[state]}</Label>}
              {state === "speaking" && (
                <i className="ps-tile__dot" style={{ transform: `scale(${1 + Math.min(1, loudness) * 0.8})` }} aria-hidden />
              )}
            </article>
          );
        })}
        <article className="ps-tile ps-tile--you" data-state={presenter.answering ? "speaking" : "idle"} aria-label="You">
          <div className="ps-tile__face">
            {camera === "on" ? (
              <video ref={videoRef} className="ps-tile__media ps-tile__media--mirror" autoPlay muted playsInline aria-label="Your camera, shown on this screen only" />
            ) : (
              <span className="ps-tile__initials">{presenter.initials}</span>
            )}
          </div>
          <div className="ps-tile__meta">
            <span className="ps-tile__name">You</span>
            <Label size="xs">{presenter.answering ? "Answering" : camera === "refused" ? "Camera blocked" : "Presenter"}</Label>
          </div>
        </article>
      </div>

      <div className="ps-caption" aria-live="polite">
        {caption && speaker && (
          <>
            <Label tone="quiet">{speaker.name}</Label>
            <p>{caption}</p>
          </>
        )}
      </div>

      {cameraNote && <p className="ps-note ps-call__note">Your camera is shown on this screen only. It is never recorded or sent anywhere.</p>}

      <div className="ps-controls" role="group" aria-label="Call controls">
        <Button variant="quiet" onClick={controls.onMute} aria-pressed={controls.muted}>
          {controls.muted ? "Unmute" : "Mute"}
        </Button>
        <Button variant="quiet" onClick={toggleCamera} aria-pressed={camera === "on"}>
          {camera === "on" ? "Camera off" : "Camera"}
        </Button>
        <Button variant="primary" onClick={controls.onNext} disabled={controls.nextDisabled}>
          {controls.nextLabel}
        </Button>
        <Button variant="secondary" onClick={controls.onEnd} disabled={controls.endDisabled}>
          End Q&amp;A
        </Button>
      </div>
    </section>
  );
}
