// The public landing page: home (one screen tall, styled like the floor),
// the two main features, step-by-step guides, and about. About and Sign in
// sit in the top-right corner. The logo here is not a link.
import Link from "next/link";
import { Avatar, Button, Label, Logo } from "@/components/ui";

const GUIDES = [
  {
    id: "new-panel",
    title: "Make a new panel",
    lede: "A panel is one piece of work (a report or a presentation) with the board that will mark it.",
    steps: [
      "On your floor, press the dashed New panel circle.",
      "Pick what it is (a master's report, a lab report or a pitch), name it, and say what's graded.",
      "Add your weak spots and, if you have it, the mark scheme.",
      "Seat your board: start from the presets, or copy one and rename it after your real lecturer.",
      "Under Assessors, add what that lecturer said in lectures. The board uses those notes next time.",
    ],
  },
  {
    id: "desk",
    title: "Find things on your Desk",
    lede: "Everything a panel has produced lives on its Desk.",
    steps: [
      "Click a panel on your floor to focus it.",
      "Press the Desk bubble in the dock at the bottom.",
      "Past sessions (reviews and presentation practices) and uploads are listed in two groups.",
      "Orange counts show comments you haven't reviewed yet.",
      "Open any item to read its feedback report again. Anything you leave part-way is saved here too.",
    ],
  },
  {
    id: "live",
    title: "Start a live panel assessment",
    lede: "Present aloud; the board listens, steps out, then questions you on a video call.",
    steps: [
      "Press the orange + in the dock and choose Panel room.",
      "Choose the panel and the board (or the pitch assessors), how many questions, and coaching or exam conditions.",
      "Press Start presenting and speak. Your words appear as you go; Panel keeps the text, never the audio.",
      "Say “thank you” and pause, or press Finish. The board steps out to confer.",
      "Answer each question aloud, then press Next. End the Q&A for your feedback report.",
    ],
  },
  {
    id: "review",
    title: "Review a document",
    lede: "Each assessor reads your report and comments on specific paragraphs.",
    steps: [
      "Press the orange + in the dock and choose Live doc review.",
      "Upload a PDF or paste your text, then check the numbered paragraphs.",
      "Press Start review. Each assessor reads independently, then the board deliberates.",
      "Filter comments by severity or by assessor, and mark each one done as you fix it.",
      "Open the Report tab for the verdict, the rating against each criterion and a ranked list of actions.",
    ],
  },
] as const;

/** The home illustration: the floor's round tables with the board seated round them. */
function FloorArt() {
  return (
    <div className="ld-art" aria-hidden>
      <div className="ld-table ld-table--focus">
        <span className="ld-table__status">Last reviewed today</span>
        <span className="ld-table__name">Master&apos;s Thesis</span>
        <span className="ld-table__dots">
          <i data-on="true" />
          <i data-on="true" />
          <i />
          <i />
        </span>
      </div>
      <div className="ld-table ld-table--a">
        <span className="ld-table__name ld-table__name--sm">Hackathon Pitch</span>
      </div>
      <div className="ld-table ld-table--b">
        <span className="ld-table__name ld-table__name--sm">Lab Report</span>
      </div>
      <Avatar avatar="avatar-006" size="fill" className="ld-seat ld-seat--1" />
      <Avatar avatar="avatar-012" size="fill" className="ld-seat ld-seat--2" />
      <Avatar avatar="avatar-008" size="fill" className="ld-seat ld-seat--3" />
      <Avatar avatar="avatar-004" size="fill" className="ld-seat ld-seat--4" />
      <Avatar avatar="avatar-027" size="fill" className="ld-seat ld-seat--5" />
      <Avatar avatar="avatar-064" size="fill" className="ld-seat ld-seat--6" />
      <Avatar avatar="avatar-014" size="fill" className="ld-seat ld-seat--7" />
      <div className="ld-bubble">Why twelve participants?</div>
      <div className="ld-paper">
        <i />
        <i />
        <i />
        <b>3</b>
      </div>
    </div>
  );
}

export function Landing() {
  return (
    <div className="ld">
      <header className="ld-head">
        <Logo />
        <nav className="ld-nav" aria-label="Site">
          <a href="#about" className="ld-nav__link">
            About
          </a>
          <Button variant="primary" href="/login">
            Sign in
          </Button>
        </nav>
      </header>

      <section className="ld-hero" aria-labelledby="ld-title">
        <div className="ld-hero__text">
          <Label tone="orange">AI assessors for students</Label>
          <h1 id="ld-title" className="ld-hero__title">
            Meet your markers
            <br />
            before they mark you.
          </h1>
          <p className="ld-hero__lede">
            Build a board of AI assessors modelled on the people who will actually mark you. They review your report, or listen to your presentation and question
            you live, then tell you exactly what to fix.
          </p>
          <div className="ld-hero__actions">
            <Button variant="create" size="lg" href="/login">
              Take your seat
            </Button>
            <Button variant="secondary" size="lg" href="#guides">
              See how it works
            </Button>
          </div>
        </div>
        <FloorArt />
        <a href="#features" className="ld-hero__more" aria-label="Scroll to the main features">
          ↓
        </a>
      </section>

      <section id="features" className="ld-section" aria-labelledby="ld-features">
        <Label>Two ways to practise</Label>
        <h2 id="ld-features" className="ld-h2">
          Review a document, or face the panel live
        </h2>
        <div className="ld-features">
          <article className="ld-feature">
            <div className="ld-feature__icon ld-feature__icon--doc" aria-hidden>
              <i />
              <i />
              <i />
            </div>
            <Label tone="orange">Main feature</Label>
            <h3 className="ld-h3">Document review</h3>
            <p className="ld-p">Upload your report or paste the text. Every assessor reads it on their own and pins comments to the exact paragraph, then the board deliberates.</p>
            <ul className="ld-list">
              <li>Comments marked major, minor or praise, from each assessor</li>
              <li>Where the board agrees, and where it doesn&apos;t</li>
              <li>A feedback report: verdict, each marking criterion, ranked actions</li>
              <li>Likely questions to prepare for</li>
            </ul>
          </article>
          <article className="ld-feature ld-feature--ink">
            <div className="ld-feature__icon ld-feature__icon--live" aria-hidden>
              <i />
              <i />
              <i />
              <b />
            </div>
            <Label tone="orange">Main feature</Label>
            <h3 className="ld-h3">Live panel assessment</h3>
            <p className="ld-p">Present aloud. The board listens, steps out to confer, then comes back as a video call and asks its questions out loud, one at a time.</p>
            <ul className="ld-list">
              <li>Questions in each assessor&apos;s own voice</li>
              <li>Follow-ups when an answer is thin, and coaching when you struggle</li>
              <li>Feedback on length, pace, structure and clarity</li>
              <li>How well you answered each question, and a stronger answer</li>
            </ul>
          </article>
        </div>
        <p className="ld-note">
          The differentiator: type what a lecturer said in a lecture under their assessor, run again, and that assessor now asks about it.
        </p>
      </section>

      <section id="guides" className="ld-section ld-section--grid" aria-labelledby="ld-guides">
        <Label>Guides</Label>
        <h2 id="ld-guides" className="ld-h2">
          How to use Panel
        </h2>
        <div className="ld-guides">
          {GUIDES.map((g, i) => (
            <article key={g.id} id={`guide-${g.id}`} className="ld-guide" data-main={g.id === "live" || g.id === "review"}>
              <div className="ld-guide__head">
                <span className="ld-guide__n">{i + 1}</span>
                <div>
                  <h3 className="ld-h3">{g.title}</h3>
                  <p className="ld-p">{g.lede}</p>
                </div>
              </div>
              <ol className="ld-steps">
                {g.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="ld-section" aria-labelledby="ld-about">
        <Label>About</Label>
        <h2 id="ld-about" className="ld-h2">
          Built for the gap between the mark scheme and the marker
        </h2>
        <div className="ld-about">
          <p className="ld-p">
            Mark schemes say what&apos;s graded. Markers have their own habits: what they always ask about, what they mark down, what they said in a lecture and never
            wrote in the handbook. Panel lets you rehearse with a board that knows those habits, before it counts.
          </p>
          <p className="ld-p">
            Your speech is turned into text in your browser; Panel keeps the text, never the audio. When the board can&apos;t agree, or a question is outside its field,
            it tells you to take it to your supervisor.
          </p>
          <p className="ld-p">Made at the Imperial AI Hackathon, November 2026.</p>
        </div>
        <div className="ld-cta">
          <Button variant="create" size="lg" href="/login">
            Take your seat
          </Button>
          <Link href="#guides" className="ld-nav__link">
            Read the guides
          </Link>
        </div>
      </section>
    </div>
  );
}
