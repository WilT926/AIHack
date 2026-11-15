"use client";

// The board's questions as a video call (lane-1.md step 1.4), routed turn by
// turn: each utterance is said aloud (or shown in writing), the answer is
// heard live, then the server's router reads the answer, code picks a mode,
// and the board's next utterance comes back in that mode. A pause stops the
// questions and points to a person. "End Q&A" works at any point.
import { useCallback, useEffect, useRef, useState } from "react";
import { Label, TextArea } from "@/components/ui";
import type { PitchSession, QaMode, QaTurn } from "@/lib/schemas";
import { joinTranscript } from "@/lib/voice/transcript";
import { recognitionErrorText, useSpeechRecognition } from "@/lib/voice/useSpeechRecognition";
import { useSpeaker } from "@/lib/voice/useSpeaker";
import { OPENING_LINE } from "@/lib/voice/tone";
import type { LiveAvatar } from "@/lib/voice/useLiveAvatar";
import { submitAnswer } from "../actions";
import type { PitchSeat } from "../types";
import { CallStage, type TileState } from "./CallStage";

type Step = "waiting" | "asking" | "answering" | "thinking" | "paused";

export const MODE_LABEL: Record<QaMode, string> = {
  pressing: "Pressing",
  probing: "Probing",
  coaching: "Coaching",
  steering: "Steering",
  "holding-the-line": "Holding the line",
  paused: "Paused",
};

export function QandA({
  session,
  seats,
  initials,
  elevenLabs,
  live = null,
  canListen,
  onSession,
  onEnd,
}: {
  session: PitchSession;
  seats: PitchSeat[];
  initials: string;
  elevenLabs: boolean;
  /** The live board, when LIVE_AVATAR=1. Any failure falls back to `speaker`. */
  live?: LiveAvatar | null;
  canListen: boolean;
  onSession: (s: PitchSession) => void;
  onEnd: () => void;
}) {
  const tone = session.settings.conditions === "exam" ? "exam" : "coaching";
  const speaker = useSpeaker({ useElevenLabs: elevenLabs, tone });
  /** The opening line is said once, before the first question. */
  const openedRef = useRef(false);
  const rec = useSpeechRecognition();
  const spoken = session.settings.mode === "spoken";

  const turns = session.qa.turns;
  const [turn, setTurn] = useState<QaTurn | undefined>(() => turns.findLast((t) => t.answer == null));
  const [step, setStep] = useState<Step>("waiting");
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [liveSeat, setLiveSeat] = useState<string | null>(null);
  const endedRef = useRef(false);

  const asker = seats.find((s) => s.id === turn?.assessorId);
  const plannedIndex = Math.max(0, session.questions.findIndex((q) => q.id === turn?.questionId));

  /** Say this turn in the asker's voice (or show it), then listen for the answer. */
  const deliver = useCallback(
    async (t: QaTurn) => {
      setTurn(t);
      setStep("asking");
      rec.reset();
      setTyped("");
      const seat = seats.find((s) => s.id === t.assessorId);
      if (spoken && seat) {
        /** Say a line in this assessor's voice: the live avatar if it is up, else ElevenLabs or the browser. */
        const sayLine = async (text: string) => {
          let said = false;
          if (live?.ready && seat.interactiveId) {
            setLiveSeat(seat.id);
            said = await live.say(seat.interactiveId, text, seat.liveVoiceId);
            setLiveSeat(null);
          }
          if (!said && !endedRef.current) await speaker.say(seat.id, text, seat.voiceIndex);
        };
        // Coaching and exam open differently, and sound different (src/lib/voice/tone.ts).
        if (!openedRef.current) {
          openedRef.current = true;
          await sayLine(OPENING_LINE[tone]);
        }
        if (!endedRef.current) await sayLine(t.text);
      }
      if (endedRef.current) return;
      if (t.kind === "pause") {
        setStep("paused");
        return;
      }
      setStep("answering");
      if (canListen) rec.start();
    },
    [rec, seats, speaker, spoken, canListen, live, tone],
  );

  // The board comes back: a short pause, then the opening question.
  useEffect(() => {
    const first = turns.findLast((t) => t.answer == null);
    const t = setTimeout(() => first && void deliver(first), 700);
    return () => clearTimeout(t);
    // Only once, when the call starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const takeAnswerText = useCallback(() => (canListen ? rec.stop() : typed.trim()), [canListen, rec, typed]);

  const next = useCallback(async () => {
    if (!turn) return;
    if (step === "asking") {
      speaker.stop(); // skip the rest and answer now
      live?.stop();
      return;
    }
    if (step !== "answering") return;
    const answer = takeAnswerText();
    setStep("thinking");
    setError(null);
    const res = await submitAnswer(session.id, answer);
    if (endedRef.current) return;
    if (!res.ok) {
      setError(res.error);
      setStep("answering");
      if (canListen) {
        rec.reset(answer);
        rec.start();
      } else setTyped(answer);
      return;
    }
    onSession(res.value.session);
    if (res.value.next) void deliver(res.value.next);
    else onEnd();
  }, [turn, step, speaker, live, takeAnswerText, session.id, canListen, rec, onSession, deliver, onEnd]);

  const end = useCallback(async () => {
    endedRef.current = true;
    speaker.stop();
    live?.stop();
    const answer = step === "answering" ? takeAnswerText() : "";
    if (answer) {
      const res = await submitAnswer(session.id, answer);
      if (res.ok) onSession(res.value.session);
    } else if (rec.listening) rec.stop();
    onEnd();
  }, [speaker, live, step, takeAnswerText, session.id, onSession, rec, onEnd]);

  const states: Record<string, TileState> = {};
  if (asker) states[asker.id] = step === "asking" ? "speaking" : step === "thinking" ? "thinking" : step === "waiting" || step === "paused" ? "idle" : "listening";
  const answering = step === "answering";
  const modeLabel = turn ? (turn.mode ? MODE_LABEL[turn.mode] : "Opening question") : null;
  const nextLabel = step === "asking" ? "Answer now" : step === "thinking" ? "Thinking" : step === "paused" ? "Paused" : "Next";

  return (
    <div className="ps-qa">
      <div className="ps-qa__count">
        <Label>
          Question {plannedIndex + 1} of {session.questions.length}
          {turn && turn.kind !== "question" ? ` · ${turn.kind.replace("-", " ")}` : ""}
          {session.settings.conditions === "exam" ? " · exam conditions" : ""}
        </Label>
        {liveSeat && spoken ? <Label size="sm">Voice: live avatar</Label> : speaker.source && spoken && <Label size="sm">{speaker.source === "elevenlabs" ? "Voice: ElevenLabs" : speaker.source === "browser" ? "Voice: browser" : "Caption only"}</Label>}
      </div>

      <CallStage
        seats={seats}
        speakerId={asker?.id ?? null}
        states={states}
        modeLabel={step === "waiting" ? null : modeLabel}
        loudness={liveSeat && live ? live.loudness : speaker.loudness}
        live={liveSeat && live?.stream ? { seatId: liveSeat, stream: live.stream } : null}
        caption={step === "waiting" ? null : (turn?.text ?? null)}
        presenter={{ initials, answering }}
        controls={{
          muted: speaker.muted,
          onMute: () => {
            live?.setMuted(!speaker.muted);
            speaker.toggleMute();
          },
          onNext: () => void next(),
          nextLabel,
          nextDisabled: step === "thinking" || step === "waiting" || step === "paused",
          onEnd: () => void end(),
          endDisabled: false,
        }}
      />

      {answering && (
        <div className="ps-answer" aria-live="polite">
          {canListen ? (
            <>
              <span className="ps-status">
                <span className="ps-status__dot" data-on={rec.listening} aria-hidden />
                <Label tone="ink">{rec.listening ? "Listening" : "Starting the microphone"}</Label>
              </span>
              <p className="ps-answer__text">{joinTranscript(rec.finalText, rec.interim) || "Answer aloud, then press Next."}</p>
            </>
          ) : (
            <TextArea id="ps-answer" label="Your answer" value={typed} rows={4} onChange={(e) => setTyped(e.target.value)} placeholder="Type your answer." />
          )}
        </div>
      )}

      {step === "paused" && (
        <p className="ui-empty" role="status">
          The board has paused the questions. Press End Q&amp;A to see your feedback; the pause is noted for a human to follow up.
        </p>
      )}

      {(error || rec.error) && (
        <p className="ps-error" role="alert">
          {error ?? (rec.error ? recognitionErrorText(rec.error) : "")}
        </p>
      )}
    </div>
  );
}
