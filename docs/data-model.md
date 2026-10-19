# Data model

v0.16 — 2026-10-19
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
v0.8 2026-10-04 — no Log = B..H consistency check: Log holds only tablet
passes, B..H also holds hand-entered counts.
v0.9 2026-10-05 — tracker section brought in line with the mailbox: one
tracker per city, what the mailbox writes, the no-route and use-post
answers, text in B..H read as 0 by pull.
v0.10 2026-10-06 — six POI types with their maneuver splits, the split a
hard limit per maneuver, "Closed" renamed "Not drivable". The type
lives on the tablet only and the tracker keeps only the target, so the
mailbox and the trackers do not change. A type change sends a target
event only when the target changes. Loading from the sheet keeps a type
that matches the loaded target.
v0.11 2026-10-13 — the consistency audit and the user's six decisions.
A rejected event is never trimmed, the limit of 3,000 counts passes and
removals only, and a delivered target event leaves the tablet at once. A
rejected event can be sent again or dropped. An event inside a push that
has not been answered is never dropped. A pass has at most one removal
that waits or was rejected.
A target event keeps the type it replaced, on the tablet only. A route
has an id on the tablet, and its code can change while the route is not
checked yet: its waiting and rejected events are recorded again under
the new code. A load keeps a type whose target event waits or was
rejected. The mailbox's 'auth' answer stops sending until the connection
is saved or tested again, 'busy' is retried silently. The mailbox must
leave no Log row for a rejected event, which v1.3 can break on 'error'.
The fields the screens need are listed. "Load from sheet" serves a new
route too.
v0.12 2026-10-13 — mailbox v1.4, the user's two decisions and an
independent review. A write that fails is undone: the old cell contents
come back and the event's Log row is cleared, so a rejected event leaves
no trace. A removal needs its ref, and a second removal of the same pass
is rejected as 'already-removed'. Event ids are UUIDs. A push stops
after 4 minutes and names only the events it handled. pull waits for a
running push, and a load waits for unanswered pushes.
v0.13 2026-10-18 — the user's rule for the approach side: the direction
the car drives as it enters the intersection. Driving north and turning
right is North Right.
v0.14 2026-10-18 — "Heading" rewritten for the tablet as tested in the
car (project docs claude/tablet-sensor-test-2026-10-17.md and
claude/prototype-v19.md): no magnetometer, the gyroscope turns the
heading and GPS sets north on straight roads. The tablet keeps the last
course, so the arrow is always on the dial (screens.md item 19).
v0.15 2026-10-19 — "Heading" after the car test of prototype v19.6: a
GPS check also needs the GPS course steady, and a gap over 30 degrees
is taken at once only while the arrow is pale. Right after slow turns
four checks had moved the arrow by 31 to 57 degrees at once.
v0.16 2026-10-19 — the inventory before chapter 6 (project doc
claude/chapter-6-inventory.md): the store is one key written in one
step, with a schema number, UUIDs from crypto only, a tablet-only seq
for order, a posted marker for later sending, cities and lastPoi in
storage, the default baseline, a full storage, the sample city, the
heading's own key, and the app's files for offline loading (CLAUDE.md).
-->

## Pass (one crossing of an intersection)
- Approach side: N / S / W / E, the direction the car drives as it
  enters the intersection. Driving north and turning right is North Right
  (the user's rule, 2026-10-18). The client's column for it is headed
  "Coming from Direction". The side is read before the turn.
- Maneuver: L (left) / St (straight) / R (right).
- Belongs to a route and a POI. Each POI has its own target (see
  "Targets per POI").
- Recorded atomically: maneuver + side in one action after the second tap.
  Neither exists alone.

## Event — the unit of storage and transfer
{ id, ts, city, route, poi, kind, side?, man?, delta?, ref?, target? }
- id — unique, generated on the tablet at tap time (UUID from
  crypto.randomUUID, never from Math.random: a repeated id would make
  the mailbox answer 'duplicate' and a pass would be lost).
- seq — a counter on the tablet only, never sent. History's order and
  "the most recent pass" of Undo last follow seq, never ts, since the
  tablet's clock can be wrong or corrected.
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
- On the tablet only, a target event also keeps fromType, the type it
  replaced, so that "Cancel change" can put it back (screens.md item
  47). fromType is never sent. A POI holds at most one target event that
  waits or was rejected: a new type change drops it (but see the rule on
  unanswered pushes below), and queues a new one only when the new
  target differs from the baseline's target. The new one keeps the
  dropped one's fromType.
- On the tablet only, every event also keeps routeId, the id of its
  route (see "Cities and routes"), so History and Undo last find a
  route's events whatever its code. routeId is never sent. A new event,
  a removal too, carries the route's code at the time it is recorded,
  looked up by routeId.
- Events are never edited. An event still waiting on the tablet may be
  dropped from the queue before delivery (it never reached the sheet, so
  there is nothing to reverse); a delivered event is never changed, only
  countered by a later event, and may be trimmed from the tablet by the
  History limit below.
- A rejected event never reached the sheet either, so it may be dropped
  the same way ("Delete", "Cancel removal", "Cancel change"). "Send
  again" makes it a waiting event again with the same id, and the
  mailbox applies it once, as long as it wrote no Log row for it (see
  "Mailbox").
- An event, once posted, is never dropped until an answer names it
  (applied, duplicate or rejected), whatever happened to the push that
  carried it: a push that timed out or lost the network is sent again
  first. A Delete, Undo last, type change or code change that would
  drop it waits for that answer, then applies to the result: a
  delivered pass gets a removal, a rejected one is dropped. Until then
  the screens show it as waiting.
- A pass has at most one removal that waits or was rejected. Undo last
  skips a pass that has one (screens.md item 9).
- An event keeps its city, route and POI for good, so a rejection for a
  missing tab or row is fixed in the tracker. The one exception is a
  route not checked yet (see "Cities and routes"). When its code
  changes, its waiting and rejected events are dropped and recorded
  again under the new code, with new ids and their original times,
  sides, maneuvers, targets and fromType. None of them reached the
  sheet, so nothing is counted twice. Once the route is checked, its
  code cannot change while any of its events waits or was rejected
  (screens.md item 22).

## Tablet storage (localStorage)
- baseline — per POI, per route, per city: the 7 counts and the target,
  as last pulled from that city's tracker and as advanced by delivered
  events (next bullet).
- types — per POI, per route, per city: the POI type (see "Targets per
  POI"). Kept on the tablet only and outside the baseline, so loading
  from the sheet never wipes it.
- events — the events this tablet recorded, each in one of three states:
  waiting (not yet delivered), delivered (the mailbox confirmed it) or
  rejected (the mailbox refused it, with the reason). Every event names
  its city and its route, so one queue can hold events from more than
  one city. A waiting event inside an unanswered push also carries
  posted, the time of that push, until an answer names it (see "Event"):
  the field exists from the first build and is read only once sending
  exists.
- When the mailbox confirms an event, the tablet folds it into the
  baseline: a pass adds its delta to the two matching counts, a target
  event replaces the POI's target. From then on the event is kept for
  History only and takes no part in the arithmetic.
- Numbers on screen = baseline + sum of waiting pass events. Loading from
  the sheet replaces the baseline and cannot count anything twice,
  because delivered events are already inside the sheet's numbers. A
  rejected event takes no part, as if it were never recorded. The type
  on screen, and the target that follows from it, is the stored type,
  which a waiting or rejected target event has already changed.
- History limit: the tablet keeps the newest 3,000 pass events (passes
  and removals). Only delivered ones are ever trimmed, oldest first. A
  waiting or rejected event is never trimmed, whatever its age. A target
  event leaves the tablet as soon as it is delivered: the baseline then
  holds the target, types holds the type, and History does not list
  sent type changes. A delivered pass whose removal waits or was
  rejected is not trimmed either. If the browser refuses to store more,
  the app trims delivered events beyond the limit and says so, and never
  drops a waiting or rejected event.
- device: the city in use, Theme ('system', 'light' or 'dark', 'system'
  by default) and Sound (on by default).
- heading: the compass's last course in degrees and the time it was
  saved (see "Heading"). Without it the next start points north, pale.
  It has its own key, poi-app:heading, apart from the store, since it is
  written every 2 s.
- cities: the cities with their routes (see "Cities and routes"). A
  route's lastPoi is the POI the working screen opens: lastPoi, else the
  first POI not done, else 1.
- schema: the number of this layout, with a migration step at start.
- The whole store is one localStorage key, poi-app:store, written in one
  setItem per change, so a crash never leaves half a change behind. The
  app's keys all start with poi-app: and it never touches other keys of
  the site (the prototype's poi-proto-* logs live beside it). At start
  the app asks for persistent storage (navigator.storage.persist) and
  takes a Web Lock on the store: a second tab of the app shows a banner
  and records nothing.
- A POI with no baseline reads as seven zeros, and its target follows
  its type (new POIs start as Intersection, 70).
- A write that still fails after the trim above refuses the tap: the
  dialog of screens.md item 78 says so, and nothing is counted.
- Sample data: with empty storage the app shows "No city" (screens.md
  item 76). A sample loads only through ?sample in the address, into a
  city with a reserved id, the name "Sample city", no mailbox and route
  codes that match no sheet anywhere (SAMPLE-001, SAMPLE-002). A city
  without a mailbox never sends, so sample events can never reach a
  tracker, and "Erase everything" removes the sample like any city.
- Empty storage = clean start; the app must work correctly in that
  state.

## User's Google tracker (one per city)
- Route sheet layout: row = POI, number in column A, data from row 2;
  B,C,D,E = N,S,W,E; F,G,H = Left, Straight, Right; I..S are formulas;
  X holds the POI's target. B..H take numbers only.
- Software writes only B..H and X of route sheets, and appends to `Log`.
  The one exception is the mailbox's setupTargetColumn, run once per
  tracker from the editor: it rewrites the formulas of I, S and the
  summary's Норма to read X (see "Targets per POI").
- NEW sheet `Log` (created by the mailbox on first run): row = event,
  append-only. Columns: A id · B time · C route · D POI · E side ·
  F maneuver · G delta · H ref · I target. A pass row leaves I empty; a
  target row leaves E..H empty. The mailbox clears a row only to undo
  its own write that failed a moment before (see "Mailbox"), so an
  empty row can sit between others.
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
- An event id must be a UUID, else 'bad-request' (the self-test uses ids
  of its own). A removal (delta −1) must carry ref, the UUID of the pass
  it removes, else 'bad-request'. If a removal in `Log` already took out
  the pass that ref names, the removal is rejected as 'already-removed'
  and nothing changes. This holds within one push too.
- Applying a target event: write target into the POI's cell of the
  target column (see "Targets per POI") and append a row to `Log`.
- Since v1.4 the mailbox appends the `Log` row, writes the cells and
  flushes, all inside the event's own check. If anything fails, it puts
  the old cell contents back (a formula as a formula, text as text),
  clears the `Log` row carrying that event's id, and answers 'error'.
  Each undo step is tried twice, a second apart. The `Log` row is
  cleared only when every cell is back. If a cell cannot be put back,
  the row stays, so a resend answers 'duplicate' and the tablet counts
  what the sheet may hold, and column S shows a pass left half written.
  That takes two failures in a row and is the one known limit.
- A push stops taking new events after 4 minutes, because Apps Script
  ends any run at 6 and a run cut short could leave a Log row without
  its cells. Its answer then names only the events it handled, and the
  tablet sends the others again, as for an unanswered push (see
  "Event").
- Rejection reasons, one per event: 'bad-request' (malformed event or
  unknown side, maneuver or delta), 'no-route' (no sheet of that exact
  name with "POI" in A1), 'no-poi' (no row with that number in column
  A), 'text-in-cell' (one of the two cells holds text), 'below-zero',
  'already-removed' (the pass this removal names was already removed),
  'bad-target' (not 70, 40 or 0), 'error' (anything else failed for
  that event; the rest of the batch still runs).
- The mailbox leaves no Log row for an event it rejects, so that "Send
  again" applies it once. v1.3 could break this on 'error' (it wrote
  the Log row before the cells and never undid it). v1.4 undoes the
  failed event's writes, as above. The tablet still sends at most one
  removal per pass (see "Event"), and the mailbox now refuses a second
  one as well.
- A push waits up to 30 s for the script lock; if another push still
  holds it → {ok:false, error:'busy'}, and the tablet retries a few
  seconds later without telling the user.
- POST {token, action:'pull', route} → {ok:true,
  counts:{poi:[N,S,W,E,L,St,R]}, targets:{poi:target}} — one route per
  call; a missing target cell reads as 70. A route with no sheet of that
  name → {ok:false, error:'no-route'}. Text in B..H reads as 0 and is not
  reported; column S of the sheet shows it, the answer does not. Since
  v1.4 pull waits for the script lock as push does, so it never reads a
  push half done, and answers {ok:false, error:'busy'} when it cannot
  get the lock. The tablet then tries the load again a few seconds
  later, as for a busy push.
- POST {token, action:'ping'} → {ok:true, version}
- Wrong token → {ok:false, error:'auth'}. The tablet keeps every event
  waiting, sets the city's keyRejected and shows "Access key rejected"
  (screens.md item 72). While it is set, the tablet stops sending on its
  own. Saving the connection, or a ping that answers ok ("Test
  connection"), clears it and sending starts again at once. 'no-answer'
  and 'offline' leave it set. A load that answers 'auth' leaves a new
  route "Not checked yet".
- GET → {ok:false, error:'use-post', version}.

## Sync
- A tap is stored on the tablet instantly and works with no network.
- Delivery to the mailbox is automatic as soon as network is available;
  offline, events queue up and go out in a batch. No schedules ("hourly"
  etc.).
- Sending groups the queue by city and posts each group to that city's
  mailbox. A city with no mailbox configured simply keeps queuing.
- Manual edits to B..H in the tracker remain allowed; `Log` and B..H
  can then drift apart. A "Log = B..H" consistency check was dropped on
  2026-10-04: Log holds only tablet passes while B..H also holds
  hand-entered counts, so the two never match on a route started by hand,
  and column S already flags text, mismatched halves and overruns.
- "Load from sheet" pulls one route per call and replaces that route's
  baseline (counts and targets) with what the tracker holds. The user
  loads the active route from the Sync panel. A new route loads right
  after it is added, and the 'no-route' answer keeps it from being
  saved. A route never loaded loads when it is first opened. Passes
  still waiting on the tablet are kept and sent as usual: they are not
  in the sheet yet, so the loaded numbers plus the waiting passes are
  exactly right. Nothing is discarded and no warning is needed. A load
  never runs while a push is unanswered: its events may already be in
  the sheet, so the tablet first sends that push again until an answer
  names them.

## Heading (compass)
- The compass shows where the car drives (screens.md item 19). The
  user's tablet has no magnetometer, so there is no magnet and no mount
  offset. Tested in the car on 2026-10-17 (project docs
  claude/tablet-sensor-test-2026-10-17.md and claude/prototype-v19.md).
- The raw gyroscope turns the heading all the time: its rotation about
  "up", "up" being a slow average of the accelerometer, so the angle of
  the mount does not matter. The Generic Sensor API is read first,
  "devicemotion" while it is silent. Android's ready-made orientation is
  not read: on this tablet it gives only zeros.
- The gyroscope drifts about 0.02 degrees a second. The drift is measured
  and removed while the car stands (GPS below 0.3 m/s): half-second
  averages that agree within 1 degree a second for 3 s. A turn above 0.5
  degrees a second is the car creeping round a corner, not drift.
- GPS sets north, only while the car drives straight at 11 km/h (3 m/s)
  or more: the gyroscope saw less than 3 degrees in the last 2 s, and the
  last 3 GPS courses, at most 1.6 s apart, lie within 5 degrees of the
  newest. In a turn the GPS course lags 2 to 3 s, so right after a turn
  the gyroscope reads straight before GPS has caught up. Below 11 km/h
  the course is noise. Each such fix pulls the heading 30% of the way to
  the GPS course. A gap over 30 degrees is taken at once only while the
  arrow is pale, after a start or a pause. With the gyroscope silent the
  live GPS course is shown.
- The motion sensors can pause without an error while something else has
  the focus. A sensor counts as working only with a reading in the last
  second, on the page's own clock. While they are silent the arrow keeps
  the last course, pale. After a pause longer than 2 s it stays pale
  until the next GPS check. Location is asked before the motion sensors
  start, and the sensors restart when the page is visible and focused
  again.
- The heading on screen is smoothed with a time constant of 0.6 s.
- The tablet keeps the last course (see "Tablet storage"), saved every
  2 s and when the page goes away. A new start shows it pale and the
  gyroscope turns it until the first GPS check. With nothing saved the
  arrow points north, pale (decided 2026-10-18).
- The side of a pass is the quarter the arrow points to (see "Pass").

## Cities and routes
- A city = { id, name, mailboxUrl, token, routes[], lastRoute, testedAt,
  testResult, sentAt, keyRejected }. Every city has its own Google
  tracker, so its own mailbox address and password. lastRoute is the
  route the working screen opens when the city is put in use. testedAt
  and testResult ('ok', 'auth', 'no-answer' or 'offline') record the
  last "Test connection". sentAt is the time of the last successful
  send. keyRejected is set by an 'auth' answer (see "Mailbox"). The
  sample city of "Tablet storage" carries sample: true and can never get
  a mailbox.
- A route = { id, code, poiCount, checked, loadedAt, lastPoi }. code and
  poiCount are typed in by hand. The route code must match the sheet
  name in that city's tracker exactly, or the mailbox finds nothing to
  write to. id is a UUID made on the tablet, as event ids are, and never
  changes, and the tablet
  keys every stored value of a route by it, never by its code. checked
  is set by the route's first successful load or its first delivered
  event. Until then the route reads "Not checked yet" and its code can
  still change (see "Event"). loadedAt is the time of the last load.
- The target per POI is not a route setting: see "Targets per POI".
- Cities are never deleted automatically. Moving from one city to the next
  adds a city; the previous one keeps its routes and its baseline.
- mailboxUrl and token live on the tablet only. They never enter project
  files, prompts or chat.

## Targets per POI
- The client's rule: an intersection takes 70 passes; a POI on a straight
  road takes 40; a POI that cannot be driven (private property, closed)
  takes 0.
- Each POI carries one of six types, and the target follows from the
  type. The type also fixes which maneuvers are possible and the split
  the crew drives (field rule, 2026-10-06):
  - Intersection: Left 28, Straight 14, Right 28 (target 70).
  - No straight: Left 35, Right 35 (70).
  - No left: Straight 14, Right 56 (70).
  - No right: Left 56, Straight 14 (70).
  - Straight only: Straight 40 (40). A POI on a straight road, or an
    intersection where only Straight is possible.
  - Not drivable: none (0). The name avoids "Closed", which reads like
    "done".
  The split is a hard limit: a maneuver whose share is full takes no
  more passes, and a maneuver the type does not allow takes none.
  Approach sides have no limit. The passenger sets the type from the
  working screen, looking at the intersection, without leaving the
  screen. New POIs start as Intersection.
- "Done", the "N of T" counter, the disc lock and the progress bar follow
  the POI's own target, never a fixed 70. A not-drivable POI is locked at once.
- The type itself lives on the tablet only (see "Tablet storage"). The
  tracker holds only the target. A change of type that changes the
  target is a target event: stored on the tablet instantly, delivered
  through the same queue as passes, written by the mailbox into the
  tracker. A change between types with the same target (the four types
  at 70) sends no event.
- Loading from the sheet keeps a stored type while a target event for
  that POI waits or was rejected, since the tracker does not hold that
  change yet. Otherwise it keeps a stored type while its target equals
  the tracker's, and else the type follows the tracker's target: 70
  Intersection, 40 Straight only, 0 Not drivable. If the tablet's data is
  lost, No straight, No left and No right come back as Intersection and
  are set again. Counts and passes are not affected.
- In the tracker the target lives in column X of every route sheet, in
  every city's tracker: the first column free of the existing layout,
  never inserted between existing columns. A new tracker must keep X
  free. An empty or non-numeric X reads as 70. "To go", the БОЛЬШЕ
  status and the summary's Норма read from it instead of the fixed 70.
  The Generator is unchanged: it already emits empty rows beyond the
  passes driven, so a POI at 40 fills 40 of its 70 rows.
