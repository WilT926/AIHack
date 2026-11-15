// Seed content shared by the database seed (supabase/seed.ts) and the
// in-memory development store (src/lib/data/memory.ts). Invented content.
import type { Board, Template } from "@/lib/schemas";

export const reportBoard: Board = {
  id: "board-report",
  name: "Report board",
  assessorIds: ["module-lead", "methodologist", "literature-hawk", "communicator", "outsider", "sceptic"],
};
export const pitchBoard: Board = {
  id: "board-pitch",
  name: "Pitch judges",
  assessorIds: ["technical-judge", "education-lead", "investor", "design-judge"],
};

export const templates: Template[] = [
  {
    id: "masters-report",
    title: "Master's report",
    description: "A chapter or a full draft, marked against your handbook.",
    brief: { what: "Master's thesis", topic: "", graded: ["Aims", "Methods", "Analysis", "Discussion", "Writing"], goal: "" },
    markSchemeText: "",
    boardId: reportBoard.id,
  },
  {
    id: "lab-report",
    title: "Lab report",
    description: "Methods and results, read hard on the experimental process.",
    brief: { what: "Lab report", topic: "", graded: ["Method", "Results", "Error analysis", "Conclusions"], goal: "" },
    markSchemeText: "",
    boardId: reportBoard.id,
  },
  {
    id: "pitch",
    title: "Hackathon pitch",
    description: "A short pitch and Q&A, judged against the event's criteria.",
    brief: { what: "Hackathon pitch", topic: "", graded: ["Originality", "Relevance", "Industry application", "Design", "Presentation"], goal: "" },
    markSchemeText:
      "Judging criteria (paste the event's own wording here):\n" +
      "- Originality\n- Relevance to the theme\n- Potential industry application\n" +
      "- User experience and design\n- Presentation\n- Security and resilience",
    boardId: pitchBoard.id,
  },
];
