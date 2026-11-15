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

/** The tables the dock's "+" menu offers, on any page. */
export async function loadPlusTables(): Promise<{ tables: { id: string; name: string; kind: "review" | "pitch" }[]; newProjectHref: string }> {
  const { buildFloor } = await import("./model");
  const floor = buildFloor(await getWorkspace());
  return { tables: floor.tables.map((t) => ({ id: t.id, name: t.name, kind: t.kind })), newProjectHref: floor.newProjectHref };
}
