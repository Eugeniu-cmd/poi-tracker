# Data model

v0.3 — 2026-09-04
<!-- Version history (append-only, never rewrite old entries):
v0.1 2026-09-03 — first version (Russian): pass, event, storage, Журнал
sheet, mailbox contract, sync rules. Carried over from the planning chat.
v0.2 2026-09-03 — translated to English per user decision; content
unchanged.
v0.3 2026-09-04 — sheet «Журнал» renamed to `Log` (English everywhere the
project authors text); heading section added (two sources, one-off
alignment, smoothing).
-->

## Pass (one crossing of an intersection)
- Approach side: N / S / W / E.
- Maneuver: L (left) / St (straight) / R (right).
- Belongs to a route (R20890-024…029) and a POI (number 1…197, 70 passes
  each).
- Recorded atomically: maneuver + side in one action after the second tap.
  Neither exists alone.

## Event — the unit of storage and transfer
{ id, ts, route, poi, side, man, delta, ref? }
- id — unique, generated on the tablet at tap time (UUID).
- ts — tap time (Unix, milliseconds).
- delta — +1 (pass recorded) or −1 (pass deleted).
- ref — only when delta = −1: id of the event being deleted.
- Events are append-only. Never edited, never erased.

## Tablet storage (localStorage)
- baseline — 7 numbers per POI per route (snapshot pulled from the
  tracker).
- events — all events, each with a sent flag (delivered to the mailbox or
  waiting).
- Numbers on screen = baseline + sum of events. Empty storage = clean
  start; the app must work correctly in that state.

## User's Google tracker (POI_tracker_Dusseldorf_v1)
- Existing sheets are NOT modified. Route sheet layout: row = POI, number
  in column A, data from row 2; B,C,D,E = N,S,W,E; F,G,H = Left, Straight,
  Right; I..S are formulas — hands off. B..H take numbers only.
- NEW sheet `Log` (created by the mailbox on first run): row = event,
  append-only. Columns: A id · B time · C route · D POI · E side ·
  F maneuver · G delta · H ref.
- The client's spreadsheet (Duesseldorf_Tracking_RoadNet_v1) is never
  touched.

## Mailbox (Apps Script inside the tracker, no UI)
- POST {token, action:'push', events:[…]} → {ok:true, applied:[ids]}
  For each event: if its id already exists in `Log` — skip it (guard
  against double delivery on retries); otherwise append a row to `Log`
  and add delta to the two matching B..H cells of the route sheet. Never
  drive a cell below 0.
- POST {token, action:'pull', route} → {ok:true,
  counts:{poi:[N,S,W,E,L,St,R]}}
- POST {token, action:'ping'} → {ok:true}
- Wrong token → {ok:false, error:'auth'}.

## Sync
- A tap is stored on the tablet instantly and works with no network.
- Delivery to the mailbox is automatic as soon as network is available;
  offline, events queue up and go out in a batch. No schedules ("hourly"
  etc.).
- Manual edits to B..H in the tracker remain allowed; `Log` and B..H
  can then drift apart. A "Log = B..H" consistency check is an open
  decision.

## Heading (compass)
- Two sources, because neither alone is trustworthy in a car:
  GPS course while moving (immune to magnetic interference, useless when
  stopped), magnetometer when stopped (works at a standstill, distorted by
  the vehicle body and the flexible metal mount).
- The tablet sits in a fixed mount, so the angle between "where the tablet
  faces" and "where the car goes" is constant but unknown. It is measured
  once: on a straight road the app compares GPS course with the
  magnetometer reading and stores the offset. The compass then shows the
  car's heading, not the tablet's.
- Readings are smoothed over ~1–2 s before they reach the screen; raw
  values jump on rough roads and a twitching needle is worse than none.
- Step 1 ships the magnetometer source only. GPS course arrives with the
  rest of the GPS work in step 2.
