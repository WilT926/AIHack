# Lane 3: design system, assessors, boards, home

You are the design lead and you own the Figma prize. Your code changes restyle the whole app at once, because every screen is built from your base components and style variables.

## Until the foundation is pushed (tier 0)
Finish the design system in Figma, in the order the app is being built:
1. **Variables:** the names and values in `design/DESIGN_SYSTEM.md` §3 to §5 are final. Code uses the same names.
2. **Base components:** button, card, avatar, text input, text area, modal, tabs, badge, comment bubble, spinner, navigation.
3. **Pitch session screen** (the live demo): listening with live transcript, "board steps out", then the discussion laid out like a video call (one tile per assessor, one for your own camera, the speaker's tile enlarged), and final feedback.
4. **Assessor profile:** who they are, plus their notes.
5. **Home:** the table with projects on it and the board seated round it.

Design the AI states deliberately: reading, deliberating, speaking, listening, failed, empty. These are what a design judge looks for in an AI product.

Light theme and laptop width only. Do not spend time on dark mode or phone layouts before tier 5.

---

## 3.1 Style variables and base components (tier 1, about 60 minutes)
**Branch:** `lane3/design-system`. Needs Lane 1's foundation.

1. Put the tokens from `design/DESIGN_SYSTEM.md` §3 to §5 into the variables file in `src/styles`, under the same names.
2. Restyle each base component in `src/components/ui` to match Figma. Keep each component's name and inputs the same, so other lanes' screens keep working.
3. Add the display and body fonts, with sensible fallbacks.
4. Give keyboard focus a visible style and check text contrast.
5. A simple `/styleguide` page showing every component and colour, for checking and for the pitch.

If your agent session has the Figma plugin, let it read the variables and components from the file instead of retyping values.

**Done when:** the `staging` site already looks like the Figma file without any other lane changing a line.

---

## 3.2 Avatars (tier 2, about 30 minutes)
**Branch:** `lane3/avatars`.

1. The set is already drawn: copy `design/avatars-pen/` (100 SVGs) into `public/avatars`. Do not use the deprecated `design/avatar-svgs/`.
2. Give each of the ten seeded assessors an avatar that suits their role.
3. Build the avatar picker used when creating an assessor.

Assessors are not colour-coded; see the design system §3.

**Done when:** every assessor in the app shows their own avatar, and the picker offers the full set.

---

## 3.2b Call stage for the pitch discussion (tier 2, about 45 minutes)
**Branch:** `lane3/call-stage`. Lane 1 uses this in step 1.4, so build it before 3.3.

The questions after a pitch are presented as a video call with the board.

**Build in `src/components/ui`:**
1. **Call stage:** a grid of tiles, one per board member plus one for the presenter. The current speaker's tile is enlarged and the rest shrink.
2. **Assessor tile:** name and field, with four states: idle, speaking, listening, thinking. The tile shows, in order of preference: the assessor's realistic clips (idle clip when quiet, talking clip while speaking), their realistic portrait, or their illustrated avatar. While speaking, the tile border pulses with the loudness of the voice (a number Lane 1 passes in) and the question appears as a caption.
3. **Presenter tile:** the user's own webcam, shown on screen only. It is never recorded or sent anywhere. If the camera is refused, show their initials.
4. **Controls bar:** next question, end Q&A, mute.

The stage takes its inputs from Lane 1: the board members, who is speaking, the loudness, the caption and the state. It makes no calls itself.

**Done when:** the `/styleguide` page shows the stage with four assessors, cycling through the states with dummy inputs.

---

## 3.2c Realistic versions for the call (tier 2, about 45 minutes, mostly waiting)
**Branch:** `lane3/realistic`. Do this after the call stage works with illustrated avatars, so there is always a working fallback.

In the live call, each illustrated assessor appears as a realistic person who clearly resembles their avatar.

**Read fal's current model list and prices first. Generate everything once and save the files; nothing is generated at run time.**

1. **Start with the four pitch judges only.** They are the ones in the live demo. Do the six report assessors afterwards if time and credits allow.
2. **Portrait:** from each illustrated avatar, generate a realistic head-and-shoulders portrait framed like a webcam shot. Keep the features that make the avatar recognisable: hair, glasses, hat, clothing colour.
3. **Test one clip before making the rest:** from one portrait, generate a short idle clip (blinking, small movements) and a short talking clip (mouth moving, no specific words). Play the talking clip in the call stage while a question is spoken.
4. **Decide:** if the mouth movement looks wrong against the voice, stop and use portraits only, with the pulsing border. If it looks right, make the idle and talking clips for the other three judges.
5. Save to `public/avatars` and set each assessor's portrait and clip fields.

These are invented faces. An assessor named after a real lecturer gets one of the invented faces, never a generated likeness of the real person.

**Done when:** the four judges appear in the call as realistic people who match their illustrated avatars, and removing the files falls back cleanly to the illustrations.

---

## 3.3 Assessors and notes (tier 2, about 60 minutes)
**Branch:** `lane3/assessors`. This step carries the product's main selling point.

**Build in `src/features/assessors` and `src/app/assessors`:**
1. **Gallery:** assessors grouped by field.
2. **Profile page:** avatar, name, field, role, personality, harshness, focus areas.
3. **Notes:** add, edit and delete notes on an assessor, each tagged as lecture, handbook or other. A large box for pasting a lecture transcript.
4. **Create by copying:** pick an existing assessor, copy it, rename it (for example to a real lecturer) and adjust field, harshness and focus areas.
5. Save everything through `src/lib/data`.

**Done when:** you copy the Module Lead, rename it, add the note "wants safety considered in the design", and the note is saved and visible. (Lane 1's engine already reads notes, so the next review will reflect it.)

---

## 3.4 Boards (tier 3, about 40 minutes)
**Branch:** `lane3/boards`.

1. List saved boards.
2. Create a board: name it and choose members from the gallery.
3. Edit a board: add or remove members, rename.
4. Show a board as avatars seated round a table.

**Done when:** you can build a board, save it, and choose it in Lane 2's project setup.

---

## 3.5 Home (tier 3, about 90 minutes)
**Branch:** `lane3/home`.

1. Build the Floor as specified in `design/DESIGN_SYSTEM.md` §7 and §8, porting the geometry and motion from `design/Panel Home Final.dc.html`. Each project is a table with its board seated round it. Use the real meanings in §1.1 of the design system, not the prototype's sample data.
2. "New project" and "Start session" are on this screen.
3. Opening a project shows its past reviews and pitch sessions.
4. Keep motion small: a member taking a seat, a new stack appearing.

**Done when:** the home screen shows real projects and boards from the database and every other page is one click away.

---

## 3.6 Visual check and design evidence (tier 4, Sunday 10:00–11:30)
**Branch:** `lane3/polish`.

1. Go through every screen on `staging` against Figma. Fix spacing, alignment and inconsistent states in the base components first, since that fixes them everywhere.
2. Check the pitch screen on the real judging screen: text size readable from the back, the question large, the speaking indicator obvious.
3. Add the Figma file link and two screenshots to the README.
4. Prepare the thirty seconds of the pitch that show how we qualify for the Figma prize: the system in Figma, the same variables in code, the designed AI states.

**Done when:** nothing on the demo path looks unstyled, and the Figma evidence is in the README.

---

## Tier 5, only if everything above is merged
- Create an assessor from scratch, not only by copying.
- Profile page: university, course and level.
- Phone layout for the home and pitch screens.
- The lounge above the table.

## Keeping usage low
- None of your steps need calls to Claude from the app.
- Do the visual thinking in Figma, then give your coding agent the finished frame for one component or one screen at a time.
- Your Anthropic key runs the deployed site, so avoid using it for development.
