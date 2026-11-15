// TEMPORARY (Lane 2): project setup shapes from the Lane 2 brief (section 5).
// Lane 1's src/lib/schemas becomes the source of truth when it lands.

export type Criterion = { id: string; name: string; weight: number }; // weights sum to 100

export type TemplateId = "masters-thesis" | "lab-report" | "hackathon-pitch" | "viva-rehearsal" | "grant-proposal" | "blank";

export type TemplateIcon = "document" | "flask" | "presentation" | "microphone" | "coin" | "plus";

export type Template = {
  id: TemplateId;
  title: string;
  description: string;
  icon: TemplateIcon;
  isNew?: boolean;
  /** Pre-fills for the brief step. */
  name: string;
  brief: string;
  graded: string[];
  weakSpotSuggestions: string[];
  markScheme?: { source: string; criteria: Criterion[] };
  /** Suggested board (assessor ids), seated in step 4. */
  boardIds: string[];
};

/** What the student builds in the setup flow. */
export type ProjectDraft = {
  template: TemplateId;
  name: string;
  brief: string;
  graded: string[];
  weakSpots: string[]; // chosen suggestions
  ownWeakSpots: string; // free text, one per line
  markScheme?: { source: string; criteria: Criterion[] };
  boardIds: string[];
  /** "written": no live Q&A afterwards, so the board writes its questions plus what to add or cut. */
  qaMode?: "live" | "written";
};
