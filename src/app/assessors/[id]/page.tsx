import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Avatar, Button, DotRating, Label, SkeletonPage } from "@/components/ui";
import { PageFrame } from "@/components/ui/PageFrame";
import { CopyAssessor } from "@/features/assessors/CopyAssessor";
import { Notes } from "@/features/assessors/Notes";
import { RemoveAssessor } from "@/features/assessors/RemoveAssessor";
import { assessorNotes, assessors, dataSource } from "@/lib/data";

async function Profile({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const [assessor, notes] = await Promise.all([assessors.get(id), assessorNotes.list({ assessorId: id })]);
  if (!assessor) notFound();
  return <div className="as-page">
    <Button variant="quiet" size="sm" href="/assessors">← All assessors</Button>
    {dataSource() !== "database" && <Label tone="orange">Temporary data · saved until the server restarts</Label>}
    <section className="as-profile" aria-label={`${assessor.name}, assessor profile`}>
      <div className="as-profile__avatar"><Avatar avatar={assessor.avatar} size="fill" /></div>
      <div className="as-profile__details">
        <Label tone="ink">{assessor.isPreset ? "Preset AI assessor" : "Your AI assessor"}</Label>
        <h2>{assessor.name}</h2>
        <Label>{assessor.field}</Label><p>{assessor.role}</p>
        <div><Label size="sm">Personality</Label><p>{assessor.personality || "No personality description added."}</p></div>
        <div className="as-choices"><Label size="sm">Harshness</Label><DotRating value={assessor.harshness} max={5} label="Harshness" /></div>
        <div><Label size="sm">Focus areas</Label><ul className="as-focus">{assessor.focusAreas.map((focus) => <li key={focus}>{focus}</li>)}</ul></div>
        <CopyAssessor assessors={[assessor]} initialId={assessor.id} label="Copy this assessor" />
        {!assessor.isPreset && <RemoveAssessor id={assessor.id} name={assessor.name} />}
      </div>
    </section>
    <Notes assessorId={assessor.id} notes={notes} />
  </div>;
}
export default function AssessorPage({ params }: { params: Promise<{ id: string }> }) {
  return <PageFrame title="Assessor profile" active="assessors"><Suspense fallback={<SkeletonPage label="Opening the assessor notes" cards={2} />}><Profile params={params} /></Suspense></PageFrame>;
}
