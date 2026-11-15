import { useEffect, useRef } from "react";
import { Button, Label } from "@/components/ui";
import { clock } from "@/lib/voice/transcript";
import type { PitchSeat } from "../types";
import { BoardRow } from "./BoardRow";

/**
 * The Listening state (§9): the board in a row, the live transcript in
 * grey-700, and a single orange dot beside "Listening".
 */
export function Listening({
  seats,
  finalText,
  interim,
  listening,
  seconds,
  words,
  notice,
  busy,
  onFinish,
  onType,
}: {
  seats: PitchSeat[];
  finalText: string;
  interim: string;
  listening: boolean;
  seconds: number;
  words: number;
  notice: string | null;
  busy: boolean;
  onFinish: () => void;
  onType: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [finalText, interim]);

  return (
    <section className="ps-listen" aria-label="Presenting">
      <BoardRow seats={seats} />

      <div className="ps-status" aria-live="polite">
        <span className="ps-status__dot" data-on={listening} aria-hidden />
        <Label tone="ink">{listening ? "Listening" : "Starting the microphone"}</Label>
        <Label>{clock(seconds)}</Label>
        <Label>{words} words</Label>
      </div>

      <div className="ps-transcript" ref={scrollRef} tabIndex={0} aria-label="Live transcript">
        {finalText || interim ? (
          <p>
            {finalText} <span className="ps-transcript__interim">{interim}</span>
          </p>
        ) : (
          <p className="ps-transcript__empty">Start speaking. The board is listening.</p>
        )}
      </div>

      {notice && (
        <p className="ps-error" role="alert">
          {notice}
        </p>
      )}

      <p className="ps-note">End with “thank you” and a pause, or press Finish.</p>

      <div className="ps-controls" role="group" aria-label="Session controls">
        <Button variant="primary" size="lg" onClick={onFinish} disabled={busy}>
          Finish
        </Button>
        <Button variant="secondary" size="lg" onClick={onType} disabled={busy}>
          Type instead
        </Button>
      </div>
    </section>
  );
}
