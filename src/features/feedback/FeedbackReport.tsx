"use client";

// The feedback report that closes every session (DESIGN_SYSTEM §9, plan step
// 2.3b). One component for both kinds: a report review links each action to
// its paragraphs; a pitch shows the transcript quote, the delivery and a
// review of each answer. Never a mark, a grade or a percentage.
import { useState, type ReactNode } from "react";
import { Avatar, Button, DotRating, Label } from "@/components/ui";
import type { FeedbackReport as Report, PitchQuestion } from "@/lib/schemas";
import { clock } from "@/lib/voice/transcript";

export type ReportPerson = { id: string; name: string; avatar: string };

const RATING = { strong: 3, adequate: 2, weak: 1 } as const;
const EFFORT = { quick: 1, moderate: 2, substantial: 3 } as const;

/** The whole report as plain text, for "Copy as text". */
export function reportAsText(r: Report, name: (id: string) => string, questions: PitchQuestion[] = [], label: (id: string) => string = (id) => id): string {
  const lines = [`Verdict: ${r.verdict}`, ""];
  r.assessorVerdicts.forEach((v) => lines.push(`${name(v.assessorId)}: ${v.line}`));
  if (r.criteria.length) lines.push("", "Against the marking criteria:", ...r.criteria.map((c) => `- ${c.criterion} (${c.rating}): ${c.evidence}`));
  lines.push("", "Actions, ranked:");
  r.actions.forEach((a, i) => {
    const where = a.evidence.paragraphIds.length ? ` [${a.evidence.paragraphIds.map(label).join(", ")}]` : "";
    const quote = a.evidence.quote ? ` "${a.evidence.quote}"` : "";
    lines.push(`${i + 1}. ${a.done ? "[done] " : ""}${a.what} (${a.effort}). ${a.why} Raised by ${a.raisedBy.map(name).join(", ")}.${where}${quote}`);
  });
  if (r.strengths.length) lines.push("", "Keep:", ...r.strengths.map((s) => `- ${s}`));
  if (r.likelyQuestions?.length) lines.push("", "Likely questions:", ...r.likelyQuestions.map((q) => `- ${name(q.assessorId)}: ${q.question}`));
  if (r.delivery) lines.push("", `Delivery: ${clock(r.delivery.lengthSeconds)}, ${r.delivery.wordsPerMinute} words per minute.`, r.delivery.structure, r.delivery.clarity);
  (r.questionReview ?? []).forEach((q) => {
    const asked = questions.find((x) => x.id === q.questionId);
    lines.push("", `Q: ${asked?.text ?? q.questionId} (${q.howWell})`, "A stronger answer would cover:", ...q.strongerAnswer.map((p) => `- ${p}`));
  });
  if (r.escalations.length) lines.push("", "Take this to your supervisor:", ...r.escalations.map((e) => `- ${e.reason} (ask: ${e.whoToAsk})`));
  if (r.sinceLastTime)
    lines.push(
      "",
      "Since last time:",
      ...r.sinceLastTime.improved.map((s) => `Improved: ${s}`),
      ...r.sinceLastTime.raisedAgain.map((s) => `Raised again: ${s}`),
      ...r.sinceLastTime.stillOpen.map((s) => `Still open: ${s}`),
    );
  return lines.filter((l) => l !== undefined).join("\n");
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="fb-section">
      <h2 className="fb-h">{title}</h2>
      {children}
    </section>
  );
}

export function FeedbackReport({
  report,
  people,
  sample,
  questions = [],
  paragraphLabel,
  onShowParagraph,
  onToggleAction,
  footer,
}: {
  report: Report;
  people: ReportPerson[];
  /** True when made without Claude: says so at the top. */
  sample: boolean;
  /** Pitch only: the questions asked, for the answer reviews. */
  questions?: PitchQuestion[];
  /** Report only: "p3" -> "¶3", and what happens when a paragraph link is pressed. */
  paragraphLabel?: (paragraphId: string) => string;
  onShowParagraph?: (paragraphId: string) => void;
  /** Saves a tick. Without it the boxes still tick, for this view only. */
  onToggleAction?: (actionId: string, done: boolean) => void;
  footer?: ReactNode;
}) {
  const [ticked, setTicked] = useState<Record<string, boolean>>(() => Object.fromEntries(report.actions.map((a) => [a.id, a.done])));
  const [copied, setCopied] = useState(false);
  const person = (id: string) => people.find((p) => p.id === id);
  const name = (id: string) => person(id)?.name ?? "An assessor";
  const avatar = (id: string) => person(id)?.avatar ?? "avatar-001";
  const label = paragraphLabel ?? ((id: string) => id);

  return (
    <article className="fb-report" aria-label="Feedback report">
      <header className="fb-top">
        {sample ? <Label tone="orange">Sample replies: not real feedback</Label> : <Label>Feedback report</Label>}
        <Button
          variant="quiet"
          size="sm"
          onClick={() => {
            const text = reportAsText({ ...report, actions: report.actions.map((a) => ({ ...a, done: !!ticked[a.id] })) }, name, questions, label);
            void navigator.clipboard?.writeText(text).then(() => setCopied(true));
          }}
        >
          {copied ? "Copied" : "Copy as text"}
        </Button>
      </header>

      {/* 1. Verdict */}
      <section className="fb-section">
        <p className="fb-verdict">{report.verdict}</p>
        {report.assessorVerdicts.length > 0 && (
          <ul className="fb-list fb-lines">
            {report.assessorVerdicts.map((v) => (
              <li key={v.assessorId}>
                <Avatar avatar={avatar(v.assessorId)} size="md" />
                <span>
                  <b>{name(v.assessorId)}</b> {v.line}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 2. Against the marking criteria */}
      {report.criteria.length > 0 && (
        <Section title={report.kind === "pitch" ? "Against the judging criteria" : "Against the marking criteria"}>
          <ul className="fb-list">
            {report.criteria.map((c) => (
              <li key={c.criterion} className="fb-crit">
                <span className="fb-crit__name">{c.criterion}</span>
                <DotRating value={RATING[c.rating]} max={3} label={c.rating} />
                <span className="fb-quiet">{c.evidence}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 3. Actions, ranked */}
      <Section title="Actions, ranked">
        {report.actions.length === 0 ? (
          <p className="ui-empty">No actions this time.</p>
        ) : (
          <ol className="fb-list fb-actions">
            {report.actions.map((a, i) => (
              <li key={a.id} className="fb-action" data-done={!!ticked[a.id]}>
                <span className="fb-action__num">{i + 1}</span>
                <div className="fb-action__body">
                  <b>{a.what}</b>
                  {a.why && <span>{a.why}</span>}
                  {report.kind === "pitch" && a.evidence.quote && <q className="fb-quote">{a.evidence.quote}</q>}
                  <span className="fb-action__meta">
                    {a.raisedBy.map((id) => (
                      <Avatar key={id} avatar={avatar(id)} size="sm" alt={name(id)} />
                    ))}
                    <DotRating value={EFFORT[a.effort]} max={3} label={`Effort: ${a.effort}`} />
                    {a.evidence.paragraphIds.map((pid) =>
                      onShowParagraph ? (
                        <button key={pid} type="button" className="fb-para" onClick={() => onShowParagraph(pid)} title="Show in the document">
                          {label(pid)}
                        </button>
                      ) : (
                        <span key={pid} className="fb-para">
                          {label(pid)}
                        </span>
                      ),
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  className="fb-tick"
                  aria-pressed={!!ticked[a.id]}
                  aria-label={`Mark "${a.what}" done`}
                  onClick={() => {
                    const done = !ticked[a.id];
                    setTicked((t) => ({ ...t, [a.id]: done }));
                    onToggleAction?.(a.id, done);
                  }}
                />
              </li>
            ))}
          </ol>
        )}
      </Section>

      {/* 4. Keep */}
      {report.strengths.length > 0 && (
        <Section title="Keep">
          <ul className="fb-list fb-plain">
            {report.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* 5. Report only: likely questions */}
      {report.kind === "report" && (report.likelyQuestions ?? []).length > 0 && (
        <Section title="Likely questions">
          <ul className="fb-list">
            {(report.likelyQuestions ?? []).map((q, i) => (
              <li key={i} className="fb-ask">
                <Avatar avatar={avatar(q.assessorId)} size="md" alt="" />
                <span className="fb-ask__body">
                  <Label size="sm">{name(q.assessorId)}</Label>
                  <span className="fb-bubble">{q.question}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 6. Pitch only: delivery and the answers */}
      {report.kind === "pitch" && report.delivery && (
        <Section title="Delivery">
          <Label tone="ink">
            {clock(report.delivery.lengthSeconds)} · {report.delivery.wordsPerMinute ? `${report.delivery.wordsPerMinute} words per minute` : "pace unknown"}
          </Label>
          {report.delivery.structure && <p className="fb-p">{report.delivery.structure}</p>}
          {report.delivery.clarity && <p className="fb-p">{report.delivery.clarity}</p>}
        </Section>
      )}
      {report.kind === "pitch" && (report.questionReview ?? []).length > 0 && (
        <Section title="Your answers">
          <ul className="fb-list">
            {(report.questionReview ?? []).map((q) => {
              const asked = questions.find((x) => x.id === q.questionId);
              return (
                <li key={q.questionId} className="fb-qa">
                  <span className="fb-qa__head">
                    {asked && <Avatar avatar={avatar(asked.assessorId)} size="sm" alt="" />}
                    <b>{asked?.text ?? q.questionId}</b>
                    <DotRating value={RATING[q.howWell]} max={3} label={`Answer: ${q.howWell}`} />
                  </span>
                  <div className="fb-quiet">A stronger answer would cover:<ul className="fb-list fb-plain">{q.strongerAnswer.map((point, i) => <li key={i}>{point}</li>)}</ul></div>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {/* 7. Take this to your supervisor: the one place the product sends the student to a person. */}
      {report.escalations.length > 0 && (
        <section className="fb-human">
          <Label tone="ink">For a human</Label>
          <h2 className="fb-h">Take this to your supervisor</h2>
          <ul className="fb-list fb-plain">
            {report.escalations.map((e) => (
              <li key={e.reason}>
                {e.reason} <span className="fb-quiet">Ask: {e.whoToAsk}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 8. Since last time */}
      {report.sinceLastTime &&
        (report.sinceLastTime.improved.length > 0 || report.sinceLastTime.raisedAgain.length > 0 || report.sinceLastTime.stillOpen.length > 0) && (
          <Section title="Since last time">
            <ul className="fb-list fb-plain">
              {report.sinceLastTime.improved.map((s) => (
                <li key={`i-${s}`}>
                  <Label size="sm" tone="ink">Improved</Label> {s}
                </li>
              ))}
              {report.sinceLastTime.raisedAgain.map((s) => (
                <li key={`r-${s}`}>
                  <Label tone="orange" size="sm">Raised again</Label> {s}
                </li>
              ))}
              {report.sinceLastTime.stillOpen.map((s) => (
                <li key={`o-${s}`}>
                  <Label size="sm">Still open</Label> {s}
                </li>
              ))}
            </ul>
          </Section>
        )}

      {footer}
    </article>
  );
}
