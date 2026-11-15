// Seed the database: the demo student, the ten preset assessors, the report
// board, the pitch judges board and the three templates.
//
//   npm run db:seed                 seed (safe to run again: upserts by id)
//   npm run db:seed -- --sample     also add the floor's sample projects
//   npm run db:seed -- --remove-sample
//
// Runs outside Next.js, so it builds its own client from .env.local.
import { createClient } from "@supabase/supabase-js";
import {
  sampleAssessors,
  sampleBoards,
  sampleDocuments,
  sampleNotes,
  samplePitchSessions,
  sampleProjects,
  sampleReviews,
  sampleWorkspace,
} from "../fixtures/home-sample";
import { assessorSchema, boardSchema, profileSchema, templateSchema } from "../src/lib/schemas";
import { pitchBoard, reportBoard, templates } from "../src/lib/data/seed-data";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const toRow = (item: object) =>
  Object.fromEntries(
    Object.entries(item)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`), v]),
  );

async function upsert(table: string, rows: object[]) {
  if (rows.length === 0) return;
  const { error } = await db.from(table).upsert(rows.map(toRow));
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ${table}: ${rows.length}`);
}

const sampleIds = {
  projects: sampleProjects.map((p) => p.id),
  boards: sampleBoards.map((b) => b.id),
  notes: sampleNotes.map((n) => n.id),
};

async function seed(withSample: boolean) {
  console.log("Seeding…");
  await upsert("profiles", [profileSchema.parse(sampleWorkspace.profile)]);
  await upsert("assessors", sampleAssessors.map((a) => assessorSchema.parse(a)));
  await upsert("boards", [reportBoard, pitchBoard].map((b) => boardSchema.parse(b)));
  await upsert("templates", templates.map((t) => templateSchema.parse(t)));
  if (withSample) {
    console.log("Adding sample projects…");
    await upsert("boards", sampleBoards);
    await upsert("assessor_notes", sampleNotes);
    await upsert("projects", sampleProjects);
    await upsert("documents", sampleDocuments.map((d) => ({ ...d, paragraphs: [] })));
    await upsert("reviews", sampleReviews);
    await upsert("pitch_sessions", samplePitchSessions);
  }
  console.log("Done.");
}

async function removeSample() {
  console.log("Removing sample projects…");
  // Documents, reviews and pitch sessions go with their project (on delete cascade).
  for (const [table, ids] of [
    ["projects", sampleIds.projects],
    ["assessor_notes", sampleIds.notes],
    ["boards", sampleIds.boards],
  ] as const) {
    const { error } = await db.from(table).delete().in("id", [...ids]);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  console.log("Done.");
}

const args = process.argv.slice(2);
(args.includes("--remove-sample") ? removeSample() : seed(args.includes("--sample"))).catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
