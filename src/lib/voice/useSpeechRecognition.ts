"use client";

// Live speech-to-text with the browser's built-in recognition (Chrome).
// Chrome ends recognition by itself after silences and every minute or so;
// while we still want to listen, it is restarted and the text so far is kept.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { voice } from "@/config";

// Minimal types: the Web Speech API is not in TypeScript's DOM library.
type RecognitionAlternative = { transcript: string };
type RecognitionResult = { isFinal: boolean; length: number; [i: number]: RecognitionAlternative };
type RecognitionEvent = { resultIndex: number; results: { length: number; [i: number]: RecognitionResult } };
type RecognitionErrorEvent = { error: string; message?: string };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noop = () => () => {};
/** Whether this browser can listen. False on the server. */
export function useRecognitionSupported(): boolean {
  return useSyncExternalStore(noop, () => getCtor() !== null, () => false);
}

export type RecognitionError = "not-allowed" | "no-microphone" | "network" | "unsupported" | "other";

const ERROR_TEXT: Record<RecognitionError, string> = {
  "not-allowed": "The microphone is blocked. Allow it in the address bar, or type the transcript instead.",
  "no-microphone": "No microphone was found. Plug one in, or type the transcript instead.",
  network: "Speech recognition lost its connection. It will keep trying; you can also type the transcript.",
  unsupported: "This browser cannot listen. Use Chrome, or type the transcript instead.",
  other: "Listening stopped unexpectedly. It will keep trying; you can also type the transcript.",
};
export const recognitionErrorText = (e: RecognitionError) => ERROR_TEXT[e];

export function useSpeechRecognition() {
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<RecognitionError | null>(null);
  const [lastHeardAt, setLastHeardAt] = useState(0);
  /** When the microphone first started listening (ISO). The pitch's start time. */
  const [startedAt, setStartedAt] = useState<string | null>(null);

  const recRef = useRef<Recognition | null>(null);
  const wantRef = useRef(false);
  const finalRef = useRef("");
  const interimRef = useRef("");
  const restartsRef = useRef<number[]>([]);
  const restartTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** Latest begin(), so a restart from inside onend calls the current one. */
  const beginRef = useRef<() => void>(() => {});

  const appendFinal = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    finalRef.current = finalRef.current ? `${finalRef.current} ${t}` : t;
    setFinalText(finalRef.current);
  }, []);

  const begin = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setError("unsupported");
      wantRef.current = false;
      return;
    }
    const rec = new Ctor();
    rec.lang = voice.lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setListening(true);
      setStartedAt((t) => t ?? new Date().toISOString());
    };
    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) appendFinal(r[0].transcript);
        else live += r[0].transcript;
      }
      interimRef.current = live;
      setInterim(live);
      setLastHeardAt(Date.now());
      setError(null);
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return; // onend restarts
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        wantRef.current = false;
        setError("not-allowed");
      } else if (e.error === "audio-capture") {
        wantRef.current = false;
        setError("no-microphone");
      } else if (e.error === "network") setError("network");
      else setError("other");
    };
    rec.onend = () => {
      // Keep words that were still interim when recognition stopped.
      if (interimRef.current) {
        appendFinal(interimRef.current);
        interimRef.current = "";
        setInterim("");
      }
      recRef.current = null;
      if (!wantRef.current) {
        setListening(false);
        return;
      }
      // Restart, backing off if Chrome keeps ending straight away.
      const now = Date.now();
      restartsRef.current = [...restartsRef.current.filter((t) => now - t < 3000), now];
      const delay = restartsRef.current.length > 3 ? 1000 : 50;
      restartTimer.current = setTimeout(() => {
        if (wantRef.current) beginRef.current();
      }, delay);
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      // start() throws if a previous instance is still closing; onend retries.
    }
  }, [appendFinal]);

  useEffect(() => {
    beginRef.current = begin;
  }, [begin]);

  /** Start (or resume) listening. Text heard so far is kept. */
  const start = useCallback(() => {
    if (wantRef.current) return;
    wantRef.current = true;
    setError(null);
    begin();
  }, [begin]);

  /** Stop listening and return everything heard, including words still being recognised. */
  const stop = useCallback((): string => {
    wantRef.current = false;
    clearTimeout(restartTimer.current);
    if (interimRef.current) {
      appendFinal(interimRef.current);
      interimRef.current = "";
      setInterim("");
    }
    recRef.current?.stop();
    setListening(false);
    return finalRef.current;
  }, [appendFinal]);

  /** Replace the transcript, e.g. with a saved one. */
  const reset = useCallback((text = "") => {
    finalRef.current = text.trim();
    interimRef.current = "";
    setFinalText(finalRef.current);
    setInterim("");
    setStartedAt(null);
  }, []);

  useEffect(
    () => () => {
      wantRef.current = false;
      clearTimeout(restartTimer.current);
      recRef.current?.abort();
    },
    [],
  );

  return { listening, finalText, interim, error, lastHeardAt, startedAt, start, stop, reset };
}
