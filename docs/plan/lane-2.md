# Lane 2: documents, report review, project setup

You own the second thing the judges see: a real report coming back covered in comments from each assessor.

## Until the foundation is pushed (tier 0)
Keep working in Figma with Lane 3. Design the two screens you will build first, using the shared variable names in the plan:
1. **Report review:** document on the left, comments on the right, deliberation panel.
2. **Project setup:** the short step-by-step flow.

When Lane 1 says the foundation is live, pull `staging` and start 2.1.

---

## 2.1 Review screen on sample data (tier 1, about 75 minutes)
**Branch:** `lane2/review-screen`. No calls to Claude in this step.

**Build in `src/features/review` and `src/app/review`:**
1. **Sample data first:** write one realistic Review and Document into `fixtures/` that pass the data shapes in `src/lib/schemas`. Use an invented, publishable document, never the thesis. Replace it with Lane 1's real outputs when they land.
2. **Document pane:** the numbered paragraphs, with commented paragraphs highlighted in the colour of the assessor who commented. Where a comment has a quote, highlight just those words.
3. **Comment rail:** each comment shows the assessor's avatar, name, severity and suggestion. Clicking a comment scrolls to its paragraph; clicking a highlight selects its comments.
4. **Filters:** by assessor and by severity.
5. **Deliberation panel:** summary, where the board agrees, where it disagrees and the advice, the ranked fix list, likely questions, and the "Take this to your supervisor" block.
6. **States:** loading, empty, and one assessor failed.

Use only the base components in `src/components/ui`. If you need one that does not exist, ask Lane 3.

**Done when:** the screen shows the sample review fully, on a laptop-width window, with every interaction above working.

---

## 2.2 Document intake (tier 2, about 45 minutes)
**Branch:** `lane2/intake`. **Read the docs of the PDF library you choose and check it runs in a Vercel server route.**

**Build in `src/lib/documents` and `src/app/api/documents`:**
1. Upload a PDF, or paste text as the fallback.
2. Extract the text on the server. Remove page numbers, headers and footers where easy; do not spend long on this.
3. Split into paragraphs and number them `p1`, `p2`, and so on. Merge fragments shorter than a sentence into their neighbour.
4. Save as a Document through `src/lib/data`. Keep the original file in storage, not in the repo.
5. A short test for the splitting and numbering.

**Done when:** a real 20-page PDF becomes a clean numbered document in the review screen, and pasting text works when a PDF does not.

---

## 2.3 Wire the review to the engine (tier 2, about 45 minutes)
**Branch:** `lane2/review-live`. Needs Lane 1's step 1.2 merged.

1. A "Start review" action that creates a Review and calls Lane 1's route once per assessor, all in parallel.
2. Progress per assessor: "reading", "done" or "failed", with a retry on failure.
3. Comments appear assessor by assessor as each call returns.
4. When all have finished or failed, call the deliberation route and show the result.
5. Reopening a saved review loads it from the database without calling Claude again.

**Done when:** uploading a document and pressing Start produces a full live review on the `staging` site.

---

## 2.4 Project setup and the pitch template (tier 3, about 60 minutes)
**Branch:** `lane2/project-setup`.

**Build in `src/features/projects` and `src/app/projects`:**
1. **Step 1, template:** master's report, lab report or hackathon pitch. Choosing one pre-fills the brief and suggests a board.
2. **Step 2, brief:** what it is, topic, what is graded, your goal. Short fields, already filled where the template can.
3. **Step 3, weak spots:** one box for "where do you feel least sure?".
4. **Step 4, board:** the suggested board, with members removable and others addable.
5. **Step 5, start:** report review (goes to upload) or pitch practice (goes to `/pitch`).
6. Extra options sit behind an "Add more" link at each step, so the default path is a few clicks.

**Done when:** a new user gets from "New project" to a running session in under a minute, and the pitch template starts Lane 1's pitch practice with the judges board.

---

## 2.5 Mark scheme upload and second run (tier 4, about 40 minutes)
**Branch:** `lane2/markscheme`.

1. Upload or paste the mark scheme on the project. Reuse the intake code and save the text on the Project.
2. A "Run again" action on a finished review, for a new version of the document.
3. If Lane 1's memory step is merged, show "since last time" at the top of the deliberation.

**Done when:** a review run with a mark scheme refers to its criteria.

---

## Tier 5, only if everything above is merged
- Written-questions mode for projects with no live Q&A.
- Export the fix list as text to copy.

## Keeping usage low
- Steps 2.1, 2.2 and 2.4 need no calls to Claude at all.
- For 2.3, test with a two-page document and two assessors on `claude-haiku-5-5`. Run the full board on a full document only at checkpoints.
