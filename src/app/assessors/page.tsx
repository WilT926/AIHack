import { Suspense } from "react";
import { connection } from "next/server";
import { Avatar, DotRating, Label, Spinner } from "@/components/ui";
import { PageFrame } from "@/components/ui/PageFrame";
import { assessorNotes, assessors, hasDatabase } from "@/lib/data";
import { sampleAssessors, sampleNotes } from "../../../fixtures/home-sample";

// Page shell (step 1.1): lists the assessors from the database. Lane 3 builds
// the real gallery, profiles and notes here (step 3.3).
async function AssessorList() {
  await connection();
  const db = hasDatabase();
  const [list, notes] = db ? await Promise.all([assessors.list(), assessorNotes.list()]) : [sampleAssessors, sampleNotes];
  if (list.length === 0) return <p className="ui-empty">No assessors yet. Run npm run db:seed to add the presets.</p>;
  return (
    <>
      {!db && <Label tone="orange">Sample data: the database is not configured</Label>}
      <ul className="shell-grid">
        {list.map((a) => {
          const n = notes.filter((x) => x.assessorId === a.id).length;
          return (
            <li key={a.id} className="ui-card shell-card">
              <Avatar avatar={a.avatar} size="2xl" />
              <span className="shell-card__name">{a.name}</span>
              <span className="shell-card__sub">
                {a.role} · {a.field}
              </span>
              <span className="shell-card__meta">
                <DotRating value={a.harshness} max={5} label="Harshness" />
                <Label size="sm">
                  {n} {n === 1 ? "note" : "notes"}
                </Label>
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function AssessorsPage() {
  return (
    <PageFrame title="Assessors" active="assessors">
      <Suspense fallback={<Spinner label="Fetching the board" />}>
        <AssessorList />
      </Suspense>
    </PageFrame>
  );
}
