"use client";

// Presentation practice, the listening half (lane-1.md step 1.3): set-up,
// live transcript with auto-resume, Finish or "thank you" to end, a typed
// fallback, a hidden "load last transcript" control, and timing.
import { useCallback, useEffect, useRef, useState } from "react";
import { voice } from "@/config";
import { recognitionErrorText, useRecognitionSupported, useSpeechRecognition } from "@/lib/voice/useSpeechRecognition";
import { clock, endsWithThanks, joinTranscript, parseClock, wordCount } from "@/lib/voice/transcript";
import type { PitchSession } from "@/lib/schemas";
import { boardQuestions, endQandA, finishPitch, lastSavedTranscript, saveTranscript, startPitchSession } from "./actions";
import type { Phase, PitchSetupData } from "./types";
import { SessionFrame } from "./components/SessionFrame";
import { Setup, type SetupValue } from "./components/Setup";
import { Listening } from "./components/Listening";
import { TypedTranscript } from "./components/TypedTranscript";
import { Conferring } from "./components/Conferring";
import { QandA } from "./components/QandA";
import { FeedbackReport } from "@/features/feedback/FeedbackReport";
import { setActionDone } from "@/features/feedback/actions";
import { Button } from "@/components/ui";

const message = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong. Try again.");

export function PitchFlow({ data }: { data: PitchSetupData }) {
  const canListen = useRecognitionSupported();
  const rec = useSpeechRecognition();

  const initialProject = data.projects.find((p) => p.id === data.initialProjectId) ?? data.projects.find((p) => p.isPitch) ?? data.projects[0];
  const [setup, setSetup] = useState<SetupValue>({
    projectId: initialProject?.id ?? null,
    boardId: initialProject?.boardId ?? data.boards[0]?.id ?? null,
    questionCount: data.defaultQuestionCount,
    mode: data.defaultMode,
    capture: "live",
  });
  const [phase, setPhase] = useState<Phase>("setup");
  const [session, setSession] = useState<PitchSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [typedLength, setTypedLength] = useState("");

  const sessionRef = useRef<PitchSession | null>(null);
  const finishingRef = useRef(false);

  const board = data.boards.find((b) => b.id === setup.boardId);
  const seats = board?.seats ?? [];
  const live = joinTranscript(rec.finalText, rec.interim);
  const seconds = rec.startedAt && now ? Math.max(0, (now - Date.parse(rec.startedAt)) / 1000) : 0;

  // ---------- The board steps out, asks, then writes its feedback ----------

  const [boardError, setBoardError] = useState<string | null>(null);

  const confer = useCallback(async (id: string) => {
    setBoardError(null);
    setPhase("conferring");
    const [res] = await Promise.all([boardQuestions(id), new Promise((r) => setTimeout(r, voice.minConferMs))]);
    if (!res.ok) {
      setBoardError(res.error);
      return;
    }
    sessionRef.current = res.value;
    setSession(res.value);
    setPhase("questions");
  }, []);

  const writeFeedback = useCallback(async () => {
    const s = sessionRef.current;
    if (!s) return;
    setBoardError(null);
    setPhase("feedback");
    const res = await endQandA(s.id);
    if (!res.ok) {
      setBoardError(res.error);
      return;
    }
    sessionRef.current = res.value;
    setSession(res.value);
    setPhase("report");
  }, []);

  // ---------- Start ----------

  const start = useCallback(async () => {
    if (!setup.projectId) return;
    const capture = canListen ? setup.capture : "typed";
    setError(null);
    if (capture === "typed") {
      setPhase("typing");
      return;
    }
    setBusy(true);
    try {
      rec.reset();
      const s = await startPitchSession({
        projectId: setup.projectId,
        boardId: setup.boardId,
        questionCount: setup.questionCount,
        mode: setup.mode,
        capture: "live",
      });
      sessionRef.current = s;
      setSession(s);
      finishingRef.current = false;
      setPhase("listening");
      rec.start();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }, [setup, canListen, rec]);

  // ---------- Finish (button or "thank you") ----------

  /** End the live pitch. `endedAtMs` lets the "thank you" ending stop the clock at the last words, not after the pause. */
  const finishLive = useCallback(async (endedAtMs?: number) => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    const text = rec.stop();
    const endedAt = new Date(endedAtMs ?? Date.now()).toISOString();
    const startedAt = rec.startedAt ?? endedAt;
    const s = sessionRef.current;
    if (!text.trim()) {
      finishingRef.current = false;
      setError("Nothing was heard. Check the microphone and press Finish again, or type the transcript.");
      return;
    }
    if (!s) return;
    setBusy(true);
    try {
      const saved = await finishPitch({ sessionId: s.id, transcript: text, capture: "live", startedAt, endedAt });
      sessionRef.current = saved;
      setSession(saved);
      void confer(saved.id);
    } catch (e) {
      finishingRef.current = false;
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }, [rec, confer]);

  // "Thank you" followed by a pause ends the pitch. The timer restarts only
  // when new words arrive, not on every render (the clock re-renders often).
  const finishRef = useRef(finishLive);
  useEffect(() => {
    finishRef.current = finishLive;
  }, [finishLive]);
  const heardThanks = phase === "listening" && endsWithThanks(live);
  useEffect(() => {
    if (!heardThanks) return;
    const heardAt = rec.lastHeardAt || Date.now();
    const t = setTimeout(() => void finishRef.current(heardAt), voice.thanksPauseMs);
    return () => clearTimeout(t);
  }, [heardThanks, rec.lastHeardAt]);

  // Clock for the elapsed time.
  useEffect(() => {
    if (phase !== "listening") return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [phase]);

  // Save the transcript so far, in case the tab closes.
  const liveRef = useRef("");
  useEffect(() => {
    liveRef.current = live;
  }, [live]);
  useEffect(() => {
    if (phase !== "listening") return;
    const t = setInterval(() => {
      const s = sessionRef.current;
      if (s && liveRef.current) void saveTranscript(s.id, liveRef.current).catch(() => {});
    }, voice.autosaveMs);
    return () => clearInterval(t);
  }, [phase]);

  // ---------- Typed fallback ----------

  const toTyped = useCallback(() => {
    const text = rec.listening || rec.finalText ? rec.stop() : "";
    if (text) setTypedText(text);
    if (seconds > 0) setTypedLength(clock(seconds));
    setError(null);
    setPhase("typing");
  }, [rec, seconds]);

  const saveTyped = useCallback(async () => {
    const len = parseClock(typedLength);
    if (!setup.projectId || !len || !typedText.trim()) return;
    setBusy(true);
    setError(null);
    try {
      let s = sessionRef.current;
      if (!s) {
        s = await startPitchSession({
          projectId: setup.projectId,
          boardId: setup.boardId,
          questionCount: setup.questionCount,
          mode: setup.mode,
          capture: "typed",
        });
      }
      const endedAt = new Date().toISOString();
      const startedAt = new Date(Date.parse(endedAt) - len * 1000).toISOString();
      const saved = await finishPitch({ sessionId: s.id, transcript: typedText.trim(), capture: "typed", startedAt, endedAt });
      sessionRef.current = saved;
      setSession(saved);
      void confer(saved.id);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }, [setup, typedText, typedLength, confer]);

  // Hidden control: Ctrl/⌘ + Shift + L loads the last saved transcript.
  const loadLast = useCallback(async () => {
    if (!setup.projectId) return;
    try {
      const last = await lastSavedTranscript(setup.projectId);
      if (!last) {
        setError("There is no saved transcript for this table yet.");
        return;
      }
      if (rec.listening) rec.stop();
      setTypedText(last.transcript);
      setTypedLength(last.seconds ? clock(last.seconds) : "");
      setError(null);
      setPhase("typing");
    } catch (e) {
      setError(message(e));
    }
  }, [setup.projectId, rec]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        void loadLast();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loadLast]);

  const again = useCallback(() => {
    rec.reset();
    sessionRef.current = null;
    setSession(null);
    setTypedText("");
    setTypedLength("");
    setError(null);
    setPhase("setup");
  }, [rec]);

  // ---------- Render ----------

  const notice = error ?? (rec.error ? recognitionErrorText(rec.error) : null);
  const step = phase === "conferring" ? 1 : phase === "questions" ? 2 : phase === "feedback" || phase === "report" ? 3 : 0;
  const sampleReplies = session?.replySource === "sample" || (data.sampleReplies && step > 0);

  return (
    <SessionFrame step={step} sample={data.sample} sampleReplies={sampleReplies} preview={data.preview}>
      {phase === "setup" && (
        <Setup data={data} value={setup} onChange={setSetup} canListen={canListen} busy={busy} error={error} onStart={start} />
      )}
      {phase === "listening" && (
        <Listening
          seats={seats}
          finalText={rec.finalText}
          interim={rec.interim}
          listening={rec.listening}
          seconds={seconds}
          words={wordCount(live)}
          notice={notice}
          busy={busy}
          onFinish={() => void finishLive()}
          onType={toTyped}
        />
      )}
      {phase === "typing" && (
        <TypedTranscript
          text={typedText}
          length={typedLength}
          busy={busy}
          error={error}
          onText={setTypedText}
          onLength={setTypedLength}
          onSave={saveTyped}
          onBack={again}
        />
      )}
      {phase === "conferring" && (
        <Conferring seats={seats} label="The board is conferring" error={boardError} onRetry={() => session && void confer(session.id)} />
      )}
      {phase === "questions" && session && (
        <QandA
          session={session}
          seats={seats}
          initials={data.initials}
          elevenLabs={data.elevenLabs}
          canListen={canListen}
          onSession={(s) => {
            sessionRef.current = s;
            setSession(s);
          }}
          onEnd={() => void writeFeedback()}
        />
      )}
      {phase === "feedback" && (
        <Conferring seats={seats} label="The board is writing its feedback" error={boardError} onRetry={() => void writeFeedback()} />
      )}
      {phase === "report" && session?.report && (
        <FeedbackReport
          report={session.report}
          people={seats}
          questions={session.questions}
          sample={session.replySource === "sample"}
          onToggleAction={(actionId, done) => void setActionDone({ kind: "pitch", id: session.id, actionId, done })}
          footer={
            <div className="ps-actions">
              <Button variant="secondary" size="lg" href="/">
                Back to your floor
              </Button>
              <Button variant="primary" size="lg" onClick={again}>
                Practise again
              </Button>
            </div>
          }
        />
      )}
      <button type="button" className="ps-hidden-load" onClick={() => void loadLast()} aria-label="Load the last saved transcript">
        Load last transcript
      </button>
    </SessionFrame>
  );
}
