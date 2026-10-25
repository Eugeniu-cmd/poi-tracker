# Screen decision registry

v0.55 — 2026-10-25
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
v0.31 2026-10-09 — decisions from the user's review of main-screen
v0.20. Straight is Lucide arrow-up, from the same Feather family as the
turn arrows, because move-up looked thinner than its neighbours (item
69). In landscape the action bar runs under the whole main area and holds
the summary (items 3, 51). A short screen gets a compact step: smaller
display numbers and a one-line button instead of the mini-map, while
discs and tap targets keep their size (items 52, 58, 70). An open menu
closes when the screen turns (item 66).
v0.32 2026-10-09 — the user's review of main-screen v0.21: at 1000 × 600
the "Still needed" card and the type pill had no air. In landscape the
compact step narrows the margins and gaps and draws the closed side discs
8px nearer, so the card keeps its normal paddings (item 70). Each "Still
needed" tile drops its "16 of 28" line, which repeated what "12 more" and
the bar already say, while the type pill shows the split (item 39).
v0.33 2026-10-11 — the user's review of main-screen v0.22: at 1333 × 800
the "Still needed" card looked small and flat beside the discs. On a tall
landscape screen the card steps up one size, the mirror of the compact
step, and item 52 now names two exceptions (items 52, 71).
v0.34 2026-10-11 — the user's decision before History is redrawn: a pass
the mailbox refused offers "Send again" and "Delete" in its History row
(item 47).
v0.35 2026-10-11 — the user's review of main-screen v0.23: the compass
is redrawn with its four letters, a red N and a two-colour needle, grows
to 128px, 144px on a tall landscape screen, and sits in the same place
with the same air in both layouts (item 19). Items 52, 70 and 71 now
name the compass's own sizes. Whether the dial stays fixed or turns is
tested in the car with tools/compass-prototype.html.
v0.36 2026-10-12 — the user's decisions after the working prototype
v17: the sync control opens a small Sync panel under itself, as the type
menu opens under the pill, and "Send now" and "Load from sheet" move
there from the Connection screen (items 16, 29, 66, 72). A city without
a connection reads "Connection not set up" (item 34). A pass already in
the sheet whose removal still waits reads "Removal waiting" with the
warning-colour dot of a waiting pass, because "deleted" read as done
(item 13).
v0.37 2026-10-12 — the user's decisions on Settings: a gear at the right
end of the top bar opens it (item 73). Settings is a sheet over the
screen, one column that drills down in portrait and the list beside the
page in landscape (item 74). A city is put in use with "Use this city"
on its page (item 21). A route has its own page and loads from the sheet
right after "Add route", which also checks its code (item 22). Erasing
the tablet and deleting a city name the passes they would lose on the
red button (items 18, 24). A new city starts from its name (item 75),
and a tablet without a city shows "Add your first city" (item 76). A tap
outside an open menu only closes it (item 66).
v0.38 2026-10-13 — the user approved the twelve wording proposals of
history.html: the states of a pass row, the right-aligned time, the
sync control's words for a removal and a refused pass, the reason
lines of a refused event, the empty list and the end of the list
(items 12, 33, 45, 47, 48). A missing route or POI row names the tab,
as Settings does.
v0.39 2026-10-13 — the consistency audit and the user's six decisions.
A pass keeps the route and POI it was recorded with, so a missing tab or
POI row is fixed in the sheet, and a checked route keeps its code while
its changes wait or were refused. A route not checked yet keeps its code
editable, and its waiting changes move to the new code (items 22, 24,
47). Nothing waiting or not accepted ever leaves History, and its limit
of 3,000 counts passes and removals only (item 48). A refused removal
and a type change have rows of their own in History, and the sync
control has words for both (items 12, 13, 33, 47, 72). A rejected
access key has a state of its own (items 16, 20, 21, 25, 72). A load
leaves alone a type change that waits or was refused (item 30). Undo
last skips a pass that History is handling (item 9). The interface says
"sheet", never "tracker" (intro). Also fixed from the audit: this
header, the intro's panels, items 18, 32, 46, 54, 61, 63, 67, 70 and
the note under the states not drawn.
v0.40 2026-10-13 — mailbox v1.4: a second removal of the same pass is
refused as already-removed, with its own reason line (item 47).
v0.41 2026-10-17 — the compass redesign after the car tests of
prototype v19.1. The compass is one arrow on a raised round face, its
left half --disc like the maneuver discs and its right half --side like
the side discs. No tail, no red and no blue. The dial stays fixed with
N up, so the test of a turning dial is closed. The arrow stays pale
while there is no heading (item 19).
v0.42 2026-10-18 — the user's decision on the compass: with no heading
yet the dial shows no arrow, so a pale arrow never points north when
nothing is known. With only a last known course the arrow stays pale
(item 19).
v0.43 2026-10-18 — the user's rule for the side of a pass: the direction
the car drives as it enters the intersection, so driving north and
turning right is North Right. The passenger reads it from the arrow
before the turn. v0.41 had it the other way round (item 19).
v0.44 2026-10-18 — the user's decisions on the POI states and the
dialog buttons. In the grid of all POIs and the mini-map the three grey
states blended, worst under sun glare. A POI in progress is now blue,
and done, sheet error and not drivable carry a sign besides their
colour (items 2, 58, 59, 69). Dialog buttons and the Settings buttons
take the size of the action bar's buttons, and a red button that loses
passes reads "Erase anyway" or "Delete anyway" (items 18, 24, 63).
v0.45 2026-10-18 — the user's decision on the compass: the arrow is
always on the dial. With no heading yet it shows the course the tablet
saved last, pale, or north, pale, when nothing is saved. v0.42 hid it,
and the dial looked broken at every start (item 19).
v0.46 2026-10-18 — the user's decision on the colour of a POI in
progress: the blue was too loud, since about half of a route is in
progress at mid-route. A POI in progress is grey with a dark bar.
White still means not started, stripes not drivable, a check done
(items 2, 58, 59).
v0.47 2026-10-18 — the user's decision after a look at the tablet:
the numbers of the type pill, its passes and its split, are larger
and amber, --t-label heavy in --warn, still smaller than the card's
counts (item 60).
v0.48 2026-10-19 — the inventory before chapter 6 (project doc
claude/chapter-6-inventory.md): the user's decisions on the wording
the documents lacked. Undo dimmed with "Nothing to undo" (item 9), the
connection state over the waiting count (item 34), the empty History
states (item 45), item 64's test and its sentences, the toasts of item
36, the 12 s notice (item 8), the over-share caption (item 46), the
3,000 line (item 48), the queue line's scope (item 13), the neutral chip
(item 41), the grid over History (item 44), the second tap (item 7),
the chime notes (item 62), the wake lock (item 11), the back gesture
(item 66), controls of a later build (item 77), a full storage (item
78). Offline loading and install (data-model.md v0.16).
v0.49 2026-10-21 — the user's decisions on the gold, from mock-ups of
the app. Metallic gold #D4AF37 replaces the amber everywhere it marked
the sides, the active POI, the current tile and the gold numbers, with
a darker gold for text on light (_tokens.css v0.16). The arrows on the
maneuver discs and on the type tile are gold, and a disc that can be
tapped wears a gold ring (items 5, 60). The compass letter N is gold,
outlined in dark gold on light (item 19). Items 39, 40, 41, 58 and 59
say gold where they said amber.
v0.50 2026-10-21 — the user's decisions after a look at the app. A
tapped side no longer bounces: it dips while a gold ring leaves it, and
it keeps its place (items 7, 62). The bounce made it jump 8 px up and
left, a centring fault fixed in the references. A compass with no
heading draws its arrow as a dashed outline without fill (item 19). The
"Change" of a type change dialog is red (item 63).
v0.51 2026-10-22 — the user's decisions on the "Still needed" card, the
type pill, one gold and plain numbers. The card, headed "TO GO", shows
the maneuvers as gold progress rings in a pyramid and the sides as a
rose of four diamonds with no heading, both on one centre line (item
39). It sizes its rings and rose by its own width, so the compact step
no longer shrinks its values and the roomy card keeps only its padding
and heading (items 70, 71). The type pill's numbers are in ink, like the
screen's other numbers, and its button reads "Change type" (item 60).
Every maneuver arrow, the ring of a disc, the fill of the card's rings
and the bar of a POI in progress share one gold, #A37F22 (items 2, 5,
59). The card's head shows the last pass of the active POI, "LAST"
(item 39). The type pill and the type menu show no passes, and the
pill centres its name and split between its tile and "Change type"
(item 60).
Item 68 lists the plain numbers that may stay literal, as CLAUDE.md rule
9 does.
v0.52 2026-10-22 — the one gold of item 5 is lighter, #CCA735, chosen on
whole screens. It reads at 2.1:1 on the light card and on the light
discs of the dark theme (the user's choice).
v0.53 2026-10-23 — decision D1 (the type change audit of 2026-10-23): a
POI is done when every ring is closed. The counter counts the passes
that fit the type, "to go" is the sum of the rings' "more", and passes
that do not fit are "to fix" on the head, the row, the grid and the
summary until they are deleted on the tablet or in the sheet (items 3,
4, 39, 40, 46, 59, 64). The type change dialog says that the sheet
keeps such passes and the export sends them, and offers to delete this
tablet's own (items 63, 64). The type toast carries Undo for six
seconds (item 36). A waiting removal can be cancelled (items 12, 13).
Undo last takes a pass whatever its maneuver (item 9). The over ring's
plus is half size and its number a step smaller, centred (item 39).
v0.54 2026-10-25 — the user's five decisions from mock-ups of the app
(the type change audit of 2026-10-23, "Decisions taken"). The over
ring's plus is as big as the digits and on their middle line, so "+26"
reads as one number. The card at scale 3: the rings keep their size in
columns of --card-col, Straight sits --card-rise rings above Left and
Right, the diamonds grow to the rings' height, and the equal space
before, between and after the pyramid and the rose is measured on the
drawn shapes (item 39, _tokens.css v0.21). Decision D2: on a Straight
only POI each side shows its passes against 20, in the done colour at
exactly 20 and as "+3 over" past it, nothing locks, and the POI is done
at Straight 40 whatever its sides (items 39, 46). Decision D3: a Not
drivable POI with passes reads "66 passes to fix in the sheet" under its
locked discs. One caption shows under the discs at a time, the most
urgent that applies, from a sheet error down to a maneuver the type does
not allow (item 46).
v0.55 2026-10-25 — the user's decisions on the app colours, from twelve
whole screens of the app: emerald with a warm yellow gold (item 68), the
arrows on the ivory discs of the dark theme in a deep gold while the
icons on the card keep the bright gold through the new --card-glyph
(item 5, _tokens.css v0.22), and a side ten or more past 20 reading
"+16" alone (item 39).
-->

The app is one working screen, on a tablet held either way. History
covers its main area (item 61), Settings and the grid of all POIs cover
the whole screen (items 59, 74), and the type, route and Sync menus open
under their controls (items 60, 66, 72). Its size and layout follow
"Screen size, orientation and layout" below. All UI copy is English,
values from the user's spreadsheet included: the interface describes
such a value in English and never quotes it ("The sheet will flag it as
over target", not the sheet's own word).
Words on screen: "sheet" is the city's Google Sheets file, which these
documents call the tracker ("in the sheet", "Vienna’s sheet", "Load from
sheet"). A "tab" is one route's page in it ("No tab named R20890-602").
A "change" is a pass, a removal or a type change ("2 changes not
accepted"). The word "tracker" stays in these documents and never
appears on screen. An apostrophe on screen is the typographic one (’).

## Screen size, orientation and layout (applies to every screen)
49. The user's tablet, measured on 2026-10-05 with tools/viewport.html:
    2000 × 1200 physical pixels at a device pixel ratio of 1.5, which is
    1333 × 800 CSS px in landscape and 800 × 1333 in portrait. In a
    Chrome tab the browser bars take about 120px at the top, leaving
    1333 × 680 and 800 × 1213. Android's "Display size" setting changes
    these numbers, so the tablet is measured again if it ever changes.
    Installed from its manifest the app runs standalone, without the
    browser bars and with the system's status bar kept, so the clock and
    the battery stay in view. Its insets are measured in that mode
    (item 53).
50. Any tablet is supported, phones are not. The smallest visible area
    the app guarantees is 1000 × 600 in landscape and 720 × 1000 in
    portrait, browser tab included. Below that the app still opens, but
    nothing is promised.
51. The layout follows the space the app actually has, not the way the
    tablet is held. The POI list is always a column beside the main area
    (item 56): from 1200px wide the column is wide (--col-wide), below
    1200px it is narrow (--col-narrow). The main area follows the shape
    of the app. When it is wider than tall, the number, the type pill and
    the "Still needed" card stand on the left and the discs on the right,
    and the action bar runs under both at the full width of the main
    area, as a toolbar along the bottom edge. When it is taller than
    wide, they stack as items 4
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
    gaps between blocks. Nothing is scaled as a whole. There are two
    exceptions, and both change only display text and paddings: the
    compact step of item 70 on a short screen and the roomy card of item
    71 on a tall landscape screen. Discs and tap targets never change
    size. The compass follows the same steps with its own sizes (item
    19).
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
70. Compact step. When the app is less than 700px tall (the 1000 × 600
    minimum, and the user's tablet in landscape inside a Chrome tab at
    1333 × 680), display-only text shrinks so more fits: the big POI
    number takes --t-num-compact, the counter --t-label and "N to go"
    --t-small. The "Still needed" card follows its own width instead
    (item 39). The mini-map becomes a one-line button at the top of the
    column: the Lucide layout-grid icon, the count of finished POIs
    ("79 of 196") and "Open", as tall as a tap target, so the column
    shows more POI rows. Discs and every tap target keep their size,
    since they are what the passenger hits in a moving car. The compass
    takes --compass-compact (item 19).
    In landscape the compact step also gives the "Still needed" card and
    the type pill room to breathe: the screen's side margins become 16px,
    the gaps beside the POI column and between the card and the discs
    12px, and the closed Left and Right discs sit 8px nearer to Straight.
    The card then keeps its normal padding.
71. Roomy card. When the app is wider than tall and more than 700px tall
    (the user's tablet in landscape without browser bars, 1333 × 800)
    and the left group beside the discs is at least 520px wide, the
    "Still needed" card takes 24px of padding and its heading --t-body,
    so it does not look small and flat beside the 118px discs. Its rings and rose keep the sizes its width gives them
    (item 39, decided 2026-10-22). Where the left group is narrower than
    520px (at 1280 × 800, for example) the normal card stays. The head,
    the type pill, the
    discs and every tap target do not change. The compass takes its
    landscape size (item 19).

## Canon (applies to every screen)
67. Size C is the app's size, chosen on the user's tablet on 2026-10-06
    out of three drawn sizes: tap targets 56px, POI rows 66px, the narrow
    POI column 208px, text 14 / 17 / 19px, POI numbers in the column
    23px, titles 26px, the big POI number 92px, a block gap of 18px,
    maneuver discs 118px and side discs 92px set 124px from the centre.
    The values live in docs/references/_tokens.css, and item 52
    keeps them fixed on every screen.
68. Every colour, font size and weight, size, spacing, radius, opacity,
    shadow and motion value of the app screen comes from
    docs/references/_tokens.css through var(). A value the canon lacks
    is first added to _tokens.css by a dedicated decision, then used.
    This holds for every reference and later for app/index.html. Plain
    numbers that are not design values may stay literal (decided
    2026-10-22): 0 and 1 (off and on, no scale), 50% and 100%, 1px
    hairlines, percentages and fr of a layout, multipliers and divisors
    of a token inside calc(), counts (columns, flex, z-index order), em,
    ch, lh and cap ratios of a token font size, keyframe stops, angles
    of a drawn shape, numbers inside an SVG drawing (coordinates, path
    data, stroke widths in its own units) and the breakpoints of media
    and container queries, which CSS cannot read from a token. An
    opacity between 0 and 1, a duration or the strength of a motion is a
    design value and takes a token. The page chrome of a reference
    around the app frame (titles, notes, the checking tool) is exempt.
    Every reference prompt checks it: no other literal colour, size or
    spacing inside the app frame. The palette is emerald with a warm
    yellow gold (decided 2026-10-25, replacing navy, lavender and a
    light gold). On light an ivory background carries emerald text and
    emerald maneuver discs. On dark the background is emerald and the
    maneuver discs are ivory. The gold marks the arrows, the rings, the
    side discs and the letters N, E, S and W, and done is a brighter
    green of its own, apart from the emerald. The error red, the focus
    blue and the hatch of a not drivable tile are not part of the
    palette and stay as they were.
69. Icons are Lucide icons only (CLAUDE.md rule 10), their path data
    copied verbatim, at stroke-width 2.6. One symbol stands for each
    maneuver everywhere in the app: Lucide corner-up-left for Left,
    arrow-up for Straight and corner-up-right for Right, on the discs, in
    the type icon, in the "Still needed" card, in split lines, dialogs
    and toasts. A text arrow (←, ↑, →, ›) never stands in for an icon.
    Manrope draws ↑ but not ← or →, so text arrows would mix two fonts.
    An arrow written in this document stands for the Lucide icon of that
    maneuver. Not drivable uses Lucide ban, the current menu choice and
    a done tile of the grid Lucide check, a sheet error in the grid
    Lucide triangle-alert, closing Lucide x, menus and links Lucide chevrons. The
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
    layouts: one small square per POI, coloured by state as the tiles of
    item 59 (current gold, done green, in progress grey, spreadsheet
    error red, not drivable striped, not started pale), with the number
    of finished POIs and the word "Open". It is the column's header, not a card
    inside the column: the squares and the caption share one width and
    keep at least 12px from the column's edges, and a hairline divides
    the header from the rows. It works for any POI count (item 22). How
    it scales for a small or a large count is settled when the reference
    is drawn. On a short screen it becomes a one-line button (item 70).
59. Tapping the mini-map opens a grid of all POIs of the route over the
    whole screen, ten to a row, coloured like the mini-map, with a
    legend whose swatches are small tiles. Every state has its colour and
    a second sign that needs no colour, for sun glare and for eyes that
    mix red and green. Current: a gold tint and a thick gold edge.
    Done: green with a check. In progress: grey with a gold bar. Not
    started: an empty bar and a grey edge. To fix: the gold tint with a
    warning triangle in the warning colour. Sheet error: red with a
    warning triangle. Not drivable: grey stripes with a ban sign. Three
    grey states blended in the car (decided 2026-10-18). Tapping a
    tile makes that POI active, closes the grid and
    scrolls the column to it. The ✕ of item 66 or a tap outside the grid
    closes it and changes nothing.
60. The POI type of item 46 is shown and set by the type pill, a
    full-width control under the big POI number: an icon, the type name
    and its split ("← 28 · ↑ 14 · → 28"). Neither the pill nor the menu
    shows the passes ("70 passes"): the counter "41 of 70" beside the
    number already shows the target, and without them the split keeps to
    one line at every size (decided 2026-10-22). The split's numbers are
    --t-label heavy in --ink, like the screen's other numbers, and stay
    smaller than the card's counts, so the plan is not read as what is
    still needed. In gold beside the gold arrows they tired the eye
    (decided 2026-10-22). The menu keeps its grey split (v0.47). The icon
    shows the allowed maneuvers, not the shape of
    the road: their
    icons of item 69 side by side in the order left, straight, right, in
    gold on a tile in the colour of the discs (item 5), wide enough for
    three, the same for every type. The type name and the split under it
    share one centre line, in the middle of the space between the tile
    and "Change type" (decided 2026-10-22). Each maneuver keeps its own place in the tile:
    an absent one leaves its place empty instead of shifting the others,
    so the tiles read as a map of the maneuvers. Tapping the pill opens
    a menu with the six types, each with its icon and split, the current
    one marked with a check, as the route menu marks the active route.
    The menu changes the active POI only. Two taps are deliberate: a
    stray touch while driving cannot change a type. A change with
    consequences for passes already recorded asks first (item 64). The
    pill ends with "Change type" and a chevron, so it reads as the POI's
    type and as a control (decided 2026-10-22). Where the left group is
    narrow (the compact card of item 70) only the chevron shows. The
    counter beside the number carries no chevron.
61. History covers the main area in both layouts, the compass and the
    action bar included, while the POI column stays live beside it, so
    item 44 holds unchanged. In portrait the summary under the main area
    keeps its place.

## Working screen — left
1. Active city and route picker, side by side. The city name is always
   visible so it is obvious which tracker a tap is written into. It is as
   large as the route code, bold, in the ink colour.
73. A gear button (Lucide settings) at the right end of the top bar,
    after the sync control, opens Settings (item 74). It is a square tap
    target as tall as the sync control, on the same raised surface.
2. POI list 1…N for the route's POI count: number, progress bar, "N to
   go". Row turns green at its target, red on error, its bar is gold while
   in progress (--prog, the one gold of item 5), not-drivable POI in a
   state of its own (item 46), active POI highlighted.
3. Bottom summary: "Done N · M to go" and the count of finished POIs.
   "Done" and "to go" count the passes that fit (item 4). A segment "K
   to fix", the number of POIs with passes to fix, in the warning
   colour, stands before the error count and appears only when it is
   not zero. The error count appears only when it is not zero. In
   portrait it sits under the main area. In landscape it sits inside
   the action bar, so the POI column runs down to the bottom (item 51).

## Working screen — right
4. Large active POI number with the "N of T" counter beside it, where T
   is the POI's target (70 or 40, a not-drivable POI reads "Not
   drivable"), and "N to go" under the counter. The counter's N is the
   passes that fit the POI's type: for every maneuver the type allows,
   the smaller of its count and its share, summed (item 46). "N to go"
   is T minus that, the sum of the rings' "more". When the POI has
   passes that do not fit, the rest line reads "27 to go · 53 to fix",
   the second part in the warning colour, and "53 to fix" alone when
   nothing is to go. "Done" stands there only when nothing is to go and
   nothing is to fix. Below them, one ordinary gap apart, come the type
   pill (item 60) and then the "Still needed" card (item 39).
5. Three big round maneuver buttons ← ↑ →, "straight" higher than its
   neighbors. They sit in the middle of the free space under the "Still
   needed" card, close to the passenger's hand, and keep that height. A
   caption about them (items 10 and 46) sits under the discs and never
   moves them. Each is a disc in --disc, emerald on light and ivory on
   dark, with its arrow in gold (--man-glyph) and, while it can be
   tapped, a gold ring of 4px (--man-ring). A locked disc fades and has
   no ring (decided 2026-10-21). The ring of a disc, the fill of the
   card's rings, the icons on the card (--card-glyph) and the bar of a
   POI in progress (items 2, 59) share one gold, --gold-line, #D9A92A on
   light and #E6B83E on dark (the palette of item 68, decided
   2026-10-25). The arrows on the discs and on the type tile
   (--man-glyph) take the same gold on light, 4.1:1 on the emerald
   discs, and a deep gold, #A67C00, on the ivory discs of the dark
   theme, 3.1:1, where the bright gold would read at 1.5:1 (decided
   2026-10-25). On the light card the gold reads at 2.1:1 and on the
   dark card at 7.8:1, where its shapes are large or stand beside a
   number or a word that says the same. Gold text (the side letters, a
   number over its share) keeps --warn, and gold surfaces (the side
   discs, the rose, the compass arrow's gold half) keep --side.
6. Tap a maneuver → that disc slides to the centre of the disc area, the
   other two fade out of the way, and the four approach sides bloom
   around it as a compass: N above, S below, W left, E right. No side
   ever reaches the screen edge, covers the POI column or comes closer
   than 8px to the action bar. On a screen too short for the open
   compass, it rises over the bottom of the "Still needed" card instead,
   since the card takes no taps. When the compass closes, the disc
   slides back to its place.
7. Tap a side → the pass is recorded as a whole: a short rising chime,
   vibration, a gold ring leaves the tapped side, the "N of T" counter
   bounces in place, and the toast of item 36 appears ("Saved: ← South ·
   N of T"). Then the sides hide and the disc slides back. Sound and
   motion follow item 62. A second tap on a side while the ring of the
   first one still runs is ignored, so one pass is never recorded twice.
8. "Cancel" is visible only while the compass is open. Tapping the same
   maneuver again also closes it. Auto-close after 12 s with the toast
   "Closed after 12 s: nothing recorded" (item 36).
9. "Undo last" removes the whole most recent pass (maneuver and side
   together) that this tablet recorded for the active POI, and can be
   pressed repeatedly. Each press asks first (item 63). A pass still
   waiting is dropped from the queue. A pass already in the sheet has a
   removal queued for it, exactly as History does.
   Undo last acts on the most recent pass that counts, whatever its
   maneuver: a pass the type no longer allows is offered too, since
   deleting it is what item 64 asks for. It skips a pass that was not
   accepted and a pass whose removal already waits or was not accepted,
   since History handles those (items 13, 47), so a pass never gets a
   second removal.
   The button is dimmed, with the caption "Nothing to undo" (item 27),
   whenever no pass of the active POI counts: none recorded by this
   tablet, or every one refused or already carrying a removal.
10. A POI that has reached its target, or has a spreadsheet error, has
    its maneuver discs locked, with a caption saying why. Input is what
    stops: "Undo last" and "History" stay available, because a miscount
    is most likely to be noticed exactly when the POI closes.
11. The screen stays awake while the app is open: the app asks the
    browser for a screen wake lock at start and again every time the page
    comes back into view, since the browser releases it whenever the page
    is hidden. A refusal is silent.
19. A compass sits at the top right of the main area, in both layouts
    one gap under the top bar and flush with the main area's right edge,
    so it stands in the same place with the same air on every screen. In
    portrait the head keeps room for it and the type pill sits one gap
    under it. It is a drawn widget (item 69) on a raised round face
    (--panel-raised, --shadow, a --line edge): minor ticks every 30
    degrees, longer marks at N, E, S and W, and the four letters inside,
    N heavy in gold (--compass-n) with a dark gold outline on light, so
    it reads on the white face (--compass-n-edge, decided 2026-10-21),
    and the others in --ink-2. One arrow shows where the car drives. Its
    left half is --disc, the colour of the maneuver
    discs, and its right half is --side, the colour of the side discs. It
    has no tail. The side of a pass is the direction the car drives as it
    enters the intersection (data-model.md "Pass"): driving north and
    turning right is North Right. So the passenger reads the side from the
    arrow before the turn, when it still points the way the car came in.
    There is no red and no
    blue, since red is the error colour and a red needle reads as north.
    The arrow turns to the car's heading while the dial stays fixed with
    N up. The arrow is always on the dial. Until the sensors give a
    heading it shows the course this tablet saved last (data-model.md
    "Heading"), or north when nothing is saved, and it stays pale until
    the first GPS check. While the heading is only a last known course
    the arrow is pale too (decided 2026-10-18). A pale arrow is drawn as
    a dashed outline without fill, so a stale course never passes for a
    live one (decided 2026-10-21). It is 128px
    (--compass), 144px on a landscape screen more than 700px tall
    (--compass-wide) and 96px on a short screen (--compass-compact, item
    70). The heading comes from the tablet's sensors as data-model.md
    "Heading" describes. Minimum gap between any two discs on the screen
    is 8px.
39. The per-POI mini counters live in the "Still needed" card under the
    type pill (decided 2026-10-22). Its heading reads "TO GO", the words
    of "29 to go" under the counter and in the POI column. Under it the
    three maneuvers stand as progress rings in a pyramid, as the discs
    stand under the card: Straight on top, Left and Right one and a half
    rings lower (--card-rise), on the left and on the right. A ring
    fills in the gold of the arrows (--card-fill, item 5) with the
    passes driven against the maneuver's share of the POI's type (item
    46), from the top clockwise, and shows inside what is still needed,
    a large "12" over a small "more". There is no "16 of 28" line: the
    type pill above already shows the split. Under each ring sit the
    maneuver's Lucide icon in gold (--card-glyph), 20px (--card-icon),
    and its name. A maneuver whose share is full closes its ring in the
    done colour and reads "Done", and its disc locks (item 46). A count
    past the share, possible only from numbers typed into the sheet or
    from a type change, closes its ring and reads "+3 over": the plus as
    big as the digits and on their middle line, the number a step
    smaller than the other rings' and in the warning colour, the whole
    centred in the ring by its drawn shape (decided 2026-10-25). A
    maneuver the type does not allow shows "+26 over" the same way when
    it has passes (its share is 0), and fades with its name and a dash
    on an empty track when it has none. Beside the pyramid the four
    approach sides stand as a rose of diamonds on the soft gold side
    tint, as on a compass: N above, E right, S below, W left, each with
    its letter in gold over its count. The rose has no heading and no
    total: the total would repeat the counter beside the POI number,
    which also names a mismatch between sides and maneuvers. Sides have
    no split, so they are plain counts, except on a Straight only POI
    (item 46). There a side with passes shows "of 20" under its count,
    turns the done colour at exactly 20, and past 20 reads "+3 over"
    under its count, both in the warning colour. Ten or more past 20 the
    line reads "+16" alone, without "over", which would cross the
    diamond's edge (decided 2026-10-25). Nothing locks, and the POI is
    done at Straight 40 whatever its sides (decision D2, 2026-10-25). A
    side at zero fades and shows no target. The pyramid and the rose
    share one centre line, with equal space before, between and after
    them, measured on the drawn rings and the tips of the diamonds. At
    the right of the head stands the last pass of the active POI:
    "LAST", the maneuver's icon in gold, the side's letter and the time
    ("LAST ↰ S · 21:40"), the time alone for today and the date with the
    time when older (item 16). It is the newest pass of the POI that
    still counts, the one "Undo last" would remove (item 9), so it
    changes with the active POI and steps back after an undo. With no
    such pass, for example when every pass of the POI reached the sheet
    by hand (item 45), the head shows TO GO alone. The rings and the
    rose follow the card's own width: rings of 76px in columns of 90px
    and a rose of 214px (--card-ring, --card-col, --card-rose), 62px,
    70px and 179px on a card narrower than 480px, where a side past 20
    reads "+3" without "over", and 52px, 60px and 135px on one of 380px
    or less, where "more", "over" and the line under a side's count are
    left out. The card carries no separate "balance" line, since the
    split already shows in the type pill and in the card itself.
40. The active POI row carries a gold tint, a 4px left edge, its number
    in the gold foreground colour and its "N to go" darkened. It must be
    findable with peripheral vision and must not imitate the green done
    row, the red error row, or a control. The tint and the edge stay
    gold in every state. An active row that is done or in error shows
    that state in the colour of its number, text and bar. A row with
    passes to fix carries a small warning triangle in the warning colour
    before its "N to go". When nothing is to go and passes are still to
    fix, the tag reads "to fix" in the warning colour and the row is not
    green.
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
      direction: each side shows its passes against 20 (item 39), and
      nothing locks (decision D2, 2026-10-25).
    - Not drivable: not counted (0). A POI that cannot be driven at all
      (private property, a road closed for good). Not called "Closed",
      which reads like "done".
    The split is a hard limit. A maneuver the type does not allow, and a
    maneuver whose share is full, has its disc dimmed (item 26) with a
    caption under the discs ("No left turn at this POI", "Left is done:
    28 of 28", and over the share "Left is over its share: 31 of 28")
    and takes no more passes. One caption shows under the discs at a
    time, the most urgent that applies (decided 2026-10-25): a sheet
    error, then passes to fix, then Not drivable, then an allowed
    maneuver over its share, then a maneuver done, then a maneuver the
    type does not allow. Between two maneuvers with the same reason,
    Left comes before Straight and Straight before Right. A maneuver the
    type does not allow reads as not allowed whatever its passes. So a
    sheet error is never hidden, and a Not drivable POI with passes
    reads "66 passes to fix in the sheet" in the warning colour
    (decision D3). Undo last or Delete frees a full share again. If a
    share cannot be reached in the field, the type is changed instead.
    Approach sides have no limit.
    A POI is done when every maneuver the type allows has reached its
    share and no pass is to fix (decision D1, 2026-10-23). Passes that do
    not fit the type, a maneuver it does not allow or passes past a
    share, are "to fix": the sheet keeps them whatever the type and the
    export sends them to the client until they are deleted, in History
    for this tablet's passes and in the sheet for passes typed in by
    hand. A POI with passes to fix is never done. When every ring is
    closed and passes are still to fix, every disc locks and the caption
    reads, in the warning colour, "53 passes to fix in the sheet", "3
    passes to fix in History", or "53 passes to fix in the sheet and 3 in
    History". While a ring still asks, the discs and the caption follow
    the maneuvers as before and the head and the row carry "to fix".
    A not-drivable POI has its discs locked at once with a caption, is
    never counted among POIs "to go", is left out of the route's count
    of POIs ("79 of 196 done" on a route of 197 with one not drivable),
    and must read as neither done nor in error. A not-drivable POI with
    passes is a POI with passes to fix. New POIs start as Intersection.
    "Only Left" and "only Right" are not types: they are too rare to add.
62. Sound and motion. Recording a pass plays a short rising two-note
    chime, removing one (Undo last, Delete) a short falling one. The
    tapped side dips under the finger while a gold ring leaves it,
    growing and fading like a sonar ping, and it keeps its place, so the
    finger never chases it (decided 2026-10-21). The "N of T" counter
    bounces in place with it, and nothing
    pops up over the POI number. The sides bloom out of the chosen disc
    when the compass opens. All motion is skipped while the tablet's
    "reduce motion" accessibility setting is on. The rising chime is two
    notes at 988 and 1319 Hz, the falling one 660 and 494 Hz, and the
    vibration lasts 25 ms. Sound can be switched off in Settings (item
    65).
64. A type can be changed at any time, also on a POI that already has
    passes. The change applies at once, with the toast "Type set:
    Straight only" (item 36), when it has none of the two consequences
    below. Otherwise it asks first (item 63), and the dialog states the
    consequence in plain words, "in the sheet" for delivered passes and
    "waiting on this tablet" for passes not sent yet:
    - Passes that do not fit the new type, a maneuver it does not allow
      or passes past a share: "It has 26 Left and 27 Right passes in the
      sheet. Straight only does not allow Left or Right. The app stops
      counting them, but the sheet keeps them and the export sends them
      to the client until they are deleted. 2 of them were sent from this
      tablet, the other 51 were typed in by hand: delete those in the
      sheet." Passes waiting on this tablet are named apart ("and 2 Right
      passes waiting on this tablet"), and the switch of item 63 offers to
      delete this tablet's passes. Past a share the sentence names the
      share: "It has 31 Left passes in the sheet. No right allows 28, so 3
      do not fit."
    - Passes on a POI turned Not drivable: "It has 66 passes in the sheet.
      Not drivable counts none of them. The sheet keeps them and the
      export sends them to the client until they are deleted." with the
      same words for passes waiting on this tablet, which are still sent
      unless the switch deletes them.
    After the change the POI reads "13 of 40 · 27 to go · 53 to fix" (item
    4) and its row "27 to go" with the mark (item 40). There is no "over
    target" state: a total past the target is passes to fix.

## "History" panel
12. Pass list: "POI" / "Route" scope control; each entry shows time and
    "maneuver + side". The time sits right-aligned in its slot. Each row
    ends with its state: "Waiting" and "Removal waiting" with the dot in
    the warning colour, "Sent" quiet, "Not accepted" in the error colour.
    A type change that sent a target event (item 64) has a row of its
    own, "Type: Straight only", with the POI number in Route scope. It
    reads "Waiting" while it waits and leaves the list once it is in the
    sheet, since the type itself is stored apart (item 48). A refused one
    reads "Not accepted" (item 47). A waiting type change carries no
    button: it is undone from the type pill, and choosing the old type
    again drops it (data-model.md). A pass whose removal waits ("Removal
    waiting") carries one button, "Cancel removal", which drops the
    waiting removal without a dialog: the pass counts again, since
    nothing reached the sheet (data-model.md "Event": a waiting event
    may be dropped). Where the slot is narrow the type's name wraps
    under "Type:".
13. Every pass has "Delete", which asks first (item 63). A pass still
    waiting on the tablet is removed outright. A pass already in the
    sheet stays in the list, struck through and labelled "Removal
    waiting" with the warning-colour dot of a waiting pass, only until
    its removal has been delivered, and carries "Cancel removal" (item
    12) until then. Then it leaves the list. A line above the list
    counts the removals still queued, "1 removal waiting to be sent",
    whatever holds them up, in the scope in view: the POI in POI scope,
    the route in Route scope. The sync control names the
    cause (items 33, 72). A removal the mailbox refused keeps the row
    struck through and reads "Not accepted" in the error colour, with
    the reason, "Send again" and "Cancel removal". "Cancel removal" asks
    nothing: the pass returns to "Sent", since nothing changed in the
    sheet (history.html frame I).
14. Passes entered earlier by hand in the spreadsheet are not shown — they
    are corrected in the spreadsheet.
38. A pass that has already reached the sheet can still be deleted here;
    the removal is queued and sent like any other event. A pass still
    waiting on the tablet is removed outright and leaves the list at
    once. The struck-through row of item 13 is for delivered passes
    only.
41. The panel's sub-header ranks its facts rather than listing them: the
    POI or route in view sits in a gold chip, the route and city stay
    as quiet context, and a total appears in a neutral chip: the passes
    this tablet recorded in the scope in view that still count, whatever
    maneuver the type allows now.
44. The POI list beside the History panel stays live: tapping another POI
    reloads the panel for it without closing. The panel never carries a
    second POI picker. The grid of all POIs (item 59) opened over History
    returns to History when it closes.
45. History lists only passes this tablet recorded. Numbers that reached
    the sheet by hand have no individual passes behind them — the sheet
    holds seven totals per POI — so they can be continued from, through
    "Load from sheet", but never listed. A POI with no passes from this
    tablet shows "No passes from this tablet" in the middle of the list,
    with one line naming how many passes reached the sheet by hand and
    that they are corrected in the sheet. With no passes from the sheet
    either it reads "No passes yet", and an empty Route scope "No passes
    on this route yet", each without the line.
47. An event the mailbox refused stays on the tablet as "rejected", with
    the mailbox's reason, and is never trimmed (item 48). History shows
    it in its row, and the working screen's sync control counts rejected
    events alongside waiting ones. A refused pass offers two actions in
    its row, as Apple's Messages offers "Try Again" on a message that was
    "Not Delivered". "Send again" queues the same event once more, for
    when its cause has been fixed in the sheet: the mailbox keeps no
    trace of a refused event, so it applies once (data-model.md
    "Mailbox", since mailbox v1.4). "Delete" drops it from
    this tablet after the dialog of item 63, and nothing is sent, since
    nothing reached the sheet. A refused removal offers "Send again" and
    "Cancel removal" (item 13). A refused type change offers "Send again"
    and "Cancel change", which puts the old type back without a dialog,
    since nothing changed in the sheet. When putting the old type back
    has a consequence of item 64 for passes recorded since, the dialog of
    item 64 asks first. An event is never edited (data-model.md): it
    keeps the route and the POI it was recorded with, so its cause is
    fixed in the sheet. The one exception is a route not checked yet,
    whose code can still be corrected in Settings (item 22). The sync
    control reads "1 pass not accepted", "1 removal
    not accepted" or "1 type change not accepted", and "2 changes not
    accepted" when they are mixed, with its dot in the error colour. The
    reason line under the row, by the mailbox's code: text-in-cell "The
    sheet has text in a cell this pass adds to. Fix the cell, then send
    again." no-route "Vienna’s sheet has no tab named R20890-058. Rename
    the route’s tab to R20890-058, then send again.", and on a route not
    checked yet "Vienna’s sheet has no tab named R20890-085. Correct the
    route code in Settings." no-poi "Tab
    R20890-058 has no row for POI 136. Add the row in the sheet, then
    send again, or delete this pass." below-zero, which only a removal
    can meet, "The sheet’s count is already 0, so there is nothing left
    to remove." already-removed, which also only a removal can meet,
    "The sheet already took this pass out. Cancel this removal."
    bad-request and bad-target "The sheet could not read this
    change. Send it again or delete it." error "The sheet could not write
    this change. Send it again." On a removal or a type change the words
    follow its own row: "this removal takes from" for "this pass adds
    to", and "or cancel the removal" or "or cancel the change" for "or
    delete it" and "or delete this pass". The look of the rows is drawn
    in history.html (frames F and I).
48. History holds the newest 3,000 passes and removals this tablet
    recorded. Older delivered ones drop off the list. Nothing waiting or
    not accepted is ever dropped, whatever its age. Type changes are not
    counted: a delivered one leaves the tablet at once, since the type
    itself is stored apart (data-model.md). Under the last row: "This
    tablet keeps its newest 3,000 passes and removals. Older sent ones
    are no longer listed." The line shows only once a pass of the scope
    in view has been dropped.

## Connection, sync status and tablet data
16. Sync status is always visible on the working screen and carries a
    timestamp: "All sent · 12:41", "12 passes waiting for network", "No
    connection", "Access key rejected". Tapping it opens the Sync panel
    of item 72 under it,
    and its chevron points down, up while the panel is open. Nothing is
    ever lost while it waits.
    Timestamps show the time alone for today and the date with the time
    when older: "All sent · 12:41", "last loaded 04.09 19:20".
72. The Sync panel opens under the sync control, right edges aligned,
    and is built like the type menu (item 60). A small title reads "SYNC"
    and the city. Under it the state in words beside the sync control's
    dot ("All sent", "2 passes waiting for network", "1 pass not
    accepted", "No connection", "Connection not set up", "Access key
    rejected") with one line: the time of the last send, or what happens
    next. Then "Send now" and "Load from sheet" (items 29, 30), the
    latter with the route and the time of the last load. A control that
    cannot act stays in place, dimmed, and its line names the reason:
    "Nothing to send", "No network", "Connection not set up", "Access key
    rejected" (items 26, 27). Last comes "Connection", which opens the
    city's Connection screen (item 25), or "Set up connection" while
    there is none. When the mailbox refused passes, removals or type
    changes, a row "Show in History" sits right under the state and
    opens History for the whole route, where each refused row offers
    "Send again" and its "Delete" or "Cancel" (item 47). Its line names
    what is left to do: "1 pass to fix or delete", "1 removal to fix or
    cancel", "1 type change to fix or cancel", "2 changes to fix". The
    panel closes like a menu (item 66) and never sends or loads by
    itself.
    When the tracker's script answers "auth", the access key saved on
    this tablet is not the script's. The control reads "Access key
    rejected" with its dot in the error colour, and the line under the
    state reads "The sheet’s script refused the key. Passes wait on this
    tablet until it is fixed." Right under the state a row "Fix the
    access key", with the number of passes waiting, opens the city's
    Connection page (item 25). Meanwhile the tablet stops sending on its
    own. Saving the connection, or a test that connects, clears the
    state and sending starts again at once. If the next send is refused
    the same way, the state comes back. A "busy" answer (another send
    holds the script) is never shown: the app tries again by itself
    (main-screen frame R).
17. Theme: System, Light or Dark, a segmented control under "This
    tablet" in Settings (item 74).
65. Sound: on / off, on by default, a switch under "This tablet". It
    silences the chimes of item 62 only. Vibration and motion do not
    change.
18. "Erase everything on this tablet" sits apart at the bottom of the
    Settings list, in red (item 28). It asks first with the dialog of
    item 63. When passes have not reached a sheet yet, the dialog gives
    their number in its text and the red button reads "Erase anyway"
    ("Erase" when no pass waits): a button title keeps to one or two
    words, as Apple asks. The text names what leaves the tablet: cities, routes,
    connections, POI types and History. The POI types are lost for good,
    since the sheet keeps only the targets (data-model.md). The
    spreadsheets are not touched. Afterwards the tablet has no city
    (item 76).

## "Settings" panel — cities and routes
74. Settings is a sheet over the whole screen, as the grid of all POIs
    is (item 59), with the round ✕ of item 66 and the title "Settings".
    Its list holds "CITIES" (item 20), "THIS TABLET" (Theme, item 17,
    and Sound, item 65) and, apart at the bottom, "Erase everything on
    this tablet" (item 18). In portrait one column drills down: the
    list, a city, its Connection or a route. Every deeper page has a
    back link that names the page above ("Settings", "Vienna"). In
    landscape the list stays on the left at the column's wide width and
    the page opens beside it, the chosen city tinted like the active POI
    row (item 40). With nothing chosen, the city in use is shown there.
    A city's page needs no back link in landscape, the list is beside it.
20. A list of cities under "CITIES". Each row: the city name, how many
    routes it holds and the state of its connection, in the words of
    the city's page (item 21). The city in
    use carries an "In use" chip. Tapping a row opens that city. "Add
    city" ends the list (item 75).
75. "Add city" opens a page with the city's name only. After "Save" the
    city's page opens, its connection not set up, and its "Connection"
    row leads to the Connection page (item 25).
21. City page: the city name, then a single "Connection" row with the
    status ("Connected · tested 18:20", "Not tested yet", "Access key
    rejected", "No answer from this address" after a failed test, or
    "Connection not set up", while a test without a network changes
    nothing) that
    opens the Connection page, then the city's routes and "Add route".
    A city not in use shows "Use this city" beside its name, with one
    line under it: the working screen switches to that city and opens
    its last route, and passes still waiting for the old city go to that
    city's sheet as usual. It asks nothing, since nothing is lost and it
    is undone the same way. "Delete city" sits apart at the bottom, in
    red. On the city in use it is dimmed with the reason "Switch to
    another city first" (items 26, 27).
22. Route page: "Route code" (it must match the tab's name in that
    city's tracker exactly) and "Number of POIs", a hint, and "Save", or
    "Add route" for a new one. The target per POI is not set here. It is
    set per POI from the working screen (item 46). A new route loads
    from the sheet at once (item 30). The mailbox answers "no-route" for
    a tab it cannot find, so the load also checks the code: the field
    says "No tab named R20890-602 in Vienna’s sheet. Check the code." and
    the route is not saved until the code is right. Without a network,
    or while the access key is rejected, the route is saved as "Not
    checked yet" and loads when it can. A route that has never been
    loaded loads when it is first opened.
    A route is checked once its first load succeeds or its first change
    reaches the sheet. Until then its code stays editable, even with
    changes waiting or not accepted: a code typed wrong offline is
    corrected here, and the route's waiting and refused changes move to
    the new code and go out on their own (data-model.md). Once the route
    is checked its code is proven, and while any change of the route
    waits or was not accepted "Route code" is dimmed with its reason: "2
    passes not yet sent carry this code. It can change once they are in
    the sheet." The reason names what waits ("1 type change not yet sent
    carries this code"), and for a refused one it reads "1 change not
    accepted carries this code. Fix it in History first." Those changes
    keep the code they were recorded with, because events are never
    edited (data-model.md), so a tab the mailbox cannot find is renamed
    in the sheet instead (item 47). "Delete route" sits at the bottom, in
    red.
23. Adding a city or a route never touches any spreadsheet; the tracker
    for a new city is created by the user in Google Sheets first.
24. Deleting a city asks first with the dialog of item 63: its routes,
    its connection, its POI types and its History leave this tablet, and
    the sheet stays as it is. When some of its passes have not reached
    the sheet, the dialog gives their number and the red button reads
    "Delete anyway", as in item 18. Deleting a route is refused while any
    change of that route waits or was not accepted: the control stays,
    dimmed, with the reason, "2 passes not yet sent. Delete works once
    they are in the sheet." (naming what waits, as item 22 does) or "1
    change not accepted. Fix it in History first."
25. Connection screen, one per city: "Script URL" (the address Apps Script
    returns after deployment) and "Access key" (masked), with the hint
    that both are stored on this tablet only, plus "Test connection" and
    "Save". The word "Mailbox" never appears in the interface. "Test
    connection" answers in one line under the fields: "Connected · tested
    18:20" with the green dot, "Access key rejected" or "No answer from
    this address. Check the Script URL." with the red dot, and "No
    network" with the muted dot. A rejected key also gives the Access key
    field the error colour's border (settings.html frame J).
29. "Send now" and "Load from sheet" live in the Sync panel (item 72),
    with the time of the last successful send and the last load, and
    nowhere else. Sending is automatic whenever the network is up. The
    button exists to confirm before a shift ends, not to run the sync.
    The Connection screen keeps the setup of item 25 only.
30. "Load from sheet" replaces the active route's counts and targets with
    what the tracker currently holds. Passes still waiting on the tablet
    are kept and sent as usual: they are not in the sheet yet, so the
    loaded numbers plus the waiting passes are exactly right. A type
    change that waits or was not accepted is kept the same way: the POI
    keeps its new type on this tablet until the change is in the sheet or
    cancelled (item 47), and the next load then agrees with the sheet.

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
    removal shows the pass itself in a chip (POI, maneuver, side, time).
    The chip names the side with "from" ("Left from South"), since it
    stands alone there, while a row of History names the side alone
    (item 12). A type change whose new type does not fit passes of this
    tablet shows, under its sentences, a switch "Also delete the 2
    passes of this tablet", on by default, with the line "They do not
    fit Straight only. A waiting pass is dropped, a sent one gets a
    removal." under its label, in the style of the Sound switch of
    Settings (item 65). With the switch on, "Change" applies the type
    and deletes those passes exactly as Delete in History does, one
    removal per sent pass. Passes typed into the sheet cannot be deleted
    from the tablet, and the dialog says so. One line says what happens:
    a waiting pass is simply dropped from this tablet, a pass already in
    the sheet gets a removal sent with the next sync, and a refused
    pass, which never reached the
    sheet, is dropped like a waiting one ("The sheet refused it, so it is
    simply dropped from this tablet."). A waiting pass that turns out to
    have reached the sheet while the dialog was open gets a removal
    instead, and History shows it as "Removal waiting" (data-model.md).
    Two buttons side by side: "Cancel" on the left, the action
    as a verb on the right ("Remove", "Delete", "Change"), never "OK" or
    "Yes". A removing button is red (item 28), and so is the button of a
    type change, since passes stop counting (decided 2026-10-21). A tap
    outside the
    dialog equals Cancel. There is no "don't ask again". Dialog buttons,
    like the Settings buttons (Save, Test connection, Add route), set
    their words at --t-body in --w-bold, the size of the action bar's
    buttons (decided 2026-10-18).
66. An overlay that covers the screen or the main area (the grid of all
    POIs, History, Settings) closes with a round ✕ button in its top-left
    corner, as large as any tap target (item 31). There is no text
    "Close": Apple's rule is the standard close symbol without a text
    label, in the top-left corner. Where a dimmed background surrounds
    the overlay, a tap on it closes the overlay too. Every layer that
    opens over the screen (the open compass, a menu, a dialog, an
    overlay) adds one entry to the browser's history and takes it back
    when it closes any other way, so the Android back gesture closes
    exactly one layer, the topmost, and leaves the app only when nothing
    is open.
    Menus (type, route, sync) close by a choice, a tap outside, or when the
    screen turns. A tap outside only closes the menu: nothing under it
    reacts, as Apple's popovers keep other views from touches until they
    close. Confirmation dialogs keep "Cancel" (item 63).
77. A control that opens a screen of a later build stays in place,
    dimmed (item 26), and a tap on it shows the toast "Settings come in a
    later version". Until Settings exists this covers the gear (item 73),
    "Set up connection" in the Sync panel (item 72), "Add routes in
    Settings" (item 35) and "Add your first city" (item 76). The Sync
    panel's other controls read "Connection not set up" as their reason.
78. The tablet's storage is full and a pass cannot be saved (data-model.md
    "Tablet storage"): the dialog of item 63 reads "Nothing recorded" with
    the text "This tablet's storage is full, so the pass was not saved.
    Free space on the tablet, then tap again." and one button, "OK". The
    counter does not move and no toast appears.

## Working-screen states not drawn as separate reference screens
32. Empty POI: the counter reads "0 of 70" and "70 to go". The "Still
    needed" tiles show the full split of the type as "more" (28, 14 and
    28 on an Intersection) over empty bars, the sides read zero and fade
    (item 39), and the discs are live. Nothing else differs.
33. Passes waiting: the sync control reads "N passes waiting for network"
    with the dot in the warning colour. A queued removal counts like a
    waiting pass: "1 removal waiting for network", and so does a type
    change: "1 type change waiting for network", "3 changes waiting for
    network" when they are mixed. "Send now" counts them all. Everything
    else is unchanged.
34. No connection: the sync control reads "No connection" with the dot in
    the muted colour. Nothing is lost meanwhile. A city whose connection
    is not set up yet reads "Connection not set up" with the same muted
    dot. Both read over item 33: with changes waiting and no connection
    the control names the connection, and the Sync panel's line under
    the state carries the count, "12 passes are kept on this tablet until
    it is set up." ("3 changes" when mixed, item 33).
35. No routes yet in this city: the route picker reads "No routes yet",
    the POI list is replaced by a single button "Add routes in Settings"
    that opens Settings, and the discs are dimmed and inert, with the
    caption "Add a route to start" under them (item 27).
76. No city on this tablet (a new tablet, or after item 18): the top bar
    reads "No city" and "No routes yet", the sync control "Connection
    not set up", the POI list is replaced by a single button "Add your
    first city" that opens Settings at "Add city" (item 75), and the
    discs are dimmed and inert with the caption "Add a city to start"
    (item 27). It changes the column, so it is drawn (main-screen frame
    Q).
36. A pass has just been recorded: a toast appears over the working area
    for about two seconds, reading "Saved: ← South · 57 of 70", then
    fades. The screen beneath does not move. The same toast serves the
    other confirmations: "Removed: ← South · 56 of 70" for a waiting pass
    undone or deleted, "Removal queued: ← South · 56 of 70" for a
    delivered one, "Type set: Straight only" (item 64) and "Closed after
    12 s: nothing recorded" (item 8). The toast "Type set: Straight only"
    stays six seconds (--dur-toast-undo) and carries a button "Undo",
    which puts the old type back exactly as choosing it again from the
    pill does (item 64) and shows "Type set: Intersection" without the
    button. It does not restore passes the dialog of item 64 deleted.
    The other toasts stay two seconds (--dur-toast).
37. A finished POI whose passes have not all been sent: the discs stay
    locked with their "This POI is done" caption, while "Undo last" stays
    live, because undo follows what this tablet recorded, not the POI's
    progress. The sync control reads "N passes waiting for network".
   These states change a line of text or a colour, never the layout, and
   so are specified here rather than drawn. Items 35 and 76 are the
   exceptions: they change the column and are drawn as main-screen
   frames N and Q.

Decided (v0.3): the passenger taps. Step-2 candidates: 3×4 grid (one tap
per pass), "repeat last", GPS/auto-POI from GPX.
