import { PageFrame } from "@/components/ui/PageFrame";

const TOPICS = [
  { title: "Your floor", text: "Each panel is a project. Its board sits round it, its documents lie on it and its sessions are dots on its rim." },
  { title: "Assessors and notes", text: "Copy an assessor, rename it after your lecturer and add what they said in lectures. The next session reflects it." },
  { title: "Review a report", text: "Upload a document. Each assessor comments on paragraphs, then the board deliberates and writes a feedback report." },
  { title: "Practise a presentation", text: "Present aloud. The board steps out, comes back as a call and asks its questions one at a time." },
  { title: "Search and filters", text: "Press ⌘K or / to search. Use Filters in the search pill to show panels by status or by assessor." },
  { title: "Take it to a person", text: "When the board cannot agree, or a point is outside its field, the report says to ask your supervisor." },
];

export default function HelpPage() {
  return (
    <PageFrame title="Help">
      <div className="help">
        {TOPICS.map((t) => (
          <article key={t.title} className="help__card">
            <h2>{t.title}</h2>
            <p>{t.text}</p>
          </article>
        ))}
      </div>
    </PageFrame>
  );
}
