"use client";

// Runs a live review against Lane 1's engine routes: one request per
// assessor, all in parallel, comments shown as each returns; then one
// deliberation request once everyone has finished or failed. The
// deliberation route saves the whole review; the address bar then points at
// it, so a refresh reopens the saved review instead of calling the engine.
//
// The run's inputs are frozen when it starts, so a parent re-render can never
// restart or change a run that is already under way.
import { useCallback, useEffect, useRef, useState } from "react";
import type { FeedbackReport, ReplySource, Review } from "@/lib/schemas";
import type { Comment, Deliberation, LiveState, ReviewResult } from "../types";

type AssessorStatus = { state: "reading" } | { state: "done" } | { state: "failed"; message: string };

type DeliberationState =
  | { state: "waiting" }
  | { state: "running" }
  | { state: "done"; deliberation: Deliberation | null; report: FeedbackReport | null; comments: Comment[]; replySource: ReplySource }
  | { state: "failed"; message: string };

type Inputs = {
  projectId: string;
  documentId: string;
  reviewId: string;
  assessorIds: string[];
  replySource: ReplySource;
  /** Comments marked done so far, sent with the deliberation so they are kept. */
  doneCommentIds: () => string[];
};

type AssessorReply = { assessorId: string; status: "done" | "failed"; comments?: Comment[]; error?: string; replySource: ReplySource };

async function postJson<T>(url: string, body: unknown, signal: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal });
  } catch (err) {
    if (signal.aborted) throw err;
    throw new Error("Couldn't reach the server. Check your connection.");
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `The server returned ${res.status}.`);
  return data;
}

export function useLiveReview(start: Inputs): {
  review: ReviewResult;
  live: LiveState;
  retryAssessor: (id: string) => void;
  retryDeliberation: () => void;
} {
  const [inputs] = useState<Inputs>(start);
  const [statuses, setStatuses] = useState<Record<string, AssessorStatus>>(() =>
    Object.fromEntries(inputs.assessorIds.map((id) => [id, { state: "reading" } as AssessorStatus])),
  );
  const [replies, setReplies] = useState<Record<string, { comments: Comment[]; replySource: ReplySource }>>({});
  const [delib, setDelib] = useState<DeliberationState>({ state: "waiting" });
  const controller = useRef<AbortController | null>(null);

  const runAssessor = useCallback(
    async (assessorId: string, s: AbortSignal) => {
      setStatuses((prev) => ({ ...prev, [assessorId]: { state: "reading" } }));
      try {
        const data = await postJson<AssessorReply>(
          "/api/engine/assessor",
          { projectId: inputs.projectId, documentId: inputs.documentId, reviewId: inputs.reviewId, assessorId },
          s,
        );
        if (data.status !== "done") throw new Error(data.error ?? "The review did not finish.");
        setReplies((prev) => ({ ...prev, [assessorId]: { comments: data.comments ?? [], replySource: data.replySource } }));
        setStatuses((prev) => ({ ...prev, [assessorId]: { state: "done" } }));
      } catch (err) {
        if (s.aborted) return;
        setStatuses((prev) => ({ ...prev, [assessorId]: { state: "failed", message: err instanceof Error ? err.message : "Something went wrong." } }));
      }
    },
    [inputs],
  );

  // Start every assessor in parallel. Under React Strict Mode (dev) the effect
  // runs twice; the cleanup aborts the first set, so nothing is left hanging.
  useEffect(() => {
    const ctrl = new AbortController();
    controller.current = ctrl;
    for (const id of inputs.assessorIds) void runAssessor(id, ctrl.signal);
    return () => ctrl.abort();
  }, [inputs, runAssessor]);

  const runDeliberation = useCallback(async () => {
    const s = controller.current?.signal ?? AbortSignal.abort();
    setDelib({ state: "running" });
    try {
      const data = await postJson<{ review: Review }>(
        "/api/engine/deliberate",
        {
          projectId: inputs.projectId,
          documentId: inputs.documentId,
          reviewId: inputs.reviewId,
          results: inputs.assessorIds.map((id) => ({
            assessorId: id,
            status: statuses[id]?.state === "done" ? "done" : "failed",
            replySource: replies[id]?.replySource ?? inputs.replySource,
            comments: replies[id]?.comments ?? [],
          })),
          doneCommentIds: inputs.doneCommentIds(),
        },
        s,
      );
      const r = data.review;
      setDelib({
        state: "done",
        deliberation: r.deliberation ?? null,
        report: r.report ?? null,
        comments: r.assessorResults.flatMap((a) => a.comments),
        replySource: r.replySource,
      });
      // Reopening or refreshing now loads the saved review, without the engine.
      window.history.replaceState(null, "", `/review?review=${encodeURIComponent(r.id)}`);
    } catch (err) {
      if (s.aborted) return;
      setDelib({ state: "failed", message: err instanceof Error ? err.message : "Something went wrong." });
    }
  }, [inputs, statuses, replies]);

  // When nobody is still reading and at least one assessor finished, deliberate.
  const settled = inputs.assessorIds.every((id) => statuses[id]?.state !== "reading");
  const anyDone = inputs.assessorIds.some((id) => statuses[id]?.state === "done");
  useEffect(() => {
    if (settled && anyDone && delib.state === "waiting") void runDeliberation();
  }, [settled, anyDone, delib.state, runDeliberation]);

  const retryAssessor = (id: string) => {
    if (!inputs.assessorIds.includes(id)) return;
    // The retried assessor's comments belong in the deliberation, so redo it afterwards.
    if (delib.state !== "running") setDelib({ state: "waiting" });
    void runAssessor(id, controller.current?.signal ?? new AbortController().signal);
  };

  const live: LiveState = {
    status: !settled ? "reviewing" : delib.state === "done" || !anyDone ? "done" : "deliberating",
    doneAssessorIds: inputs.assessorIds.filter((id) => statuses[id]?.state === "done"),
    reading: inputs.assessorIds.filter((id) => statuses[id]?.state === "reading").map((id) => ({ assessorId: id })),
    failed: inputs.assessorIds.flatMap((id) => {
      const st = statuses[id];
      return st?.state === "failed" ? [{ assessorId: id, message: st.message }] : [];
    }),
    deliberationError: delib.state === "failed" ? delib.message : undefined,
  };

  const anySample = inputs.replySource === "sample" || Object.values(replies).some((r) => r.replySource === "sample");
  const review: ReviewResult =
    delib.state === "done"
      ? { id: inputs.reviewId, comments: delib.comments, deliberation: delib.deliberation, report: delib.report, replySource: delib.replySource }
      : {
          id: inputs.reviewId,
          comments: inputs.assessorIds.flatMap((id) => replies[id]?.comments ?? []),
          deliberation: null,
          report: null,
          replySource: anySample ? "sample" : "claude",
        };

  return { review, live, retryAssessor, retryDeliberation: () => void runDeliberation() };
}
