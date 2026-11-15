# Panel — Design System & Build Spec

> Single source of truth for how **Panel** looks and behaves. Panel is a university web app where a student builds a board of AI assessors modelled on the people who will mark them, has that board review a report or question them after a presentation, and gets a feedback report with ranked actions.
> What gets built, by whom and in what order is in [`docs/plan/README.md`](../docs/plan/README.md). Where this document and the plan disagree about **how it looks**, this document wins. Where they disagree about **what the product does**, the plan wins.
> The product sections (§1, §9 to §11, §15) were rewritten on Saturday evening to match the product as planned. §1.1 lists what changed from the prototype.

---

## 0. Links (start here)

| What | Link |
|---|---|
| Figma file (AI_hackathon) | https://www.figma.com/design/d0G58b8c7ESX0rw0qbXHcX/AI_hackathon |
| **Product spec** (PLATFORM tree: Profile, Assessors, Boards, Projects, Sessions, Engine, App shell) | https://www.figma.com/design/d0G58b8c7ESX0rw0qbXHcX/AI_hackathon?node-id=43-2 |
| **Visual reference frame** (place screenshots from `/reference` here) | https://www.figma.com/design/d0G58b8c7ESX0rw0qbXHcX/AI_hackathon?node-id=51-63 |
| **FINAL home (floor, springy) — source** | [`Panel Home Final.dc.html`](./Panel%20Home%20Final.dc.html) |
| **FINAL home — standalone export (offline, single file)** | [`export/Panel Home Final.html`](./export/Panel%20Home%20Final.html) |
| Earlier interactive prototype (floor + carousel) | [`Roundtables.dc.html`](./Roundtables.dc.html) |
| Exploration canvas (all earlier rounds 1–4) | `Roundtable Mockups.dc.html` |
| **Avatar reference set (100 SVGs)** | [`avatars-pen/avatar-001.svg … avatar-100.svg`](./avatars-pen/), gallery: [`Avatar Collection Pen.dc.html`](./Avatar%20Collection%20Pen.dc.html) |
| Reference screenshots | `reference/*.png` (see §12) |
| **Build plan and data shapes** | [`docs/plan/README.md`](../docs/plan/README.md) |

> **Figma note:** the reference images in `/reference` should be dropped into frame **51:63**. Add one frame per screenshot, named exactly as the file (e.g. `01-floor-default`). If you add new screens, add frames to the right of 51:63 at the same 1440×900 size and update §12.

---

## 0.1 Final version (locked)

- **Direction:** Floor plan only. The carousel view and its switch are removed.
- **Motion:** Springy only (easeOutBack, c1 = 1.5). The "calm" option is removed.
- **Focused table:** orange, with session rim dots, no pulse, no "your seat" placeholders.
- **Avatars:** the reference set is **`avatars-pen/` (100 SVGs)**. The final prototype still renders the 12 `avatars2/` source PNGs through [`Panel Avatar.dc.html`](./Panel%20Avatar.dc.html); swap to `avatars-pen/` when building.
- **Nav:** bubble dock (bottom) + orange "+". No top nav bar.

## 0.2 File locations (all project-relative; click to open)

| File | Location |
|---|---|
| Design system (this doc) | [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) |
| Final home source | [`Panel Home Final.dc.html`](./Panel%20Home%20Final.dc.html) |
| Final home export (single offline HTML) | [`export/Panel Home Final.html`](./export/Panel%20Home%20Final.html) |
| Final avatar component (embedded images) | [`Panel Avatar.dc.html`](./Panel%20Avatar.dc.html) |
| Avatar style source (12 PNGs, the originals the set was drawn from) | [`avatars2/`](./avatars2/) — `a0.png … a11.png` |
| **Avatar reference set — USE THIS** | [`avatars-pen/`](./avatars-pen/) — `avatar-001.svg … avatar-100.svg`, gallery: [`Avatar Collection Pen.dc.html`](./Avatar%20Collection%20Pen.dc.html) |
| Deprecated: older front-facing set (do not use) | [`avatar-svgs/`](./avatar-svgs/) |
| Deprecated gallery | [`Avatar Collection.dc.html`](./Avatar%20Collection.dc.html) |
| Earlier prototype (floor + carousel) | [`Roundtables.dc.html`](./Roundtables.dc.html), copy: [`Roundtables copy.dc.html`](./Roundtables%20copy.dc.html) |
| Dev avatar component (file paths) | [`Avatar.dc.html`](./Avatar.dc.html) |
| Exploration canvas (rounds 1–4) | [`Roundtable Mockups.dc.html`](./Roundtable%20Mockups.dc.html) |
| Final reference screenshots | [`reference/final/`](./reference/final/) |
| Earlier reference screenshots | [`reference/`](./reference/) |
| User uploads (logo, avatar refs) | [`uploads/`](./uploads/) |

> When downloaded, these paths are relative to the project folder root. The same names apply on disk.

## 1. Product in one paragraph

A student creates **assessors** (presets, or copies renamed after a real lecturer) and adds **notes** to each one: what that lecturer said they want, especially when it is not in the module handbook. Assessors are seated at a **board**. A board is attached to a **project** (a thesis, a lab report, a pitch), which holds the brief, the mark scheme and the student's own weak spots. The student then runs **sessions** on demand:

- **Report review:** upload the document. Each assessor reads it independently and comments on specific paragraphs, then the board deliberates.
- **Presentation practice** (called *pitch* in the plan and the code): present aloud. The board steps out, comes back as a video call, and asks its questions by voice, one at a time.

Every session ends in the same **feedback report**: a verdict, a rating against each marking criterion, ranked actions with the evidence behind each, and anything the board says to take to a human supervisor. The board remembers earlier sessions, so the next one says what improved.

The UI shows this literally as a **floor plan of round tables**: each project is a table, its board sits around it, its documents lie on it, and its sessions are dots on its rim.

### Terminology mapping (product → UI)

| Product (see `docs/plan/README.md`) | UI object | Notes |
|---|---|---|
| Profile | Profile pill, top right; **Avatar** bubble in the dock | University, course, level, your own avatar |
| Assessor | **Seat** (avatar at a table) + **Assessor card** | Name, avatar, field, personality, harshness, focus areas, notes |
| Assessor note | A line on the assessor's profile | "Wants safety considered in the design." The count shows on the card |
| Board | **The ring of seats** around a table | Saved boards can be seated at other tables |
| Project | **Table** | Brief, mark scheme, weak spots, documents, sessions |
| Session (report review or presentation practice) | **Rim dot** on the table + **bead** in the side panel | Done, in session, or ready to run (§9) |
| Document | **Paper** lying on a table + a card on the **Desk** | Orange badge = open actions |
| Feedback report | Opened from a bead or a Desk card | One per session (§9) |
| Navigation | **Bubble dock** (bottom centre) | Floor · Desk · Assessors · Avatar · Settings + orange "+" |
| Home | **Floor plan** with swing-to-focus motion | §7 |

### 1.1 What the prototype shows that is not in the product

The home prototype was drawn before the product was pinned down, so some of its sample content describes a scheduling tool for meetings with real people. The visual design stands. These labels and data do not: build the right-hand column.

| In the prototype | In the product |
|---|---|
| Sessions dated in the future, "next session" lines, "This week" and "To prepare" filters | Sessions are run on demand. A session is done, in session, or ready to run. Nothing is scheduled |
| Peers seated at tables | Assessors only. The student is never drawn at their own table |
| **Invite** button, "Invite to MT" pills | **Edit board** and "Seat at MT": seating an AI assessor, not inviting a person |
| Office hours on assessor cards | The number of notes held on that assessor, and harshness as dots |
| "Panel room" and "Live doc review" in the "+" menu | "Practise a presentation" and "Review a report" |
| Speech bubble cycling invented questions | The likely questions from that project's latest feedback report |
| Share, Hand and a slide agenda in the presentation room | Mute, Camera, Next question, End Q&A. Slides are not shared in v1 |
| A live rubric filling in while you speak | Ratings appear afterwards, in the feedback report |
| Reply on a comment | Not in v1. A comment can be marked done |
| Avatar studio with editable hair and clothing | Pick an avatar from the set. No editing in v1 |
| Carousel view and "calm" motion | Removed (§0.1) |

Not in v1 at all: accounts and sharing between students, feedback on tone of voice or body language, the lounge, a phone layout, a dark theme.

---

## 2. Brand

### Logo — "Panel"
Built only from circles. An **orange dot** (the student) faces an **arc of five black dots** (the panel), then the wordmark **Panel**.

```
 ●   •
      •
       •      Panel
      •
     •
```

CSS build (sizes for a 40px-tall mark), copied from `Roundtables.dc.html`:
- Box 34×40. Orange dot 10px at (0,15). Five black 7px dots at (18,0) (24,9) (26,17) (24,25) (18,33).
- Wordmark: Instrument Sans 700, 24px, letter-spacing −0.03em, `#111`.
- Optional subline: JetBrains Mono 500, 11px, `#8b8b87`, uppercase (e.g. `YOUR FLOOR · AUTUMN`).
- Clear space: one orange-dot diameter on every side. Never recolour the dots. Never put the logo on orange.

### Voice
Calm, direct, a little warm. Talk like a good tutor: "Your panel is waiting", "Take your seat", "Which result would change your conclusion?". No exclamation marks, no gamification language (spec: *no streaks, tracks or gamification*).

---

## 3. Colour tokens

Flat. Black, white and greys, plus **one** highlight.

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#111111` | Text, outlines (1.5px), primary buttons, past-session fills, dock |
| `--paper` | `#FFFFFF` | App background (always white), tables, cards |
| `--orange` | `#FF5D2B` | **Focus / live / primary create** only. The focused table, live state, "+", comment badges, the "now" marker |
| `--orange-halo` | `#FFE4DA` | 7–9px halo around a live bead |
| `--grey-900` | `#2A2A28` | Long-form body text in documents |
| `--grey-700` | `#5C5C58` | Secondary text |
| `--grey-500` | `#8B8B87` | Meta, mono labels, inactive icons |
| `--grey-400` | `#9A9A96` | Inactive dock icons |
| `--grey-300` | `#B5B5B1` | Dashed placeholders |
| `--grey-250` | `#C9C8C4` | Dashed "new" outlines, paper lines |
| `--grey-200` | `#DCDCD8` | Document-review fill (exploration rounds), disabled |
| `--grey-150` | `#E3E2DE` | Hairlines on cards, inactive card borders |
| `--grey-100` | `#ECEBE8` | Dividers, light borders, timeline tracks |
| `--grey-50` | `#F3F2EF` | Chip/segmented backgrounds, hover fills |
| `--floor-dot` | `#E9E8E4` | Floor dot grid |

**Rules**
- Orange should cover less than about 8% of any screen. Exactly **one** orange table at a time: the focused one.
- Text on orange is always `#111`, never white.
- No gradients, shadows, glass or blur. The only `box-shadow` allowed is a solid ring (e.g. `0 0 0 3px #fff`) used as a cut-out.
- **No per-assessor colours and no traffic-light colours.** Assessors are told apart by avatar, name and numbered anchors. Severity, ratings and effort use the dot language in §9.
- **In code**, these token names are used as they are written here. The style variables in `src/styles` carry the same names and values; no feature defines its own colours.

---

## 4. Typography

| Role | Family | Weight | Size / line-height | Tracking |
|---|---|---|---|---|
| Wordmark | Instrument Sans | 700 | 24/1 | −0.03em |
| Display (hero, big titles) | Bricolage Grotesque | 600 | 44–78 / 0.94–1.0 | −0.035em |
| H1 (page/panel title) | Bricolage Grotesque | 600 | 30 / 1.02 | −0.025em |
| H2 / table name (focused) | Bricolage Grotesque | 600 | 26 / 1.02 | −0.02em |
| H3 / card title | Bricolage Grotesque | 600 | 16–20 / 1.15 | −0.01em |
| Body | Instrument Sans | 400/500 | 14–15 / 1.5 | 0 |
| Small / meta | Instrument Sans | 400 | 12–13 / 1.4 | 0 |
| Label / status / time | JetBrains Mono | 500 | 10–11 / 1.2, UPPERCASE | +0.04–0.08em |

Google Fonts:
```
https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap
```
Minimum sizes: 12px for body text, 9.5px for mono labels on small tables only.

---

## 5. Shape, line & space

- **Everything is a circle or a pill.** Radii: `50%` (tables, seats, beads, icon buttons), `999px` (chips, buttons, inputs), `32px` (side panel, sheets), `22–26px` (cards), `14–18px` (list rows), `6–8px` (paper sheets only).
- **Line**: a single 1.5px solid `#111` stroke for outlines. Dashed 2px (`#C9C8C4` or `#B5B5B1`) means "create / empty / document review".
- **Floor background**: white with a 28px dot grid, `radial-gradient(circle,#E9E8E4 1.2px,transparent 1.6px) 0 0/28px 28px`.
- **Spacing**: 4-based; common steps 4, 6, 8, 10, 12, 14, 16, 18, 22, 24, 28, 32. Screen margin 28–32px.
- **Gooey merge**: neighbouring circles melt into each other using the SVG filter below (feGaussianBlur + alpha threshold). Used for the dock and the "meeting blob" motif.

```html
<filter id="goo"><feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b"/>
<feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"/></filter>
```
Recipe: n circles on a row plus a bridge rectangle (height ≈ 0.5× diameter) from the first centre to the last; put the filter on the parent. Keep text and icons in a separate, unfiltered layer above.

---

## 6. Avatars

**Reference set: [`avatars-pen/avatar-001.svg … avatar-100.svg`](./avatars-pen/)** (gallery: [`Avatar Collection Pen.dc.html`](./Avatar%20Collection%20Pen.dc.html)). Every person in the product (assessors and the student) uses an avatar from this set or one drawn to match it. The style source is the 12 PNGs in [`avatars2/`](./avatars2/).

### Style (match exactly when adding new avatars)
- **Format:** SVG, 300×300 viewBox, **transparent background**. Never a circle, card or tint behind an avatar.
- **Line:** single-weight ink `#111`, stroke 3.6, round caps and joins. Thin accents (collar ribs, hair strands) are 2.2–2.4.
- **Fills:** white `#fff` or solid ink only. No greys, no gradients. Silver or grey hair = white fill with an ink outline and ink strands.
- **Pose:** three-quarter turn, head tilted slightly. About half face left and half face right (mirrored).
- **Head:** soft jaw that narrows to the chin, with an ear on the far side (ear outline + inner curve).
- **Neck shadow:** a solid-ink wedge under the jaw on the far side. It's the signature detail; always include it.
- **Shoulders:** an open curve cropped at the bottom edge; no closed body outline.
- **Face:** dot eyes (or lidded or happy variants), short brow strokes, a hooked single-line nose, a small asymmetric smile. Optional open grin with white teeth.
- **Hair:** solid ink shapes: spiky, crop, side part, slick, curly, afro, bald with sides, buzz (stippled), bun, bob with bangs or a sweep, long, wavy, ponytail, hijab.
- **Clothing:** crew neck with a ribbed collar (plain, dotted or striped), collared shirt, blazer (ink, with white lapel lines), blazer + tie, turtleneck (ribbed), V-neck, cardigan.
- **Extras:** chunky, round or thin glasses; full beard, short beard, moustache or stubble; stud or hoop earrings; age lines.
- **Mix:** weighted toward faculty (blazers, turtlenecks, cardigans, glasses, silver hair), with students mixed in.

### Usage
- **On black surfaces:** `filter: invert(1)`.
- **Sizes:** seat = 0.64 × table radius (≈90px on the focused table, ≈58px on side tables); side-panel list 62px; assessor card 84px; profile chip 52px; inline comment 22–36px.
- **Avatar picker:** when creating an assessor or setting up a profile, the user picks an avatar from `avatars-pen/`. Editing hair, clothing and accessories (exploration `1c`) is not in v1.
- **Naming:** `avatar-NNN.svg`. New avatars continue the numbering (`avatar-101.svg` …).
- **Prototype note:** `Panel Home Final.dc.html` currently renders the 12 `avatars2/` PNGs through `Panel Avatar.dc.html` (prop `who` 0–11). When building, replace that component with an `<img src="avatars-pen/avatar-NNN.svg">` lookup per person.

### Realistic counterparts (live call only)
- In the call stage (§9), an assessor may appear as a realistic head-and-shoulders portrait that clearly resembles their pen avatar: the same hair, glasses, facial hair and clothing. Everywhere else in the product they are the pen avatar.
- Portraits are generated once from the pen avatar and stored as files. Nothing is generated while the product runs. A short idle clip and a short talking clip may be made from each portrait.
- Framed like a webcam shot, on a plain background, with no text.
- These are invented faces. An assessor named after a real lecturer uses an invented face, never a likeness of that person.
- An assessor with no counterpart appears in the call as their pen avatar. The two must look deliberate side by side.

---

## 7. Home: the Floor (primary screen)

Canvas 1440×900, scaled to fit the viewport (`scale = min(vw/1440, vh/900)`, centred).

### Layout zones
| Zone | Position | Content |
|---|---|---|
| Brand | top-left 32,26 | Logo only. There is no view switch: the carousel was removed (§0.1) |
| Search | top-centre, x 560, w 340 | Pill with a 1.5px ink border: "Find a table, assessor or doc", `⌘K` hint |
| Filter-by-assessor chip | below search, y 84 | Black pill "Tables with **Dr. Leo Marsh** ×" (only while an assessor is selected) |
| Profile | top-right | Pill: avatar 52 + name + course |
| Floor | x 0–1040 | Tables, seats, papers, "New table" |
| Side panel | x 1056, y 104, w 358, bottom 28 | Details of the focused table |
| Filters | bottom-left | Chips: All tables · In session · Actions open · Not started |
| Dock | bottom, x 373, y 822 | Bubble nav + orange "+" |

### Table
- Circle. **Focused** table: radius 140, fill `--orange`, no border, full content (mono status, 26px name, a 12px line giving the last session and the number of open actions). **Other** tables: radius 92, fill white, 1.5px ink border, compact content (name 11–19px, short mono status).
- **Rim dots**: focused table only. One 11px dot per session along the bottom inner rim (radius − 17), 12° apart, in chronological order left to right. Done = filled ink, in session = white, ready to run = 1.5px dashed outline. If the brief has a deadline, one last dot with a 1.5px solid outline stands for the real hand-in or presentation. See the state key in §9.
- **Seats**: the board's avatars sit around the rim at `dist = r + 0.5·av + 2`, starting at −110° and evenly spaced. **There are no empty "your seat" placeholders.**
- **Paper**: when the table has a document, a white sheet (0.34r wide, rotated −9°) sits near the top-right of the table, with an orange badge counting the open actions in its latest feedback report.
- **Speech bubble**: on the focused table, a white pill with a ring tail next to a seat. It cycles every 3.6s through the likely questions from that project's latest feedback report, each shown beside the assessor who would ask it. A table with no report yet has no bubble.
- **Dimming**: tables that don't match the filter or the selected assessor go to opacity 0.18 over 0.4s.
- **New table**: a dashed circle (156px) with an orange "+" that opens the create menu.

### Floor plan positions (centre 520,455; ellipse 420×280)
- Focus slot: d = 0.
- Ring slots at 215° (upper-left), 152° (lower-left) and 325° (upper-right). Other tables fill these slots in cyclic order after the focused one.
- "New table" is fixed at (850,640).

The carousel variant was removed in the final version (§0.1). `Roundtables.dc.html` still contains it, for reference only.

---

## 8. Motion

| Interaction | Spec |
|---|---|
| Focus a table (floor) | 1000ms, easeOutBack (c1 = 1.5). Tables move in **polar space** (angle, distance, radius are interpolated), so they swing along arcs rather than straight lines. A table leaving the centre starts from (target angle − 90°) so it swings out. Angles always take the shortest path. |
| Dock active bubble | `left` transition 0.55s, `cubic-bezier(.4,1.7,.45,1)` |
| Bottom sheets | `translateY(120% → 0)` 0.55s, `cubic-bezier(.3,1.35,.45,1)`; opacity 0.3s |
| Assessor carousel track | `translateX(-idx·244px)` 0.6s, `cubic-bezier(.3,1.3,.45,1)` |
| Pop-ins (chips, toasts, menus, palette) | keyframe scale 0.6→1 with opacity 0→1, 0.2–0.4s, `cubic-bezier(.3,1.6,.5,1)` |
| "+" button | Rotates 135° to become ×, 0.45s springy |
| Session bead select | Size 18→26px plus a halo ring, 0.3s springy |
| **Do not** | Use flashing or looping pulse rings, parallax, confetti, or shadows that animate |

Respect `prefers-reduced-motion`: replace every movement with a 150ms cross-fade.

---

## 9. Components

### Bubble dock (app shell bottom navigation)
- Five 56px black circles at a 62px pitch, gooey-merged with a 28px bridge. Order: **Floor** (two dots) · **Desk** (paper icon with an orange count badge) · **Assessors** (three dots) · **Avatar** (head-and-shoulders glyph) · **Settings** (ring).
- What each one opens: **Floor** is home. **Desk** holds every document and feedback report, and its badge counts open actions. **Assessors** holds the gallery, each assessor's profile and their notes. **Avatar** is the student's own profile: university, course, level and avatar. **Settings** is minimal in v1.
- Active state: a white 44px circle slides under the active icon, and that icon turns ink. Inactive icons are `#9A9A96`.
- Hover: a black mono tooltip appears 36px above the bubble.
- Next to the dock, 14px away: an orange 56px "+" circle. Opening it pops two pills above it: **Practise a presentation** (black) and **Review a report** (white with outline). Each asks which table the session is for, or starts the new-table flow.

### Side panel (focused table)
1. Mono status (orange when a session is in progress) + `n / 4 ← →`.
2. H1 table name, then one line: the last session and the number of open actions. If the brief has a deadline, show it here in mono.
3. **SESSIONS**: a horizontal track of beads (same states as the rim dots). Clicking a bead selects it and shows a grey card with the session type, the date and the first line of its verdict, plus **Open feedback report**.
4. **AT THIS TABLE**: the board's assessors (62px avatar, name, mono field). Clicking one opens their card in the Assessors sheet.
5. **ON THE TABLE**: document rows with a paper icon, title and "n OPEN" in orange (open actions). The mark scheme is listed here too, with a mono `MARK SCHEME` label.
6. Footer: a primary CTA + an outlined **Edit board** button. The CTA is orange **Take your seat** when a session is in progress (it resumes it), otherwise black **Review a report** or **Practise a presentation**, whichever the project's template calls for.

### What the board remembers (home side panel)
- Place after Sessions and before At this table. Use the mono label **WHAT THE BOARD REMEMBERS**.
- A quiet outlined disclosure shows the count of remembered attempts and open actions. Expanding it shows the three most recent attempts (type, mono date, an ink dot, short verdict and ticked action count), the previous attempt's still-open actions, and criterion trends as three-dot ratings from oldest to newest.
- Levels use ink dots only; **STILL OPEN FROM LAST TIME** may use the one orange highlight. Counts describe sessions or actions, never marks or scores.
- The side panel scrolls when expanded. Empty copy explains that memory begins after the first session. Temporary sample memory keeps the floor's sample-data label. Each invented remembered attempt also says **SAMPLE REPLIES · NOT REAL FEEDBACK**, including when held in a configured database; real Claude runs exclude these attempts from comparisons.

### Assessors sheet (carousel of assessors)
- A sheet 1010×352 sliding up above the dock, with a 32px radius and a 1.5px ink border.
- Cards 228 wide, 16px gap, 4 visible, navigated with ← → buttons. Each card: 84px avatar, project-code chips for the tables they sit at (e.g. `MT` `LR`), name (Bricolage 16), field, focus (one line, ellipsis), harshness as five dots, `n NOTES` in mono, and a **Seat at {code}** pill for the focused table.
- **Selected** card: inverted (black fill, white text, inverted avatar, orange button). Selecting also filters the floor to that assessor's tables and adds an orange dot under their seat.
- The first card is dashed: **New assessor**. In v1 it copies an existing assessor, which the student then renames and adjusts.
- Opening a card shows the **assessor profile**: who they are, then their notes. After the two session screens this is the most important screen in the product, because notes are what make a board specific to the student's own markers. Notes are a plain list, each with a mono source label (`LECTURE`, `HANDBOOK`, `OTHER`), above an add-note pill input and a large dashed drop zone for pasting a lecture transcript.

### Desk sheet (documents and reports)
- Four-column grid of cards. Document cards: paper glyph, title, project code, open actions in orange mono. Feedback report cards: session-state dot, title, project code, date.
- A dashed **Review a report** card starts a new review.

### Command palette (⌘K or /)
- The page behind fades to 82% white. A 560px card with a 30px radius: input row, then results with a 34px state circle (orange = live table, outline = table, black = assessor, dashed = doc), label, sub-label and mono kind.
- Enter or click jumps straight to the result: focuses a table, opens an assessor, or opens the Desk.

### Buttons
| Type | Style |
|---|---|
| Primary create | Orange fill, `#111` text, pill, 600 14px, padding 12×20 |
| Primary | Ink fill, white text |
| Secondary | White, 1.5px ink border |
| Quiet | `#F3F2EF` fill |
| Icon | 36–42px circle |

### Chips / segmented controls
Pill, 13px 500, padding 9×14. Active = ink fill with white text. Inactive = white with a 1.5px `#ECEBE8` border. Segmented groups sit in a `#F3F2EF` or white pill track with 4px padding.

### Toast
Black pill, white 13px text, centred above the dock, auto-dismisses after 2.4s.

### Session state key (use everywhere)
| State | Meaning | Dot / bead |
|---|---|---|
| Done | A finished session with a feedback report | Ink fill |
| In session | Running now: assessors reading, or the Q&A in progress | Orange (bead) / white on the orange table (rim) + halo |
| Ready | A document is uploaded or a presentation is set up, and the session has not been run | White with a dashed ink outline |
| Deadline | The real hand-in or presentation date, if the brief has one. At most one, always last | White with a 1.5–2px solid ink outline |

### Dot ratings (use wherever a level is shown)
Levels are shown as a row of dots, never as a colour, a number or a percentage.
- **Harshness** of an assessor: five dots, filled = harsher.
- **Rating against a marking criterion**: three dots. Strong = three filled, adequate = two, weak = one.
- **Effort** of an action: three dots. Quick = one filled, moderate = two, substantial = three.
- Filled dots are ink. Empty dots have a 1.5px ink outline. Dots are 8px with a 4px gap.

### Comment anchors (report review)
- Every comment is tied to a numbered paragraph. Its anchor is a numbered disc in the document margin, and the words it refers to carry a 1.5px ink underline.
- Open major comment: orange disc, ink numeral. Other open comments: white disc with a 1.5px ink outline. Done: `--grey-300` outline and numeral.
- The comment card shows the assessor's avatar (24px), name, mono field, the comment and its suggestion.
- Where several assessors comment on the same paragraph, stack their avatars on one anchor. Agreement and disagreement in the board discussion are shown the same way.

### AI states (design every one; never show a bare spinner)
| State | Where | How it looks |
|---|---|---|
| Reading | Report review, per assessor | The assessor's seat with a mono `READING` label and three ink dots that fill left to right |
| Board steps out | Presentation practice, before the questions | The seats swing away from the table and gather into a gooey blob (§5), with mono `THE BOARD IS CONFERRING` |
| Listening | Presentation practice, while the student speaks | The live transcript in `--grey-700`, and a single orange dot beside "Listening" |
| Speaking | Call stage, one assessor | That tile enlarges, an orange dot sits under it, and the question appears as a caption |
| Thinking | Call stage, deciding on a follow-up | Mono `THINKING` under the tile, no motion |
| Failed | One assessor's review did not return | The seat at 0.4 opacity, mono `DID NOT FINISH`, and a quiet **Try again** pill. The other assessors are unaffected |
| Empty | A table with no sessions, or an assessor with no notes | A dashed outline and one sentence saying what to do next |

### Call stage (presentation practice: the questions)
- The questions are presented as a video call: one tile per assessor, plus one for the student's own camera.
- Tiles are 26px-radius cards with a 1.5px ink border. The speaker's tile enlarges with the springy ease and the others shrink into a row.
- Each tile shows the assessor's name and field in mono. The speaking tile shows the question as a caption in Instrument Sans 20px, so it can be read from the back of a room.
- In the call, an assessor appears as the **realistic counterpart** of their pen avatar where one exists (§6), otherwise as the pen avatar.
- Bottom control pill: **Mute · Camera · Next question · End Q&A** (End Q&A is outlined).
- Above the stage, a stepper of four pills joined by 2px lines: Present · Board steps out · Questions · Feedback.
- The student's camera is shown on screen only. It is never recorded or sent anywhere, and the interface says so the first time the camera is switched on.

### Feedback report (closes every session)
One layout for both session types, on a white page with a 28px top radius. In order:
1. **Verdict:** two or three sentences in Bricolage 26, then one line from each assessor beside their 36px avatar.
2. **Against the marking criteria:** one row per criterion, with its three-dot rating and the evidence in `--grey-700`.
3. **Actions, ranked:** numbered rows. What to do (600 weight), why it matters, the avatars of the assessors who raised it, effort as dots, and a round tick box. For a report, a link to the paragraphs. For a presentation, the quote from the transcript in mono.
4. **Keep:** the strengths, as a plain list.
5. **Report only:** likely questions, each beside the assessor who would ask it.
6. **Presentation only:** delivery (length and words per minute in mono, then notes on structure and clarity), and a review of each question with a bullet list of points a stronger answer would cover. Never give answer wording.
7. **Take this to your supervisor:** points the board could not settle or that fall outside its fields. A card with a 1.5px ink border and the mono label `FOR A HUMAN`. This is the one place the product sends the student to a person, so it must not look like an error.
8. **Since last time**, when there was an earlier session: what improved, what was raised again (mono `RAISED AGAIN` in orange), and the previous attempt's unticked actions under `STILL OPEN`.
9. **How the board behaved**, last in both report kinds: ordered mode shifts, then guardrail events grouped by reason with their counts. Mode names and event counts are mono labels, with ink dots for the ordered trace. Explain why a boundary removed content without showing the removed wording. A new report with no events says so; an older report without telemetry says behavior was not recorded. Preserve this section in **Copy as text**, including the sample-reply label when applicable. No scores and no additional highlight colours.

A **Copy as text** pill sits at the top right. The report never shows a mark, a grade or a percentage. It never comments on tone of voice or body language, because the product only has the student's words.

---

## 10. Session screens (reference explorations in `Roundtable Mockups.dc.html`)

Only the Floor is designed in hi-fi. The session screens are built from the explorations below, using the components in §9.

| Screen | Exploration id | What to take from it | What to change |
|---|---|---|---|
| Report review | **1f** / **1g** | Document in the centre, threads on the right, numbered disc anchors, avatars on comments, Open and Done tabs, stacked avatars for agreement | Two tabs across the top: **Comments** and **Feedback report**. No Reply. Add the Reading and Failed states |
| Presentation practice | **1d** (dark) / **1e** (ink) | The row of assessors, the stepper, the bottom control pill | White background. The row becomes the call stage. No shared slide, no live rubric, no Hand or Share |
| Assessor profile and notes | **1c** (layout only) | Large avatar on the left, grouped options on the right with mono labels | The right side holds the assessor's details and notes, not avatar editing |
| Home alternatives | **2a–2c**, **3a–3d**, **4a–4c** | Rejected directions, kept for reference | Do not build |

Keep the dock visible on every screen. Inside a session it collapses to an exit bubble.

---

## 11. Data

The data shapes are defined once, in [`docs/plan/README.md`](../docs/plan/README.md) under "Data shapes", and in code in `src/lib/schemas`. Do not redefine them here or inside a feature.

What the UI derives from them:
- **Project code:** the two-letter chip (`MT`, `LR`) is made from the initials of the project title.
- **Table order** on the floor is the order the projects were created. Focus defaults to a project with a session in progress, otherwise the most recently used.
- **Rim dots and beads:** one per review or presentation session, oldest first, then the deadline dot if the brief has one.
- **Open actions:** the unticked actions in the project's latest feedback report.
- **Speech bubble:** the likely questions in the project's latest feedback report.

---

## 12a. Final reference images (`/reference/final`, captures of the final export)

| File | Shows | Figma frame to create in 51:63 |
|---|---|---|
| [`01-panel-final.png`](./reference/final/01-panel-final.png) | Default: Master's Thesis focused (orange), rim dots, live speech bubble, side panel | `Final / 01 Floor default` |
| [`02-panel-final.png`](./reference/final/02-panel-final.png) | After → : next table swung to centre | `Final / 02 Focus next` |
| [`03-panel-final.png`](./reference/final/03-panel-final.png) | After → again | `Final / 03 Focus third` |
| [`04-panel-final.png`](./reference/final/04-panel-final.png) | ⌘K command palette | `Final / 04 Command palette` |

Figma target: https://www.figma.com/design/d0G58b8c7ESX0rw0qbXHcX/AI_hackathon?node-id=51-63. Use one 1440×900 frame per image, placed left to right with an 80px gap, in a section named **Roundtables — Final**.

## 12. Reference images (`/reference`, 1440×900 captures of `Roundtables.dc.html`)

| File | Shows |
|---|---|
| `01-floor-default.png` | Floor plan, Master's Thesis focused (orange, rim dots, live speech bubble) |
| `02-floor-focus-swap.png` | After clicking another table: the tables have swung around |
| `03-carousel.png` | Carousel view |
| `04-carousel-rotated.png` | Carousel after → (rotation) |
| `05-floor-return.png` | Back to the floor plan |
| `06-floor-focus-pitch.png` / `07-floor-focus-pitch-alt.png` | Pitch Practice focused (orange), side panel with sessions, people and docs |
| `08-command-palette.png` | ⌘K palette over the floor |

Put these in Figma frame **51:63**: https://www.figma.com/design/d0G58b8c7ESX0rw0qbXHcX/AI_hackathon?node-id=51-63

---

## 13. Build checklist for agents

1. Load the three fonts; set the CSS variables from §3; the page background is **white**.
2. Build the logo (§2) as DOM circles, not an image.
3. Implement the Floor as an absolutely positioned 1440×900 stage scaled to fit; compute table geometry in JS from polar slots (§7).
4. Animate focus with a requestAnimationFrame tween over (angle, distance, radius) using easeOutBack (§8).
5. Seats, rim dots and paper are derived from table geometry every frame; there is no per-element CSS animation.
6. Dock: gooey SVG filter + a sliding white bubble; it controls the Desk and Assessors sheets.
7. Side panel reads the focused project; session beads are selectable.
8. Assessors sheet: card carousel + filter-by-assessor that dims the floor.
9. Command palette: ⌘K or /, Esc to close; ← → keys cycle table focus.
10. Use `avatars-pen/` (100 SVGs) for every person. No backgrounds behind avatars; match the §6 style for any new ones.
11. Accessibility: tables are buttons (`aria-pressed` when focused, label "Project · status"); the dock is a `nav` with `aria-current`; sheets are `dialog` elements with focus trap; contrast is ink on white or ink on orange (≥ 4.5:1); support reduced motion.
12. Don't: add a top nav bar, a dashboard grid, gradients or shadows, avatars inside filled circles, flashing animations, "your seat" placeholders, or more than one orange table at a time. Don't show peers, invitations, scheduled sessions, marks or percentages (§1.1).

---

## 14. Source files in this project

| File | Purpose |
|---|---|
| `Panel Home Final.dc.html` | **Canonical final** (floor, springy). Export: `export/Panel Home Final.html` |
| `Roundtables.dc.html` | Earlier interactive prototype (floor + carousel, dock, sheets, palette). Logic in the `<script data-dc-script>` class: data (`PROFS`, `TABLES`), geometry (`slotsA`, `geo`), tween (`tween`, `ease`) |
| `Roundtable Mockups.dc.html` | All exploration rounds (1–4) |
| `avatars-pen/` | **Avatar reference set**: 100 SVGs |
| `Avatar Collection Pen.dc.html` | Gallery of the reference set |
| `avatars2/` | 12 source PNGs (style origin) |
| `Avatar.dc.html` / `Panel Avatar.dc.html` | Prototype avatar components (avatars2 PNGs) |
| `avatar-svgs/`, `Avatar Collection.dc.html` | Deprecated older set |
| `reference/` | Screenshots for Figma 51:63 |
| `DESIGN_SYSTEM.md` | This document |

---

## 15. What is designed, and what is built from this system

Only the **Home/Floor** is designed in hi-fi. Everything else is built from the tokens and components above. The steps refer to `docs/plan/`.

| Screen or flow | Design status | Build it from | Plan step |
|---|---|---|---|
| Floor (home) | Final | §7, `Panel Home Final.dc.html` | 3.5 |
| Dock, sheets, command palette | Final | §9 | 3.1 |
| Assessors sheet, assessor profile and notes | Sheet designed, profile not | §9 Assessors sheet | 3.3 |
| New assessor (copy one, rename, adjust) | Not designed | A sheet with pill inputs; harshness as five dots; focus areas as chips; avatar picked from `avatars-pen/` | 3.3 |
| Boards (save, reuse, edit) | Implicit in the seats | "Edit board" opens the Assessors sheet with **Seat** and **Unseat** pills. "Save board" lives in the table's ⋯ menu | 3.4 |
| New project | Not designed | The orange "+" or the dashed New table. Steps as pills joined by lines: Template · Brief · Weak spots · Board · Start. The new table pops into the next free slot, then swings to focus | 2.4 |
| Report review | Explorations 1f / 1g | §9 Comment anchors and AI states; §10 | 2.1 to 2.3 |
| Presentation practice | Explorations 1d / 1e | §9 Call stage and AI states; §10 | 1.3, 1.4, 3.2b |
| Feedback report | Not designed | §9 Feedback report | 2.3b |
| Profile | Not designed | A single white sheet from the profile pill: pill inputs, level as a segmented control (UG · PGT · PGR), avatar on the left | Tier 5 |

### Screens the design lead should draw next, in build order
1. Presentation practice: listening, board steps out, call stage
2. Feedback report
3. Report review, finalised from 1f
4. Assessor profile and notes
5. New project

Each new screen: 1440×900, white, uses the dock, and goes into Figma frame 51:63 next to the final floor.

### Rules that hold on every screen
- No streaks, points, badges, scores or progress percentages. Progress is shown by session dots and ticked actions only.
- One highlight colour. No per-assessor colours and no traffic-light colours (§3).
- Every waiting moment uses a designed AI state (§9).
- Nothing implies a real person is on the other end. Only the student names an assessor after a lecturer, and realistic counterparts are always invented faces.
