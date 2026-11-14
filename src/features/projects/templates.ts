// Project templates. Picking one pre-fills the brief and seats a suggested
// board. Assessor ids are the preset keys from the brief (keep them stable).
import type { Criterion, ProjectDraft, Template, TemplateId } from "./types";

export const GRADED_OPTIONS = ["Idea & originality", "The demo", "Presentation skills", "Written report"];

/** Imperial AI Hack judging criteria: the hackathon pitch template's mark scheme. */
export const HACKATHON_CRITERIA: Criterion[] = [
  { id: "originality", name: "Originality", weight: 30 },
  { id: "relevance", name: "Relevance to the theme", weight: 20 },
  { id: "industry", name: "Potential industry application", weight: 20 },
  { id: "ux", name: "User experience & design", weight: 15 },
  { id: "presentation", name: "Presentation", weight: 10 },
  { id: "security", name: "Security & resilience", weight: 5 },
];

export const TEMPLATES: Template[] = [
  {
    id: "masters-thesis",
    title: "Master's thesis",
    description: "Chapter or full draft, marked against your handbook",
    icon: "document",
    name: "Master's thesis",
    brief: "A chapter of my master's thesis. Goal: find what an examiner would pick apart before I submit.",
    graded: ["Idea & originality", "Written report"],
    weakSpotSuggestions: ["Sample size", "Related work is thin", "Methods are unclear", "Too long"],
    boardIds: ["module-lead", "methodologist", "literature-hawk", "communicator"],
  },
  {
    id: "lab-report",
    title: "Lab report",
    description: "Methods and results, harsh on the experimental process",
    icon: "flask",
    name: "Lab report",
    brief: "A lab report covering methods and results. Goal: make sure the experimental process holds up.",
    graded: ["Written report"],
    weakSpotSuggestions: ["Error analysis", "Controls", "Figures and units", "Conclusion overreaches"],
    boardIds: ["methodologist", "module-lead", "sceptic"],
  },
  {
    id: "hackathon-pitch",
    title: "Hackathon pitch",
    description: "Deck and demo, judged against the event's criteria",
    icon: "presentation",
    isNew: true,
    name: "AI Hackathon pitch",
    brief:
      "A 3-minute pitch and live demo of our hackathon project. Goal: find the weakest part of the pitch before the judges do.",
    graded: ["Idea & originality", "The demo", "Presentation skills"],
    weakSpotSuggestions: ["Business model", "Why not just ChatGPT?", "Data privacy", "Demo might break"],
    markScheme: { source: "Hackathon judging criteria", criteria: HACKATHON_CRITERIA },
    boardIds: ["outsider", "communicator", "sceptic"],
  },
  {
    id: "viva-rehearsal",
    title: "Viva rehearsal",
    description: "Your report plus a spoken Q&A from the panel",
    icon: "microphone",
    name: "Viva rehearsal",
    brief: "My report, ahead of a viva. Goal: know which questions are coming and where my answers are weakest.",
    graded: ["Written report", "Presentation skills"],
    weakSpotSuggestions: ["Limitations", "Why this method?", "Contribution to the field"],
    boardIds: ["module-lead", "literature-hawk", "sceptic"],
  },
  {
    id: "grant-proposal",
    title: "Grant proposal",
    description: "Aims, impact and budget, read by a funding panel",
    icon: "coin",
    name: "Grant proposal",
    brief: "A grant proposal: aims, impact and budget. Goal: make the case a funding panel would back.",
    graded: ["Idea & originality", "Written report"],
    weakSpotSuggestions: ["Budget justification", "Impact is vague", "Feasibility", "Timeline"],
    boardIds: ["outsider", "methodologist", "sceptic"],
  },
  {
    id: "blank",
    title: "Start blank",
    description: "No template. Write your own brief",
    icon: "plus",
    name: "",
    brief: "",
    graded: [],
    weakSpotSuggestions: ["Structure", "Evidence", "Clarity"],
    boardIds: [],
  },
];

export function getTemplate(id: TemplateId): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[TEMPLATES.length - 1];
}

/** A fresh draft from a template. */
export function draftFromTemplate(id: TemplateId): ProjectDraft {
  const t = getTemplate(id);
  return {
    template: t.id,
    name: t.name,
    brief: t.brief,
    graded: [...t.graded],
    weakSpots: [],
    ownWeakSpots: "",
    markScheme: t.markScheme ? { source: t.markScheme.source, criteria: t.markScheme.criteria.map((c) => ({ ...c })) } : undefined,
    boardIds: [...t.boardIds],
  };
}
