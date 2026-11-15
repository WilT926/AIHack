// Hand-written sample replies in the shape the engine asks Claude for. NOT
// real Claude output: used only to test reply checking and failure handling.
// Each includes items that must be dropped.

/** The Sceptic's reply on the sample document. */
export const sampleAssessorReply = {
  comments: [
    {
      paragraphId: "p2",
      quote: "twelve participants",
      category: "Sample size",
      severity: "major",
      text: "Twelve participants across three variants gives little power. The chapter does not say why twelve is enough.",
      suggestion: "Add a power calculation, or frame the study as a feasibility study.",
    },
    {
      paragraphId: "p5",
      quote: "",
      category: "Measures",
      severity: "minor",
      text: "The two-point threshold needs a source.",
      suggestion: "Cite where the two-point threshold comes from.",
    },
    // Dropped: paragraph does not exist.
    { paragraphId: "p99", quote: "", category: "Ghost", severity: "minor", text: "Refers to a paragraph that is not there.", suggestion: "" },
    // Dropped: the quote is not in paragraph p4.
    { paragraphId: "p4", quote: "forty participants", category: "Misquote", severity: "major", text: "Quotes words that p4 does not contain.", suggestion: "" },
    // Dropped: headings are not commented on.
    { paragraphId: "p1", quote: "", category: "Heading", severity: "minor", text: "Comment on a heading.", suggestion: "" },
    // Dropped: severity is not one of praise, minor, major.
    { paragraphId: "p3", quote: "", category: "Bad", severity: "catastrophic", text: "Invalid severity.", suggestion: "" },
  ],
};

/** A deliberation reply for a board of sceptic + methodologist. */
export const sampleDeliberationReply = {
  deliberation: {
    summary: "The board agrees the design is sound but the sample size is not justified.",
    agreements: ["The sample size needs a justification."],
    disagreements: [
      {
        topic: "Whether twelve participants is enough",
        views: [
          { assessorId: "sceptic", view: "Too few to support any conclusion." },
          { assessorId: "methodologist", view: "Enough for a feasibility study if framed as one." },
          { assessorId: "not-on-board", view: "Dropped: not on this board." },
        ],
        advice: "Call it a feasibility study and add a power calculation for a full trial.",
      },
    ],
  },
  report: {
    verdict: "A clear methods chapter with one serious gap: the sample size is never justified.",
    criteria: [
      { criterion: "Methods", rating: "adequate", evidence: "Design is clear; the sample size is not justified (p2)." },
      { criterion: "Analysis", rating: "strong", evidence: "Appropriate test and correction (p6)." },
    ],
    strengths: ["Randomised order of variants.", "Calibrated sensors."],
    actions: [
      { what: "Justify twelve participants", why: "Every marker will ask.", raisedBy: ["sceptic", "methodologist"], paragraphIds: ["p2"], effort: "quick" },
      { what: "Source the two-point threshold", why: "Unsupported claims cost marks.", raisedBy: ["sceptic"], paragraphIds: ["p5"], effort: "quick" },
      // Dropped: points at no real paragraph.
      { what: "Rewrite the discussion", why: "Not based on this document.", raisedBy: ["sceptic"], paragraphIds: ["p42"], effort: "substantial" },
      // Dropped: raised by no one on the board.
      { what: "Add a figure", why: "Raised by a stranger.", raisedBy: ["stranger"], paragraphIds: ["p4"], effort: "moderate" },
    ],
    assessorVerdicts: [
      { assessorId: "sceptic", line: "Justify the numbers before anything else." },
      { assessorId: "methodologist", line: "Solid design; frame it as feasibility." },
      { assessorId: "stranger", line: "Dropped: not on this board." },
    ],
    likelyQuestions: [
      { assessorId: "sceptic", question: "Why twelve participants?" },
      { assessorId: "stranger", question: "Dropped: not on this board." },
    ],
    escalations: [{ reason: "Whether the ethics approval covers home use is outside the board's fields.", whoToAsk: "Your supervisor or the ethics panel" }],
  },
};
