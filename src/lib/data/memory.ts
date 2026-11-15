import "server-only";
// ============================================================================
// TEMPORARY DEVELOPMENT STORE: NOT THE DATABASE.
//
// Used only when Supabase is not configured (no SUPABASE_URL / secret key).
// Holds rows in this server process's memory so sessions can be saved while
// developing. Everything is lost when the server restarts, and each server
// instance has its own copy. It starts from the sample fixture, so the UI
// must keep saying "sample data" whenever this store is in use
// (see dataSource() in ./index.ts).
//
// Delete this file once every environment has the real database.
// ============================================================================
import { sampleWorkspace } from "../../../fixtures/home-sample";
import { pitchBoard, reportBoard, templates } from "./seed-data";

type Row = Record<string, unknown>;
type Store = Map<string, Map<string, Row>>;

const holder = globalThis as unknown as { __panelDevStore?: Store };

function seed(): Store {
  const ws = sampleWorkspace;
  const tables: [string, Row[]][] = [
    ["profiles", [ws.profile]],
    ["assessors", ws.assessors],
    ["assessor_notes", ws.notes],
    ["boards", [reportBoard, pitchBoard, ...ws.boards]],
    ["templates", templates],
    ["projects", ws.projects],
    ["documents", ws.documents.map((d) => ({ ...d, paragraphs: [] }))],
    ["reviews", ws.reviews],
    ["pitch_sessions", ws.pitchSessions],
    ["call_logs", []],
  ];
  // structuredClone so writes never mutate the fixture module itself.
  return new Map(tables.map(([name, rows]) => [name, new Map(rows.map((r) => [String(r.id), structuredClone(r)]))]));
}

/** The process-wide store. Kept on globalThis so dev hot reloads keep it. */
export function memoryTable(name: string): Map<string, Row> {
  holder.__panelDevStore ??= seed();
  let t = holder.__panelDevStore.get(name);
  if (!t) {
    t = new Map();
    holder.__panelDevStore.set(name, t);
  }
  return t;
}

/** Child rows removed with their project, as the database's cascades do. */
export const CASCADES: Record<string, { table: string; key: string }[]> = {
  projects: [
    { table: "documents", key: "projectId" },
    { table: "reviews", key: "projectId" },
    { table: "pitch_sessions", key: "projectId" },
  ],
  documents: [{ table: "reviews", key: "documentId" }],
  assessors: [{ table: "assessor_notes", key: "assessorId" }],
};

/** Uploaded files, by path. Development only. */
export const memoryUploads = new Map<string, { body: ArrayBuffer; contentType: string }>();
