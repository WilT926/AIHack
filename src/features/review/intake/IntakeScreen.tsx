"use client";

import { useState } from "react";
import type { Document } from "../types";
import { buildDocument, titleFromFilename } from "@/lib/documents/split";
import type { IntakeContext } from "../load";
import { startReview, type StartedReview } from "../actions";
import { extractPdfText, PdfReadError } from "@/lib/documents/pdf";
import { formatNumber, plural } from "../lib";
import { cn } from "../ui/cn";
import { Button, Logo, Spinner } from "@/components/ui";
import { Label } from "../ui/Label";
import { Card } from "../ui/Card";
import { Tabs } from "../ui/Tabs";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { ExitBubble } from "../ui/ExitBubble";
import { FileDrop } from "../ui/FileDrop";
import { LiveReview } from "../live/LiveReview";

type Mode = "pdf" | "paste";
type Stage =
  | { kind: "input" }
  | { kind: "reading"; fileName: string; page: number; pages: number }
  | { kind: "preview"; doc: Document; source: string }
  | { kind: "review"; doc: Document; started: StartedReview };

export type { IntakeContext };

export function IntakeScreen({ context, sampleReplies }: { context: IntakeContext; sampleReplies: boolean }) {
  const [mode, setMode] = useState<Mode>("pdf");
  const [stage, setStage] = useState<Stage>({ kind: "input" });
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState<string>();
  const [starting, setStarting] = useState(false);

  const start = async (doc: Document) => {
    setError(undefined);
    setStarting(true);
    const res = await startReview({
      projectId: context.project.id,
      title: doc.title.trim() || "Untitled document",
      paragraphs: doc.paragraphs.map((p) => ({ id: p.id, type: p.type, text: p.text })),
    });
    setStarting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setStage({ kind: "review", doc, started: res.value });
  };

  const readPdf = async (file: File) => {
    setError(undefined);
    setStage({ kind: "reading", fileName: file.name, page: 0, pages: 0 });
    try {
      const { text } = await extractPdfText(file, (page, pages) =>
        setStage({ kind: "reading", fileName: file.name, page, pages }),
      );
      const doc = buildDocument(text, { title: titleFromFilename(file.name) });
      if (doc.paragraphs.length === 0) throw new PdfReadError("We found no paragraphs in that PDF.", "no-text");
      setStage({ kind: "preview", doc, source: file.name });
    } catch (err) {
      setError(err instanceof PdfReadError ? err.message : "Something went wrong reading that PDF. Try pasting the text.");
      setStage({ kind: "input" });
    }
  };

  const readPaste = () => {
    setError(undefined);
    const doc = buildDocument(pasteText, { title: pasteTitle });
    if (doc.paragraphs.length === 0) {
      setError("Paste some text first.");
      return;
    }
    setStage({ kind: "preview", doc, source: "Pasted text" });
  };

  if (stage.kind === "review") {
    return (
      <LiveReview
        project={context.project}
        board={{ ...context.board, assessorIds: stage.started.boardIds }}
        assessors={context.assessors}
        document={stage.doc}
        documentId={stage.started.documentId}
        reviewId={stage.started.reviewId}
        replySource={stage.started.replySource}
        onUpload={() => setStage({ kind: "input" })}
      />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="flex h-topbar shrink-0 items-center gap-6 bg-white px-8">
        <Logo href="/" />
        <div className="h-7 w-px bg-grey-100" />
        <Label tone="ink">{context.project.name}  /  Upload document</Label>
      </header>

      <main className="mx-auto flex w-full max-w-sheet flex-col gap-6 px-6 py-12">
        <div>
          <Label tone="accent">Step 1 · Your document</Label>
          <h1 className="mt-2 font-display text-display font-semibold tracking-display text-ink">
            {stage.kind === "preview" ? "Check the paragraphs" : "What should the board read?"}
          </h1>
          <p className="mt-2 text-body text-grey-700">
            {stage.kind === "preview"
              ? "Every paragraph gets a number so the board can point at it. Go back if the split looks wrong."
              : "Upload a PDF or paste your text. We number the paragraphs; the text is saved with your project when the review starts."}
          </p>
          {sampleReplies && (
            <p className="mt-3">
              <Label tone="accent">Sample replies: no Anthropic key is set, so the board will use made-up comments</Label>
            </p>
          )}
        </div>

        {stage.kind === "input" && (
          <Card className="flex flex-col gap-5 p-6">
            <Tabs
              items={[
                { id: "pdf", label: "Upload PDF" },
                { id: "paste", label: "Paste text" },
              ]}
              active={mode}
              onChange={(m) => {
                setMode(m);
                setError(undefined);
              }}
            />

            {mode === "pdf" ? (
              <FileDrop
                accept="application/pdf,.pdf"
                onFile={(file) => void readPdf(file)}
                title="Drop a PDF, or click to choose one"
                hint={<Label>PDF · up to 25 MB · text, not scans</Label>}
              />
            ) : (
              <div className="flex flex-col gap-3">
                <TextInput value={pasteTitle} onChange={setPasteTitle} placeholder="Title (optional), e.g. Chapter 3, Methods" ariaLabel="Title" />
                <TextArea
                  value={pasteText}
                  onChange={setPasteText}
                  placeholder="Paste your text. Leave a blank line between paragraphs."
                  ariaLabel="Document text"
                  rows={14}
                />
                <div className="flex justify-end">
                  <Button onClick={readPaste} disabled={!pasteText.trim()}>
                    Number the paragraphs
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <p role="alert" className="rounded-row bg-orange-halo px-4 py-3 text-body text-ink">
                {error}
              </p>
            )}
          </Card>
        )}

        {stage.kind === "reading" && (
          <Card variant="dashed" className="flex flex-col gap-2 p-6">
            <Spinner label="Reading" />
            <span className="font-display text-h3-lg font-semibold tracking-h3 text-ink">{stage.fileName}</span>
            <Label>{stage.pages ? `Page ${stage.page} of ${stage.pages}` : "Opening the PDF"}</Label>
          </Card>
        )}

        {stage.kind === "preview" && (
          <>
            <Preview
              doc={stage.doc}
              source={stage.source}
              starting={starting}
              onTitle={(title) => setStage({ ...stage, doc: { ...stage.doc, title } })}
              onBack={() => setStage({ kind: "input" })}
              onStart={() => void start(stage.doc)}
            />
            {error && (
              <p role="alert" className="rounded-row bg-orange-halo px-4 py-3 text-body text-ink">
                {error}
              </p>
            )}
          </>
        )}
      </main>
      <ExitBubble />
    </div>
  );
}

function Preview({
  doc,
  source,
  starting,
  onTitle,
  onBack,
  onStart,
}: {
  doc: Document;
  source: string;
  starting: boolean;
  onTitle: (title: string) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  const headings = doc.paragraphs.filter((p) => p.type === "heading").length;
  const summary = [
    plural(doc.paragraphs.length - headings, "paragraph", "paragraphs"),
    headings > 0 && plural(headings, "heading", "headings"),
    `${formatNumber(doc.wordCount)} words`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-display text-h3-lg font-semibold tracking-h3 text-ink">Found {summary}</span>
        <Label className="truncate">{source}</Label>
      </div>
      <TextInput value={doc.title} onChange={onTitle} ariaLabel="Document title" />

      <ol className="flex max-h-96 flex-col gap-2 overflow-y-auto rounded-row bg-grey-50 p-4">
        {doc.paragraphs.map((p) => (
          <li key={p.id} className="grid grid-cols-numbered gap-2">
            <span className="pt-0.5 font-mono text-label text-grey-500">¶{p.index}</span>
            <span className={cn("text-body text-grey-900", p.type === "heading" ? "font-display font-semibold text-ink" : "line-clamp-2")}>{p.text}</span>
          </li>
        ))}
      </ol>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button variant="create" onClick={onStart} disabled={starting}>
          {starting ? "Starting" : "Start review"}
        </Button>
      </div>
    </Card>
  );
}
