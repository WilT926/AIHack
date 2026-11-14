// Apply every SQL file in supabase/migrations, in name order.
//   npm run db:migrate
// Needs DATABASE_URL in .env.local (Supabase: Connect > Session pooler).
// Without it, paste the migration files into the Supabase SQL editor instead.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL in .env.local, or paste supabase/migrations/*.sql into the Supabase SQL editor.");
  process.exit(1);
}

const dir = join(process.cwd(), "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

async function main() {
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    for (const f of files) {
      console.log(`Applying ${f}`);
      await client.query(readFileSync(join(dir, f), "utf8"));
    }
    console.log("Done.");
  } finally {
    await client.end();
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
