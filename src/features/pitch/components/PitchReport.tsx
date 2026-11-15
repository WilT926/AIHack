"use client";

// The feedback report that closes a presentation-practice session (§9
// Feedback report). A plain version until Lane 2's report screen (2.3b) lands.
import { useState } from "react";
import { Avatar, Button, DotRating, Label } from "@/components/ui";
import type { FeedbackReport, PitchQuestion } from "@/lib/schemas";
import { clock } from "@/lib/voice/transcript";
import type { PitchSeat } from "../types";

const RATING = { strong: 3, adequate: 2, weak: 1 } as const;
const EFFORT = { quick: 1, moderate: 2, substantial: 3 } as const;

function asText(r: FeedbackReport, name: (id: string) => string, questions: PitchQuestion[]): string {
  const lines = [`Verdict: ${r.verdict}`, ""];
  r.assessorVerdicts.forEach((v) => lines.push(`${name(v.assessorId)}: ${v.line}`));
  lines.push("", "Against the criteria:");
  r.criteria.forEach((c) => lines.push(`- ${c.criterion} (${c.rating}): ${c.evidence}`));
  lines.push("", "Actions:");
  r.actions.forEach((a, i) => lines.push(`${i + 1}. ${a.what} (${a.effort}). ${a.why} Raised by ${a.raisedBy.map(name).join(", ")}.${a.evidence.quote ? ` "${a.evidence.quote}"` : ""}`));
  if (r.strengths.length) lines.push("", "Keep:", ...r.strengths.map((s) => `- ${s}`));
  if (r.delivery) lines.push("", `Delivery: ${clock(r.delivery.lengthSeconds)}, ${r.delivery.wordsPerMinute} wpm.`, r.delivery.structure, r.delivery.clarity);
  (r.questionReview ?? []).forEach((q) => {
    const asked = questions.find((x) => x.id === q.questionId);
    lines.push("", `Q: ${asked?.text ?? q.questionId} (${q.howWell})`, `Stronger answer: ${q.strongerAnswer}`);
  });
  if (r.escalations.length) lines.push("", "Take this to your supervisor:", ...r.escalations.map((e) => `- ${e.reason} (${e.whoToAsk})`));
  return lines.join("\n");
}

export function PitchReport({
  report,
  seats,
  questions,
  sample,
  onToggle,
  onAgain,
}: {
  report: FeedbackReport;
  seats: PitchSeat[];
  questions: PitchQuestion[];
  sample: boolean;
  onToggle: (actionId: string, done: boolean) => void;
  onAgain: () => void;
}) {
  const [ticked, setTicked] = useState<Record<string, boolean>>(() => Object.fromEntries(report.actions.map((a) => [a.id, a.done])));
  const [copied, setCopied] = useState(false);
  const seat = (id: string) => seats.find((s) => s.id === id);
  const name = (id: string) => seat(id)?.name ?? id;

  return (
    <article className="ps-report" aria-labelledby="ps-report-verdict">
      <header className="ps-report__top">
        {sample ? <Label tone="orange">Sample replies: not real feedback</Label> : <Label>Feedback report</Label>}
        <Button
          variant="quiet"
          size="sm"
          onClick={() => {
            void navigator.clipboard?.writeText(asText(report, name, questions)).then(() => setCopied(true));
          }}
        >
          {copied ? "Copied" : "Copy as text"}
        </Button>
      </header>

      <section className="ps-report__section">
        <p id="ps-report-verdict" className="ps-report__verdict">
          {report.verdict}
        </p>
        <ul className="ps-report__lines">
          {report.assessorVerdicts.map((v) => (
            <li key={v.assessorId}>
              <Avatar avatar={seat(v.assessorId)?.avatar ?? "avatar-001"} size="md" />
              <span>
                <b>{name(v.assessorId)}</b> {v.line}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {report.criteria.length > 0 && (
        <section className="ps-report__section">
          <h2 className="ps-report__h">Against the judging criteria</h2>
          <ul className="ps-report__rows">
            {report.criteria.map((c) => (
              <li key={c.criterion} className="ps-report__crit">
                <span className="ps-report__crit-name">{c.criterion}</span>
                <DotRating value={RATING[c.rating]} max={3} label={c.rating} />
                <span className="ps-report__evidence">{c.evidence}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="ps-report__section">
        <h2 className="ps-report__h">Actions, ranked</h2>
        {report.actions.length === 0 ? (
          <p className="ui-empty">No actions this time.</p>
        ) : (
          <ol className="ps-report__actions">
            {report.actions.map((a, i) => (
              <li key={a.id} className="ps-report__action" data-done={!!ticked[a.id]}>
                <span className="ps-report__num">{i + 1}</span>
                <div className="ps-report__action-body">
                  <b>{a.what}</b>
                  <span>{a.why}</span>
                  {a.evidence.quote && <q className="ps-report__quote">{a.evidence.quote}</q>}
                  <span className="ps-report__by">
                    {a.raisedBy.map((id) => (
                      <Avatar key={id} avatar={seat(id)?.avatar ?? "avatar-001"} size="sm" alt={name(id)} />
                    ))}
                    <DotRating value={EFFORT[a.effort]} max={3} label={`Effort: ${a.effort}`} />
                  </span>
                </div>
                <button
                  type="button"
                  className="ps-report__tick"
                  aria-pressed={!!ticked[a.id]}
                  aria-label={`Mark "${a.what}" done`}
                  onClick={() => {
                    const done = !ticked[a.id];
                    setTicked((t) => ({ ...t, [a.id]: done }));
                    onToggle(a.id, done);
                  }}
                />
              </li>
            ))}
          </ol>
        )}
      </section>

      {report.strengths.length > 0 && (
        <section className="ps-report__section">
          <h2 className="ps-report__h">Keep</h2>
          <ul className="ps-report__plain">
            {report.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      {report.delivery && (
        <section className="ps-report__section">
          <h2 className="ps-report__h">Delivery</h2>
          <Label tone="ink">
            {clock(report.delivery.lengthSeconds)} · {report.delivery.wordsPerMinute ? `${report.delivery.wordsPerMinute} words per minute` : "pace unknown"}
          </Label>
          {report.delivery.structure && <p className="ps-report__p">{report.delivery.structure}</p>}
          {report.delivery.clarity && <p className="ps-report__p">{report.delivery.clarity}</p>}
        </section>
      )}

      {(report.questionReview ?? []).length > 0 && (
        <section className="ps-report__section">
          <h2 className="ps-report__h">Your answers</h2>
          <ul className="ps-report__rows">
            {(report.questionReview ?? []).map((q) => {
              const asked = questions.find((x) => x.id === q.questionId);
              return (
                <li key={q.questionId} className="ps-report__qa">
                  <span className="ps-report__qa-head">
                    {asked && <Avatar avatar={seat(asked.assessorId)?.avatar ?? "avatar-001"} size="sm" />}
                    <b>{asked?.text ?? q.questionId}</b>
                    <DotRating value={RATING[q.howWell]} max={3} label={`Answer: ${q.howWell}`} />
                  </span>
                  <span className="ps-report__evidence">A stronger answer: {q.strongerAnswer}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {report.escalations.length > 0 && (
        <section className="ps-report__human">
          <Label tone="ink">For a human</Label>
          <h2 className="ps-report__h">Take this to your supervisor</h2>
          <ul className="ps-report__plain">
            {report.escalations.map((e) => (
              <li key={e.reason}>
                {e.reason} <span className="ps-report__evidence">Ask: {e.whoToAsk}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="ps-actions">
        <Button variant="secondary" size="lg" href="/">
          Back to your floor
        </Button>
        <Button variant="primary" size="lg" onClick={onAgain}>
          Practise again
        </Button>
      </div>
    </article>
  );
}
