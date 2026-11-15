"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Assessor, CommentSeverity, ReviewView } from "./types";
import { commentsByParagraph, indexAssessors, paragraphLabel, paragraphOrder, sortByParagraph } from "./lib";
import { Tabs, type TabItem } from "./ui/Tabs";
import { TopBar } from "./components/TopBar";
import { DocumentPane } from "./components/DocumentPane";
import { CommentMargin, type Passage } from "./components/CommentMargin";
import { BoardDiscussion } from "./components/DeliberationCard";
import { BoardLiveCard, EmptyState, FailedCard } from "./components/StatusCards";
import { FeedbackReport } from "@/features/feedback/FeedbackReport";
import { ExitBubble } from "./ui/ExitBubble";
import { CommentFilters } from "./components/CommentFilters";

/** §10: two tabs across the top, Comments and Feedback report. */
export type RailTab = "comments" | "report";
type ScrollRequest = { kind: "paragraph" | "comment"; id: string; nonce: number };

export function ReviewScreen({
  view,
  onUpload,
  onRetryAssessor,
  onRetryDeliberation,
  onCommentDone,
  onActionDone,
  initialTab = "comments",
  startControl,
}: {
  view: ReviewView;
  onUpload?: () => void;
  onRetryAssessor?: (assessorId: string) => void;
  onRetryDeliberation?: () => void;
  /** Saves "Mark done" on a comment (saved reviews only). */
  onCommentDone?: (commentId: string) => void;
  /** Saves a tick on a feedback report action (saved reviews only). */
  onActionDone?: (actionId: string, done: boolean) => void;
  initialTab?: RailTab;
  startControl?: ReactNode;
}) {
  const router = useRouter();
  const { review, board, live } = view;
  const doc = view.document;

  const [tab, setTab] = useState<RailTab>(initialTab);
  const chooseTab = (next: RailTab) => {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === "report") url.searchParams.set("tab", "report");
    else url.searchParams.delete("tab");
    window.history.replaceState(null, "", url);
  };
  const [resolved, setResolved] = useState<Set<string>>(
    () => new Set(review.comments.filter((c) => c.done).map((c) => c.id)),
  );
  const [selectedParagraphId, setSelectedParagraphId] = useState<string>();
  const [, setSelectedCommentIds] = useState<Set<string>>(() => new Set());
  const [scrollRequest, setScrollRequest] = useState<ScrollRequest>();
  const [kindFilter, setKindFilter] = useState<CommentSeverity | "all">("all");
  const [assessorFilter, setAssessorFilter] = useState<Set<string>>(() => new Set());

  const paragraphEls = useRef(new Map<string, HTMLElement>());
  const commentEls = useRef(new Map<string, HTMLElement>());

  const assessors = useMemo(() => indexAssessors(view.assessors), [view.assessors]);
  const boardMembers = useMemo(
    () => board.assessorIds.map((id) => assessors.get(id)).filter((a): a is Assessor => Boolean(a)),
    [board.assessorIds, assessors],
  );
  const order = useMemo(() => paragraphOrder(doc), [doc]);
  const openComments = useMemo(
    () => sortByParagraph(review.comments.filter((c) => !resolved.has(c.id)), order),
    [review.comments, resolved, order],
  );
  const openByParagraph = useMemo(() => commentsByParagraph(openComments), [openComments]);
  // Filters narrow both the rail and the highlights in the document.
  const filtering = kindFilter !== "all" || assessorFilter.size > 0;
  const visibleComments = useMemo(
    () =>
      openComments.filter(
        (c) => (kindFilter === "all" || c.severity === kindFilter) && (assessorFilter.size === 0 || assessorFilter.has(c.assessorId)),
      ),
    [openComments, kindFilter, assessorFilter],
  );
  const visibleByParagraph = useMemo(() => commentsByParagraph(visibleComments), [visibleComments]);
  const commenters = useMemo(
    () => boardMembers.filter((a) => openComments.some((c) => c.assessorId === a.id)),
    [boardMembers, openComments],
  );
  /** One margin card per commented paragraph, in document order. */
  const passages: Passage[] = useMemo(
    () =>
      [...visibleByParagraph]
        .sort(([a], [b]) => (order.get(a) ?? 0) - (order.get(b) ?? 0))
        .map(([paragraphId, comments]) => ({ paragraphId, label: paragraphLabel(doc, paragraphId), comments })),
    [visibleByParagraph, order, doc],
  );
  const paragraphEl = useCallback((id: string) => paragraphEls.current.get(id), []);
  const openMajorCount = openComments.filter((c) => c.severity === "major").length;

  // Scroll after the DOM has updated (e.g. after switching back to the Comments tab).
  useEffect(() => {
    if (!scrollRequest) return;
    const map = scrollRequest.kind === "paragraph" ? paragraphEls.current : commentEls.current;
    map.get(scrollRequest.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [scrollRequest]);

  const requestScroll = (kind: ScrollRequest["kind"], id: string) =>
    setScrollRequest((prev) => ({ kind, id, nonce: (prev?.nonce ?? 0) + 1 }));

  const registerParagraph = useCallback((id: string, el: HTMLElement | null) => {
    if (el) paragraphEls.current.set(id, el);
    else paragraphEls.current.delete(id);
  }, []);

  const registerComment = useCallback((id: string, el: HTMLElement | null) => {
    if (el) commentEls.current.set(id, el);
    else commentEls.current.delete(id);
  }, []);

  /** Comment -> its paragraph. */
  const showParagraph = (paragraphId: string, fromCommentId?: string) => {
    chooseTab("comments");
    setSelectedParagraphId(paragraphId);
    setSelectedCommentIds(new Set(fromCommentId ? [fromCommentId] : []));
    requestScroll("paragraph", paragraphId);
  };

  /** Highlighted paragraph -> its comments in the rail. */
  const showCommentsFor = (paragraphId: string) => {
    const onParagraph = visibleByParagraph.get(paragraphId) ?? [];
    if (onParagraph.length === 0) return;
    chooseTab("comments");
    setSelectedParagraphId(paragraphId);
    setSelectedCommentIds(new Set(onParagraph.map((c) => c.id)));
    requestScroll("comment", onParagraph[0].id);
  };

  const resolve = (commentId: string) => {
    setResolved((prev) => new Set(prev).add(commentId));
    onCommentDone?.(commentId);
    setSelectedCommentIds((prev) => {
      const next = new Set(prev);
      next.delete(commentId);
      return next;
    });
    // Drop the paragraph selection if nothing is left open on it.
    const comment = review.comments.find((c) => c.id === commentId);
    if (
      comment &&
      selectedParagraphId &&
      comment.paragraphId === selectedParagraphId &&
      (openByParagraph.get(selectedParagraphId) ?? []).every((c) => c.id === commentId)
    ) {
      setSelectedParagraphId(undefined);
    }
  };

  const tabs: TabItem<RailTab>[] = [
    { id: "comments", label: "Comments", count: openComments.length },
    { id: "report", label: "Feedback report" },
  ];

  const isLive = live && (live.status === "reviewing" || (live.status === "deliberating" && !live.deliberationError));
  const stillReading = (live?.reading ?? []).length;
  const failed = (live?.failed ?? [])
    .map((f) => ({ ...f, assessor: assessors.get(f.assessorId) }))
    .filter((f): f is typeof f & { assessor: Assessor } => Boolean(f.assessor));

  return (
    <div className="flex h-dvh flex-col bg-white">
      <TopBar
        view={view}
        boardMembers={boardMembers}
        onUpload={onUpload ?? (() => router.push(`/review/new?project=${encodeURIComponent(view.project.id)}`))}
      />

      {/* Document and comment margin scroll together as one page (§9 Comment anchors). */}
      <main className="flex min-h-0 flex-1 items-start gap-6 overflow-y-auto px-14">
        <section className="min-w-0 flex-1 pt-6" aria-label="Document">
          <DocumentPane
            doc={doc}
            openByParagraph={visibleByParagraph}
            openCommentCount={openComments.length}
            openMajorCount={openMajorCount}
            assessors={assessors}
            selectedParagraphId={selectedParagraphId}
            onParagraphClick={showCommentsFor}
            registerParagraph={registerParagraph}
          />
        </section>

        <aside className="flex w-full max-w-rail shrink-0 flex-col pt-6" aria-label="Board feedback">
          {/* Tabs and filters stay put; below them the margin starts level with the document. */}
          <div className="sticky top-0 z-10 flex flex-col gap-3 bg-white pb-3">
            <Tabs items={tabs} active={tab} onChange={chooseTab} />
            {tab === "comments" && (
              <>
                {openComments.length > 0 && (
                  <CommentFilters
                    kind={kindFilter}
                    onKind={setKindFilter}
                    assessors={commenters}
                    selected={assessorFilter}
                    onToggleAssessor={(id) =>
                      setAssessorFilter((prev) => {
                        const next = new Set(prev);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        return next;
                      })
                    }
                  />
                )}
              </>
            )}
          </div>

          <div key={tab} className="mt-2 pb-10">
            {tab === "comments" && (
              <div className="flex flex-col gap-3">
                {startControl}
                {isLive && live && (live.status === "reviewing" || live.status === "deliberating") && (
                  <BoardLiveCard
                    board={boardMembers}
                    status={live.status}
                    doneIds={live.doneAssessorIds}
                    failedIds={(live.failed ?? []).map((f) => f.assessorId)}
                    onRetry={onRetryAssessor}
                  />
                )}


                {!isLive && failed.map((f) => (
                  <FailedCard
                    key={f.assessorId}
                    assessor={f.assessor}
                    message={f.message}
                    onRetry={onRetryAssessor ? () => onRetryAssessor(f.assessorId) : undefined}
                  />
                ))}


                {filtering && visibleComments.length === 0 && openComments.length > 0 && (
                  <EmptyState title="No comments match these filters" body="Choose All to see every open comment." />
                )}

                {passages.length > 0 && (
                  <CommentMargin
                    passages={passages}
                    assessors={assessors}
                    paragraphEl={paragraphEl}
                    selectedParagraphId={selectedParagraphId}
                    layoutKey={`${visibleComments.length}-${review.deliberation ? 1 : 0}-${isLive ? 1 : 0}-${failed.length}`}
                    onSelect={(pid, cid) => showParagraph(pid, cid)}
                    onDone={resolve}
                    registerComment={registerComment}
                  />
                )}


                {live?.deliberationError && (
                  <FailedCard
                    title="The board couldn't deliberate"
                    message={live.deliberationError}
                    onRetry={onRetryDeliberation}
                  />
                )}

                {!startControl && !isLive && openComments.length === 0 && stillReading === 0 && failed.length === 0 && (
                  <EmptyState
                    title={review.comments.length > 0 ? "Everything is marked done" : "No comments yet"}
                    body={
                      review.comments.length > 0
                        ? "Upload a new version when you're ready for another run."
                        : "Comments appear here as each assessor finishes reading."
                    }
                  />
                )}
              </div>
            )}

            {tab === "report" && review.deliberation && (
              <div className="mb-4">
                <BoardDiscussion deliberation={review.deliberation} assessors={assessors} />
              </div>
            )}
            {tab === "report" &&
              (review.report ? (
                <FeedbackReport
                  report={review.report}
                  people={view.assessors}
                  sample={review.replySource === "sample"}
                  paragraphLabel={(pid) => paragraphLabel(doc, pid)}
                  onShowParagraph={(pid) => showParagraph(pid)}
                  onToggleAction={onActionDone}
                />
              ) : (
                <EmptyState
                  title="No feedback report yet"
                  body="It is written once every assessor has read and the board has compared notes."
                />
              ))}
          </div>
        </aside>
      </main>
      <ExitBubble />
    </div>
  );
}
