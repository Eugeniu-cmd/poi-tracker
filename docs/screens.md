# Screen decision registry

v0.30 — 2026-10-09
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
v0.23 2026-09-12 — consistency audit applied: item 12 takes the "POI" /
"Route" wording of v0.19; item 36 names the side alone; item 37 drops
the count in parentheses and follows the v0.20 undo rule.
v0.24 2026-10-03 — targets per POI: 70 / 40 / 0 by type, set from the POI
list on the working screen; done, lock and counters follow the target
(items 2, 4, 10, 22, 46). Sync decisions recorded: "Load from sheet" per
route and without discarding (item 30); deleted rows per item 13 (item
38); rejected events (item 47); History limit (item 48).
v0.25 2026-10-05 — screen size and layout rule recorded from a
measurement of the user's tablet (tools/viewport.html): measured sizes,
supported devices and minimum size, layout chosen by available width,
fixed element sizes, the bottom gesture area and rubber references
(items 49 to 54). The intro line no longer pins the app to landscape and
two columns.
v0.26 2026-10-06 — layout decisions taken on the portrait drawings.
Portrait is primary. The POI list stays a column beside the discs in both
layouts, narrow in portrait, with an index rail, a mini-map and a grid of
all POIs. The POI type is set from the counter of the active POI (items
46, 51, 55 to 61). Correction to v0.25: below 1000px the layout keeps the
POI column, only narrower, instead of a single column (item 51).
v0.27 2026-10-06 — decisions taken on the working prototype tested in the
car. Six POI types with their maneuver splits. A maneuver the type does
not allow, or one whose share of the split is full, takes no more passes
(items 39, 46). "Closed" is renamed "Not drivable", because "Closed"
read like "done" (items 2, 4, 46, 58, 64). The type is shown and set by
a type pill under the POI number, and the counter loses its chevron
(items 4, 60). The row of chips becomes the "Still needed" card with the
sides driven so far (item 39). The discs keep their height, the tapped
disc moves to the centre and the sides bloom around it (items 5, 6). A
chime, a bounce of the tapped side and of the counter on every pass, and
a sound switch in Settings (items 7, 62, 65). Removing a pass and a type
change with consequences ask in a dialog (items 9, 13, 63, 64). Values
from the user's spreadsheet are described in English in the interface,
never quoted (intro).
v0.28 2026-10-06 — canon. Overlays close with a round ✕ in their top-left
corner, a tap on the dimmed background, or the Android back gesture
(items 59, 66). Size C recorded with its values (item 67). Every visual
value of the app screen comes from _tokens.css, no literals (item 68).
The city name is as large as the route code (item 1).
v0.29 2026-10-09 — fixes from the pixel audit of main-screen v0.18 and
the user's review. Icons are Lucide only, one symbol per maneuver
everywhere (item 69). The column is wide from 1200px, and a landscape
screen puts the discs beside the number and the card (item 51). The open
compass may rise over the "Still needed" card on a short screen
(item 6). The rail bubble sits inside the column (item 57). The mini-map
is the column's header and the list shows whole rows at its top (items
56, 58). Both menus mark the current choice with a check (item 60). "Add
routes in Settings" is a button (item 35).
v0.30 2026-10-09 — fixes from the audit of main-screen v0.19. Each
maneuver keeps its own place in the type icon (item 60). The active row
keeps its amber tint and edge in every state (item 40). With no routes,
a caption under the discs names the reason (item 35).
-->

The app is one working screen plus two slide-in panels, on a tablet held
either way. Its size and layout follow "Screen size, orientation and
layout" below. All UI copy is English, values from the user's spreadsheet
included: the interface describes such a value in English and never quotes
it ("The sheet will flag it as over target", not the sheet's own word).

## Screen size, orientation and layout (applies to every screen)
49. The user's tablet, measured on 2026-10-05 with tools/viewport.html:
    2000 × 1200 physical pixels at a device pixel ratio of 1.5, which is
    1333 × 800 CSS px in landscape and 800 × 1333 in portrait. In a
    Chrome tab the browser bars take about 120px at the top, leaving
    1333 × 680 and 800 × 1213. Android's "Display size" setting changes
    these numbers, so the tablet is measured again if it ever changes.
50. Any tablet is supported, phones are not. The smallest visible area
    the app guarantees is 1000 × 600 in landscape and 720 × 1000 in
    portrait, browser tab included. Below that the app still opens, but
    nothing is promised.
51. The layout follows the space the app actually has, not the way the
    tablet is held. The POI list is always a column beside the main area
    (item 56): from 1200px wide the column is wide (--col-wide), below
    1200px it is narrow (--col-narrow). The main area follows the shape
    of the app. When it is wider than tall, the number, the type pill and
    the "Still needed" card stand on the left, the discs and the action
    bar on the right. When it is taller than wide, they stack as items 4
    and 5 describe. On the user's tablet that gives the wide column with
    the side-by-side main area in landscape and the narrow column with
    the stack in portrait. 1200px is also where Google's large window
    class begins. At the 1000 × 600 minimum nothing is clipped. The
    layout switches live when the tablet turns and loses nothing: an open
    compass, the active POI and an open panel stay as they were. A
    compact layout for split screen (about 660px wide) may come later as
    one more width step, without changing the two layouts.
52. Discs, the compass, text sizes and tap targets keep their size in px
    on every screen. A larger screen shows more, not bigger: extra space
    goes into the length of lists (more POI rows at once) and into the
    gaps between blocks. Nothing is scaled as a whole.
53. The bottom edge of the screen is shared with the system: on Android a
    sideways swipe along the bottom handle switches apps. Nothing
    tappable or swipeable sits inside that area. Its height is taken from
    the browser (the safe-area inset), never typed in as a guess.
54. References are rubber. Each reference page shows the app screen in a
    frame whose size can change: preset buttons for 1333 × 800,
    1000 × 600, 800 × 1333 and 720 × 1000, plus a frame corner the mouse
    can drag. The layout inside reacts to the frame's size with the same
    rules the app will use (CSS container queries). A reference is drawn
    at the user's full screen and checked at the minimum sizes. The frame
    and its buttons are a checking tool and never appear in the app.
   The references drawn before v0.25 (main-screen.html v0.17,
   settings.html v0.8, history.html v0.7) are still fixed 1000 × 600
   pictures. Their meta lines describe the frame they were drawn at and
   stay until each reference is redrawn.

## Canon (applies to every screen)
67. Size C is the app's size, chosen on the user's tablet on 2026-10-06
    out of three drawn sizes: tap targets 56px, POI rows 66px, the narrow
    POI column 208px, text 14 / 17 / 19px, POI numbers in the column
    23px, titles 26px, the big POI number 92px, a block gap of 18px,
    maneuver discs 118px and side discs 92px set 124px from the centre.
    The values live in docs/references/_tokens.css (v0.6), and item 52
    keeps them fixed on every screen.
68. Every colour, font size and weight, size, spacing, radius, opacity,
    shadow and motion value of the app screen comes from
    docs/references/_tokens.css through var(). A value the canon lacks is
    first added to _tokens.css by a dedicated decision, then used. This
    holds for every reference and later for app/index.html. Plain zero,
    1px hairlines, 50% for round shapes and percentages of a layout are
    not canon values and may stay literal. The page chrome of a reference
    around the app frame (titles, notes, the checking tool) is exempt.
    Every reference prompt checks it: no other literal colour, size or
    spacing inside the app frame.
69. Icons are Lucide icons only (CLAUDE.md rule 10), their path data
    copied verbatim, at stroke-width 2.6. One symbol stands for each
    maneuver everywhere in the app: Lucide corner-up-left for Left,
    move-up for Straight and corner-up-right for Right, on the discs, in
    the type icon, in the "Still needed" card, in split lines, dialogs
    and toasts. A text arrow (←, ↑, →, ›) never stands in for an icon.
    Manrope draws ↑ but not ← or →, so text arrows would mix two fonts.
    An arrow written in this document stands for the Lucide icon of that
    maneuver. Not drivable uses Lucide ban, the current menu choice
    Lucide check, closing Lucide x, menus and links Lucide chevrons. The
    live compass of item 19 is a drawn widget, not an icon.

## POI column, mini-map and grid (applies to both layouts)
55. The portrait layout is the primary one. The user works with the
    tablet upright, so portrait is designed first and wins when the two
    layouts conflict. Landscape stays fully supported (item 51).
56. The POI list of item 2 is always a column on the left, beside the
    main area that holds the POI number, the counters, the discs and the
    action bar. In portrait the column is narrow (--col-narrow, item 67).
    Every row keeps the minimum tap height (item 31). The list shows
    whole rows at its top edge and fades the cut row at its bottom edge,
    so no sliver of a row ever sits under the mini-map. Nothing about
    choosing a POI ever moves the discs.
57. An index rail runs along the right edge of the column, marked from 1
    to the route's POI count. Sliding a finger along it scrolls the
    column to that part of the route and shows the number under the
    finger in a bubble. The bubble sits inside the column, over the rows
    just left of the rail and level with the finger, so it never covers
    the main area. The rail's touch area also takes in the gap beside the
    column. The POI is then chosen by tapping its row: the rail scrolls,
    it never selects.
58. A mini-map of the route sits at the top of the column in both
    layouts: one small square per POI, coloured by state (current, done,
    in progress, spreadsheet error, not drivable), with the number of finished
    POIs and the word "Open". It is the column's header, not a card
    inside the column: the squares and the caption share one width and
    keep at least 12px from the column's edges, and a hairline divides
    the header from the rows. It works for any POI count (item 22). How
    it scales for a small or a large count is settled when the reference
    is drawn.
59. Tapping the mini-map opens a grid of all POIs of the route over the
    whole screen, ten to a row, coloured like the mini-map, with a
    legend. Tapping a tile makes that POI active, closes the grid and
    scrolls the column to it. The ✕ of item 66 or a tap outside the grid
    closes it and changes nothing.
60. The POI type of item 46 is shown and set by the type pill, a
    full-width control under the big POI number: an icon, the type name
    and its passes with the split ("70 passes · ← 28 · ↑ 14 · → 28"). The
    icon shows the allowed maneuvers, not the shape of the road: their
    icons of item 69 side by side in the order left, straight, right, in
    a tile wide enough for three, so the type name starts at the same
    place for every type. Each maneuver keeps its own place in the tile:
    an absent one leaves its place empty instead of shifting the others,
    so the tiles read as a map of the maneuvers. Tapping the pill opens
    a menu with the six types, each with its icon and split, the current
    one marked with a check, as the route menu marks the active route.
    The menu changes the active POI only. Two taps are deliberate: a
    stray touch while driving cannot change a type. A change with
    consequences for passes already recorded asks first (item 64). The
    counter beside the number carries no chevron.
61. In portrait the History panel covers the main area while the POI
    column stays live beside it, so item 44 holds unchanged. The compass
    keeps its place at the top right of the main area in both layouts
    (item 19).

## Working screen — left
1. Active city and route picker, side by side. The city name is always
   visible so it is obvious which tracker a tap is written into. It is as
   large as the route code, bold, in the ink colour.
2. POI list 1…N for the route's POI count: number, progress bar, "N to
   go". Row turns green at its target, red on error, not-drivable POI in a
   state of its own (item 46), active POI highlighted.
3. Bottom summary: "Done N · M to go" and the count of finished POIs. The
   error count appears only when it is not zero.

## Working screen — right
4. Large active POI number with the "N of T" counter beside it, where T
   is the POI's target (70 or 40, a not-drivable POI reads "Not
   drivable"), and "N to go" under the counter. Below them, one ordinary
   gap apart, come the type pill (item 60) and then the "Still needed"
   card (item 39).
5. Three big round maneuver buttons ← ↑ →, "straight" higher than its
   neighbors. They sit in the middle of the free space under the "Still
   needed" card, close to the passenger's hand, and keep that height. A
   caption about them (items 10 and 46) sits under the discs and never
   moves them.
6. Tap a maneuver → that disc slides to the centre of the disc area, the
   other two fade out of the way, and the four approach sides bloom
   around it as a compass: N above, S below, W left, E right. No side
   ever reaches the screen edge, covers the POI column or comes closer
   than 8px to the action bar. On a screen too short for the open
   compass, it rises over the bottom of the "Still needed" card instead,
   since the card takes no taps. When the compass closes, the disc
   slides back to its place.
7. Tap a side → the pass is recorded as a whole: a short rising chime,
   vibration, the tapped side bounces, the "N of T" counter bounces in
   place, and the toast of item 36 appears ("Saved: ← South · N of T").
   Then the sides hide and the disc slides back. Sound and motion follow
   item 62.
8. "Cancel" is visible only while the compass is open. Tapping the same
   maneuver again also closes it. Auto-close after 12 s — nothing
   recorded, with a notice.
9. "Undo last" removes the whole most recent pass (maneuver and side
   together) that this tablet recorded for the active POI, and can be
   pressed repeatedly. Each press asks first (item 63). A pass still
   waiting is dropped from the queue. A pass already in the sheet has a
   removal queued for it, exactly as History does.
   The button is dimmed only on a POI this tablet has never written to —
   a one-time state on a route filled in by hand before the app was used.
10. A POI that has reached its target, or has a spreadsheet error, has
    its maneuver discs locked, with a caption saying why. Input is what
    stops: "Undo last" and "History" stay available, because a miscount
    is most likely to be noticed exactly when the POI closes.
11. The screen stays awake while the app is open.
19. A compass sits in the top-right corner: a fixed ring with a North tick
    and a needle that rotates to the car's heading. Minimum gap between
    any two discs on the screen is 8px.
39. The per-POI mini counters live in the "Still needed" card under the
    type pill. Its top row shows, per maneuver, what is still needed
    against the split of the POI's type (item 46): a large "12 more", a
    bar, and "16 of 28" under it. A maneuver whose share is full shows
    "Done" in the done colour, and its disc locks (item 46). A count past
    the share, possible only from numbers typed into the sheet or from a
    type change, shows "+3 over" in the warning colour. A maneuver the
    type does not allow shows a dash. The bottom row, "Sides so far",
    shows the four approach sides driven, on the soft amber side tint, as
    plain counts, because sides have no split. A zero value fades toward
    the background. The card carries no separate "balance" line, since
    the split already shows in the type pill and in the card itself.
40. The active POI row carries an amber tint, a 4px left edge, its number
    in the amber foreground colour and its "N to go" darkened. It must be
    findable with peripheral vision and must not imitate the green done
    row, the red error row, or a control. The tint and the edge stay
    amber in every state. An active row that is done or in error shows
    that state in the colour of its number, text and bar.
43. On a POI in spreadsheet error the line under the counter replaces
    "N to go" and states the mismatch in words. It stays in the ordinary
    muted colour; the red caption beside the locked discs is where the
    error is named, and two red lines in one column compete.
46. Every POI has one of six types. The passenger sets it for the active
    POI from the type pill (item 60), looking at the intersection,
    without leaving the screen. The type fixes the target and the
    maneuvers that are possible, with the split the crew drives (field
    rule, 2026-10-06):
    - Intersection: Left 28, Straight 14, Right 28 (70 passes).
    - No straight: Left 35, Right 35 (70).
    - No left: Straight 14, Right 56 (70).
    - No right: Left 56, Straight 14 (70).
    - Straight only: Straight 40 (40). A POI on a straight road, or an
      intersection where only Straight is possible. Usually 20 from each
      direction, the side split is not tracked.
    - Not drivable: not counted (0). A POI that cannot be driven at all
      (private property, a road closed for good). Not called "Closed",
      which reads like "done".
    The split is a hard limit. A maneuver the type does not allow, and a
    maneuver whose share is full, has its disc dimmed (item 26) with a
    caption under the discs ("No left turn at this POI", "Left is done:
    28 of 28") and takes no more passes. Undo last or Delete frees a full
    share again. If a share cannot be reached in the field, the type is
    changed instead. Approach sides have no limit. A not-drivable POI has
    its discs locked at once with a caption, is never counted among POIs
    "to go", and must read as neither done nor in error. New POIs start
    as Intersection. "Only Left" and "only Right" are not types: they are
    too rare to add.
62. Sound and motion. Recording a pass plays a short rising two-note
    chime, removing one (Undo last, Delete) a short falling one. The
    tapped side bounces: a brief elastic scale that returns to rest,
    Apple's "bounce" (SF Symbols), the motion that says an action
    happened. The "N of T" counter bounces in place with it, and nothing
    pops up over the POI number. The sides bloom out of the chosen disc
    when the compass opens. All motion is skipped while the tablet's
    "reduce motion" accessibility setting is on. Sound can be switched
    off in Settings (item 65).
64. A type can be changed at any time, also on a POI that already has
    passes. The change applies at once when it has no consequence: on an
    empty POI, upward from 40 to 70, or when no recorded pass conflicts
    with the new type. Otherwise it asks first (item 63), and the dialog
    states the consequence in plain words:
    - Passes over the new target: "It already has 66 passes. Straight
      only needs 40, so the POI becomes done with 26 passes over its
      target. The sheet will flag it as over target."
    - Passes on a POI turned Not drivable: they stay in the sheet, and the
      app stops counting the POI.
    - Passes of a maneuver the new type does not allow: they stay in the
      sheet and can be deleted in History if they were a mistake.
    A POI over its target reads "Done · 26 over target" under its
    counter, and "done +26" in its row.

## "History" panel
12. Pass list: "POI" / "Route" scope control; each entry shows time and
    "maneuver + side".
13. Every pass has "Delete", which asks first (item 63). A pass still
    waiting on the tablet is removed outright. A pass already in the
    sheet stays in the list, struck through and labelled "deleted", only
    until its removal has been delivered. Then it leaves the list. A line
    above the list counts the removals still queued.
14. Passes entered earlier by hand in the spreadsheet are not shown — they
    are corrected in the spreadsheet.
38. A pass that has already reached the sheet can still be deleted here;
    the removal is queued and sent like any other event. A pass still
    waiting on the tablet is removed outright and leaves the list at
    once. The struck-through row of item 13 is for delivered passes
    only.
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
47. An event the mailbox refused stays on the tablet as "rejected", with
    the mailbox's reason. History shows it in its row, and the working
    screen's sync control counts rejected events alongside waiting ones.
    Exact wording and look are still to be drawn.
48. History holds the newest 3,000 events this tablet recorded. Older
    delivered events drop off the list; nothing still waiting is ever
    dropped, whatever its age.

## Connection, sync status and tablet data
16. Sync status is always visible on the working screen and carries a
    timestamp: "All sent · 12:41", "12 passes waiting for network", "No
    connection". Tapping it opens the Connection screen of the active
    city. Nothing is ever lost while it waits.
    Timestamps show the time alone for today and the date with the time
    when older: "All sent · 12:41", "last loaded 04.09 19:20".
17. Theme: system / light / dark.
65. Sound: on / off, on by default. It silences the chimes of item 62
    only. Vibration and motion do not change.
18. "Erase everything on this tablet" — with confirmation and a
    warning about undelivered passes; the spreadsheet is not touched.

## "Settings" panel — cities and routes
20. A list of cities. Each row: city name, how many routes it holds, and
    whether its mailbox is configured. Tapping a row opens that city.
21. City screen: the city name and that city's list of routes. A single
    "Connection" row shows the status (connected / not set) and opens the
    connection screen. A "Delete city" control sits at the bottom.
22. Route editor inside a city: route code (must match the sheet name in
    that city's tracker) and POI count. The target per POI is not set
    here; it is set per POI from the working screen (item 46).
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
30. "Load from sheet" replaces the active route's counts and targets with
    what the tracker currently holds. Passes still waiting on the tablet
    are kept and sent as usual: they are not in the sheet yet, so the
    loaded numbers plus the waiting passes are exactly right.

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
63. Removing a pass (Undo last, item 9, and Delete, item 13) and a type
    change with consequences (item 64) ask first, on the pattern Apple
    and Google share. A dialog sits in the middle of the screen over a
    dimmed background. Its title names the action: "Remove the last
    pass?", "Delete this pass?", "Change POI 122 to Straight only?". A
    removal shows the pass itself (POI, maneuver, side, time) and one
    line on what happens: a waiting pass is simply dropped from this
    tablet, a pass already in the sheet gets a removal sent with the
    next sync. Two buttons side by side: "Cancel" on the left, the action
    as a verb on the right ("Remove", "Delete", "Change"), never "OK" or
    "Yes". A removing button is red (item 28). A type change button keeps
    the ordinary dark style, since nothing is deleted. A tap outside the
    dialog equals Cancel. There is no "don't ask again".
66. An overlay that covers the screen or the main area (the grid of all
    POIs, History, Settings) closes with a round ✕ button in its top-left
    corner, as large as any tap target (item 31). There is no text
    "Close": Apple's rule is the standard close symbol without a text
    label, in the top-left corner. Where a dimmed background surrounds
    the overlay, a tap on it closes the overlay too. The Android back
    gesture closes the topmost open overlay instead of leaving the app.
    Menus (type, route) close by a choice or a tap outside. Confirmation
    dialogs keep "Cancel" (item 63).

## Working-screen states not drawn as separate reference screens
32. Empty POI: counters read "0 of 70" and "70 to go", all mini counters
    zero, the discs are live. Nothing else differs.
33. Passes waiting: the sync control reads "N passes waiting for network"
    with the dot in the warning colour. Everything else is unchanged.
34. No connection: the sync control reads "No connection" with the dot in
    the muted colour. Nothing is lost meanwhile.
35. No routes yet in this city: the route picker reads "No routes yet",
    the POI list is replaced by a single button "Add routes in Settings"
    that opens Settings, and the discs are dimmed and inert, with the
    caption "Add a route to start" under them (item 27).
36. A pass has just been recorded: a toast appears over the working area
    for about two seconds, reading "Saved: ← South · 57 of 70", then
    fades. The screen beneath does not move.
37. A finished POI whose passes have not all been sent: the discs stay
    locked with their "This POI is done" caption, while "Undo last" stays
    live, because undo follows what this tablet recorded, not the POI's
    progress. The sync control reads "N passes waiting for network".
   These states change a line of text or a colour, never the layout, and
   so are specified here rather than drawn.

Decided (v0.3): the passenger taps. Step-2 candidates: 3×4 grid (one tap
per pass), "repeat last", GPS/auto-POI from GPX.
