"use client";

// Speaks the board's questions. Tries the ElevenLabs route first (when it is
// switched on); on any failure uses the browser's built-in voice, picking a
// different one per assessor. Exposes the loudness of the audio as it plays
// (0 to 1) for the call stage.
import { useCallback, useEffect, useRef, useState } from "react";
import { BROWSER_SETTINGS, type Tone } from "./tone";

export type VoiceSource = "elevenlabs" | "browser" | "caption";

/** Rough reading time, used when no voice is available or a voice never reports its end. */
const readingMs = (text: string) => Math.max(2500, text.split(/\s+/).length * 380 + 1200);

function englishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const all = window.speechSynthesis.getVoices();
  const en = all.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const gb = en.filter((v) => v.lang.toLowerCase().includes("gb"));
  return [...gb, ...en.filter((v) => !gb.includes(v))];
}

export function useSpeaker({ useElevenLabs, tone = "coaching" }: { useElevenLabs: boolean; tone?: Tone }) {
  const [speaking, setSpeaking] = useState(false);
  const [loudness, setLoudness] = useState(0);
  const [muted, setMuted] = useState(false);
  const [source, setSource] = useState<VoiceSource | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef(0);
  const doneRef = useRef<(() => void) | null>(null);
  const mutedRef = useRef(false);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const finish = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setSpeaking(false);
    setLoudness(0);
    const done = doneRef.current;
    doneRef.current = null;
    done?.();
  }, []);

  /** Stop whatever is speaking now. */
  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    finish();
  }, [finish]);

  const playElevenLabs = useCallback(
    async (assessorId: string, text: string): Promise<boolean> => {
      let res: Response;
      try {
        res = await fetch("/api/voice", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ assessorId, text, tone }) });
      } catch {
        return false;
      }
      if (!res.ok || !(res.headers.get("content-type") ?? "").startsWith("audio/")) return false;
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audioRef.current = audio;
      try {
        ctxRef.current ??= new AudioContext();
        const ctx = ctxRef.current;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaElementSource(audio).connect(analyser);
        analyser.connect(ctx.destination);
        const data = new Uint8Array(analyser.fftSize);
        const tick = () => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (const v of data) sum += ((v - 128) / 128) ** 2;
          setLoudness(Math.min(1, Math.sqrt(sum / data.length) * 4));
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        // No analyser: play without the loudness signal.
      }
      audio.onended = () => {
        URL.revokeObjectURL(url);
        finish();
      };
      audio.onerror = () => finish();
      try {
        await audio.play();
      } catch {
        URL.revokeObjectURL(url);
        return false;
      }
      setSource("elevenlabs");
      return true;
    },
    [finish, tone],
  );

  const playBrowser = useCallback(
    (text: string, voiceIndex: number) => {
      const voices = englishVoices();
      if (voices.length === 0) {
        setSource("caption");
        setTimeout(finish, readingMs(text));
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voices[voiceIndex % voices.length];
      u.lang = u.voice.lang;
      // A little variety when voices repeat, then the condition's pace and pitch.
      u.pitch = 0.9 + ((voiceIndex * 7) % 5) * 0.05 + BROWSER_SETTINGS[tone].pitchShift;
      u.rate = BROWSER_SETTINGS[tone].rate;
      let pulse = 0;
      const decay = () => {
        pulse *= 0.9;
        setLoudness(pulse);
        rafRef.current = requestAnimationFrame(decay);
      };
      u.onboundary = () => {
        pulse = 0.8;
      };
      const safety = setTimeout(finish, readingMs(text) * 2);
      u.onend = () => {
        clearTimeout(safety);
        finish();
      };
      u.onerror = () => {
        clearTimeout(safety);
        finish();
      };
      decay();
      setSource("browser");
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    },
    [finish, tone],
  );

  /**
   * Say a question in this assessor's voice. Resolves when it has been said
   * (or, when muted or voiceless, after a reading pause with the caption up).
   */
  const say = useCallback(
    (assessorId: string, text: string, voiceIndex: number): Promise<void> => {
      stop();
      return new Promise<void>((resolve) => {
        doneRef.current = resolve;
        setSpeaking(true);
        if (mutedRef.current) {
          setSource("caption");
          setTimeout(finish, readingMs(text));
          return;
        }
        void (async () => {
          if (useElevenLabs && (await playElevenLabs(assessorId, text))) return;
          if (typeof window !== "undefined" && "speechSynthesis" in window) playBrowser(text, voiceIndex);
          else {
            setSource("caption");
            setTimeout(finish, readingMs(text));
          }
        })();
      });
    },
    [useElevenLabs, playElevenLabs, playBrowser, stop, finish],
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      if (!m) {
        audioRef.current?.pause();
        if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
        if (doneRef.current) finish();
      }
      return !m;
    });
  }, [finish]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      audioRef.current?.pause();
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
      void ctxRef.current?.close();
    },
    [],
  );

  return { say, stop, speaking, loudness, muted, toggleMute, source };
}
