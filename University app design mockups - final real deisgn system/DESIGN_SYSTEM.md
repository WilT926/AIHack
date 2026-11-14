# Panel — Design System & Build Spec

> Single source of truth for building **Panel**, a university web app where students rehearse crits, vivas and report reviews in front of a board of AI assessors drawn as pen-sketch avatars.
> Written so another agent (or developer) can build the product without this chat.

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
| Avatar library (100 SVGs) | `avatar-svgs/avatar-001.svg … avatar-100.svg`, gallery: `Avatar Collection.dc.html` |
| Reference screenshots | `reference/*.png` (see §12) |

> **Figma note:** the reference images in `/reference` should be dropped into frame **51:63**. Add one frame per screenshot, named exactly as the file (e.g. `01-floor-default`). If you add new screens, add frames to the right of 51:63 at the same 1440×900 size and update §12.

---

## 0.1 Final version (locked)

- **Direction:** Floor plan only. The carousel view and its switch are removed.
- **Motion:** Springy only (easeOutBack, c1 = 1.5). The "calm" option is removed.
- **Focused table:** orange, with session rim dots, no pulse, no "your seat" placeholders.
- **Avatars:** `avatars2/a0–a11.png` (pen line on transparent), embedded in [`Panel Avatar.dc.html`](./Panel%20Avatar.dc.html) so the export works offline.
- **Nav:** bubble dock (bottom) + orange "+". No top nav bar.

## 0.2 File locations (all project-relative; click to open)

| File | Location |
|---|---|
| Design system (this doc) | [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) |
| Final home source | [`Panel Home Final.dc.html`](./Panel%20Home%20Final.dc.html) |
| Final home export (single offline HTML) | [`export/Panel Home Final.html`](./export/Panel%20Home%20Final.html) |
| Final avatar component (embedded images) | [`Panel Avatar.dc.html`](./Panel%20Avatar.dc.html) |
| Avatar images used in final | [`avatars2/`](./avatars2/) — `a0.png … a11.png` |
| 100-avatar SVG library | [`avatar-svgs/`](./avatar-svgs/) — `avatar-001.svg … avatar-100.svg` |
| Avatar gallery | [`Avatar Collection.dc.html`](./Avatar%20Collection.dc.html) |
| Earlier prototype (floor + carousel) | [`Roundtables.dc.html`](./Roundtables.dc.html), copy: [`Roundtables copy.dc.html`](./Roundtables%20copy.dc.html) |
| Dev avatar component (file paths) | [`Avatar.dc.html`](./Avatar.dc.html) |
| Exploration canvas (rounds 1–4) | [`Roundtable Mockups.dc.html`](./Roundtable%20Mockups.dc.html) |
| Final reference screenshots | [`reference/final/`](./reference/final/) |
| Earlier reference screenshots | [`reference/`](./reference/) |
| User uploads (logo, avatar refs) | [`uploads/`](./uploads/) |

> When downloaded, these paths are relative to the project folder root. The same names apply on disk.

## 1. Product in one paragraph

You create **assessors** (preset or modelled on a real lecturer), seat them at a **board**, attach that board to a **project** (thesis, lab report, pitch…), and run **sessions** against the project: a **report review** (5a) or **presentation practice** (5b). The feedback engine reviews the work through each assessor's lens and remembers what you fixed. The UI shows this literally as a **floor plan of round tables**: each project is a table, its board sits around it, documents lie on it, and sessions are dots on its rim.

### Terminology mapping (spec → UI)

| Spec (Figma 43:2) | UI object | Notes |
|---|---|---|
| You (profile) | Profile card, top right; Avatar studio | University, course, level |
| Assessor | **Seat** (avatar around a table) + **Assessor card** | name, avatar, field, personality / harshness, focus, knowledge |
| Board | **The ring of seats** around a table | Saved boards can be reused on other tables |
| Project | **Table** | Brief, mark scheme, weak spots, sessions |
| Session (5a report / 5b presentation) | **Rim dot** on the table + **session bead** in the side panel | past / live / upcoming / doc |
| Documents | **Paper** lying on a table + **Desk** sheet | Orange badge = open comments |
| App shell, bottom navigation | **Bubble dock** (bottom centre) | Floor · Desk · Assessors · Avatar · Settings + orange "+" |
| "Home: a table… everyone shuffles round" | **Floor plan** with swing-to-focus motion | See §7 |
| Lounge (later) | Area above the tables (not built) | Reserve the top-left of the floor |

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
Calm, direct, a little warm. Talk like a good tutor: "Your panel is waiting", "Take your seat", "Why twelve studios?". No exclamation marks, no gamification language (spec: *no streaks, tracks or gamification*).

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

- **Style**: black pen line (stroke ≈ 4 on a 200 viewBox, round caps and joins), white or flat-black fills, grey `#B4B3AF` for silver hair or turtlenecks. **Transparent background: never a circle or other frame behind an avatar.** On black surfaces, invert with `filter: invert(1)`.
- **Library**: `avatar-svgs/avatar-001…100.svg`, 200×200, procedurally generated. Weighted toward faculty looks (blazer, blazer + tie, turtleneck, cardigan, collared shirt, V-neck) with casual pieces mixed in (striped or dotted tees). Variables: head shape, 11 hair styles × 3 tones, glasses (round/rect), beard, moustache, stubble, studs, hoops, freckles, 5 mouths, eye styles, brows.
- **Avatar studio** (spec 2 · Avatars): pick from the library as a base, then tweak hair, accessories, clothing and line style. See exploration `1c` in `Roundtable Mockups.dc.html`.
- **Sizes**: seat = 0.64 × table radius (≈90px on the focused table, ≈58px on side tables); panel list 62px; card 84px; profile chip 52px; inline comment 22–36px.
- The final uses `Panel Avatar.dc.html` (prop `who` 0–11 → `avatars2/a{n}.png`, embedded as data URIs). The 100-SVG library is the expansion set for the assessor picker.

---

## 7. Home: the Floor (primary screen)

Canvas 1440×900, scaled to fit the viewport (`scale = min(vw/1440, vh/900)`, centred).

### Layout zones
| Zone | Position | Content |
|---|---|---|
| Brand + view switch | top-left 32,26 | Logo, then a segmented control: **Floor plan** / **Carousel** |
| Search | top-centre, x 560, w 340 | Pill with a 1.5px ink border: "Find a table, assessor or doc", `⌘K` hint |
| Filter-by-assessor chip | below search, y 84 | Black pill "Tables with **Dr. Leo Marsh** ×" (only while an assessor is selected) |
| Profile | top-right | Pill: avatar 52 + name + course |
| Floor | x 0–1040 | Tables, seats, papers, "New table" |
| Side panel | x 1056, y 104, w 358, bottom 28 | Details of the focused table |
| Filters | bottom-left | Chips: All tables · Live · This week · To prepare |
| Dock | bottom, x 373, y 822 | Bubble nav + orange "+" |

### Table
- Circle. **Focused** table: radius 140, fill `--orange`, no border, full content (mono status, 26px name, 12px next session). **Other** tables: radius 92, fill white, 1.5px ink border, compact content (name 11–19px, short mono status).
- **Rim dots**: focused table only. One 11px dot per session along the bottom inner rim (radius − 17), 12° apart, in chronological order left to right. Done = filled ink, live = white, upcoming = 1.5px ink outline, document = 1.5px dashed outline.
- **Seats**: the board's avatars sit around the rim at `dist = r + 0.5·av + 2`, starting at −110° and evenly spaced. **There are no empty "your seat" placeholders.**
- **Paper**: when the table has a document, a white sheet (0.34r wide, rotated −9°) sits near the top-right of the table, with an orange comment-count badge.
- **Speech bubble**: on the live focused table, a white pill with a ring tail next to the first seat. It cycles through realistic assessor questions every 3.6s.
- **Dimming**: tables that don't match the filter or the selected assessor go to opacity 0.18 over 0.4s.
- **New table**: a dashed circle (156px) with an orange "+" that opens the create menu.

### Floor plan positions (centre 520,455; ellipse 420×280)
- Focus slot: d = 0.
- Ring slots at 215° (upper-left), 152° (lower-left) and 325° (upper-right). Other tables fill these slots in cyclic order after the focused one.
- "New table" is fixed at (850,640).

### Carousel variant (alternate home)
- Tables sit on an elliptical "lazy-Susan" track centred at (520,410), Rx 380, Ry 170, drawn as a 1.5px dashed `#DCDBD7` ellipse.
- Angle θᵢ = i·90° − φ. Position `x = 520 + 380·sinθ`, `y = 410 + 170·cosθ`. Scale `s = 0.45 + 0.55·(1+cosθ)/2`, radius = 140·s, z-index rises with s.
- Clicking a table animates φ the shortest way round to bring it to the front. Arrow buttons ← → sit under the track.

---

## 8. Motion

| Interaction | Spec |
|---|---|
| Focus a table (floor) | 1000ms, easeOutBack (c1 = 1.5 "springy", 0.4 "calm"). Tables move in **polar space** (angle, distance, radius are interpolated), so they swing along arcs rather than straight lines. A table leaving the centre starts from (target angle − 90°) so it swings out. Angles always take the shortest path. |
| Focus a table (carousel) | Same easing; interpolate φ only. |
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
- Active state: a white 44px circle slides under the active icon, and that icon turns ink. Inactive icons are `#9A9A96`.
- Hover: a black mono tooltip appears 36px above the bubble.
- Next to the dock, 14px away: an orange 56px "+" circle. Opening it pops two pills above it: **Panel room** (black) and **Live doc review** (white with outline).

### Side panel (focused table)
1. Mono status (orange when live) + `n / 4 ← →`.
2. H1 table name + next-session line.
3. **SESSIONS**: a horizontal track of beads (same states as the rim dots). Clicking a bead selects it and shows a grey card with title, date and note.
4. **AT THIS TABLE**: assessors and peers (62px avatar, name, mono role). Clicking an assessor opens their card in the Assessors sheet.
5. **ON THE TABLE**: document rows with a paper icon, title and "n OPEN" in orange.
6. Footer: primary CTA (orange **Take your seat** when live, otherwise black **Prepare** / **Upload deck**) + an outlined **Invite** button.

### Assessors sheet (carousel of professors)
- A sheet 1010×352 sliding up above the dock, with a 32px radius and a 1.5px ink border.
- Cards 228 wide, 16px gap, 4 visible, navigated with ← → buttons. Each card: 84px avatar, project-code chips (e.g. `MT` `LR`), name (Bricolage 16), role, focus (one line, ellipsis), office hours in mono, and an **Invite to {code}** pill.
- **Selected** card: inverted (black fill, white text, inverted avatar, orange button). Selecting also filters the floor to that assessor's tables and adds an orange dot under their seat.

### Desk sheet (documents)
- Four-column grid of document cards (paper glyph, title, project, mono comment count in orange) plus a dashed **Start live doc review** card.

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
| State | Dot / bead |
|---|---|
| Done | Ink fill |
| Live | Orange (bead) / white on the orange table (rim) + halo |
| Upcoming | White with 1.5–2px ink outline |
| Document review | White with dashed ink outline |

---

## 10. Other screens (reference explorations in `Roundtable Mockups.dc.html`)

| Spec section | Exploration id | Notes for the build |
|---|---|---|
| 2 · Assessors → Avatar studio | **1c** | Three steps (Face, Style, Name); options on the right; big avatar preview |
| 5b · Presentation practice (panel room) | **1d** (dark) / **1e** (ink) | Avatars in a row; speaking indicator is a gooey dot pulse; agenda stepper; live rubric dots; bottom control pill (Mic, Cam, Share, Hand, End) |
| 5a · Report review | **1f** / **1g** | Numbered disc anchors link highlights to threads; inline comments carry the assessor's avatar and name; Open/Resolved tabs; Reply/Resolve pills; agreement and disagreement shown by stacking avatars |
| Home alternatives | **2a–2c**, **3a–3d**, **4a–4c** | Rejected directions, kept for reference: Orbits (4a) and Lines (4c) are possible alternative "views" |

When building 5a and 5b, reuse the tokens above, use the white app background (the dark 1d is optional for live rooms), and keep the dock visible.

---

## 11. Data model (minimum)

```ts
type Assessor = { id; name; avatar: string /* svg path */; field; role; personality; harshness: 1-5;
  focus: string[]; knowledge: Note[]; officeHours?: string; preset?: 'module-lead'|'methodologist'|'literature-hawk'|'communicator'|'outsider'|'sceptic' };
type Board = { id; name; seats: (AssessorId | PeerId)[] };
type Project = { id; code: string /* 2 letters */; name; brief; markScheme?: File; weakSpots: string[];
  boardId; sessions: Session[]; docs: Doc[] };
type Session = { id; kind: 'report'|'presentation'; title; date; state: 'past'|'live'|'next'|'doc'; note };
type Doc = { id; title; projectId; openComments: number };
```
Table order on the floor is the user's project order. Focus defaults to the live project, otherwise the next upcoming one.

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
10. Use `avatar-svgs/` for every person; no backgrounds behind avatars.
11. Accessibility: tables are buttons (`aria-pressed` when focused, label "Project · status"); the dock is a `nav` with `aria-current`; sheets are `dialog` elements with focus trap; contrast is ink on white or ink on orange (≥ 4.5:1); support reduced motion.
12. Don't: add a top nav bar, a dashboard grid, gradients or shadows, avatars inside filled circles, flashing animations, "your seat" placeholders, or more than one orange table at a time.

---

## 14. Source files in this project

| File | Purpose |
|---|---|
| `Panel Home Final.dc.html` | **Canonical final** (floor, springy). Export: `export/Panel Home Final.html` |
| `Roundtables.dc.html` | Earlier interactive prototype (floor + carousel, dock, sheets, palette). Logic in the `<script data-dc-script>` class: data (`PROFS`, `TABLES`), geometry (`slotsA`, `geo`), tween (`tween`, `ease`) |
| `Roundtable Mockups.dc.html` | All exploration rounds (1–4) |
| `Avatar.dc.html` | Temporary avatar component (cut-outs) |
| `avatar-svgs/` | 100 production avatar SVGs |
| `Avatar Collection.dc.html` | Gallery of the SVG set |
| `reference/` | Screenshots for Figma 51:63 |
| `DESIGN_SYSTEM.md` | This document |

---

## 15. Spec coverage from Figma 43:2 (filling the gaps)

Source: https://www.figma.com/design/d0G58b8c7ESX0rw0qbXHcX/AI_hackathon?node-id=43-2 (PLATFORM: 1 You/profile · 2 Assessors · 3 Boards · 4 Projects · 5 Sessions · Engine · App shell).
Only the **Home/Floor** is designed in hi-fi. Every other spec item is below, with the UI rules to build it in this system.

| # | Spec item | Status | How to build it in this system |
|---|---|---|---|
| 1 | **You / profile**: university, course, level | Not designed | Opened from the profile pill (top right). Single white sheet, 32px radius. Fields are pill inputs with a 1.5px ink border; level is a segmented control (UG · PGT · PGR). Avatar preview on the left, pen line, no frame. Save = black pill. |
| 2 | **Assessors**: preset or modelled on a real lecturer; name, avatar, field, personality / harshness, focus, knowledge | Partly (Assessors sheet) | **Create flow** = three-step stepper (Who · How they think · What they know). Step 1: preset chips (Module lead, Methodologist, Literature hawk, Communicator, Outsider, Sceptic) or "Model a real lecturer" (name + upload of past feedback or notes). Step 2: harshness = 5 dots (filled = harsher), the same dot language as the rubric; focus = chips. Step 3: knowledge = document drop zone (2px dashed). Avatar picked from `avatar-svgs/`. |
| 2a | **Avatar studio** | Exploration 1c | Left: large avatar. Right: options grouped by mono labels (HAIR, DETAILS, LINE, BACKDROP=none). Shuffle (outline) + Save (black). |
| 3 | **Boards**: a saved set of assessors, reusable | Implicit (seats) | Drag assessor cards from the Assessors sheet onto a table's rim, and seats snap in with the springy ease. "Save board" lives in the table's ⋯ menu. Saved boards appear as chips in the New-table flow. |
| 4 | **Projects**: brief, mark scheme, weak spots, sessions | Table + side panel | **New table** flow (orange "+" → Panel room): name, 2-letter code (auto), brief (text), mark scheme (file), weak spots (chips), choose board. The new table drops into the next free ring slot with a pop-in, then swings to focus. |
| 5a | **Report review** session | Explorations 1f / 1g | Document centre (white page, 28px top radius), threads right. Each assessor comments in their own voice; an anchor = numbered disc on the margin. Thread card: avatar 24, name, mono time, body, Reply / Resolve pills. "Engine memory" line in grey: "Fixed since last review: 3". |
| 5b | **Presentation practice** session | Explorations 1d / 1e | Panel row of avatars; the speaker gets an orange dot under them (not a pulse). Shared slide centre. Agenda stepper (pills joined by 2px lines). Live rubric as dot rows. Bottom control pill: Mic · Cam · Share · Hand · End (End = outlined). |
| E | **Feedback engine**: reviews through each assessor's lens and remembers fixes | Data only | Surface it in three places: (1) side-panel session note ("6 notes · 2 resolved since"), (2) a thread label "Raised again" (mono, orange) when an issue repeats, (3) a session summary card after each session: per-assessor verdict, top 3 actions, resolved count. |
| S | **App shell / bottom navigation** | Designed | Bubble dock (§9). Keep it on every screen; inside sessions it collapses to the "+" and an exit bubble. |
| L | **Lounge** (later) | Reserved | Top-left of the floor, above the tables: a small cluster of grey seats where assessors "hang out" between sessions. Not in v1. |
| — | **No streaks, tracks or gamification** | Rule | Never add points, badges, streak counters or progress percentages framed as a score. Progress = session dots only. |

### Screens still to design (priority order)
1. New table / project creation (4)
2. Report review session (5a), finalised from 1f
3. Presentation session (5b), finalised from 1d, light theme
4. Assessor create + edit (2)
5. Profile (1)
6. Post-session summary (Engine)

Each new screen: 1440×900, white, uses the dock, and goes into Figma frame 51:63 next to the final floor.
