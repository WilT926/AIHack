import "server-only";
import type { z } from "zod";
import {
  assessorNoteSchema,
  assessorSchema,
  boardSchema,
  callLogSchema,
  documentSchema,
  documentSummarySchema,
  keepValid,
  pitchSessionSchema,
  profileSchema,
  projectSchema,
  reviewSchema,
  templateSchema,
  type Workspace,
} from "@/lib/schemas";
import { db, hasDatabase, UPLOADS_BUCKET } from "./client";

// The only code that touches the database. Server only. Every row is checked
// against its shape on the way out; rows that do not match are dropped.

export { hasDatabase };

/** The one seeded student. There is no login. */
export const DEMO_USER_ID = "demo-user";

// ---------- Row mapping: camelCase shapes ↔ snake_case columns ----------
// Only top-level keys change; jsonb columns keep the shape's own keys.

const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

function toRow(item: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(item)) if (v !== undefined) row[toSnake(k)] = v;
  return row;
}

function fromRow(row: Record<string, unknown>): Record<string, unknown> {
  const item: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) item[toCamel(k)] = v;
  return item;
}

function fail(table: string, action: string, error: { message: string }): never {
  throw new Error(`Database ${action} on ${table} failed: ${error.message}`);
}

type Filter = Record<string, string | number | boolean>;

/** List, get, save and remove for one table, validated against one shape. */
function table<S extends z.ZodType>(name: string, schema: S, order: { column: string; ascending: boolean }) {
  return {
    async list(filter: Filter = {}): Promise<z.infer<S>[]> {
      let q = db().from(name).select("*");
      for (const [k, v] of Object.entries(filter)) q = q.eq(toSnake(k), v);
      const { data, error } = await q.order(order.column, { ascending: order.ascending });
      if (error) fail(name, "list", error);
      return keepValid(schema, (data ?? []).map(fromRow));
    },

    async get(id: string): Promise<z.infer<S> | null> {
      const { data, error } = await db().from(name).select("*").eq("id", id).maybeSingle();
      if (error) fail(name, "get", error);
      if (!data) return null;
      const parsed = schema.safeParse(fromRow(data));
      return parsed.success ? parsed.data : null;
    },

    /** Insert or update by id. The item is validated before it is written. */
    async save(item: z.input<S>): Promise<z.infer<S>> {
      const valid = schema.parse(item) as Record<string, unknown>;
      const { data, error } = await db().from(name).upsert(toRow(valid)).select("*").single();
      if (error) fail(name, "save", error);
      return schema.parse(fromRow(data));
    },

    async remove(id: string): Promise<void> {
      const { error } = await db().from(name).delete().eq("id", id);
      if (error) fail(name, "remove", error);
    },
  };
}

const byCreated = { column: "created_at", ascending: true };

export const profiles = table("profiles", profileSchema, { column: "id", ascending: true });
export const assessors = table("assessors", assessorSchema, byCreated);
export const assessorNotes = table("assessor_notes", assessorNoteSchema, byCreated);
export const boards = table("boards", boardSchema, byCreated);
export const templates = table("templates", templateSchema, { column: "id", ascending: true });
export const projects = table("projects", projectSchema, byCreated);
export const documents = table("documents", documentSchema, byCreated);
export const reviews = table("reviews", reviewSchema, byCreated);
export const pitchSessions = table("pitch_sessions", pitchSessionSchema, byCreated);
export const callLogs = table("call_logs", callLogSchema, { column: "started_at", ascending: true });

/** Documents without their text, for lists. */
export async function listDocumentSummaries(filter: { projectId?: string } = {}) {
  let q = db().from("documents").select("id, project_id, title, created_at");
  if (filter.projectId) q = q.eq("project_id", filter.projectId);
  const { data, error } = await q.order("created_at", { ascending: true });
  if (error) fail("documents", "list", error);
  return keepValid(documentSummarySchema, (data ?? []).map(fromRow));
}

/** The demo student's profile. */
export async function getProfile() {
  return profiles.get(DEMO_USER_ID);
}

/** Everything the home floor needs, in one round of parallel queries. */
export async function getWorkspace(): Promise<Workspace> {
  const [profile, a, n, b, p, d, r, s] = await Promise.all([
    getProfile(),
    assessors.list(),
    assessorNotes.list(),
    boards.list(),
    projects.list(),
    listDocumentSummaries(),
    reviews.list(),
    pitchSessions.list(),
  ]);
  if (!profile) throw new Error(`The demo profile "${DEMO_USER_ID}" is missing. Run npm run db:seed.`);
  return { profile, assessors: a, notes: n, boards: b, projects: p, documents: d, reviews: r, pitchSessions: s };
}

// ---------- Uploads (private bucket) ----------

/** Store a file in the private uploads bucket and return its path. */
export async function uploadFile(path: string, body: Blob | ArrayBuffer, contentType: string): Promise<string> {
  const { data, error } = await db().storage.from(UPLOADS_BUCKET).upload(path, body, { contentType, upsert: true });
  if (error) fail(UPLOADS_BUCKET, "upload", error);
  return data.path;
}

/** A short-lived link to a stored file. */
export async function signedUploadUrl(path: string, expiresInSeconds = 600): Promise<string> {
  const { data, error } = await db().storage.from(UPLOADS_BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error) fail(UPLOADS_BUCKET, "sign", error);
  return data.signedUrl;
}
