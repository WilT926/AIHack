import { Suspense } from "react";
import { connection } from "next/server";
import { Avatar, Button, Card, DotRating, Label, Spinner } from "@/components/ui";
import { PageFrame } from "@/components/ui/PageFrame";
import { CopyAssessor } from "@/features/assessors/CopyAssessor";
import { assessorNotes, assessors, dataSource } from "@/lib/data";

async function AssessorGallery() {
  await connection();
  const [list, notes] = await Promise.all([assessors.list(), assessorNotes.list()]);
  const fields = [...new Set(list.map((a) => a.field || "General"))].sort();
  return <div className="as-page">
    {dataSource() !== "database" && <Label tone="orange">Temporary data · saved until the server restarts</Label>}
    <p className="as-quiet">Invented AI assessors, shaped by the notes you give them about your own markers.</p>
    <Card dashed className="as-create"><div><h2>New assessor</h2><p className="as-quiet">Copy someone, rename them, then add what your marker looks for.</p></div><CopyAssessor assessors={list} /></Card>
    <div className="as-gallery">{fields.map((field) => <section key={field} className="as-group" aria-label={field}>
      <h2 className="ui-label">{field}</h2>
      {list.filter((a) => (a.field || "General") === field).map((a) => <Card key={a.id} className="as-card">
        <Avatar avatar={a.avatar} size="2xl" />
        <h3>{a.name}</h3><Label size="sm">{a.role}</Label>
        <p className="as-card__focus">{a.focusAreas.join(" · ") || "General feedback"}</p>
        <div className="as-choices"><DotRating value={a.harshness} max={5} label="Harshness" /><Label size="sm">{notes.filter((n) => n.assessorId === a.id).length} notes</Label></div>
        <Button variant="secondary" size="sm" href={`/assessors/${a.id}`}>View profile and notes</Button>
      </Card>)}
    </section>)}</div>
  </div>;
}
export default function AssessorsPage() {
  return <PageFrame title="Assessors" active="assessors"><Suspense fallback={<Spinner label="Fetching the board" />}><AssessorGallery /></Suspense></PageFrame>;
}
