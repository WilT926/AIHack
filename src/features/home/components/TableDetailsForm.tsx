"use client";

// A table's editable details: name, type, description, topic and deadline.
// Used by the new-table panel and by Edit details in the side panel.
import { TextArea, TextInput } from "@/components/ui";
import { Segmented } from "@/components/ui/Controls";

export type TableDetails = { title: string; template: "masters-report" | "lab-report" | "pitch"; what: string; topic: string; deadline: string };

export const BLANK_DETAILS: TableDetails = { title: "", template: "masters-report", what: "", topic: "", deadline: "" };

const TYPES = [
  { id: "masters-report", label: "Report" },
  { id: "lab-report", label: "Lab report" },
  { id: "pitch", label: "Presentation" },
] as const;

export function TableDetailsForm({ value, onChange, idPrefix }: { value: TableDetails; onChange: (v: TableDetails) => void; idPrefix: string }) {
  return (
    <div className="fl-details">
      <TextInput id={`${idPrefix}-name`} label="Name" value={value.title} placeholder="e.g. Dissertation" onChange={(e) => onChange({ ...value, title: e.target.value })} />
      <div className="ui-field">
        <span className="ui-label">Type</span>
        <Segmented label="Type" value={value.template} options={[...TYPES]} onChange={(t) => onChange({ ...value, template: t })} />
      </div>
      <TextArea
        id={`${idPrefix}-what`}
        label="Description"
        value={value.what}
        rows={3}
        placeholder={value.template === "pitch" ? "What you're presenting, and to whom" : "What the work is and what's graded"}
        onChange={(e) => onChange({ ...value, what: e.target.value })}
      />
      <TextInput id={`${idPrefix}-topic`} label="Topic" value={value.topic} placeholder="Optional" onChange={(e) => onChange({ ...value, topic: e.target.value })} />
      <TextInput
        id={`${idPrefix}-deadline`}
        label={value.template === "pitch" ? "Presenting on" : "Due"}
        type="date"
        value={value.deadline}
        onChange={(e) => onChange({ ...value, deadline: e.target.value })}
      />
    </div>
  );
}
