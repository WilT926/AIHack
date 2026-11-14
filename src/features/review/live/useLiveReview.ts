"use client";

// Runs a live review: one request per assessor, all in parallel, comments
// shown as each returns; then one deliberation request once everyone has
// finished or failed. Failed calls can be retried individually.
//
// The run's inputs are frozen when it starts, so a parent re-render can never
// restart or change a run that is already under way.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Assessor, Comment, Deliberation, Document, FixItem, LiveState, Question, Run } from "../types";
import type { ReviewContext } from "../engine/schemas";

type AssessorStatus = { state: "reading" } | { state: "done" } | { state: "failed"; message: string };

type DeliberationState =
  | { state: "waiting" }
  | { state: "running" }
  | { state: "done"; deliberation: Deliberation; fixList: FixItem[]; questions: Question[] }
  | { state: "failed"; message: string };

type Inputs = { context: ReviewContext; document: Document; assessors: Assessor[] };

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
}: Inputs & { runId: string; runNumber: number }): {
  run: Run;
  live: LiveState;
  retryAssessor: (id: string) => void;
  retryDeliberation: () => void;
} {
  const [inputs] = useState<Inputs>(() => ({ context, document, assessors }));
  const [statuses, setStatuses] = useState<Record<string, AssessorStatus>>(() =>
    Object.fromEntries(inputs.assessors.map((a) => [a.id, { state: "reading" } as AssessorStatus])),
  );
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [delib, setDelib] = useState<DeliberationState>({ state: "waiting" });
  const [uploadedAt] = useState(() => new Date().toISOString());
  const controller = useRef<AbortController | null>(null);

  const signal = () => controller.current?.signal ?? AbortSignal.abort();

  const runAssessor = useCallback(
    async (assessor: Assessor, s: AbortSignal) => {
      setStatuses((prev) => ({ ...prev, [assessor.id]: { state: "reading" } }));
      try {
        const data = await postJson<{ comments: Comment[] }>(
          "/review/api/assessor",
          { context: inputs.context, document: inputs.document, assessor },
          s,
        );
        setComments((prev) => ({ ...prev, [assessor.id]: data.comments }));
        setStatuses((prev) => ({ ...prev, [assessor.id]: { state: "done" } }));
      } catch (err) {
        if (s.aborted) return;
        setStatuses((prev) => ({
          ...prev,
          [assessor.id]: { state: "failed", message: err instanceof Error ? err.message : "Something went wrong." },
        }));
      }
    },
    [inputs],
  );

  // Start every assessor in parallel. The cleanup aborts in-flight requests;
  // under React Strict Mode (dev) the effect runs twice, and the second run
  // starts a fresh set, so nothing is left hanging.
  useEffect(() => {
    const ctrl = new AbortController();
    controller.current = ctrl;
    setStatuses(Object.fromEntries(inputs.assessors.map((a) => [a.id, { state: "reading" } as AssessorStatus])));
    setComments({});
    setDelib({ state: "waiting" });
    for (const a of inputs.assessors) void runAssessor(a, ctrl.signal);
    return () => ctrl.abort();
  }, [inputs, runAssessor]);

  const runDeliberation = useCallback(async () => {
    const s = controller.current?.signal ?? AbortSignal.abort();
    const done = inputs.assessors.filter((a) => statuses[a.id]?.state === "done");
    setDelib({ state: "running" });
    try {
      const data = await postJson<{ deliberation: Deliberation; fixList: FixItem[]; questions: Question[] }>(
        "/review/api/deliberate",
        {
          context: inputs.context,
          document: inputs.document,
          assessors: done,
          comments: done.flatMap((a) => comments[a.id] ?? []),
        },
        s,
      );
      setDelib({ state: "done", ...data });
    } catch (err) {
      if (s.aborted) return;
      setDelib({ state: "failed", message: err instanceof Error ? err.message : "Something went wrong." });
    }
  }, [inputs, statuses, comments]);

  // When nobody is still reading and at least one assessor finished, deliberate.
  const settled = inputs.assessors.every((a) => statuses[a.id]?.state !== "reading");
  const anyDone = inputs.assessors.some((a) => statuses[a.id]?.state === "done");
  useEffect(() => {
    if (settled && anyDone && delib.state === "waiting") void runDeliberation();
  }, [settled, anyDone, delib.state, runDeliberation]);

  const retryAssessor = (id: string) => {
    const a = inputs.assessors.find((x) => x.id === id);
    if (!a) return;
    // The retried assessor's comments belong in the deliberation, so redo it afterwards.
    if (delib.state !== "running") setDelib({ state: "waiting" });
    void runAssessor(a, signal());
  };

  const live: LiveState = {
    status: !settled ? "reviewing" : delib.state === "done" || !anyDone ? "done" : "deliberating",
    doneAssessorIds: inputs.assessors.filter((a) => statuses[a.id]?.state === "done").map((a) => a.id),
    reading: inputs.assessors.filter((a) => statuses[a.id]?.state === "reading").map((a) => ({ assessorId: a.id })),
    failed: inputs.assessors.flatMap((a) => {
      const st = statuses[a.id];
      return st?.state === "failed" ? [{ assessorId: a.id, message: st.message }] : [];
    }),
    deliberationError: delib.state === "failed" ? delib.message : undefined,
  };

  const run: Run = {
    id: runId,
    number: runNumber,
    uploadedAt,
    document: inputs.document,
    comments: inputs.assessors.flatMap((a) => comments[a.id] ?? []),
    deliberation: delib.state === "done" ? delib.deliberation : undefined,
    fixList: delib.state === "done" ? delib.fixList : [],
    questions: delib.state === "done" ? delib.questions : [],
  };

  return { run, live, retryAssessor, retryDeliberation: () => void runDeliberation() };
}
