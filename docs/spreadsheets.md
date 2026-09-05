# Spreadsheets

v0.2 — 2026-09-04
<!-- Version history (append-only, never rewrite old entries):
v0.1 2026-09-04 — extracted from docs/inputs/handoff_v2.md (Russian,
2026-09-02) and verified against the two workbooks in docs/inputs/.
v0.2 2026-09-04 — the sheet the mailbox creates is named `Log`; no other
change. Russian names quoted from the user's spreadsheet stay verbatim.
-->

Two separate Google Sheets exist. The app writes to the user's tracker only,
through the Apps Script mailbox. The client's file is never touched by any
software in this project — it is updated by the user, by hand.

## A. User's tracker — POI_tracker_Dusseldorf_v1

Sheets: `Readme`, `Сводка` (summary), route sheets `R20890-024` …
`R20890-029`, `Generator`.

### Route sheet
Row 1 is the header; data starts at row 2. One row = one POI, POI number in
column A, 197 POIs per route.

| Col | Meaning |
|---|---|
| B, C, D, E | approach side N, S, W, E |
| F, G, H | maneuver Left, Straight, Right |
| I | To go = 70 − J |
| J | =SUM(B:E) — sides entered |
| K | =SUM(F:H) — maneuvers entered |
| L…O | running side thresholds: B, B+C, B+C+D, B+C+D+E |
| P…R | running maneuver thresholds: F, F+G, F+G+H |
| S | status: OK / ОШИБКА (J≠K) / БОЛЬШЕ (J>70) / ТЕКСТ! (non-number in B..H) |
| T1, U1, V1 | per-POI targets 28 / 14 / 28 |
| T (below row 1) | user's own notes |

Columns I..S are formulas. The app writes to B..H only, numbers only.

### Generator
Builds the 70-rows-per-POI block the user pastes into the client's file.
B2 route picker · B3 POI count · B4 rows per POI (70) · B5 copy range
`="C9:D"&(8+B3*B4)` · B6 gate: blocks copying while the summary reports
errors · B7 total passes. Block AA:AH holds the running thresholds of the
selected route; columns C and D resolve each row's side and maneuver from
those thresholds.

### Export to the client (manual, unchanged by this project)
1. Enter numbers on the route sheet.
2. Generator → pick the route in B2 → B6 must read "OK, можно копировать".
3. Select the range from B5 → copy.
4. In the client's file, route sheet → cell C5 → paste values only.
   The paste OVERWRITES THE WHOLE BLOCK.
5. The client's column V must match "Сделано" in the tracker summary.
`Readme!C81` = `SUM(V5:V201)` — the user's yellow check cell. Do not delete.

## B. Client's file — Duesseldorf_Tracking_RoadNet_v1

Sheets: `Auswertung` (their dashboard), `Template 3`, route sheets
`R20890-024` … `R20890-031`. Rows 1–4 are the header; data starts at row 5.
Two independent tables sit side by side.

### Pass journal, columns A–I, 70 consecutive rows per POI
A = Intersection Number · B = Scenario (empty) · C = Coming from Direction
(North/South/West/East) · D = Maneuver (Right/Left/Straight) · E–I =
lighting, weather, surface, traffic — never touched.
Paste block: `C5:D(4 + POI × 70)`; for 197 POIs that is C5:D13794.

### Per-POI summary, columns M–W, one row per POI, rows 5…(4+POI)
M = Intersection ID · N = maneuvers needed (70) · O,P,Q,R = North, South,
West, East · **S, T, U = Right, Left, Straight** · V = maneuvers done ·
W = % completed. O:U and V recalculate from C:D automatically.

**Column-order trap:** the client orders maneuvers Right, Left, Straight
(S,T,U); the tracker orders them Left, Straight, Right (F,G,H). Copying
O:U in one paste scrambles the maneuvers. Any transfer in that direction
must be done column by column.

### Routes
024–029 are ours. **030 and 031 belong to another vehicle — never touch
them, and never assume their numbers are ours.**

## C. State as of 2026-09-02 (two workbook snapshots in docs/inputs/)

- Tracker: only route 028 has data — 93 POIs, 590 passes, all 93 rows read
  OK, no text in B..H anywhere.
- Client's file: route 028 shows 558 passes. The 32-pass difference sits in
  POIs 2–16, tracker ≥ client everywhere; the remaining 183 POIs match.
  A manual export is outstanding.
- Balance on 028: Left 20 % · Right 40 % · Straight 39.5 % against the
  project target of Left 40 % · Right 40 % · Straight 20 %.
- The client's Auswertung has broken formulas of their own: two `#DIV/0!`
  cells, "Actual Maneuvers" sums only 024–029 (excluding 030/031), and
  route 024 is added twice in the Right row. Their file, their problem —
  but do not copy those numbers as truth.

## D. Rules paid for with damaged data

1. **Numbers only in B..H.** The user once used ❌ as a marker for
   "impossible maneuver". The generator compares a number against a running
   threshold, and "number ≤ text" is always TRUE in Sheets, so all 70 rows
   of that POI were emitted as Left (❌ in F) or North (❌ in B). Column S
   did not catch it because SUM ignores text. 28 POIs on route 020 and 11
   on 019 were corrupted this way in Dortmund. An impossible maneuver is
   **0**; notes go in column T.
2. **A blank cell breaks a whole route.** `Generator!D14` once held a space
   instead of a formula, so POI 1 of every route emitted 69 maneuvers
   instead of 70. Fixed in the Düsseldorf tracker.
3. **Other people's data.** Dortmund routes 019 and 022 hold passes from
   another vehicle. Exporting over them would erase someone else's work.
4. The 40/40/20 balance is stated but not enforced anywhere.

## E. Open questions for the client (Nelu) — unanswered

1. Does the client read side and maneuver as a pair within one row? If yes,
   the seven-numbers-per-POI scheme does not hold.
2. Column B (Scenario) is empty even in filled data — should it be filled?
3. Roundabouts are not in their maneuver list. How are they recorded?
4. Is the 40/40/20 target per project or per vehicle?
5. Columns J and K of their route sheets carry a numbering 1…281 and 95
   scenario labels ("SKEWED INTERSECTION", "STREET PARKING LANE" …). The
   set is identical across all eight route sheets including 030/031, so it
   looks like template residue rather than per-POI data. Confirm before
   relying on it.
