// Opt-in only: PANEL_VERIFY_LIVE=1 npm test -- src/lib/engine/live-verification.test.ts
// Uses only the invented, publishable fixtures. Never logs environment values.
import { writeFile } from "node:fs/promises";
import { expect, it } from "vitest";
import { finishPitch, startPitchSession } from "@/features/pitch/actions";
import { callLogs, documents, projects } from "@/lib/data";
import { reportBoard } from "@/lib/data/seed-data";
import { sampleEngineDocument } from "../../../fixtures/engine/sample-document";
import { finishQandA, generateQuestions, takeAnswer } from "./pitchService";
import { deliberateAndSave, reviewWithAssessor, type FinishedResult } from "./service";

it.skipIf(process.env.PANEL_VERIFY_LIVE !== "1")("verifies real review and pitch replies on invented material", async () => {
  process.loadEnvFile(".env.local");
  const prefix = process.env.PANEL_VERIFY_GUARDS === "1" ? "guarded-real" : "real";
  expect(Boolean(process.env.ANTHROPIC_API_KEY)).toBe(true);
  const project = (await projects.get("proj-mt"))!;
  await projects.save({ ...project, boardId: reportBoard.id, memory: { attempts: [] }, markSchemeText: "", brief: { ...project.brief, graded: ["Methods", "Analysis", "Writing"], goal: "Clear, justified methods" } });
  await documents.save(sampleEngineDocument);
  const results = await Promise.all(reportBoard.assessorIds.map((assessorId) => reviewWithAssessor({ projectId: project.id, documentId: sampleEngineDocument.id, assessorId })));
  console.info("Real assessors:", results.map((r) => `${r.assessorId}: ${r.status}${r.status === "done" ? ` (${r.comments.length} comments)` : ` (${r.error})`}`).join(", "));
  expect(results.every((r) => r.status === "done" && r.comments.length > 0)).toBe(true);
  const finished: FinishedResult[] = results.map((r) => ({ assessorId: r.assessorId, status: r.status, replySource: r.replySource, comments: r.status === "done" ? r.comments : [] }));
  const review = await deliberateAndSave({ projectId: project.id, documentId: sampleEngineDocument.id, results: finished });
  expect(review.replySource).toBe("claude");
  expect(review.report?.actions.length).toBeGreaterThan(0);
  await writeFile(`fixtures/engine/${prefix}-review.json`, JSON.stringify({ provenance: "Real Claude replies on invented sample-document.ts; not student work", verifiedAt: new Date().toISOString(), review, calls: await callLogs.list() }, null, 2) + "\n");
  console.info("Real review saved");

  const p = (await projects.get("proj-hp"))!;
  await projects.save({ ...p, memory: { attempts: [] }, markSchemeText: "", brief: { ...p.brief, graded: ["Problem", "Evidence", "Design"], goal: "Explain the prototype clearly" } });
  const s = await startPitchSession({ projectId: p.id, questionCount: 2, mode: "text", capture: "typed" });
  const transcript = "Panel helps students practise before marking. A student builds a board of AI assessors with different fields, uploads a report or gives a pitch, then receives questions and feedback linked to their own words. Each assessor reads independently before the board deliberates. We tested a clickable prototype with twelve students; nine found the actions useful, but we have not measured learning gains or compared against a generic chatbot. The prototype uses one demo profile and stores invented projects. It does not assign grades or write answers. Our next test will compare students' revisions against blind marker feedback. Thank you.";
  const start = Date.now();
  await finishPitch({ sessionId: s.id, transcript, capture: "typed", startedAt: "2026-11-15T02:00:00Z", endedAt: "2026-11-15T02:01:30Z" });
  const asked = await generateQuestions(s.id);
  const firstQuestionMs = Date.now() - start;
  let next: unknown = true;
  const gaps: number[] = [];
  let turns = 0;
  while (next && turns++ < 8) {
    const r = await takeAnswer(s.id, "Our evidence is a usability pilot with twelve students, nine of whom found the actions useful. That does not establish learning gains. We will compare revisions against blind marker feedback in a controlled study, with prior attainment balanced across groups and a generic chatbot as the baseline.");
    next = r.next;
    if (r.next?.timing) gaps.push(r.next.timing.gapMs);
  }
  expect(next).toBeNull();
  const pitch = await finishQandA(s.id);
  expect(pitch.report?.questionReview?.length).toBe(asked.questions.length);
  expect(pitch.replySource).toBe("claude");
  await writeFile(`fixtures/engine/${prefix}-pitch.json`, JSON.stringify({ provenance: "Real Claude replies on an invented typed pitch; microphone and audio not verified", verifiedAt: new Date().toISOString(), firstQuestionMs, answerToQuestionMs: gaps, pitch, calls: (await callLogs.list()).filter((c) => c.kind !== "review" && c.kind !== "deliberation") }, null, 2) + "\n");
  console.info("Real pitch saved", { firstQuestionMs, answerToQuestionMs: gaps });
}, 300_000);
