// A publishable, invented document for exercising the engine. Not a real thesis.
import type { Document } from "../../src/lib/schemas";

export const sampleEngineDocument: Document = {
  id: "doc-mt-ch3",
  projectId: "proj-mt",
  title: "Chapter 3 Methods",
  createdAt: "2026-11-14T09:30:00Z",
  paragraphs: [
    { id: "p1", type: "heading", text: "3 Methods" },
    { id: "p2", type: "paragraph", text: "We designed a graded compression wrap and tested it with twelve participants across two clinics. Each participant wore three wrap variants for one week each, in a randomised order." },
    { id: "p3", type: "paragraph", text: "Participants were recruited through clinic referral. Inclusion criteria were adults with a healed venous leg ulcer in the past two years and no arterial disease." },
    { id: "p4", type: "paragraph", text: "Sub-bandage pressure was logged at the ankle and calf every ten minutes using printed capacitive sensors calibrated before each session." },
    { id: "p5", type: "paragraph", text: "Comfort was rated daily on a ten-point scale. We treat a two-point change as clinically meaningful." },
    { id: "p6", type: "paragraph", text: "Results were compared with a repeated-measures ANOVA, with Bonferroni correction across the three variants." },
    { id: "p7", type: "paragraph", text: "Two participants withdrew in week two. Their partial data are reported separately." },
    { id: "p8", type: "paragraph", text: "The study was reviewed by the departmental ethics panel. All participants gave written consent." },
  ],
};
