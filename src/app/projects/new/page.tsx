import { ProjectSetup } from "@/features/projects/ProjectSetup";
import { presetAssessors } from "../../../../fixtures/review-sample";

// Step 2.4: template -> brief and weak spots -> board -> start, then upload
// and a live review. Preset assessors are sample data until Lane 1 seeds them.
export default function NewProjectPage() {
  return <ProjectSetup presets={presetAssessors} />;
}
