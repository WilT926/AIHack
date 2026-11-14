import { features } from "@/config";
import { PageFrame } from "@/components/ui/PageFrame";

// Page shell (step 1.1). Presentation practice is built in steps 1.3 and 1.4
// and stays switched off in src/config until then.
export default function PitchPage() {
  return (
    <PageFrame title="Presentation practice">
      <p className="ui-empty">
        {features.pitch
          ? "Choose a table on your floor to practise a presentation."
          : "Presentation practice is not switched on yet."}
      </p>
    </PageFrame>
  );
}
