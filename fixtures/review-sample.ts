// Sample data for the review screen (Lane 2, step 2.1).
// Invented, publishable content only. Never the real thesis.
import type { Assessor, ReviewView } from "../src/features/review/types";

export const presetAssessors: Assessor[] = [
  {
    id: "module-lead",
    name: "Prof. Alan Marsh",
    role: "Module Lead",
    field: "Biomedical engineering",
    harshness: 3,
    focus: ["mark scheme", "handbook requirements"],
    avatar: "module-lead",
  },
  {
    id: "methodologist",
    name: "Dr Raj Patel",
    role: "Methodologist",
    field: "Experimental design and statistics",
    harshness: 4,
    focus: ["sample size", "controls", "analysis"],
    avatar: "methodologist",
  },
  {
    id: "literature-hawk",
    name: "Dr Amara Osei",
    role: "Literature Hawk",
    field: "Related work in compression therapy",
    harshness: 3,
    focus: ["citations", "novelty"],
    avatar: "literature-hawk",
  },
  {
    id: "communicator",
    name: "Sophie Lang",
    role: "Communicator",
    field: "Scientific writing",
    harshness: 2,
    focus: ["structure", "flow", "clarity"],
    avatar: "communicator",
  },
  {
    id: "outsider",
    name: "Marcus Reid",
    role: "Outsider",
    field: "Medical device industry",
    harshness: 3,
    focus: ["cost", "adoption", "market"],
    avatar: "outsider",
  },
  {
    id: "sceptic",
    name: "Dr Nina Volkova",
    role: "Sceptic",
    field: "Clinical research methods",
    harshness: 5,
    focus: ["weakest claim", "bias"],
    avatar: "sceptic",
  },
];

const paragraphTexts = [
  "We designed a graded compression wrap and tested it with twelve participants across two clinics. Each participant wore three wrap variants for one week each, in a randomised order.",
  "Twelve participants were recruited through clinic referral. Inclusion criteria were adults with a healed venous leg ulcer in the past two years and no arterial disease.",
  "Sub-bandage pressure was logged at the ankle and calf every ten minutes using printed capacitive sensors calibrated before each session.",
  "Comfort was rated daily on a ten-point scale. We treat a two-point change as clinically meaningful, following earlier compression studies.",
  "All lattice samples were printed on the same machine from a single filament batch to limit variation between variants.",
  "Results were compared with a repeated-measures ANOVA, with Bonferroni correction across the three variants.",
  "Each wrap variant differed only in lattice density at the calf. Ankle density, wrap length and closure were held constant so that any change in pressure could be attributed to the calf section.",
  "Participants were given a one-page guide and a short demonstration on the first day. Clinic nurses checked the fit at the start of each week.",
  "Skin condition was photographed at the start and end of each week and graded by a nurse who did not know which variant had been worn.",
  "Sensor readings outside the calibrated range were flagged and removed before analysis. Days with fewer than six hours of wear were excluded.",
  "We also recorded how long each participant took to put the wrap on, as a proxy for whether it could be used at home without help.",
  "Two participants withdrew in week two, one for an unrelated illness and one who found the densest variant too warm. Their partial data are reported separately.",
  "The study was reviewed by the departmental ethics panel. All participants gave written consent and could withdraw at any time.",
  "All code and anonymised sensor data will be released with the thesis so the analysis can be repeated.",
];

export const sampleReview: ReviewView = {
  project: { id: "proj-masters", name: "Master's thesis" },
  board: {
    id: "board-early-gateway",
    name: "Early Gateway",
    assessorIds: ["module-lead", "methodologist", "literature-hawk", "sceptic", "outsider"],
  },
  assessors: presetAssessors,
  run: {
    id: "run-3",
    number: 3,
    uploadedAt: "2026-11-14T10:00:00Z",
    document: {
      id: "doc-ch3",
      title: "Methods",
      chapter: "Chapter 3",
      version: 3,
      wordCount: 2840,
      paragraphs: paragraphTexts.map((text, i) => ({
        id: `p${i + 1}`,
        index: i + 1,
        type: "paragraph",
        text,
      })),
    },
    comments: [
      {
        id: "c1",
        assessorId: "methodologist",
        paragraphIds: ["p2"],
        kind: "critique",
        text: "Twelve participants with three variants each is thin. Where is your power calculation? Without it I can't tell whether a null result means anything.",
      },
      {
        id: "c2",
        assessorId: "literature-hawk",
        paragraphIds: ["p4"],
        kind: "question",
        text: "Which compression studies set the two-point threshold? Cite them here. If they used a different scale, say how you converted it.",
      },
      {
        id: "c3",
        assessorId: "module-lead",
        paragraphIds: ["p5"],
        kind: "praise",
        text: "Good: controlling for print batch is exactly what the handbook asks for. Say this in the abstract too.",
      },
      {
        id: "c4",
        assessorId: "sceptic",
        paragraphIds: ["p2"],
        kind: "critique",
        text: "Clinic referral means the clinicians picked who took part. How do you rule out them choosing patients who'd do well?",
      },
      {
        id: "c5",
        assessorId: "outsider",
        paragraphIds: ["p11"],
        kind: "question",
        text: "Putting-on time is a good proxy. What would a clinic pay for this wrap compared with a standard four-layer bandage?",
      },
      {
        id: "c6",
        assessorId: "module-lead",
        paragraphIds: ["p13"],
        kind: "critique",
        text: "Give the ethics approval reference and date. The handbook makes this a required item in the methods chapter.",
      },
    ],
    deliberation: {
      seconds: 40,
      agreements: [
        "Controlling for print batch (¶5) is a real strength and should be kept.",
        "The two-point comfort threshold (¶4) needs a citation before submission.",
      ],
      splits: [
        {
          paragraphIds: ["p2"],
          topic: "is twelve participants enough?",
          approve: ["module-lead", "literature-hawk", "outsider"],
          object: ["methodologist"],
          advice:
            "Keep the paragraph. Add a power calculation and one line on why twelve suits a feasibility study. That satisfies Dr Patel without losing the others.",
        },
      ],
    },
    fixList: [
      {
        rank: 1,
        text: "Add a power calculation and justify n = 12 as a feasibility study.",
        paragraphIds: ["p2"],
        raisedBy: ["methodologist"],
      },
      {
        rank: 2,
        text: "Explain how referral bias was limited.",
        paragraphIds: ["p2"],
        raisedBy: ["sceptic"],
      },
      {
        rank: 3,
        text: "Cite the source of the two-point comfort threshold.",
        paragraphIds: ["p4"],
        raisedBy: ["literature-hawk"],
      },
    ],
    questions: [
      { assessorId: "methodologist", text: "If you ran this again, how many participants would you need, and why?" },
      { assessorId: "sceptic", text: "What stops the clinicians choosing patients who'd do well?" },
      { assessorId: "literature-hawk", text: "Which study is your two-point threshold from?" },
      { assessorId: "module-lead", text: "How does this method meet the module's ethics requirements?" },
      { assessorId: "outsider", text: "Could a clinic actually afford to use this wrap?" },
    ],
  },
  live: {
    status: "reviewing",
    doneAssessorIds: ["module-lead", "methodologist", "literature-hawk", "outsider"],
    reading: { assessorId: "sceptic", paragraphId: "p5" },
  },
};
