import { Button, TextArea, TextInput } from "@/components/ui";
import { parseClock, wordCount } from "@/lib/voice/transcript";

/** Fallback: paste or type what was said, with how long it took. */
export function TypedTranscript({
  text,
  length,
  busy,
  error,
  onText,
  onLength,
  onSave,
  onBack,
}: {
  text: string;
  length: string;
  busy: boolean;
  error: string | null;
  onText: (t: string) => void;
  onLength: (l: string) => void;
  onSave: () => void;
  onBack: () => void;
}) {
  const seconds = parseClock(length);
  const words = wordCount(text);
  const ready = words > 0 && seconds !== null && seconds > 0;
  return (
    <section className="ps-typed" aria-labelledby="ps-typed-title">
      <h1 id="ps-typed-title" className="ps-title">
        Your pitch, as text
      </h1>
      <TextArea
        id="ps-typed-text"
        label="Transcript"
        hint={`${words} words`}
        value={text}
        rows={14}
        placeholder="Paste or type what you said."
        onChange={(e) => onText(e.target.value)}
      />
      <TextInput
        id="ps-typed-length"
        label="How long it took"
        hint={seconds ? undefined : "Minutes and seconds, for example 4:30. Used to work out your pace."}
        value={length}
        placeholder="4:30"
        inputMode="numeric"
        className="ps-length"
        onChange={(e) => onLength(e.target.value)}
      />
      {error && (
        <p className="ps-error" role="alert">
          {error}
        </p>
      )}
      <div className="ps-actions">
        <Button variant="secondary" size="lg" onClick={onBack} disabled={busy}>
          Back
        </Button>
        <Button variant="primary" size="lg" onClick={onSave} disabled={!ready || busy}>
          Hand it to the board
        </Button>
      </div>
    </section>
  );
}
