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
};

export type FloorSeat = {
  assessorId: string;
  name: string;
  short: string;
  field: string;
  avatar: string;
};

export type FloorDoc = { id: string; title: string; open: number; href: string };

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
  /** Last session and open actions. */
  line: string;
  deadline?: string;
  sessions: FloorSession[];
  seats: FloorSeat[];
  docs: FloorDoc[];
  hasMarkScheme: boolean;
  memory: BoardMemory;
  openActions: number;
  questions: { assessorId: string; text: string }[];
  tags: FloorFilter[];
  cta?: { label: string; href: string; tone: "orange" | "ink" };
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

export type DeskReport = { id: string; projectId: string; title: string; code: string; date: string; state: SessionState; href?: string };
export type DeskDoc = FloorDoc & { projectId: string; code: string; project: string };

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
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

type RawSession = {
  id: string;
  kind: "review" | "pitch";
  at: string;
  state: "done" | "live" | "ready";
  title: string;
  documentId?: string;
  report?: FeedbackReport | null;
  sample: boolean;
};

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
          sample: s.replySource === "sample",
        })),
    ].sort((a, b) => a.at.localeCompare(b.at));

    const sessions: FloorSession[] = raw.map((s) => {
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
    const openActions = openCount(latestReport);
    const liveSession = raw.find((s) => s.state === "live");
    const live = !!liveSession;
    const last = raw[raw.length - 1];
    const anyRun = raw.some((s) => s.state !== "ready");

    const docs: FloorDoc[] = ws.documents
      .filter((d) => d.projectId === p.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((d) => {
        const latest = [...raw].reverse().find((s) => s.documentId === d.id && s.state === "done");
        return { id: d.id, title: d.title, open: openCount(latest?.report), href: `/review?document=${encodeURIComponent(d.id)}` };
      });

    let status: string, short: string;
    if (live) {
      status = `● IN SESSION · ${liveSession.kind === "review" ? "REVIEW" : "Q&A"}`;
      short = "IN SESSION";
    } else if (raw.some((s) => s.state === "ready")) {
      status = "READY TO RUN";
      short = "READY";
    } else if (latestDone) {
      status = `LAST SESSION · ${dateLabel(latestDone.at)}`;
      short = dateLabel(latestDone.at);
    } else {
      status = "NOT STARTED";
      short = "NOT STARTED";
    }

    const line = last
      ? `${last.kind === "review" ? last.title : "Presentation"} · ${openActions ? `${plural(openActions, "open action")}` : "nothing open"}`
      : `No sessions yet · ${plural(seats.length, "assessor")}`;

    let cta: FloorTable["cta"];
    if (liveSession) {
      // A session in progress runs in the tab that started it; there is
      // nothing to rejoin from here, so no "Take your seat".
    } else if (isPitch) {
      if (features.pitch) cta = { label: "Practise a presentation", href: `/pitch?project=${p.id}`, tone: "ink" };
    } else if (features.review) {
      cta = { label: "Review a report", href: `/review/new?project=${p.id}`, tone: "ink" };
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
      memory: p.memory,
      hasMarkScheme: p.markSchemeText.trim().length > 0,
      openActions,
      questions: (latestReport?.likelyQuestions ?? [])
        .filter((q) => seats.some((s) => s.assessorId === q.assessorId))
        .map((q) => ({ assessorId: q.assessorId, text: q.question })),
      tags,
      cta,
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

  const deskDocs: DeskDoc[] = tables.flatMap((t) => t.docs.map((d) => ({ ...d, projectId: t.id, code: t.code, project: t.name })));
  const deskReports: DeskReport[] = tables.flatMap((t) =>
    t.sessions
      .filter((s) => s.state === "done")
      .map((s) => ({ id: s.id, projectId: t.id, title: `${s.note.startsWith("Sample replies") ? "Sample · " : ""}${s.type}: ${s.title === s.type ? t.name : s.title}`, code: t.code, date: s.date, state: s.state, href: s.reportHref })),
  );

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
