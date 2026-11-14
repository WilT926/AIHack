import type { Assessor, Comment, CommentKind, Document } from "../types";
import { dominantKind, plural } from "../lib";
import { cn } from "../ui/cn";
import { Label } from "../ui/Label";
import { Avatar } from "../ui/Avatar";

const kindClass: Record<CommentKind, string> = {
  critique: "bg-critique-tint border-accent",
  question: "bg-question-tint border-ink",
  praise: "bg-praise-tint border-graphite",
};

export function DocumentPane({
  doc,
  openByParagraph,
  openCommentCount,
  openQuestionCount,
  assessors,
  selectedParagraphId,
  onParagraphClick,
  registerParagraph,
}: {
  doc: Document;
  openByParagraph: Map<string, Comment[]>;
  openCommentCount: number;
  openQuestionCount: number;
  assessors: Map<string, Assessor>;
  selectedParagraphId?: string;
  onParagraphClick: (paragraphId: string) => void;
  registerParagraph: (paragraphId: string, el: HTMLElement | null) => void;
}) {
  const meta = [
    plural(doc.paragraphs.filter((p) => p.type === "paragraph").length, "paragraph", "paragraphs"),
    plural(openCommentCount, "comment", "comments"),
    plural(openQuestionCount, "open question", "open questions"),
  ].join(" · ");

  return (
    <article className="mx-auto min-h-full w-full max-w-sheet rounded-t-lg border border-b-0 border-rule bg-surface px-16 pt-12 pb-24">
      {doc.chapter && <Label tone="accent">{doc.chapter}</Label>}
      <h1 className="mt-1.5 text-3xl font-extrabold tracking-heading text-ink">{doc.title}</h1>
      <div className="mt-3 border-b border-rule pb-3">
        <Label>{meta}</Label>
      </div>

      {doc.paragraphs.length === 0 ? (
        <p className="py-16 text-center text-body text-text-muted">This document has no paragraphs yet.</p>
      ) : (
        <ol className="mt-6 -ml-10 flex flex-col gap-3">
          {doc.paragraphs.map((p) => {
            const open = openByParagraph.get(p.id) ?? [];
            const kind = dominantKind(open);
            const commenters = [...new Set(open.map((c) => c.assessorId))]
              .map((id) => assessors.get(id))
              .filter((a): a is Assessor => Boolean(a));
            const selected = selectedParagraphId === p.id;
            const Text = p.type === "heading" ? "h2" : "p";

            return (
              <li
                key={p.id}
                ref={(el) => registerParagraph(p.id, el)}
                className="grid scroll-mt-6 grid-cols-paragraph items-start gap-2"
              >
                <span className="pt-2.5 font-mono text-label text-text-muted">¶{p.index}</span>
                <div
                  role={kind ? "button" : undefined}
                  tabIndex={kind ? 0 : undefined}
                  onClick={kind ? () => onParagraphClick(p.id) : undefined}
                  onKeyDown={
                    kind
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onParagraphClick(p.id);
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    "rounded-sm border-l-4 px-3 py-2 transition-colors",
                    kind ? cn(kindClass[kind], "cursor-pointer") : "border-transparent",
                    selected && "ring-2 ring-ink",
                    kind && "focus-visible:outline-2 focus-visible:outline-focus",
                  )}
                >
                  <Text
                    className={cn(
                      "text-ink",
                      p.type === "heading" ? "text-title font-bold tracking-heading" : "text-reading",
                    )}
                  >
                    {p.text}
                  </Text>
                </div>
                <div className="flex flex-col items-center gap-1 pt-1">
                  {commenters.map((a) => (
                    <Avatar key={a.id} avatar={a.avatar} name={a.name} size="sm" />
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </article>
  );
}
