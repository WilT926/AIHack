import { expect, it } from "vitest";
import { sampleWorkspace } from "../../../fixtures/home-sample";
import { buildFloor } from "./model";

it("gives Desk and side-panel documents their own URLs, and review feedback a report-tab URL", () => {
  const model = buildFloor(sampleWorkspace);
  for (const doc of model.desk.docs) {
    expect(doc.href).toBe(`/review?document=${encodeURIComponent(doc.id)}`);
    expect(model.tables.flatMap((t) => t.docs).find((d) => d.id === doc.id)?.href).toBe(doc.href);
  }
  const reviewReports = model.desk.reports.filter((r) => r.href?.startsWith("/review"));
  expect(reviewReports.length).toBeGreaterThan(0);
  expect(reviewReports.every((r) => new URL(r.href!, "http://panel.test").searchParams.get("tab") === "report")).toBe(true);
});
