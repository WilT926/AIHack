"use client";

// Runs a live review: one request per assessor, all in parallel, comments
// shown as each returns; then one deliberation request once everyone has
// finished or failed. Failed calls can be retried individually.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Assessor, Comment, Deliberation, Document, FixItem, LiveState, Question, Run } from "../types";
import type { ReviewContext } from "../engine/schemas";

type AssessorStatus = { state: "reading" } | { state: "done" } | { state: "failed"; message: string };

type DeliberationState =
  | { state: "waiting" }
  | { state: "running" }
  | { state: "done"; deliberation: Deliberation; fixList: FixItem[]; questions: Question[] }
  | { state: "failed"; message: string };

async function postJson<T>(url: string, body: unknown, signal: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (signal.aborted) throw err;
    throw new Error("Couldn't reach the server. Check your connection.");
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `The server returned ${res.status}.`);
  return data;
}

export function useLiveReview({
  context,
  document,
  assessors,
  runId,
  runNumber,
}: {
  context: ReviewContext;
  document: Document;
  assessors: Assessor[];
  runId: string;
  runNumber: number;
}): { run: Run; live: LiveState; retryAssessor: (id: string) => void; retryDeliberation: () => void } {
  const [statuses, setStatuses] = useState<Record<string, AssessorStatus>>(() =>
    Object.fromEntries(assessors.map((a) => [a.id, { state: "reading" } as AssessorStatus])),
  );
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [delib, setDelib] = useState<DeliberationState>({ state: "waiting" });
  const [uploadedAt] = useState(() => new Date().toISOString());
  const abort = useRef<AbortController | null>(null);

  // One controller for the whole run; aborted when the screen unmounts.
  useEffect(() => {
    abort.current = new AbortController();
    return () => abort.current?.abort();
  }, []);

  const runAssessor = useCallback(
    async (assessor: Assessor) => {
      const signal = abort.current?.signal ?? new AbortController().signal;
      setStatuses((s) => ({ ...s, [assessor.id]: { state: "reading" } }));
      try {
        const data = await postJson<{ comments: Comment[] }>("/review/api/assessor", { context, document, assessor }, signal);
        setComments((c) => ({ ...c, [assessor.id]: data.comments }));
        setStatuses((s) => ({ ...s, [assessor.id]: { state: "done" } }));
      } catch (err) {
        if (signal.aborted) return;
        setStatuses((s) => ({
          ...s,
          [assessor.id]: { state: "failed", message: err instanceof Error ? err.message : "Something went wrong." },
        }));
      }
    },
    [context, document],
  );

  const runDeliberation = useCallback(async () => {
    const signal = abort.current?.signal ?? new AbortController().signal;
    const done = assessors.filter((a) => statuses[a.id]?.state === "done");
    setDelib({ state: "running" });
    try {
      const data = await postJson<{ deliberation: Deliberation; fixList: FixItem[]; questions: Question[] }>(
        "/review/api/deliberate",
        { context, document, assessors: done, comments: done.flatMap((a) => comments[a.id] ?? []) },
        signal,
      );
      setDelib({ state: "done", ...data });
    } catch (err) {
      if (signal.aborted) return;
      setDelib({ state: "failed", message: err instanceof Error ? err.message : "Something went wrong." });
    }
  }, [assessors, statuses, comments, context, document]);

  // Start every assessor once, in parallel.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    for (const a of assessors) void runAssessor(a);
  }, [assessors, runAssessor]);

  // When nobody is still reading and at least one assessor finished, deliberate.
  const settled = assessors.every((a) => statuses[a.id]?.state !== "reading");
  const anyDone = assessors.some((a) => statuses[a.id]?.state === "done");
  useEffect(() => {
    if (settled && anyDone && delib.state === "waiting") void runDeliberation();
  }, [settled, anyDone, delib.state, runDeliberation]);

  const retryAssessor = (id: string) => {
    const a = assessors.find((x) => x.id === id);
    if (!a) return;
    // A retried assessor's comments should be in the deliberation, so redo it after.
    if (delib.state !== "running") setDelib({ state: "waiting" });
    void runAssessor(a);
  };

  const live: LiveState = {
    status: !settled ? "reviewing" : delib.state === "done" || !anyDone ? "done" : "deliberating",
    doneAssessorIds: assessors.filter((a) => statuses[a.id]?.state === "done").map((a) => a.id),
    reading: assessors.filter((a) => statuses[a.id]?.state === "reading").map((a) => ({ assessorId: a.id })),
    failed: assessors.flatMap((a) => {
      const s = statuses[a.id];
      return s?.state === "failed" ? [{ assessorId: a.id, message: s.message }] : [];
    }),
    deliberationError: delib.state === "failed" ? delib.message : undefined,
  };

  const run: Run = {
    id: runId,
    number: runNumber,
    uploadedAt,
    document,
    comments: assessors.flatMap((a) => comments[a.id] ?? []),
    deliberation: delib.state === "done" ? delib.deliberation : undefined,
    fixList: delib.state === "done" ? delib.fixList : [],
    questions: delib.state === "done" ? delib.questions : [],
  };

  return { run, live, retryAssessor, retryDeliberation: () => void runDeliberation() };
}
