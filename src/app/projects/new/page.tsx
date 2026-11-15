import { Suspense } from "react";
import { connection } from "next/server";
import { Spinner } from "@/components/ui";
import { ProjectSetup } from "@/features/projects/ProjectSetup";
import { assessors } from "@/lib/data";
import { replySource } from "@/lib/engine/service";

// Step 2.4: template -> brief and weak spots -> board -> start. The project
// and board are saved, then upload and a live review (or pitch practice).
async function Setup() {
  await connection();
  return <ProjectSetup presets={await assessors.list()} sampleReplies={replySource() === "sample"} />;
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={<div className="flex h-dvh items-center justify-center"><Spinner label="Loading" /></div>}>
      <Setup />
    </Suspense>
  );
}
