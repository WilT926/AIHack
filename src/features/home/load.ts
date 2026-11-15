import "server-only";
import { dataSource, getWorkspace } from "@/lib/data";
import type { Workspace } from "@/lib/schemas";

/**
 * The student's workspace. Without Supabase settings the data layer serves
 * its temporary in-memory store (seeded from the sample fixture), and the
 * floor says "sample data".
 */
export async function loadWorkspace(): Promise<{ workspace: Workspace; sample: boolean }> {
  return { workspace: await getWorkspace(), sample: dataSource() !== "database" };
}
