# Screen decision registry

v0.5 — 2026-09-04
<!-- Version history (append-only, never rewrite old entries):
v0.1 2026-09-03 — working screen and two panels; decisions carried over
from the planning chat (interactive prototype of 2026-09-02, verified in
a browser).
v0.2 2026-09-03 — translated to English per user decision; content
unchanged.
v0.3 2026-09-04 — decision: the passenger taps, not the driver. Compass
flow stays the primary input; the 3×4 one-tap grid remains a step-2
candidate. Button sizes unchanged (moving-car tolerances still apply).
Visual direction confirmed: keep the existing tokens (dark maneuver discs,
amber approach-side discs); Apple/CarPlay guidance applies as contrast and
target-size discipline, not as a restyle.
v0.4 2026-09-04 — all UI copy switched from Russian to English; compass
sides moved to 150px with a minimum 8px gap between any two discs; a live
compass added to the top-right of the working screen.
v0.5 2026-09-04 — approach sides at 124px from the maneuver centre;
maneuver glyphs are Lucide SVG arrows; approach-side discs keep letters
rather than icons — an embedded-letter compass icon renders the letter too
small to read at a glance in a moving car.
-->

The app is one working screen (10.6" tablet, landscape, two columns) plus
two slide-in panels. All UI copy is English.

## Working screen — left
1. Route picker R20890-024…029.
2. POI list 1…197: number, progress bar, "N to go". Row turns green at
   70/70, red on error, active POI highlighted.
3. Bottom summary: "Done N · N to go", count of finished POIs and
   errors.

## Working screen — right
4. Large active POI number, "N of 70" counter, small N/S/W/E and ←/↑/→
   counters.
5. Three big round maneuver buttons ← ↑ →; "straight" sits higher than
   its neighbors.
6. Tap a maneuver → four approach sides bloom around that button as a
   compass: N above, S below, W left, E right. Other maneuvers dim
   meanwhile.
7. Tap a side → the pass is recorded as a whole, vibration, toast
   "Saved: ← from South · N of 70". Sides hide.
8. "Cancel" is visible only while the compass is open. Tapping the same
   maneuver again also closes it. Auto-close after 12 s — nothing
   recorded, with a notice.
9. "Undo last" — rolls back a whole pass, repeatable within the
   POI; available-undo count in parentheses.
10. A POI at 70/70 or with a spreadsheet error — maneuver buttons locked,
    with a caption saying why.
11. The screen stays awake while the app is open.
19. A compass sits in the top-right corner: a fixed ring with a North tick
    and a needle that rotates to the car's heading. Minimum gap between
    any two discs on the screen is 8px.

## "History" panel
12. Pass list: "this POI / whole route" toggle; each entry shows time and
    "maneuver + side".
13. Every pass has "Delete". A deleted pass stays in the list,
    struck-through, marked "deleted".
14. Passes entered earlier by hand in the spreadsheet are not shown — they
    are corrected in the spreadsheet.

## "Sheet" panel (mailbox connection)
15. Mailbox URL and password (stored on the tablet only), "Test
    connection", "Load from sheet", "Send now".
16. Sync status always visible on the working screen: "All sent /
    N passes waiting for network / No connection". No data is lost
    meanwhile.
17. Theme: system / light / dark.
18. "Erase everything on this tablet" — with confirmation and a
    warning about undelivered passes; the spreadsheet is not touched.

Decided (v0.3): the passenger taps. Step-2 candidates: 3×4 grid (one tap
per pass), "repeat last", GPS/auto-POI from GPX.
