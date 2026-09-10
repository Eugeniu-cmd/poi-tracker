# Screen decision registry

v0.22 — 2026-09-09
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
v0.9 2026-09-05 — sync controls settled: sending stays automatic; the
working-screen status line carries a timestamp and opens Connection for
the active city; "Send now" and "Load from sheet" live on Connection.
v0.10 2026-09-07 — consistency audit applied: item 15 retired (that panel
is Connection, items 25/29/30); timestamp format fixed; POI list rows rise
to the minimum tap target; the error count is shown only when non-zero.
v0.11 2026-09-08 — "Undo last" is driven by the queue, not by POI
progress: only undelivered passes can be rolled back. Text-only states of
the working screen recorded here rather than drawn; a POI in spreadsheet
error gets its own reference screen because its layout changes.
v0.12 2026-09-08 — the error caption on a POI names the two totals that
disagree, taken from the tracker's own status rule (sides vs maneuvers).
v0.13 2026-09-08 — a finished POI that still holds queued passes is
recorded as a text state; the reference shows the clean finished case.
v0.14 2026-09-09 — mini counters are role-coloured chips; zero values
fade. Recorded as the counter rule.
v0.15 2026-09-09 — the active POI row gains an amber tint and a badge
behind its number; History reference built, and a delivered pass deleted
there queues a removal rather than being refused.
v0.16 2026-09-09 — the active POI row keeps its tint and edge but drops
the badge; its number is recoloured instead.
v0.17 2026-09-09 — a deleted pass is shown only while its removal is
queued; once delivered it leaves the list.
v0.18 2026-09-09 — the History sub-header ranks its facts with the chip
language: amber chip for the current POI or route, quiet context for the
rest, neutral chip for a count.
v0.19 2026-09-09 — sides are named alone, without "from"; the History
scope control reads "POI" / "Route"; the dimmed undo control drops its
caption because the sync line beside it already gives the reason; a POI in
error states the mismatch in the error colour.
v0.20 2026-09-09 — undo removes the last pass recorded on this tablet for
the POI, delivered or not; a delivered one is removed by queueing a
removal, exactly as History does. The count in parentheses is dropped.
v0.21 2026-09-15 — undo is live wherever this tablet recorded anything and
its disabled case is text-only; History switches POI from the list beside
the panel; "Load from sheet" is described as the bridge from hand entry.
v0.22 2026-09-09 — a finished POI locks input, not every control: undo and
History stay available. Correction: the v0.21 entry above is dated
2026-09-15 in error; that work was done on 2026-09-09.
-->

The app is one working screen (10.6" tablet, landscape, two columns) plus
two slide-in panels. All UI copy is English.

## Working screen — left
1. Active city and route picker, side by side. The city name is always
   visible so it is obvious which tracker a tap is written into.
2. POI list 1…197: number, progress bar, "N to go". Row turns green at
   70/70, red on error, active POI highlighted.
3. Bottom summary: "Done N · M to go" and the count of finished POIs. The
   error count appears only when it is not zero.

## Working screen — right
4. Large active POI number, "N of 70" counter, small N/S/W/E and ←/↑/→
   counters.
5. Three big round maneuver buttons ← ↑ →; "straight" sits higher than
   its neighbors.
6. Tap a maneuver → four approach sides bloom around that button as a
   compass: N above, S below, W left, E right. Other maneuvers dim
   meanwhile.
7. Tap a side → the pass is recorded as a whole, vibration, toast
   "Saved: ← South · N of 70". Sides hide.
8. "Cancel" is visible only while the compass is open. Tapping the same
   maneuver again also closes it. Auto-close after 12 s — nothing
   recorded, with a notice.
9. "Undo last" removes the whole most recent pass — maneuver and side
   together — that this tablet recorded for the active POI, and can be
   pressed repeatedly. A pass still waiting is dropped from the queue; a
   pass already in the sheet has a removal queued for it, exactly as
   History does.
   The button is dimmed only on a POI this tablet has never written to —
   a one-time state on a route filled in by hand before the app was used.
10. A POI at 70/70 or with a spreadsheet error has its maneuver discs
    locked, with a caption saying why. Input is what stops: "Undo last"
    and "History" stay available, because a miscount is most likely to be
    noticed exactly when the POI closes.
11. The screen stays awake while the app is open.
19. A compass sits in the top-right corner: a fixed ring with a North tick
    and a needle that rotates to the car's heading. Minimum gap between
    any two discs on the screen is 8px.
39. The per-POI mini counters are chips in the disc language at low
    volume: sides on a soft amber tint, maneuvers on a soft dark tint,
    the value bolder than its label. A zero-valued chip fades toward the
    background so only collected sides and maneuvers draw the eye.
40. The active POI row carries an amber tint, a 4px left edge, its number
    in the amber foreground colour and its "N to go" darkened. It must be
    findable with peripheral vision and must not imitate the green done
    row, the red error row, or a control.
43. On a POI in spreadsheet error the line under the counter replaces
    "N to go" and states the mismatch in words. It stays in the ordinary
    muted colour; the red caption beside the locked discs is where the
    error is named, and two red lines in one column compete.

## "History" panel
12. Pass list: "this POI / whole route" toggle; each entry shows time and
    "maneuver + side".
13. Every pass has "Delete". A pass still waiting on the tablet is removed
    outright. A pass already in the sheet stays in the list, struck
    through and labelled "deleted", only until its removal has been
    delivered; then it leaves the list. A line above the list counts the
    removals still queued.
14. Passes entered earlier by hand in the spreadsheet are not shown — they
    are corrected in the spreadsheet.
38. A pass that has already reached the sheet can still be deleted here;
    the removal is queued and sent like any other event. A pass still
    waiting on the tablet is removed outright. Either way the row stays in
    the list, struck through and labelled.
41. The panel's sub-header ranks its facts rather than listing them: the
    POI or route in view sits in an amber chip, the route and city stay
    as quiet context, and a total appears in a neutral chip.
44. The POI list beside the History panel stays live: tapping another POI
    reloads the panel for it without closing. The panel never carries a
    second POI picker.
45. History lists only passes this tablet recorded. Numbers that reached
    the sheet by hand have no individual passes behind them — the sheet
    holds seven totals per POI — so they can be continued from, through
    "Load from sheet", but never listed.

## Connection, sync status and tablet data
16. Sync status is always visible on the working screen and carries a
    timestamp: "All sent · 12:41", "12 passes waiting for network", "No
    connection". Tapping it opens the Connection screen of the active
    city. Nothing is ever lost while it waits.
    Timestamps show the time alone for today and the date with the time
    when older: "All sent · 12:41", "last loaded 04.09 19:20".
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
29. Connection also holds "Send now" and "Load from sheet", with the time
    of the last successful send and the last load. Sending is automatic
    whenever the network is up; the button exists to confirm before a
    shift ends, not to run the sync.
30. "Load from sheet" replaces this city's counts with what the tracker
    currently holds. It warns first when passes are still waiting to be
    sent, because loading before sending would discard them.

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
31. Every control is at least var(--tap-min) tall, list rows included. A
    POI row is a tap target: a mis-tap writes a pass into the wrong POI,
    and that error surfaces only when reconciling with the client.
42. Item 27 has one exception: a control may drop its caption when the
    reason is already stated beside it.

## Working-screen states not drawn as separate reference screens
32. Empty POI: counters read "0 of 70" and "70 to go", all mini counters
    zero, the discs are live. Nothing else differs.
33. Passes waiting: the sync control reads "N passes waiting for network"
    with the dot in the warning colour. Everything else is unchanged.
34. No connection: the sync control reads "No connection" with the dot in
    the muted colour. Nothing is lost meanwhile.
35. No routes yet in this city: the route picker reads "No routes yet",
    the POI list is replaced by a single line "Add routes in Settings",
    and the discs are dimmed and inert.
36. A pass has just been recorded: a toast appears over the working area
    for about two seconds, reading "Saved: ← from South · 57 of 70", then
    fades. The screen beneath does not move.
37. A finished POI whose passes have not all been sent: the discs stay
    locked with their "This POI is done" caption, while "Undo last (N)"
    stays live, because undo follows the queue and not the POI's progress.
    The sync control reads "N passes waiting for network".
   These states change a line of text or a colour, never the layout, and
   so are specified here rather than drawn.

Decided (v0.3): the passenger taps. Step-2 candidates: 3×4 grid (one tap
per pass), "repeat last", GPS/auto-POI from GPX.
