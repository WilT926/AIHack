// Turns a student's Workspace into what the floor draws (DESIGN_SYSTEM §11).
// Pure and serialisable: the page builds it on the server from either the
// sample fixture or src/lib/data, and the client components never change.
import { features } from "@/config";
import type { BoardMemory, FeedbackReport, Workspace } from "@/lib/schemas";
import { MAX_TABLES } from "@/styles/floor";

export type SessionState = "done" | "live" | "ready" | "deadline";
export type FloorFilter = "all" | "live" | "open" | "new";

export type FloorSession = {
  id: string;
  state: SessionState;
  /** "Report review", "Presentation practice", "Hand-in" … */
  type: string;
  title: string;
  /** Mono date label, e.g. "5 NOV" or "NOW". */
  date: string;
  /** One line: the first line of the verdict, or what happens next. */
  note: string;
  /** Feedback report link, only when that screen is switched on. */
  reportHref?: string;
  /** For the desk card of a finished session. */
  desk?: { attempt: number; kind: "Presentation" | "Report review"; at: string; verdict: string; open: number; sample: boolean };
};

export type FloorSeat = {
  assessorId: string;
  name: string;
  short: string;
  field: string;
  avatar: string;
};

export type FloorDoc = { id: string; title: string; open: number; href: string; at?: string; usedBy?: string | null };

/** One assessor's feedback on the latest finished session. */
export type FloorFeedback = {
  assessorId: string;
  short: string;
  avatar: string;
  /** 1–5: how well the work did with this assessor; null before any feedback. */
  score: number | null;
  /** Reports only: their comments marked reviewed, of all their comments. */
  reviewed?: { done: number; total: number };
};

export type FloorAttempt = { id: string; title: string; date: string; note: string; href?: string };
export type FloorAction = { id: string; what: string; by: string; done: boolean };

export type FloorTable = {
  id: string;
  code: string;
  name: string;
  /** Which session this table runs: a report review or a presentation. */
  kind: "review" | "pitch";
  live: boolean;
  /** Mono status on the focused table and the side panel. */
  status: string;
  /** Short mono status on a side table. */
  short: string;
  /** Under the name: when it was last reviewed or practised. */
  line: string;
  /** The board this table seats (editable from the side panel). */
  boardId: string | null;
  /** Reports only: one dot per assessor; true when all their comments are marked reviewed. */
  dots: { assessorId: string; reviewed: boolean }[];
  /** Side panel header: "Last reviewed …" / "Not reviewed yet", even while a session runs. */
  lastReviewed: string;
  /** What's on the table, e.g. "3 documents · 1 not reviewed yet" or "3 practice runs". */
  summary: string;
  /** What changed since the student last opened this table, or null. */
  updates: string | null;
  feedback: FloorFeedback[];
  attempts: FloorAttempt[];
  actions: FloorAction[];
  deadline?: string;
  sessions: FloorSession[];
  seats: FloorSeat[];
  docs: FloorDoc[];
  hasMarkScheme: boolean;
  memory: BoardMemory;
  openActions: number;
  questions: { assessorId: string; text: string }[];
  tags: FloorFilter[];
  /** What this panel can start: both kinds, the template's own first. */
  starts?: { kind: "review" | "pitch"; label: string; href: string; preferred: boolean }[];
};

export type FloorAssessor = {
  id: string;
  name: string;
  short: string;
  role: string;
  field: string;
  focus: string;
  harshness: number;
  notes: number;
  avatar: string;
  tables: string[];
};

export type DeskReport = { id: string; projectId: string; title: string; code: string; date: string; state: SessionState; href?: string; attempt: number; kind: string; at: string; verdict: string; open: number; sample: boolean };
export type DeskDoc = FloorDoc & { projectId: string; code: string; project: string; at: string; usedBy: string | null };

export type FloorModel = {
  profile: { name: string; sub: string; avatar: string };
  tables: FloorTable[];
  assessors: FloorAssessor[];
  desk: { docs: DeskDoc[]; reports: DeskReport[]; reviewHref?: string };
  openActions: number;
  initialFocus: number;
  newProjectHref: string;
  /** True when the floor shows the sample fixture instead of the database. */
  sample?: boolean;
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** "5 NOV". UTC, so the server and the browser agree. */
export function dateLabel(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** Two-letter project code from the title's initials (§11). */
export function projectCode(title: string): string {
  const words = title.replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean);
  const letters = words.length >= 2 ? words[0][0] + words[1][0] : (words[0] ?? "??").slice(0, 2);
  return letters.toUpperCase();
}

/** "Prof. Alan Marsh" → "Marsh". */
export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? name;
}

function firstSentence(text: string): string {
  const m = text.match(/^.*?[.?!](\s|$)/);
  return (m ? m[0] : text).trim();
}

const openCount = (r?: FeedbackReport | null) => (r ? r.actions.filter((a) => !a.done).length : 0);

/** "today", "yesterday", "3 days ago", else the date, for "Last reviewed …" under a table's name. */
export function ago(iso: string, now = Date.now()): string {
  const days = Math.floor((now - Date.parse(iso)) / 86_400_000);
  if (Number.isNaN(days)) return "";
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return dateLabel(iso);
}

type RawSession = {
  id: string;
  kind: "review" | "pitch";
  at: string;
  state: "done" | "live" | "ready";
  title: string;
  documentId?: string;
  report?: FeedbackReport | null;
  /** Unresolved items: comments not marked done (reviews) or open actions (presentations). */
  open: number;
  /** Reviews: each assessor's comments. */
  results?: { assessorId: string; done: number; total: number; major: number; minor: number; praise: number }[];
  /** Presentations: how well each assessor's questions were answered (1–5). */
  scores?: { assessorId: string; score: number }[];
  /** When it finished (or started), for "new since you last looked". */
  finishedAt?: string | null;
  sample: boolean;
};

const HOW_WELL = { strong: 5, adequate: 3, weak: 1 } as const;
const clampScore = (n: number) => Math.max(1, Math.min(5, Math.round(n)));

export function buildFloor(ws: Workspace): FloorModel {
  const assessorById = new Map(ws.assessors.map((a) => [a.id, a]));
  const boardById = new Map(ws.boards.map((b) => [b.id, b]));
  const docById = new Map(ws.documents.map((d) => [d.id, d]));

  const projects = [...ws.projects].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(0, MAX_TABLES);

  const tables: FloorTable[] = projects.map((p) => {
    const code = projectCode(p.title);
    const board = p.boardId ? boardById.get(p.boardId) : undefined;
    const seats: FloorSeat[] = (board?.assessorIds ?? [])
      .map((id) => assessorById.get(id))
      .filter((a) => a !== undefined)
      .map((a) => ({ assessorId: a.id, name: a.name, short: shortName(a.name), field: a.field, avatar: a.avatar }));

    const raw: RawSession[] = [
      ...ws.reviews
        .filter((r) => r.projectId === p.id)
        .map<RawSession>((r) => ({
          id: r.id,
          kind: "review",
          at: r.createdAt,
          state: r.status === "done" ? "done" : r.status === "running" ? "live" : "ready",
          title: docById.get(r.documentId)?.title ?? "Report",
          documentId: r.documentId,
          report: r.report,
          open: r.assessorResults.reduce((n, a) => n + a.comments.filter((c) => !c.done).length, 0),
          results: r.assessorResults.map((a) => ({
            assessorId: a.assessorId,
            done: a.comments.filter((c) => c.done).length,
            total: a.comments.length,
            major: a.comments.filter((c) => c.severity === "major").length,
            minor: a.comments.filter((c) => c.severity === "minor").length,
            praise: a.comments.filter((c) => c.severity === "praise").length,
          })),
          finishedAt: r.createdAt,
          sample: r.replySource === "sample",
        })),
      ...ws.pitchSessions
        .filter((s) => s.projectId === p.id)
        .map<RawSession>((s) => ({
          id: s.id,
          kind: "pitch",
          at: s.startedAt ?? s.createdAt,
          state: s.status === "done" ? "done" : s.status === "ready" ? "ready" : "live",
          title: "Presentation practice",
          report: s.report,
          open: openCount(s.report),
          scores: (() => {
            const byQ = new Map((s.report?.questionReview ?? []).map((q) => [q.questionId, HOW_WELL[q.howWell]]));
            const per = new Map<string, number[]>();
            for (const q of s.questions) {
              const v = byQ.get(q.id);
              if (v !== undefined) per.set(q.assessorId, [...(per.get(q.assessorId) ?? []), v]);
            }
            return [...per].map(([assessorId, v]) => ({ assessorId, score: clampScore(v.reduce((a, b) => a + b, 0) / v.length) }));
          })(),
          finishedAt: s.endedAt ?? s.startedAt ?? s.createdAt,
          sample: s.replySource === "sample",
        })),
    ].sort((a, b) => a.at.localeCompare(b.at));

    let attempt = 0;
    const sessions: FloorSession[] = raw.map((s) => {
      if (s.state === "done") attempt += 1;
      const type = s.kind === "review" ? "Report review" : "Presentation practice";
      let note: string;
      if (s.state === "done") note = s.report ? firstSentence(s.report.verdict) : "Finished";
      else if (s.state === "live") note = s.kind === "review" ? `The board is reading ${s.title}` : "The Q&A is in progress";
      else note = s.kind === "review" ? "Uploaded, not reviewed yet" : "Set up, not run yet";
      const reportHref =
        features.feedbackReport && s.state === "done" && s.report
          ? s.kind === "review"
            ? `/review?review=${encodeURIComponent(s.id)}&tab=report`
            : `/pitch?session=${s.id}`
          : undefined;
      return {
        id: s.id,
        state: s.state,
        type,
        title: s.kind === "review" ? s.title : type,
        date: s.state === "live" ? "NOW" : dateLabel(s.at),
        note: s.sample ? `Sample replies · ${note}` : note,
        reportHref,
        desk:
          s.state === "done"
            ? { attempt, kind: s.kind === "review" ? "Report review" : "Presentation", at: s.at, verdict: s.report ? firstSentence(s.report.verdict) : "Finished", open: s.open, sample: s.sample }
            : undefined,
      };
    });

    const isPitch = p.template === "pitch";
    if (p.deadline) {
      sessions.push({
        id: `${p.id}-deadline`,
        state: "deadline",
        type: isPitch ? "Presentation" : "Hand-in",
        title: isPitch ? "The real presentation" : "The real hand-in",
        date: dateLabel(p.deadline),
        note: isPitch ? "The day you present to the real panel" : "The day the real marking starts",
      });
    }

    const latestDone = [...raw].reverse().find((s) => s.state === "done" && s.report);
    const latestReport = latestDone?.report ?? null;
    const latestDocs = [...raw].reverse();
    const liveSession = raw.find((s) => s.state === "live");
    const live = !!liveSession;
    const anyRun = raw.some((s) => s.state !== "ready");

    const docs: FloorDoc[] = ws.documents
      .filter((d) => d.projectId === p.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((d) => {
        const latest = latestDocs.find((s) => s.documentId === d.id && s.state === "done");
        return { id: d.id, title: d.title, open: latest?.open ?? 0, href: `/review?document=${encodeURIComponent(d.id)}`, at: d.createdAt, usedBy: latest ? `Report review · ${dateLabel(latest.at)}` : null };
      });

    // Notifications: what still needs looking at. For a report, the comments
    // not yet marked done in its latest review (the same comments the review
    // screen shows); for a presentation, the open actions of its last report.
    const openActions = isPitch ? (latestDone?.open ?? 0) : docs.reduce((n, d) => n + d.open, 0);

    // Reports: per assessor, across the latest finished review of each document.
    const latestPerDoc = isPitch ? [] : docs.map((d) => latestDocs.find((s) => s.documentId === d.id && s.state === "done")).filter((s) => s !== undefined);
    const perAssessor = new Map<string, { done: number; total: number; major: number; minor: number; praise: number }>();
    for (const s of latestPerDoc)
      for (const r of s.results ?? []) {
        const t = perAssessor.get(r.assessorId) ?? { done: 0, total: 0, major: 0, minor: 0, praise: 0 };
        perAssessor.set(r.assessorId, { done: t.done + r.done, total: t.total + r.total, major: t.major + r.major, minor: t.minor + r.minor, praise: t.praise + r.praise });
      }
    const dots = isPitch ? [] : seats.filter((s) => perAssessor.has(s.assessorId)).map((s) => {
      const t = perAssessor.get(s.assessorId)!;
      return { assessorId: s.assessorId, reviewed: t.total > 0 && t.done === t.total };
    });
    const pitchScores = new Map((isPitch ? (latestDone?.scores ?? []) : []).map((x) => [x.assessorId, x.score]));
    const feedback: FloorFeedback[] = seats.map((s) => {
      if (isPitch) return { assessorId: s.assessorId, short: s.short, avatar: s.avatar, score: pitchScores.get(s.assessorId) ?? null };
      const t = perAssessor.get(s.assessorId);
      if (!t) return { assessorId: s.assessorId, short: s.short, avatar: s.avatar, score: null };
      // Start at 4, a major costs a point, two minors a point, praise earns half a point back.
      return { assessorId: s.assessorId, short: s.short, avatar: s.avatar, score: clampScore(4 - t.major - t.minor / 2 + t.praise / 2), reviewed: { done: t.done, total: t.total } };
    });

    const finished = raw.filter((s) => s.state === "done");
    const docsCount = docs.length;
    const notReviewed = docs.filter((d) => !latestDocs.some((s) => s.documentId === d.id && s.state === "done")).length;
    const summary = isPitch
      ? finished.length === 0
        ? "No practice runs yet"
        : `${finished.length} practice ${finished.length === 1 ? "run" : "runs"}${raw.some((s) => s.state === "ready") ? " · 1 ready to run" : ""}`
      : docsCount === 0
        ? "No documents uploaded yet"
        : `${docsCount} ${docsCount === 1 ? "document" : "documents"} · ${notReviewed === 0 ? "all reviewed" : `${notReviewed} not reviewed yet`}`;

    const seen = p.viewedAt ? Date.parse(p.viewedAt) : 0;
    const fresh = finished.filter((s) => s.finishedAt && Date.parse(s.finishedAt) > seen);
    const updates = live
      ? `${liveSession.kind === "review" ? "The board is reviewing" : "A practice is running"} now`
      : fresh.length
        ? `New feedback from the board · ${fresh.length} ${isPitch ? (fresh.length === 1 ? "practice" : "practices") : fresh.length === 1 ? "review" : "reviews"} since you last looked`
        : null;

    const attempts: FloorAttempt[] = [...finished].reverse().map((s) => ({
      id: s.id,
      title: s.kind === "review" ? s.title : "Presentation practice",
      date: dateLabel(s.at),
      note: s.kind === "review" ? (s.open ? `${s.open} ${s.open === 1 ? "comment" : "comments"} to review` : "All comments reviewed") : s.open ? `${s.open} ${s.open === 1 ? "action" : "actions"} open` : "All actions done",
      href: features.feedbackReport ? (s.kind === "pitch" ? `/pitch?session=${s.id}` : s.documentId ? `/review?document=${encodeURIComponent(s.documentId)}` : undefined) : undefined,
    }));
    const nameOf = (id: string) => seats.find((x) => x.assessorId === id)?.short ?? assessorById.get(id)?.name ?? "The board";
    const actions: FloorAction[] = (latestReport?.actions ?? [])
      .map((a) => ({ id: a.id, what: a.what, by: a.raisedBy.map(nameOf).join(", "), done: a.done }))
      .sort((a, b) => Number(a.done) - Number(b.done));

    let status: string, short: string;
    if (live) {
      status = `● IN SESSION · ${liveSession.kind === "review" ? "REVIEW" : "Q&A"}`;
      short = "IN SESSION";
    } else if (raw.some((s) => s.state === "ready")) {
      status = "READY TO RUN";
      short = "READY";
    } else if (latestDone) {
      status = `LAST SESSION · ${dateLabel(latestDone.at)}`;
      short = ago(latestDone.at).toUpperCase();
    } else {
      status = "NOT STARTED";
      short = "NOT STARTED";
    }

    // Under the name: when it was last reviewed (or practised).
    const lastWhen = latestDone ? ago(latestDone.at) : "";
    const line = live
      ? `${liveSession.kind === "review" ? "Being reviewed" : "In practice"} now`
      : latestDone
        ? `Last ${isPitch ? "practised" : "reviewed"} ${lastWhen}`
        : `Not ${isPitch ? "practised" : "reviewed"} yet`;

    // A session in progress runs in the tab that started it; there is
    // nothing to rejoin from here, so no "Take your seat".
    let starts: FloorTable["starts"];
    if (!liveSession) {
      const both: NonNullable<FloorTable["starts"]> = [];
      if (features.review) both.push({ kind: "review", label: "Review a report", href: `/review/new?project=${p.id}`, preferred: !isPitch });
      if (features.pitch) both.push({ kind: "pitch", label: "Practise a presentation", href: `/pitch?project=${p.id}`, preferred: isPitch });
      starts = both.sort((a, b) => Number(b.preferred) - Number(a.preferred));
    }

    const tags: FloorFilter[] = ["all"];
    if (live) tags.push("live");
    if (openActions > 0) tags.push("open");
    if (!anyRun) tags.push("new");

    return {
      id: p.id,
      code,
      name: p.title,
      kind: isPitch ? "pitch" : "review",
      live,
      status,
      short,
      line,
      deadline: p.deadline ? `${isPitch ? "PRESENTING" : "DUE"} ${dateLabel(p.deadline)}` : undefined,
      sessions,
      seats,
      docs,
      boardId: p.boardId ?? null,
      lastReviewed: latestDone ? `Last ${isPitch ? "practised" : "reviewed"} ${lastWhen}` : `Not ${isPitch ? "practised" : "reviewed"} yet`,
      dots,
      summary,
      updates,
      feedback,
      attempts,
      actions,
      memory: p.memory,
      hasMarkScheme: p.markSchemeText.trim().length > 0,
      openActions,
      questions: (latestReport?.likelyQuestions ?? [])
        .filter((q) => seats.some((s) => s.assessorId === q.assessorId))
        .map((q) => ({ assessorId: q.assessorId, text: q.question })),
      tags,
      starts,
    };
  });

  const assessors: FloorAssessor[] = ws.assessors.map((a) => ({
    id: a.id,
    name: a.name,
    short: shortName(a.name),
    role: a.role,
    field: a.field,
    focus: a.focusAreas.join(", "),
    harshness: a.harshness,
    notes: ws.notes.filter((n) => n.assessorId === a.id).length,
    avatar: a.avatar,
    tables: tables.filter((t) => t.seats.some((s) => s.assessorId === a.id)).map((t) => t.code),
  }));

  const deskDocs: DeskDoc[] = tables
    .flatMap((t) => t.docs.map((d) => ({ ...d, projectId: t.id, code: t.code, project: t.name, at: d.at ?? "", usedBy: d.usedBy ?? null })))
    .sort((a, b) => b.at.localeCompare(a.at));
  const deskReports: DeskReport[] = tables.flatMap((t) =>
    t.sessions
      .filter((s) => s.state === "done")
      .map((s) => ({
        id: s.id, projectId: t.id, title: `${s.note.startsWith("Sample replies") ? "Sample · " : ""}${s.type}: ${s.title === s.type ? t.name : s.title}`, code: t.code, date: s.date, state: s.state, href: s.reportHref,
        attempt: s.desk?.attempt ?? 1, kind: s.desk?.kind ?? s.type, at: s.desk?.at ?? "", verdict: s.desk?.verdict ?? s.note, open: s.desk?.open ?? 0, sample: s.desk?.sample ?? false,
      })),
  ).sort((a, b) => b.at.localeCompare(a.at));

  const liveIdx = tables.findIndex((t) => t.live);
  let initialFocus = liveIdx;
  if (initialFocus < 0) {
    const recent = [...projects].map((p, i) => ({ i, u: p.updatedAt })).sort((a, b) => b.u.localeCompare(a.u))[0];
    initialFocus = recent ? recent.i : 0;
  }

  const levelLabel = { UG: "Undergraduate", PGT: "PGT", PGR: "PGR" }[ws.profile.level];

  return {
    profile: { name: ws.profile.name, sub: `${ws.profile.course} · ${levelLabel}`, avatar: ws.profile.avatar },
    tables,
    assessors,
    desk: { docs: deskDocs, reports: deskReports, reviewHref: features.review ? "/review/new" : undefined },
    openActions: tables.reduce((n, t) => n + t.openActions, 0),
    initialFocus,
    newProjectHref: "/projects/new",
  };
}
