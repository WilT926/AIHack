"use client";

// The board's questions as a video call (lane-1.md step 1.4): each question
// is said aloud (or shown in writing), the answer is heard live, then the
// asking judge decides on one follow-up at most. "End Q&A" works at any point.
import { useCallback, useEffect, useRef, useState } from "react";
import { Label, TextArea } from "@/components/ui";
import type { PitchQuestion, PitchSession } from "@/lib/schemas";
import { joinTranscript } from "@/lib/voice/transcript";
import { recognitionErrorText, useSpeechRecognition } from "@/lib/voice/useSpeechRecognition";
import { useSpeaker } from "@/lib/voice/useSpeaker";
import { submitAnswer } from "../actions";
import type { PitchSeat } from "../types";
import { CallStage, type TileState } from "./CallStage";

type Step = "waiting" | "asking" | "answering" | "thinking" | "followup-asking" | "followup-answering";

export function QandA({
  session,
  seats,
  initials,
  elevenLabs,
  canListen,
  onSession,
  onEnd,
}: {
  session: PitchSession;
  seats: PitchSeat[];
  initials: string;
  elevenLabs: boolean;
  canListen: boolean;
  onSession: (s: PitchSession) => void;
  onEnd: () => void;
}) {
  const speaker = useSpeaker({ useElevenLabs: elevenLabs });
  const rec = useSpeechRecognition();
  const questions = session.questions;
  const spoken = session.settings.mode === "spoken";

  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<Step>("waiting");
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endedRef = useRef(false);

  const q: PitchQuestion | undefined = questions[index];
  const asker = seats.find((s) => s.id === q?.assessorId);
  const caption = step.startsWith("followup") || (step === "thinking" && followUp) ? followUp : (q?.text ?? null);

  /** Say a line in the asker's voice (or show it), then listen for the answer. */
  const askThenListen = useCallback(
    async (text: string, seat: PitchSeat | undefined, asking: Step, answering: Step) => {
      setStep(asking);
      rec.reset();
      setTyped("");
      if (spoken && seat) await speaker.say(seat.id, text, seat.voiceIndex);
      if (endedRef.current) return;
      setStep(answering);
      if (canListen) rec.start();
    },
    [rec, speaker, spoken, canListen],
  );

  const startQuestion = useCallback(
    (i: number) => {
      const next = questions[i];
      if (!next) return;
      setIndex(i);
      setFollowUp(null);
      setError(null);
      void askThenListen(next.text, seats.find((s) => s.id === next.assessorId), "asking", "answering");
    },
    [questions, seats, askThenListen],
  );

  // The board comes back: a short pause, then the first question.
  useEffect(() => {
    const t = setTimeout(() => startQuestion(0), 700);
    return () => clearTimeout(t);
    // Only once, when the call starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const takeAnswer = useCallback(() => (canListen ? rec.stop() : typed.trim()), [canListen, rec, typed]);

  const advance = useCallback(() => {
    if (index + 1 < questions.length) startQuestion(index + 1);
    else onEnd();
  }, [index, questions.length, startQuestion, onEnd]);

  const next = useCallback(async () => {
    if (!q) return;
    if (step === "asking" || step === "followup-asking") {
      // Skip the rest of the question and answer now.
      speaker.stop();
      return;
    }
    if (step !== "answering" && step !== "followup-answering") return;
    const answer = takeAnswer();
    const wasFollowUp = step === "followup-answering";
    setStep("thinking");
    setError(null);
    const res = await submitAnswer(session.id, q.id, answer);
    if (endedRef.current) return;
    if (!res.ok) {
      setError(res.error);
      setStep(wasFollowUp ? "followup-answering" : "answering");
      if (canListen) {
        rec.reset(answer);
        rec.start();
      } else setTyped(answer);
      return;
    }
    onSession(res.value.session);
    if (!wasFollowUp && res.value.followUp) {
      setFollowUp(res.value.followUp);
      void askThenListen(res.value.followUp, asker, "followup-asking", "followup-answering");
    } else advance();
  }, [q, step, speaker, takeAnswer, session.id, canListen, rec, onSession, askThenListen, asker, advance]);

  const end = useCallback(async () => {
    endedRef.current = true;
    speaker.stop();
    const answering = step === "answering" || step === "followup-answering";
    const answer = answering ? takeAnswer() : "";
    if (answering && answer && q) {
      const res = await submitAnswer(session.id, q.id, answer);
      if (res.ok) onSession(res.value.session);
    } else if (rec.listening) rec.stop();
    onEnd();
  }, [speaker, step, takeAnswer, q, session.id, onSession, rec, onEnd]);

  const states: Record<string, TileState> = {};
  if (asker) {
    states[asker.id] =
      step === "asking" || step === "followup-asking" ? "speaking" : step === "thinking" ? "thinking" : step === "waiting" ? "idle" : "listening";
  }
  const answering = step === "answering" || step === "followup-answering";
  const last = index + 1 >= questions.length;
  const nextLabel =
    step === "asking" || step === "followup-asking" ? "Answer now" : step === "thinking" ? "Thinking" : last && (step === "followup-answering" || followUp === null) ? "Finish" : "Next question";

  return (
    <div className="ps-qa">
      <div className="ps-qa__count">
        <Label>
          Question {Math.min(index + 1, questions.length)} of {questions.length}
          {followUp && step.startsWith("followup") ? " · follow-up" : ""}
        </Label>
        {speaker.source && spoken && <Label size="sm">{speaker.source === "elevenlabs" ? "Voice: ElevenLabs" : speaker.source === "browser" ? "Voice: browser" : "Caption only"}</Label>}
      </div>

      <CallStage
        seats={seats}
        speakerId={asker?.id ?? null}
        states={states}
        loudness={speaker.loudness}
        caption={step === "waiting" ? null : caption}
        presenter={{ initials, answering }}
        controls={{
          muted: speaker.muted,
          onMute: speaker.toggleMute,
          onNext: () => void next(),
          nextLabel,
          nextDisabled: step === "thinking" || step === "waiting",
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
              <p className="ps-answer__text">{joinTranscript(rec.finalText, rec.interim) || "Answer aloud, then press Next question."}</p>
            </>
          ) : (
            <TextArea id="ps-answer" label="Your answer" value={typed} rows={4} onChange={(e) => setTyped(e.target.value)} placeholder="Type your answer." />
          )}
        </div>
      )}

      {(error || rec.error) && (
        <p className="ps-error" role="alert">
          {error ?? (rec.error ? recognitionErrorText(rec.error) : "")}
        </p>
      )}
    </div>
  );
}
