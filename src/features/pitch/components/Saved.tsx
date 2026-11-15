import { Button, Label } from "@/components/ui";
import { clock } from "@/lib/voice/transcript";

/**
 * End of the listening half: the pitch is saved with its timing. The board's
 * questions are the next build step, and the screen says so.
 */
export function Saved({
  seconds,
  words,
  wpm,
  transcript,
  capture,
  onAgain,
}: {
  seconds: number;
  words: number;
  wpm: number;
  transcript: string;
  capture: "live" | "typed";
  onAgain: () => void;
}) {
  return (
    <section className="ps-saved" aria-labelledby="ps-saved-title">
      <h1 id="ps-saved-title" className="ps-title">
        Pitch saved
      </h1>
      <div className="ps-stats">
        <span>
          <Label>Length</Label>
          <b>{clock(seconds)}</b>
        </span>
        <span>
          <Label>Words</Label>
          <b>{words}</b>
        </span>
        <span>
          <Label>Pace</Label>
          <b>{wpm ? `${wpm} wpm` : "unknown"}</b>
        </span>
        <span>
          <Label>Captured</Label>
          <b>{capture === "live" ? "Live" : "Typed"}</b>
        </span>
      </div>
      <p className="ps-saved__transcript">{transcript}</p>
      <p className="ui-empty">Preview: the board stepping out and asking its questions is the next build step.</p>
      <div className="ps-actions">
        <Button variant="secondary" size="lg" href="/">
          Back to your floor
        </Button>
        <Button variant="primary" size="lg" onClick={onAgain}>
          Practise again
        </Button>
      </div>
    </section>
  );
}
