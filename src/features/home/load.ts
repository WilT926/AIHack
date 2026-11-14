import "server-only";
import { getWorkspace, hasDatabase } from "@/lib/data";
import type { Workspace } from "@/lib/schemas";
import { sampleWorkspace } from "../../../fixtures/home-sample";

/**
 * The student's workspace from the database. Without Supabase settings (a
 * teammate with no .env.local) it falls back to the sample fixture and says so.
 */
export async function loadWorkspace(): Promise<{ workspace: Workspace; sample: boolean }> {
  if (!hasDatabase()) return { workspace: sampleWorkspace, sample: true };
  return { workspace: await getWorkspace(), sample: false };
}
