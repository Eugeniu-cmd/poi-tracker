# Data model

v0.7 — 2026-10-04
<!-- Version history (append-only, never rewrite old entries):
v0.1 2026-09-03 — first version (Russian): pass, event, storage, Журнал
sheet, mailbox contract, sync rules. Carried over from the planning chat.
v0.2 2026-09-03 — translated to English per user decision; content
unchanged.
v0.3 2026-09-04 — sheet «Журнал» renamed to `Log` (English everywhere the
project authors text); heading section added (two sources, one-off
alignment, smoothing).
v0.4 2026-09-05 — cities: the app holds a list of cities, each with its
own tracker, mailbox and routes; events carry a city id; routes are
entered by hand (code + POI count); 70 passes per POI is a constant.
v0.5 2026-10-03 — mailbox contract and tablet arithmetic settled:
delivered events fold into the baseline and stay for History only;
History keeps 3,000 events; a pass is applied whole or not at all; push
answers with applied / duplicate / rejected; pull and "Load from sheet"
work per route. Targets per POI: 70 / 40 / 0 by type, set from the
working screen, stored in a tracker column; "70 is a constant" retired.
v0.6 2026-10-04 — mailbox written (mailbox/Code.gs v1.0): side and
maneuver codes fixed, full list of rejection reasons, ping returns the
script version, busy on a held lock, the target column is X in every
tracker.
v0.7 2026-10-04 — mailbox v1.1 after the live install in Vienna: a count
that a removal brings to 0 is left empty, since a hand-typed 0 marks an
impossible maneuver.
-->

## Pass (one crossing of an intersection)
- Approach side: N / S / W / E.
- Maneuver: L (left) / St (straight) / R (right).
- Belongs to a route and a POI. Each POI has its own target (see
  "Targets per POI").
- Recorded atomically: maneuver + side in one action after the second tap.
  Neither exists alone.

## Event — the unit of storage and transfer
{ id, ts, city, route, poi, kind, side?, man?, delta?, ref?, target? }
- id — unique, generated on the tablet at tap time (UUID).
- city — id of the city this event belongs to. The queue may hold events
  from more than one city; each event goes to its own city's mailbox.
- ts — tap time (Unix, milliseconds).
- kind — 'pass' or 'target'.
- side — 'N' | 'S' | 'W' | 'E'; man — 'L' | 'St' | 'R'.
- A pass event carries side, man and delta: +1 (pass recorded) or −1
  (pass deleted); ref — only when delta = −1: id of the pass being
  deleted.
- A target event carries target: 70, 40 or 0 — the POI's new target (see
  "Targets per POI").
- Events are never edited. An event still waiting on the tablet may be
  dropped from the queue before delivery (it never reached the sheet, so
  there is nothing to reverse); a delivered event is never changed, only
  countered by a later event, and may be trimmed from the tablet by the
  History limit below.

## Tablet storage (localStorage)
- baseline — per POI, per route, per city: the 7 counts and the target,
  as last pulled from that city's tracker and as advanced by delivered
  events (next bullet).
- events — the events this tablet recorded, each in one of three states:
  waiting (not yet delivered), delivered (the mailbox confirmed it) or
  rejected (the mailbox refused it, with the reason). Every event names
  its city and its route, so one queue can hold events from more than
  one city.
- When the mailbox confirms an event, the tablet folds it into the
  baseline: a pass adds its delta to the two matching counts, a target
  event replaces the POI's target. From then on the event is kept for
  History only and takes no part in the arithmetic.
- Numbers on screen = baseline + sum of waiting pass events. Loading from
  the sheet replaces the baseline and cannot count anything twice,
  because delivered events are already inside the sheet's numbers.
- History limit: the tablet keeps the newest 3,000 events. Only delivered
  or rejected events are ever trimmed, oldest first; a waiting event —
  a pass or a removal — is never trimmed, whatever its age. If the
  browser refuses to store more, the app trims delivered events beyond
  the limit and says so, and never drops a waiting event.
- Empty storage = clean start; the app must work correctly in that
  state.

## User's Google tracker (POI_tracker_Dusseldorf_v1)
- Existing sheets are NOT modified. Route sheet layout: row = POI, number
  in column A, data from row 2; B,C,D,E = N,S,W,E; F,G,H = Left, Straight,
  Right; I..S are formulas — hands off. B..H take numbers only.
- NEW sheet `Log` (created by the mailbox on first run): row = event,
  append-only. Columns: A id · B time · C route · D POI · E side ·
  F maneuver · G delta · H ref · I target. A pass row leaves I empty; a
  target row leaves E..H empty.
- The client's spreadsheet (Duesseldorf_Tracking_RoadNet_v1) is never
  touched.

## Mailbox (Apps Script inside the tracker, no UI)
- POST {token, action:'push', events:[…]} → {ok:true, applied:[ids],
  duplicate:[ids], rejected:[{id, reason}]}
  For each event: if its id already exists in `Log` — report it under
  duplicate and change nothing (guard against double delivery on
  retries). Otherwise apply it and report it under applied, or refuse it
  and report it under rejected with a reason. The tablet treats applied
  and duplicate alike as delivered.
- Applying a pass: add delta to the two matching B..H cells of the route
  sheet and append a row to `Log`. The event is applied whole or not at
  all: if either cell would go below 0, neither cell changes, no `Log`
  row is written, and the event is rejected (reason 'below-zero'). A
  cell that comes to 0 is left empty, not written as 0: a 0 typed by
  hand marks an impossible maneuver.
- Applying a target event: write target into the POI's cell of the
  target column (see "Targets per POI") and append a row to `Log`.
- Rejection reasons, one per event: 'bad-request' (malformed event or
  unknown side, maneuver or delta), 'no-route' (no sheet of that exact
  name with "POI" in A1), 'no-poi' (no row with that number in column
  A), 'text-in-cell' (one of the two cells holds text), 'below-zero',
  'bad-target' (not 70, 40 or 0), 'error' (anything else failed for
  that event; the rest of the batch still runs).
- A push waits up to 30 s for the script lock; if another push still
  holds it → {ok:false, error:'busy'}, and the tablet retries later.
- POST {token, action:'pull', route} → {ok:true,
  counts:{poi:[N,S,W,E,L,St,R]}, targets:{poi:target}} — one route per
  call; a missing target cell reads as 70.
- POST {token, action:'ping'} → {ok:true, version}
- Wrong token → {ok:false, error:'auth'}.

## Sync
- A tap is stored on the tablet instantly and works with no network.
- Delivery to the mailbox is automatic as soon as network is available;
  offline, events queue up and go out in a batch. No schedules ("hourly"
  etc.).
- Sending groups the queue by city and posts each group to that city's
  mailbox. A city with no mailbox configured simply keeps queuing.
- Manual edits to B..H in the tracker remain allowed; `Log` and B..H
  can then drift apart. A "Log = B..H" consistency check is an open
  decision.
- "Load from sheet" pulls one route — the active one — and replaces that
  route's baseline (counts and targets) with what the tracker holds.
  Passes still waiting on the tablet are kept and sent as usual: they
  are not in the sheet yet, so the loaded numbers plus the waiting
  passes are exactly right. Nothing is discarded and no warning is
  needed.

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

## Cities and routes
- A city = { id, name, mailboxUrl, token, routes[] }. Every city has its
  own Google tracker, so its own mailbox address and password.
- A route = { code, poiCount }. Both are typed in by hand. The route code
  must match the sheet name in that city's tracker exactly, or the mailbox
  finds nothing to write to.
- The target per POI is not a route setting: see "Targets per POI".
- Cities are never deleted automatically. Moving from one city to the next
  adds a city; the previous one keeps its routes and its baseline.
- mailboxUrl and token live on the tablet only. They never enter project
  files, prompts or chat.

## Targets per POI
- The client's rule: an intersection takes 70 passes; a POI on a straight
  road takes 40; a POI that cannot be driven (private property, closed)
  takes 0.
- Each POI therefore carries a type with three positions — intersection
  (70) / straight (40) / closed (0) — and the target follows from the
  type. The passenger sets it from the working screen, looking at the
  intersection, without leaving the screen. New POIs start as
  intersection.
- "Done", the "N of T" counter, the disc lock and the progress bar follow
  the POI's own target, never a fixed 70. A closed POI is locked at once.
- A change of type is a target event: stored on the tablet instantly,
  delivered through the same queue as passes, written by the mailbox into
  the tracker.
- In the tracker the target lives in column X of every route sheet, in
  every city's tracker: the first column free of the existing layout,
  never inserted between existing columns. A new tracker must keep X
  free. An empty or non-numeric X reads as 70. "To go", the БОЛЬШЕ
  status and the summary's Норма read from it instead of the fixed 70.
  The Generator is unchanged: it already emits empty rows beyond the
  passes driven, so a POI at 40 fills 40 of its 70 rows.
