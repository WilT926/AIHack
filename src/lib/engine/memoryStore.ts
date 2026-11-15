import "server-only";
// Saving the board's memory (see ./memory.ts) on the project.
import { projects } from "@/lib/data";
import type { BoardMemory, MemoryAttempt } from "@/lib/schemas";
import { withActionDone, withAttempt } from "./memory";

export async function loadMemory(projectId: string): Promise<BoardMemory> {
  return (await projects.get(projectId))?.memory ?? { attempts: [] };
}

/** Called when a session ends. */
export async function recordAttempt(projectId: string, attempt: MemoryAttempt): Promise<void> {
  const p = await projects.get(projectId);
  if (!p) return;
  await projects.save({ ...p, memory: withAttempt(p.memory, attempt), updatedAt: new Date().toISOString() });
}

/** Called when the student ticks or unticks an action. */
export async function recordActionDone(projectId: string, sessionId: string, actionId: string, done: boolean): Promise<void> {
  const p = await projects.get(projectId);
  if (!p) return;
  await projects.save({ ...p, memory: withActionDone(p.memory, sessionId, actionId, done) });
}
