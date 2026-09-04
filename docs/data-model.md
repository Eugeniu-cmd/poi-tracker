# Data model

v0.2 — 2026-09-03
<!-- Version history (append-only, never rewrite old entries):
v0.1 2026-09-03 — first version (Russian): pass, event, storage, Журнал
sheet, mailbox contract, sync rules. Carried over from the planning chat.
v0.2 2026-09-03 — translated to English per user decision; content
unchanged.
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
- NEW sheet «Журнал» (created by the mailbox on first run): row = event,
  append-only. Columns: A id · B time · C route · D POI · E side ·
  F maneuver · G delta · H ref.
- The client's spreadsheet (Duesseldorf_Tracking_RoadNet_v1) is never
  touched.

## Mailbox (Apps Script inside the tracker, no UI)
- POST {token, action:'push', events:[…]} → {ok:true, applied:[ids]}
  For each event: if its id already exists in «Журнал» — skip it (guard
  against double delivery on retries); otherwise append a row to «Журнал»
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
- Manual edits to B..H in the tracker remain allowed; «Журнал» and B..H
  can then drift apart. A "Журнал = B..H" consistency check is an open
  decision.
