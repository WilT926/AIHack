import type { Assessor, Deliberation } from "../types";
import { Card } from "../ui/Card";
import { Label } from "../ui/Label";
import { Avatar } from "../ui/Avatar";

/**
 * The board discussion (plan step 2.1): the summary, where the board agrees,
 * where it disagrees with each assessor's view, and the advice. The ranked
 * actions live in the feedback report tab.
 */
export function BoardDiscussion({
  deliberation,
  assessors,
}: {
  deliberation: Deliberation;
  assessors: Map<string, Assessor>;
}) {
  return (
    <Card variant="dark" className="p-6">
      <Label tone="accent">Board discussion</Label>
      {deliberation.summary && <h2 className="mt-2 font-display text-h3-lg font-semibold tracking-h3">{deliberation.summary}</h2>}

      {deliberation.agreements.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          <Label tone="inverse">Where the board agrees</Label>
          <ul className="flex flex-col gap-1.5">
            {deliberation.agreements.map((a, i) => (
              <li key={i} className="text-body text-grey-200">
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {deliberation.disagreements.map((d, i) => (
        <div key={i} className="mt-5 flex flex-col gap-2.5 border-t border-grey-700 pt-4">
          <Label tone="inverse">Where it disagrees</Label>
          <h3 className="font-display text-h3 font-semibold tracking-h3">{d.topic}</h3>
          <ul className="flex flex-col gap-2">
            {d.views.map((v) => {
              const a = assessors.get(v.assessorId);
              return (
                <li key={v.assessorId} className="flex items-start gap-2.5">
                  <Avatar avatar={a?.avatar ?? ""} name={a?.name ?? "An assessor"} size="sm" invert />
                  <span className="text-body text-grey-200">
                    <b className="text-white">{a?.name ?? "An assessor"}</b> {v.view}
                  </span>
                </li>
              );
            })}
          </ul>
          {d.advice && (
            <p className="text-body text-white">
              <Label tone="accent" size="sm">Advice</Label> {d.advice}
            </p>
          )}
        </div>
      ))}
    </Card>
  );
}
