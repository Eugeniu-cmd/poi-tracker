# Spreadsheets

v0.5 — 2026-10-05
<!-- Version history (append-only, never rewrite old entries):
v0.1 2026-09-04 — extracted from docs/inputs/handoff_v2.md (Russian,
2026-09-02) and verified against the two workbooks in docs/inputs/.
v0.2 2026-09-04 — the sheet the mailbox creates is named `Log`; no other
change. Russian names quoted from the user's spreadsheet stay verbatim.
v0.3 2026-09-12 — correction to the v0.1 entry above: the source file it
names as docs/inputs/handoff_v2.md is in the project as
docs/inputs/ARCHIVE_handoff_v2_2026-09-02.md. The entry itself stays as
written; no other change.
v0.4 2026-10-04 — Vienna tracker documented after the mailbox install:
sheets, target column X, formulas switched to it, locale, time zone, Log.
v0.5 2026-10-05 — "target" now means column X only: T1:V1 is called the
maneuver balance everywhere; the Vienna section gets the letter F.
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
| T1, U1, V1 | maneuver balance per POI: Left 28 / Straight 14 / Right 28 |
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

## F. Vienna tracker (POI_tracker_Vienna_v1)

The user's tracker for Vienna, built by hand from the Düsseldorf one. A
native Google Sheets file. Mailbox v1.3 installed on 2026-10-04.
Snapshot: docs/inputs/POI_tracker_Vienna_v1.xlsx.

- Sheets, in order: Readme, Сводка, R20890-054, R20890-055, R20890-056,
  R20890-057❌, R20890-058, R20890-059, R20890-060❌, R20890-061❌,
  Generator, Log.
- The three sheets marked ❌ are routes another vehicle drove. Their
  names differ from the plain route codes, so the mailbox answers
  no-route for R20890-057, R20890-060 and R20890-061. Rename such a sheet,
  and fix the Generator's references to it, only if that route ever
  becomes the user's.
- Route sheet layout as in Düsseldorf: A the POI number (shown as P1, P2
  by number format), B..E N/S/W/E, F..H Left/Straight/Right, I To go,
  J..R helper sums (J hidden), S status, T1:V1 the maneuver balance
  28 / 14 / 28.
- Column X, header Target in X1, holds the POI's target. Empty means 70.
  40 marks a POI on a straight road, 0 a closed POI. The mailbox writes
  it, and the user may type it by hand.
- I (To go) and S (status) read the target from X: 40 or 0 when X holds
  that number, otherwise Generator!$B$4 (70). The summary's Норма is the
  number of POIs times 70, minus 30 for each POI at 40 and minus 70 for
  each POI at 0. The mailbox function setupTargetColumn switched these
  formulas on 2026-10-04.
- Locale: Romanian. In the live file, function arguments are separated
  by ";". An .xlsx export shows the same formulas with ",". Test any
  formula change in the live file, never on an export alone.
- Time zone: (GMT+02:00) Vienna since 2026-10-04. The two Log rows
  written before that show GMT time (14:43 for a tap at 16:43).
- Log: created by the mailbox on 2026-10-04. Its first four rows are
  tests on R20890-058 POI 12, two +1 / -1 pairs that cancel out.
- There is no automatic Log = B..H check. Log holds only tablet passes,
  while B..H also holds counts entered by hand. Column S already flags
  text, mismatched halves and overruns.
