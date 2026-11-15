"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Assessor } from "../review/types";
import type { ProjectDraft, TemplateId } from "./types";
import { draftFromTemplate } from "./templates";
import { missingFor, toReviewContext } from "./context";
import { Logo } from "@/components/ui";
import { Label } from "../review/ui/Label";
import { Button } from "../review/ui/Button";
import { IntakeScreen } from "../review/intake/IntakeScreen";
import { Stepper } from "./components/Stepper";
import { BoardStep, BriefStep, StartStep, TemplateStep } from "./components/Steps";

type Screen = "template" | "brief" | "board" | "start" | "intake";

const SCREENS: { id: Exclude<Screen, "intake">; steps: number[]; title: string; intro: string }[] = [
  {
    id: "template",
    steps: [1],
    title: "What are you getting reviewed?",
    intro: "Pick the closest match. It fills in the brief and seats a suggested board, which you can change in step 4.",
  },
  {
    id: "brief",
    steps: [2, 3],
    title: "Tell the board what this is.",
    intro: "Shared with every assessor, so each one knows what's being judged and how.",
  },
  {
    id: "board",
    steps: [4],
    title: "Who sits on your board?",
    intro: "Each assessor reads alone, through their own lens. Seat the people who will actually mark you.",
  },
  {
    id: "start",
    steps: [5],
    title: "Ready when you are.",
    intro: "Check the summary. Next you upload the document and the board starts reading.",
  },
];

export function ProjectSetup({ presets }: { presets: Assessor[] }) {
  const [screen, setScreen] = useState<Screen>("template");
  const [draft, setDraft] = useState<ProjectDraft | undefined>();
  const [error, setError] = useState<string>();
  const assessors = useMemo(() => new Map(presets.map((a) => [a.id, a])), [presets]);

  if (screen === "intake" && draft) {
    return (
      <IntakeScreen
        context={{
          project: { id: `proj-${draft.template}`, name: draft.name.trim() },
          board: { id: "board-project", name: `${draft.name.trim()} board`, assessorIds: draft.boardIds },
          assessors: presets,
          reviewContext: toReviewContext(draft),
        }}
      />
    );
  }

  const index = SCREENS.findIndex((s) => s.id === screen);
  const current = SCREENS[index];

  const chooseTemplate = (id: TemplateId) => {
    // Re-picking the same template keeps edits; a new one starts fresh.
    setDraft((d) => (d?.template === id ? d : draftFromTemplate(id)));
    setError(undefined);
  };

  const next = () => {
    if (!draft) return setError("Pick a template, or start blank.");
    const missing = screen === "brief" ? missingFor("brief", draft) : screen === "board" ? missingFor("board", draft) : undefined;
    if (missing) return setError(missing);
    setError(undefined);
    setScreen(screen === "start" ? "intake" : SCREENS[index + 1].id);
  };

  const back = () => {
    setError(undefined);
    if (index > 0) setScreen(SCREENS[index - 1].id);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="grid h-topbar shrink-0 grid-cols-centred items-center bg-white px-8">
        <Logo />
        <Stepper current={current.steps} />
        <Link
          href="/"
          className="justify-self-end font-mono text-label uppercase tracking-label text-grey-700 hover:text-ink"
        >
          ✕ Close
        </Link>
      </header>

      <main className="mx-auto w-full max-w-page flex-1 px-8 pt-11 pb-32">
        <Label tone="accent">
          New project · {current.steps.length > 1 ? `Steps ${current.steps[0]}–${current.steps.at(-1)}` : `Step ${current.steps[0]}`} of 5
        </Label>
        <h1 className="mt-2 font-display text-display font-semibold tracking-display text-ink">{current.title}</h1>
        <p className="mt-2 max-w-2xl text-reading text-grey-700">{current.intro}</p>

        <div className="mt-9">
          {screen === "template" && <TemplateStep selected={draft?.template} assessors={assessors} onSelect={chooseTemplate} />}
          {screen === "brief" && draft && <BriefStep draft={draft} onChange={setDraft} />}
          {screen === "board" && draft && <BoardStep draft={draft} presets={presets} onChange={setDraft} />}
          {screen === "start" && draft && <StartStep draft={draft} assessors={assessors} />}
        </div>
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-grey-100 bg-white">
        <div className="mx-auto grid w-full max-w-page grid-cols-centred items-center px-8 py-4">
          <div>
            <Button variant="outline" onClick={back} disabled={index === 0}>
              Back
            </Button>
          </div>
          {error ? (
            <p role="alert" className="text-body font-semibold text-ink">
              {error}
            </p>
          ) : (
            <Label>You can change all of this later</Label>
          )}
          <div className="justify-self-end">
            <Button variant={screen === "start" ? "create" : "primary"} onClick={next}>
              {screen === "start" ? "Start review →" : "Continue →"}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
