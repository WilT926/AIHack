// Focus angles: each run, the code picks a few at random per assessor, so two
// runs on the same document do not read it the same way. (Sampling settings
// such as temperature are rejected by the current API; variation comes from
// here.)

const BY_ROLE: Record<string, string[]> = {
  "module lead": [
    "how well the work meets each graded criterion in the brief",
    "anything the handbook requires that is missing",
    "whether the conclusion answers the question the project set",
    "how the work would read to a second marker",
    "the balance between description and critical analysis",
  ],
  methodologist: [
    "whether the sample size is justified",
    "controls and confounding factors",
    "whether the analysis matches the design",
    "how measurement error is handled",
    "whether someone could repeat this from the text alone",
  ],
  "literature hawk": [
    "whether the gap in the literature is stated clearly",
    "claims that need a citation",
    "whether the work is positioned against the closest prior work",
    "over-reliance on a few sources",
    "whether the novelty is overstated",
  ],
  communicator: [
    "paragraph structure and signposting",
    "jargon that is not defined",
    "whether each paragraph makes one point",
    "figures, tables and captions",
    "whether the opening tells the reader what to expect",
  ],
  outsider: [
    "whether a non-specialist could follow the argument",
    "real-world use, cost and adoption",
    "who would actually benefit and how",
    "assumptions an expert might not notice",
    "what is missing for someone outside the field",
  ],
  sceptic: [
    "the weakest claim in the work",
    "alternative explanations for the results",
    "conclusions that go beyond the evidence",
    "possible sources of bias",
    "what would change the conclusion",
  ],
  "technical judge": ["what actually works today", "the hardest technical part", "how it fails", "security and data handling", "what is real versus mocked"],
  "education lead": ["the benefit to students", "evidence that it helps learning", "fairness and access", "fit with how universities work", "risks of misuse"],
  investor: ["who pays and why", "the size of the market", "what stops a competitor copying it", "the next twelve months", "the team's unfair advantage"],
  "design judge": ["clarity of the interface", "consistency of the design", "the first thirty seconds of use", "accessibility", "how the AI's state is shown"],
};

const GENERAL = [
  "the single most important improvement",
  "anything a marker would mark down",
  "what is genuinely strong and should be kept",
  "the clarity of the main argument",
  "places where the evidence is thin",
];

/** The angle list for an assessor, by role (case-insensitive), or a general list. */
export function anglesFor(role: string): string[] {
  return BY_ROLE[role.trim().toLowerCase()] ?? GENERAL;
}

/** Pick `count` distinct angles at random. `random` is injectable for tests. */
export function pickAngles(role: string, count: number, random: () => number = Math.random): string[] {
  const pool = [...anglesFor(role)];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
