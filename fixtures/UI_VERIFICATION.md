# Desk and floor verification

Verified locally on 15 November 2026 with Playwright MCP, at 1440×900 and 1280×800.

- Desk document cards and side-panel document rows open saved document reviews on Comments. Feedback cards open Feedback report; refreshing retains that tab. Opening saved views made no engine requests.
- Starting a review of an existing document reused its document ID. A full review, feedback report, evidence-to-paragraph navigation, reload and reopening from Desk passed on a separate production server with the Anthropic key explicitly disabled. These replies were labelled **Sample replies** throughout; this was not a new real-Claude quality test.
- The focused table's Desk shows its own documents and reports. All tables restores the workspace-wide view; changing focus updates the project scope. Clicking the centre table opens Desk. Both Desk and Assessors close on outside clicks.
- More below scrolls to feedback reports; Back to top returns to the first row. The final version uses the button as its visible affordance and hides the scrollbar.
- Assessor notes were visually checked at desktop and laptop sizes. A new synthetic assessor was copied, given a synthetic note, kept after cancelling removal, then removed through its confirmation. It disappeared from the gallery and its profile returned 404. The built-in Module Lead remained protected.
- Rim dots were measured during 136 animation frames: their maximum distance error relative to the moving table was 0.013 CSS pixels. The title retained the same DOM node and its width-to-table ratio varied by less than 0.00003. Interrupted focus paths also have a regression test.
- The original navigation destinations remain: the floor's Assessors button opens its sheet; the profile/settings area's Assessors link opens the full gallery. Dock heights measured 56 pixels on the floor, profile, gallery and settings, including the smaller laptop viewport. The route transition's horizontal animation was observed in the browser.
- Three-second question rotation and pause-on-hover passed in the browser. Bubbles use short exact excerpts, with an off-centre thought dot beside the correct assessor.

Validation: lint and production build passed; 107 tests passed, with four opt-in live-Claude tests skipped. Database-backed deletion and persistence remain unverified here because Supabase is not configured.
