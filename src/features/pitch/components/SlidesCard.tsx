"use client";

// Optional "Add your slides or notes" before presenting. Nothing is required:
// Skip is always one click. What is added goes to the board as context for
// its questions, never as instructions.
import { useRef, useState } from "react";
import { Button, Card, Label, TextArea, TextButton } from "@/components/ui";
import { extractPdfText, PdfReadError } from "@/lib/documents/pdf";

const MAX_CHARS = 20000;
const words = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

export function SlidesCard({
  slides,
  skipped,
  onSlides,
  onSkip,
}: {
  slides: string | null;
  skipped: boolean;
  onSlides: (text: string | null) => void;
  onSkip: (skipped: boolean) => void;
}) {
  const [pasting, setPasting] = useState(false);
  const [draft, setDraft] = useState("");
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const readPdf = async (file: File) => {
    setError(null);
    setReading(true);
    try {
      const { text } = await extractPdfText(file);
      if (!text.trim()) throw new PdfReadError("That PDF has no text to read. Paste your notes instead.", "no-text");
      onSlides(text.slice(0, MAX_CHARS));
    } catch (e) {
      setError(e instanceof Error ? e.message : "That PDF could not be read. Paste your notes instead.");
    } finally {
      setReading(false);
    }
  };

  if (slides) {
    return (
      <Card className="ps-slides">
        <div className="ps-slides__row">
          <div className="ps-slides__text">
            <Label tone="ink">Slides or notes added</Label>
            <span className="ps-note">{words(slides).toLocaleString()} words. The board reads them before it asks its questions.</span>
          </div>
          <TextButton onClick={() => onSlides(null)}>Remove</TextButton>
        </div>
      </Card>
    );
  }

  if (skipped) {
    return (
      <div className="ps-slides__row">
        <span className="ps-note">No slides or notes. The board works from what you say.</span>
        <TextButton onClick={() => onSkip(false)}>Add slides or notes</TextButton>
      </div>
    );
  }

  return (
    <Card dashed className="ps-slides">
      <div className="ps-slides__text">
        <Label tone="ink">Add your slides or notes</Label>
        <span className="ps-note">Optional. A PDF of your slides, or pasted notes. The board uses them as context for its questions.</span>
      </div>

      {pasting ? (
        <>
          <TextArea
            id="ps-slides-text"
            label="Slides or notes"
            hint={`${words(draft)} words`}
            rows={6}
            maxLength={MAX_CHARS}
            value={draft}
            placeholder="Paste the text of your slides or your speaker notes."
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="ps-slides__actions">
            <Button
              variant="primary"
              disabled={!draft.trim()}
              onClick={() => {
                onSlides(draft.trim());
                setPasting(false);
                setDraft("");
              }}
            >
              Add these notes
            </Button>
            <Button variant="secondary" onClick={() => setPasting(false)}>
              Cancel
            </Button>
            <Button variant="quiet" onClick={() => onSkip(true)}>
              Skip
            </Button>
          </div>
        </>
      ) : (
        <div className="ps-slides__actions">
          <Button variant="secondary" disabled={reading} onClick={() => fileRef.current?.click()}>
            {reading ? "Reading the PDF…" : "Upload a PDF"}
          </Button>
          <Button variant="secondary" disabled={reading} onClick={() => setPasting(true)}>
            Paste text
          </Button>
          <Button variant="quiet" disabled={reading} onClick={() => onSkip(true)}>
            Skip
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void readPdf(f);
            }}
          />
        </div>
      )}
      {error && (
        <p className="ps-error" role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}
