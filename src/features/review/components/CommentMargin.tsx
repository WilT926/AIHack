"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { Assessor, Comment } from "../types";
import { cn } from "../ui/cn";
import { Avatar } from "../ui/Avatar";
import { Card } from "../ui/Card";
import { Label } from "../ui/Label";
import { Pill, type PillVariant } from "../ui/Pill";

const GAP = 12;
const severityPill: Record<"major" | "minor", PillVariant> = { major: "accent", minor: "outline" };
const rank = { major: 0, minor: 1, praise: 2 } as const;

/** One passage (a paragraph) and every open comment on it. */
export type Passage = { paragraphId: string; label: string; comments: Comment[] };

/**
 * Comments as in Word (§9 Comment anchors): one card per passage, level with
 * it in the margin. Cards never overlap; a card pushed down keeps a thin
 * connector back to its passage. Several assessors on one passage share the
 * card and are stepped through by avatar or arrows.
 */
export function CommentMargin({
  passages,
  assessors,
  paragraphEl,
  selectedParagraphId,
  layoutKey,
  onSelect,
  onDone,
  registerComment,
}: {
  passages: Passage[];
  assessors: Map<string, Assessor>;
  paragraphEl: (paragraphId: string) => HTMLElement | undefined;
  selectedParagraphId?: string;
  /** Changes whenever the document's layout may have changed. */
  layoutKey: string;
  onSelect: (paragraphId: string, commentId?: string) => void;
  onDone: (commentId: string) => void;
  registerComment: (commentId: string, el: HTMLElement | null) => void;
}) {
  const marginRef = useRef<HTMLDivElement>(null);
  const cardEls = useRef(new Map<string, HTMLElement>());
  const [pos, setPos] = useState<Record<string, { want: number; top: number }>>({});
  const [height, setHeight] = useState(0);

  const place = useCallback(() => {
    const margin = marginRef.current;
    if (!margin) return;
    const base = margin.getBoundingClientRect().top;
    const next: Record<string, { want: number; top: number }> = {};
    let floor = 0;
    for (const p of passages) {
      const para = paragraphEl(p.paragraphId);
      const card = cardEls.current.get(p.paragraphId);
      if (!card) continue;
      // No passage on screen (e.g. a sample without its text): stack in order.
      const want = para ? Math.max(0, para.getBoundingClientRect().top - base) : floor;
      const top = Math.max(want, floor);
      next[p.paragraphId] = { want, top };
      floor = top + card.offsetHeight + GAP;
    }
    setPos((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    setHeight(floor);
  }, [passages, paragraphEl]);

  useLayoutEffect(() => {
    place();
    const ro = new ResizeObserver(() => place());
    const doc = marginRef.current?.closest("main");
    if (doc) ro.observe(doc);
    cardEls.current.forEach((el) => ro.observe(el));
    window.addEventListener("resize", place);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [place, layoutKey, selectedParagraphId]);

  return (
    <div ref={marginRef} className="relative" style={{ minHeight: height }} aria-label="Comments in the margin">
      {passages.map((p) => {
        const at = pos[p.paragraphId];
        const pushed = at ? at.top - at.want : 0;
        return (
          <div
            key={p.paragraphId}
            ref={(el) => {
              if (el) cardEls.current.set(p.paragraphId, el);
              else cardEls.current.delete(p.paragraphId);
              for (const c of p.comments) registerComment(c.id, el);
            }}
            className="absolute inset-x-0 scroll-mt-16 transition-[top] duration-200"
            style={{ top: at?.top ?? 0, visibility: at ? "visible" : "hidden" }}
          >
            {pushed > 4 && (
              <span
                aria-hidden
                className="pointer-events-none absolute -left-4 w-3 border-t-line border-l-line border-grey-300"
                style={{ top: -pushed + 10, height: pushed }}
              />
            )}
            <PassageCard
              passage={p}
              assessors={assessors}
              selected={selectedParagraphId === p.paragraphId}
              onSelect={onSelect}
              onDone={onDone}
            />
          </div>
        );
      })}
    </div>
  );
}

function PassageCard({
  passage,
  assessors,
  selected,
  onSelect,
  onDone,
}: {
  passage: Passage;
  assessors: Map<string, Assessor>;
  selected: boolean;
  onSelect: (paragraphId: string, commentId?: string) => void;
  onDone: (commentId: string) => void;
}) {
  const points = passage.comments.filter((c) => c.severity !== "praise").sort((a, b) => rank[a.severity] - rank[b.severity]);
  const keep = passage.comments.filter((c) => c.severity === "praise");
  const [step, setStep] = useState(0);
  const i = Math.min(step, Math.max(0, points.length - 1));
  const current = points[i];
  const who = current ? assessors.get(current.assessorId) : undefined;
  const go = (n: number) => {
    const k = (n + points.length) % points.length;
    setStep(k);
    onSelect(passage.paragraphId, points[k]?.id);
  };

  return (
    // Clicking the card (not its buttons) scrolls to and selects its highlight.
    <div
      className="cursor-pointer"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        onSelect(passage.paragraphId, current?.id);
      }}
    >
    <Card selected={selected}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5" role="group" aria-label="Assessors on this passage">
          {points.map((c, k) => {
            const a = assessors.get(c.assessorId);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => go(k)}
                aria-pressed={k === i}
                aria-label={`${a?.name ?? "Assessor"}, ${c.severity}`}
                className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
              >
                <Avatar avatar={a?.avatar ?? ""} name={a?.name ?? ""} size="sm" ring={k === i ? "ink" : "none"} />
              </button>
            );
          })}
        </div>
        <span className="flex items-center gap-2">
          <Label size="sm">{passage.label}</Label>
          {points.length > 1 && (
            <span className="flex items-center gap-1">
              <button type="button" onClick={() => go(i - 1)} aria-label="Previous comment" className="font-mono text-label text-grey-500 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange">←</button>
              <Label size="sm">
                {i + 1} of {points.length}
              </Label>
              <button type="button" onClick={() => go(i + 1)} aria-label="Next comment" className="font-mono text-label text-grey-500 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange">→</button>
            </span>
          )}
        </span>
      </div>

      {current && (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1">
              <span className="block text-body font-semibold text-ink">{who?.name ?? "Unknown assessor"}</span>
              {who && <Label size="sm">{who.field}</Label>}
            </span>
            <Pill variant={severityPill[current.severity as "major" | "minor"]}>{current.severity}</Pill>
          </div>
          <p className="mt-2 text-body text-grey-900">{current.text}</p>
          {current.suggestion && <p className="mt-2 text-small text-grey-700">{current.suggestion}</p>}
          <button
            type="button"
            onClick={() => {
              onDone(current.id);
              setStep(0);
            }}
            className="mt-3 flex items-center gap-2 text-small text-grey-700 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
          >
            <span aria-hidden className="flex size-4 items-center justify-center rounded-full border-line border-ink text-label leading-none">
              ✓
            </span>
            Mark done
          </button>
        </div>
      )}

      {keep.length > 0 && (
        <div className={cn(current && "mt-3 border-t border-grey-100 pt-3")}>
          <Label size="sm">Keep</Label>
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {keep.map((c) => (
              <li key={c.id} className="flex items-start gap-2 text-small text-grey-900">
                <Avatar avatar={assessors.get(c.assessorId)?.avatar ?? ""} name={assessors.get(c.assessorId)?.name ?? ""} size="sm" />
                <span className="min-w-0 flex-1">{c.text}</span>
                <button type="button" onClick={() => onDone(c.id)} aria-label="Mark done" className="font-mono text-label text-grey-500 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange">✓</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
    </div>
  );
}
