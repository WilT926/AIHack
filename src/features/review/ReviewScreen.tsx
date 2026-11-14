"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Assessor, CommentKind, ReviewView } from "./types";
import { commentsByParagraph, indexAssessors, paragraphLabel, paragraphOrder, sortByParagraph } from "./lib";
import { Tabs, type TabItem } from "./ui/Tabs";
import { TopBar } from "./components/TopBar";
import { DocumentPane } from "./components/DocumentPane";
import { CommentCard } from "./components/CommentCard";
import { ConsensusCard, DeliberationCard } from "./components/DeliberationCard";
import { ArrivingCard, BoardLiveCard, EmptyState, FailedCard } from "./components/StatusCards";
import { DeliberationTab, FixListTab, QuestionsTab } from "./components/RailTabs";
import { CommentFilters } from "./components/CommentFilters";

type RailTab = "comments" | "deliberation" | "fixes" | "questions";
type ScrollRequest = { kind: "paragraph" | "comment"; id: string; nonce: number };

export function ReviewScreen({
  view,
  onUpload,
  onRetryAssessor,
  onRetryDeliberation,
}: {
  view: ReviewView;
  onUpload?: () => void;
  onRetryAssessor?: (assessorId: string) => void;
  onRetryDeliberation?: () => void;
}) {
  const router = useRouter();
  const { run, board, live } = view;
  const doc = run.document;

  const [tab, setTab] = useState<RailTab>("comments");
  const [resolved, setResolved] = useState<Set<string>>(
    () => new Set(run.comments.filter((c) => c.resolved).map((c) => c.id)),
  );
  const [selectedParagraphId, setSelectedParagraphId] = useState<string>();
  const [selectedCommentIds, setSelectedCommentIds] = useState<Set<string>>(() => new Set());
  const [replies, setReplies] = useState<Record<string, string[]>>({});
  const [scrollRequest, setScrollRequest] = useState<ScrollRequest>();
  const [kindFilter, setKindFilter] = useState<CommentKind | "all">("all");
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
    () => sortByParagraph(run.comments.filter((c) => !resolved.has(c.id)), order),
    [run.comments, resolved, order],
  );
  const openByParagraph = useMemo(() => commentsByParagraph(openComments), [openComments]);
  // Filters narrow both the rail and the highlights in the document.
  const filtering = kindFilter !== "all" || assessorFilter.size > 0;
  const visibleComments = useMemo(
    () =>
      openComments.filter(
        (c) => (kindFilter === "all" || c.kind === kindFilter) && (assessorFilter.size === 0 || assessorFilter.has(c.assessorId)),
      ),
    [openComments, kindFilter, assessorFilter],
  );
  const visibleByParagraph = useMemo(() => commentsByParagraph(visibleComments), [visibleComments]);
  const commenters = useMemo(
    () => boardMembers.filter((a) => openComments.some((c) => c.assessorId === a.id)),
    [boardMembers, openComments],
  );
  const openQuestionCount = openComments.filter((c) => c.kind === "question").length;

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
    setSelectedParagraphId(paragraphId);
    setSelectedCommentIds(new Set(fromCommentId ? [fromCommentId] : []));
    requestScroll("paragraph", paragraphId);
  };

  /** Highlighted paragraph -> its comments in the rail. */
  const showCommentsFor = (paragraphId: string) => {
    const onParagraph = visibleByParagraph.get(paragraphId) ?? [];
    if (onParagraph.length === 0) return;
    setTab("comments");
    setSelectedParagraphId(paragraphId);
    setSelectedCommentIds(new Set(onParagraph.map((c) => c.id)));
    requestScroll("comment", onParagraph[0].id);
  };

  const resolve = (commentId: string) => {
    setResolved((prev) => new Set(prev).add(commentId));
    setSelectedCommentIds((prev) => {
      const next = new Set(prev);
      next.delete(commentId);
      return next;
    });
    // Drop the paragraph selection if nothing is left open on it.
    const comment = run.comments.find((c) => c.id === commentId);
    if (
      comment &&
      selectedParagraphId &&
      comment.paragraphIds.includes(selectedParagraphId) &&
      (openByParagraph.get(selectedParagraphId) ?? []).every((c) => c.id === commentId)
    ) {
      setSelectedParagraphId(undefined);
    }
  };

  const tabs: TabItem<RailTab>[] = [
    { id: "comments", label: "Comments", count: openComments.length },
    { id: "deliberation", label: "Deliberation" },
    { id: "fixes", label: "Fix list", count: run.fixList.length },
    { id: "questions", label: "Likely questions", count: run.questions.length },
  ];

  const headlineSplit = run.deliberation?.splits[0];
  const readers = (live?.reading ?? [])
    .map((r) => ({ ...r, assessor: assessors.get(r.assessorId) }))
    .filter((r): r is typeof r & { assessor: Assessor } => Boolean(r.assessor));
  const failed = (live?.failed ?? [])
    .map((f) => ({ ...f, assessor: assessors.get(f.assessorId) }))
    .filter((f): f is typeof f & { assessor: Assessor } => Boolean(f.assessor));

  return (
    <div className="flex h-dvh flex-col bg-dots">
      <TopBar
        view={view}
        boardMembers={boardMembers}
        onUpload={onUpload ?? (() => router.push("/review/new"))}
      />

      <main className="flex min-h-0 flex-1 gap-6 px-14">
        <section className="min-w-0 flex-1 overflow-y-auto pt-6" aria-label="Document">
          <DocumentPane
            doc={doc}
            openByParagraph={visibleByParagraph}
            openCommentCount={openComments.length}
            openQuestionCount={openQuestionCount}
            assessors={assessors}
            selectedParagraphId={selectedParagraphId}
            onParagraphClick={showCommentsFor}
            registerParagraph={registerParagraph}
          />
        </section>

        <aside className="flex w-full max-w-rail shrink-0 flex-col pt-6" aria-label="Board feedback">
          <Tabs items={tabs} active={tab} onChange={setTab} />

          <div className="mt-5 min-h-0 flex-1 overflow-y-auto pb-10">
            {tab === "comments" && (
              <div className="flex flex-col gap-3">
                {live && (live.status === "reviewing" || (live.status === "deliberating" && !live.deliberationError)) && (
                  <BoardLiveCard
                    board={boardMembers}
                    status={live.status}
                    doneIds={live.doneAssessorIds}
                    failedIds={(live.failed ?? []).map((f) => f.assessorId)}
                  />
                )}

                {headlineSplit && (
                  <div className="mb-1">
                    <DeliberationCard
                      split={headlineSplit}
                      seconds={run.deliberation?.seconds}
                      paragraphLabel={headlineSplit.paragraphIds[0] ? paragraphLabel(doc, headlineSplit.paragraphIds[0]) : ""}
                      assessors={assessors}
                    />
                  </div>
                )}

                {run.deliberation && !headlineSplit && (
                  <ConsensusCard
                    seconds={run.deliberation.seconds}
                    agreements={run.deliberation.agreements}
                    fixCount={run.fixList.length}
                    onShowFixes={() => setTab("fixes")}
                  />
                )}

                {failed.map((f) => (
                  <FailedCard
                    key={f.assessorId}
                    assessor={f.assessor}
                    message={f.message}
                    onRetry={onRetryAssessor ? () => onRetryAssessor(f.assessorId) : undefined}
                  />
                ))}

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

                {filtering && visibleComments.length === 0 && openComments.length > 0 && (
                  <EmptyState title="No comments match these filters" body="Choose All to see every open comment." />
                )}

                {visibleComments.map((c) => (
                  <CommentCard
                    key={c.id}
                    ref={(el) => registerComment(c.id, el)}
                    comment={c}
                    assessor={assessors.get(c.assessorId)}
                    paragraphLabels={c.paragraphIds.map((id) => ({ id, label: paragraphLabel(doc, id) }))}
                    replies={replies[c.id] ?? []}
                    selected={selectedCommentIds.has(c.id)}
                    onShowInText={() => c.paragraphIds[0] && showParagraph(c.paragraphIds[0], c.id)}
                    onShowParagraph={(pid) => showParagraph(pid, c.id)}
                    onResolve={() => resolve(c.id)}
                    onReply={(text) => setReplies((prev) => ({ ...prev, [c.id]: [...(prev[c.id] ?? []), text] }))}
                  />
                ))}

                {readers.map((r) => (
                  <ArrivingCard
                    key={r.assessorId}
                    assessor={r.assessor}
                    paragraphLabel={r.paragraphId ? paragraphLabel(doc, r.paragraphId) : undefined}
                  />
                ))}


                {live?.deliberationError && (
                  <FailedCard
                    title="The board couldn't deliberate"
                    message={live.deliberationError}
                    onRetry={onRetryDeliberation}
                  />
                )}

                {openComments.length === 0 && readers.length === 0 && failed.length === 0 && (
                  <EmptyState
                    title={run.comments.length > 0 ? "Everything is resolved" : "No comments yet"}
                    body={
                      run.comments.length > 0
                        ? "Upload a new version when you're ready for another run."
                        : "Comments appear here as each assessor finishes reading."
                    }
                  />
                )}
              </div>
            )}

            {tab === "deliberation" && (
              <DeliberationTab
                deliberation={run.deliberation}
                doc={doc}
                assessors={assessors}
                onShowParagraph={(pid) => showParagraph(pid)}
              />
            )}

            {tab === "fixes" && (
              <FixListTab
                fixList={run.fixList}
                doc={doc}
                assessors={assessors}
                onShowParagraph={(pid) => showParagraph(pid)}
              />
            )}

            {tab === "questions" && (
              <QuestionsTab questions={run.questions} boardOrder={board.assessorIds} assessors={assessors} />
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
