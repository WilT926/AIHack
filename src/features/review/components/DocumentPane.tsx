import type { Assessor, Comment, Document } from "../types";
import { plural, quoteRuns } from "../lib";
import { cn } from "../ui/cn";
import { Label } from "../ui/Label";

/**
 * The document, with §9 comment anchors: every commented paragraph gets a
 * numbered disc in the margin. An open major comment is an orange disc with
 * an ink numeral; other open comments are a white disc with a 1.5px ink line.
 * The words a comment quotes carry the 1.5px ink underline.
 */
export function DocumentPane({
  doc,
  openByParagraph,
  openCommentCount,
  openMajorCount,
  selectedParagraphId,
  onParagraphClick,
  registerParagraph,
}: {
  doc: Document;
  openByParagraph: Map<string, Comment[]>;
  openCommentCount: number;
  openMajorCount: number;
  assessors: Map<string, Assessor>;
  selectedParagraphId?: string;
  onParagraphClick: (paragraphId: string) => void;
  registerParagraph: (paragraphId: string, el: HTMLElement | null) => void;
}) {
  const meta = [
    plural(doc.paragraphs.filter((p) => p.type === "paragraph").length, "paragraph", "paragraphs"),
    plural(openCommentCount, "comment", "comments"),
    plural(openMajorCount, "major point", "major points"),
  ].join(" · ");

  return (
    <article className="mx-auto min-h-full w-full max-w-sheet rounded-t-sheet border-line border-b-0 border-grey-150 bg-white px-16 pt-12 pb-28">
      {doc.chapter && <Label tone="accent">{doc.chapter}</Label>}
      <h1 className="mt-1.5 font-display text-h1 font-semibold tracking-h1 text-ink">{doc.title}</h1>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b border-grey-100 pb-3">
        <Label>{meta}</Label>
        <span className="flex items-center gap-3" aria-label="Anchor key">
          <span className="flex items-center gap-1.5">
            <mark className="bg-orange-halo px-1 text-inherit underline decoration-orange decoration-[1.5px] underline-offset-4"><Label>Major</Label></mark>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="underline decoration-ink decoration-[1.5px] underline-offset-4"><Label>Minor</Label></span>
          </span>
        </span>
      </div>

      {doc.paragraphs.length === 0 ? (
        <p className="py-16 text-center text-body text-grey-700">The saved text is unavailable for this document. Sample documents may include a title and feedback only. Upload a new version to review your own text.</p>
      ) : (
        <ol className="mt-6 -ml-12 flex flex-col gap-4">
          {doc.paragraphs.map((p) => {
            const open = openByParagraph.get(p.id) ?? [];
            // Praise is never marked in the text; it is listed under the card as Keep.
            const marked = open.filter((c) => c.severity !== "praise");
            const major = marked.some((c) => c.severity === "major");
            const quoted = marked.filter((c) => c.quote);
            const bar = marked.length > quoted.length;
            const runs = quoteRuns(p.text, quoted.map((c) => c.quote ?? ""));
            const selected = selectedParagraphId === p.id;
            const Text = p.type === "heading" ? "h2" : "p";
            const activate = () => onParagraphClick(p.id);

            return (
              <li key={p.id} ref={(el) => registerParagraph(p.id, el)} className="grid scroll-mt-6 grid-cols-paragraph items-start gap-2">
                <span className="justify-self-center pt-1.5 font-mono text-label text-grey-300">{p.index}</span>
                <Text
                  onClick={open.length ? activate : undefined}
                  role={open.length ? "button" : undefined}
                  tabIndex={open.length ? 0 : undefined}
                  onKeyDown={open.length ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); } } : undefined}
                  aria-label={open.length ? `Paragraph ${p.index}: ${open.length} open ${open.length === 1 ? "comment" : "comments"}` : undefined}
                  className={cn(
                    p.type === "heading" ? "font-display text-h3-lg font-semibold tracking-h3 text-ink" : "text-reading text-grey-900",
                    open.length > 0 && "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange",
                    bar && "-ml-3 border-l-line pl-3",
                    bar && (major ? "border-orange" : "border-ink"),
                    selected && "rounded-row bg-grey-50",
                  )}
                >
                  {runs.map((r, i) =>
                    r.quoted ? (
                      <mark
                        key={i}
                        className={cn(
                          "text-inherit underline decoration-[1.5px] underline-offset-4",
                          major ? "bg-orange-halo decoration-orange" : "bg-transparent decoration-ink",
                          selected && "outline-line outline-ink",
                        )}
                      >
                        {r.text}
                      </mark>
                    ) : (
                      <span key={i}>{r.text}</span>
                    ),
                  )}
                </Text>
                <span aria-hidden />
              </li>
            );
          })}
        </ol>
      )}
    </article>
  );
}
