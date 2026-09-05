# Screen decision registry

v0.8 — 2026-09-05
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
v0.6 2026-09-05 — Settings gains a city list (name, mailbox, password,
routes); the working screen shows the active city beside the route picker;
routes are typed in by hand as code + POI count.
v0.7 2026-09-05 — the city screen keeps only the city name and its routes;
connection details move to their own screen behind a status row. UI wording:
"Connection", "Script URL", "Access key" — the word "Mailbox" stays out of
the interface.
v0.8 2026-09-05 — control-state rule recorded: colour carries the role,
opacity carries the state; unavailable controls keep their colour, dim,
and say why.
-->

The app is one working screen (10.6" tablet, landscape, two columns) plus
two slide-in panels. All UI copy is English.

## Working screen — left
1. Active city and route picker, side by side. The city name is always
   visible so it is obvious which tracker a tap is written into.
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

## "Settings" panel — cities and routes
20. A list of cities. Each row: city name, how many routes it holds, and
    whether its mailbox is configured. Tapping a row opens that city.
21. City screen: the city name and that city's list of routes. A single
    "Connection" row shows the status (connected / not set) and opens the
    connection screen. A "Delete city" control sits at the bottom.
22. Route editor inside a city: route code (must match the sheet name in
    that city's tracker) and POI count. Passes per POI is fixed at 70 and
    is not editable.
23. Adding a city or a route never touches any spreadsheet; the tracker
    for a new city is created by the user in Google Sheets first.
24. Deleting a city warns that its queued, undelivered passes will be lost
    and asks for confirmation. Deleting a route is refused while that
    route holds undelivered passes.
25. Connection screen, one per city: "Script URL" (the address Apps Script
    returns after deployment) and "Access key" (masked), with the hint
    that both are stored on this tablet only, plus "Test connection" and
    "Save". The word "Mailbox" never appears in the interface.

## Control states (applies to every screen)
26. A control that is unavailable keeps its normal colour and is dimmed,
    never recoloured and never hidden. A recoloured control is no longer
    recognisable as the same action; a hidden one makes the screen jump
    and leaves the reason unexplained.
27. Whenever a control is unavailable, a caption next to it names the
    reason in the user's terms — "32 passes not yet sent", "This POI is
    done: 70 of 70" — not a generic disabled state.
28. Destructive controls are red wherever they appear, available or not,
    and sit apart from the controls used routinely.

Decided (v0.3): the passenger taps. Step-2 candidates: 3×4 grid (one tap
per pass), "repeat last", GPS/auto-POI from GPX.
