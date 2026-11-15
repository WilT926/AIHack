"use client";

// Step 2.5: the mark scheme beside the brief. Upload a PDF, text file or photo
// (or paste it), check the criteria it found, edit names and weights. Every
// assessor gets the criteria, tags its comments with them and spends its
// attention by the weights.

import { useState } from "react";
import { normaliseWeights, parseMarkScheme } from "@/lib/documents/markScheme";
import type { Criterion, ProjectDraft } from "../types";
import { MARK_SCHEME_ACCEPT, MarkSchemeError, readMarkScheme } from "../readMarkScheme";
import { cn } from "../../review/ui/cn";
import { Label } from "../../review/ui/Label";
import { Button } from "../../review/ui/Button";
import { TextArea } from "../../review/ui/TextArea";
import { TextButton } from "../../review/ui/TextButton";
import { FileDrop } from "../../review/ui/FileDrop";
import { ReadingDots } from "../../review/ui/ReadingDots";
import { TemplateIcon } from "./TemplateIcon";

type MarkScheme = NonNullable<ProjectDraft["markScheme"]>;

function newId(criteria: Criterion[]): string {
  let n = criteria.length + 1;
  while (criteria.some((c) => c.id === `criterion-${n}`)) n++;
  return `criterion-${n}`;
}

export function MarkSchemeEditor({
  value,
  onChange,
}: {
  value?: MarkScheme;
  onChange: (value: MarkScheme | undefined) => void;
}) {
  const [mode, setMode] = useState<"view" | "upload" | "paste">(value?.criteria.length ? "view" : "upload");
  const [pasted, setPasted] = useState("");
  const [reading, setReading] = useState<string>();
  const [error, setError] = useState<string>();

  const criteria = value?.criteria ?? [];
  const total = criteria.reduce((n, c) => n + c.weight, 0);
  const max = Math.max(1, ...criteria.map((c) => c.weight));
  const top = criteria.reduce<Criterion | undefined>((b, c) => (!b || c.weight > b.weight ? c : b), undefined);
  const lightest = criteria.reduce<Criterion | undefined>((b, c) => (!b || c.weight < b.weight ? c : b), undefined);

  const set = (next: Criterion[]) => onChange({ source: value?.source ?? "Your mark scheme", criteria: next });
  const update = (id: string, patch: Partial<Criterion>) => set(criteria.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const loadFile = async (file: File) => {
    setError(undefined);
    setReading(file.name);
    try {
      const found = await readMarkScheme(file);
      onChange({ source: file.name, criteria: found });
      setMode("view");
    } catch (err) {
      setError(err instanceof MarkSchemeError ? err.message : "Something went wrong reading that file.");
    } finally {
      setReading(undefined);
    }
  };

  const loadPaste = () => {
    const found = parseMarkScheme(pasted);
    if (found.length === 0) return setError("We couldn't find any criteria. Put one per line, e.g. \"Method 30%\".");
    setError(undefined);
    onChange({ source: "Pasted mark scheme", criteria: found });
    setMode("view");
  };

  return (
    <aside className="self-start rounded-sheet bg-grey-50 p-7" aria-label="Mark scheme">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label tone="ink" className="block">Mark scheme</Label>
          <Label className="block">Optional · board marks against it</Label>
        </div>
        {mode === "view" && criteria.length > 0 && (
          <TextButton onClick={() => setMode("upload")}>Replace</TextButton>
        )}
      </div>

      {reading && (
        <div className="mt-5 flex flex-col gap-1 rounded-card border-2 border-dashed border-grey-250 bg-white px-5 py-6">
          <span className="flex items-center gap-2 text-ink">
            <Label tone="ink">Reading</Label>
            <ReadingDots />
          </span>
          <span className="truncate font-display text-h3 font-semibold tracking-h3 text-ink">{reading}</span>
        </div>
      )}

      {!reading && mode === "upload" && (
        <div className="mt-5 flex flex-col gap-3">
          <FileDrop
            accept={MARK_SCHEME_ACCEPT}
            onFile={(f) => void loadFile(f)}
            title="Drop your mark scheme"
            hint={<Label>PDF, text or a photo</Label>}
          />
          <div className="flex items-center justify-center gap-3">
            <TextButton onClick={() => { setError(undefined); setMode("paste"); }}>Paste it instead</TextButton>
            {criteria.length > 0 && (
              <>
                <span aria-hidden="true" className="text-grey-500">·</span>
                <TextButton onClick={() => setMode("view")}>Keep current</TextButton>
              </>
            )}
          </div>
        </div>
      )}

      {!reading && mode === "paste" && (
        <div className="mt-5 flex flex-col gap-3">
          <TextArea
            value={pasted}
            onChange={setPasted}
            ariaLabel="Paste your mark scheme"
            placeholder={"One criterion per line, e.g.\nLiterature review 20%\nMethod 30%\nResults 30%\nPresentation 20%"}
            rows={7}
          />
          <div className="flex items-center justify-between">
            <TextButton onClick={() => setMode(criteria.length ? "view" : "upload")}>Back</TextButton>
            <Button size="sm" onClick={loadPaste} disabled={!pasted.trim()}>
              Find criteria
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-row bg-orange-halo px-4 py-3 text-body text-ink">
          {error}
        </p>
      )}

      {!reading && mode === "view" && criteria.length > 0 && (
        <>
          <div className="mt-5 flex items-center gap-3 rounded-card-sm border-line border-ink bg-white px-5 py-4">
            <TemplateIcon name="document" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-display text-h3 font-semibold tracking-h3 text-ink">{value?.source}</span>
              <Label>
                {criteria.length} criteria · {total}%
              </Label>
            </div>
          </div>

          <ul className="mt-5 flex flex-col gap-4">
            {criteria.map((c) => (
              <li key={c.id}>
                <div className="flex items-center gap-2">
                  <input
                    value={c.name}
                    onChange={(e) => update(c.id, { name: e.target.value })}
                    aria-label="Criterion name"
                    placeholder="Criterion"
                    className="min-w-0 flex-1 rounded-row border-line border-transparent bg-transparent px-2 py-1 text-body text-ink hover:border-grey-150 focus:border-ink focus:bg-white focus:outline-none"
                  />
                  <span className="flex items-center rounded-full border-line border-grey-150 bg-white pr-2.5 focus-within:border-ink">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={100}
                      value={c.weight}
                      onChange={(e) => update(c.id, { weight: Math.max(0, Math.min(100, Math.round(Number(e.target.value) || 0))) })}
                      aria-label={`Weight of ${c.name || "criterion"}, percent`}
                      className="w-12 bg-transparent py-1 pl-3 text-right font-mono text-label text-ink focus:outline-none"
                    />
                    <span className="font-mono text-label text-grey-500">%</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => set(criteria.filter((x) => x.id !== c.id))}
                    aria-label={`Remove ${c.name || "criterion"}`}
                    className="rounded-full px-1.5 font-mono text-label text-grey-500 hover:text-ink focus-visible:outline-2 focus-visible:outline-orange"
                  >
                    ✕
                  </button>
                </div>
                <div className="mx-2 mt-1.5 h-1.5 rounded-full bg-grey-100">
                  <div
                    className={cn("h-full rounded-full", c.id === top?.id ? "bg-orange" : "bg-ink")}
                    style={{ width: `${(c.weight / max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between">
            {criteria.length < 12 ? (
              <TextButton onClick={() => set([...criteria, { id: newId(criteria), name: "", weight: 0 }])}>+ Add criterion</TextButton>
            ) : (
              <span />
            )}
            {total !== 100 && (
              <TextButton onClick={() => set(normaliseWeights(criteria))}>Total {total}% · scale to 100</TextButton>
            )}
          </div>

          {top && lightest && top !== lightest && (
            <p className="mt-5 text-body text-grey-700">
              Each comment is tagged with a criterion. {top.name || "The top criterion"} gets the most attention,{" "}
              {(lightest.name || "the lightest").toLowerCase()} the least.
            </p>
          )}

          <div className="mt-4">
            <TextButton onClick={() => { onChange(undefined); setMode("upload"); }}>Remove mark scheme</TextButton>
          </div>
        </>
      )}
    </aside>
  );
}
