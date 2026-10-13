# POI Tracker mailbox

An Apps Script that lives inside one city's tracker spreadsheet. The
tablet app sends it passes and target changes, and it writes them into
the route sheets. It has no user interface. The contract it implements
is docs/data-model.md, section "Mailbox".

## What the tracker must have

- A native Google Sheets file. An .xlsx opened in Google Sheets has no
  Extensions > Apps Script menu. Convert it first with File > Save as
  Google Sheets.
- One sheet per route, named exactly as the route code in the app (for
  example R20890-058), with "POI" in A1 and the POI numbers in column A.
- Columns B..H on every route sheet: N, S, W, E, Left, Straight, Right.
  Numbers only.
- Column X free on every route sheet. The mailbox keeps each POI's target
  there (70, 40 or 0). An empty or non-numeric cell reads as 70. You may
  also type 40 or 0 there by hand.
- No sheet named Log. The mailbox creates it on the first push, at the
  end of the tab list, and appends to it. It clears a row only to undo
  its own write that failed a moment before (v1.4).
- File > Settings > Time zone set to the city's time zone. The Log's
  time column is shown in that zone; with the default GMT a tap at 16:43
  in Vienna reads 14:43.

## Install (once per city)

1. Open the tracker. Extensions > Apps Script.
2. Delete everything in the editor's Code.gs. Paste the whole of
   mailbox/Code.gs. Save.
3. Once per tracker: pick setupTargetColumn in the function list next to
   Debug, press Run, allow the permission prompt if one appears. After
   new code is pasted the list jumps back to doGet, and Run on doGet
   does nothing, so pick setupTargetColumn again every time. It
   switches "To go" (column I), the status (column S) and the summary's
   norm from the fixed 70 to the target in column X. The Execution log
   lists every sheet and how many cells changed. It reads the
   spreadsheet's own argument separator ("," or ";", which depends on the
   locale) and repairs cells written by v1.2 with the wrong one. Running
   it again changes nothing. File > Version history restores the sheet if
   needed.
4. Project Settings (gear icon) > Script properties > Add script
   property. Property: TOKEN. Value: the access key you made up. Save.
   The key never goes into any file of this project, a prompt or a chat.
5. Deploy > New deployment > Select type: Web app.
   Execute as: Me. Who has access: Anyone. Deploy.
   The Romanian interface shows two entries both named "Oricine": the
   first is "Anyone with Google account", the last is "Anyone". Pick the
   last.
6. The first deployment asks for permission. Allow it. If Google shows
   "Google hasn't verified this app", choose Advanced, then Go to the
   project. It is your own script, running under your own account.
7. Copy the Web app URL. It ends with /exec.
8. On the tablet: Settings > the city > Connection. Paste the URL into
   Script URL and the key into Access key. Test connection, then Save.

Each city has its own tracker, so its own copy of the script, its own
URL and its own key.

## Check it from a computer

In the VS Code terminal, type powershell and press Enter, then:

1. $u = Read-Host "URL"   then paste the URL at the URL: prompt.
2. $k = Read-Host "Key"   then paste the key at the Key: prompt.
   Paste at these prompts with a right-click: Ctrl+V types ^V there.
3. cls
4. function mb($b) { $b.token = $k; Invoke-RestMethod -Uri $u -Method Post -ContentType 'text/plain' -Body ($b | ConvertTo-Json -Depth 5 -Compress) }
5. mb @{action='ping'}   must answer True and the version.
6. (mb @{action='pull'; route='R20890-058'}).counts.'3' -join ' '
   must print the seven numbers of POI 3 as the sheet shows them.

A page of HTML mentioning a Google sign-in instead of an answer means
Who has access is not "Anyone". Fix it in Deploy > Manage deployments
> pencil icon; the URL does not change.

## Changing the key

Project Settings > Script properties > Edit script properties > new
value for TOKEN > Save. No new deployment is needed: the key is read on
every request. Enter the new key on the tablet too.

## Test the safety net on a copy (v1.4)

Since v1.4 a write that fails is undone: the cells get their old values
back and the Log row of that event is cleared, so "Send again" applies
it once. A second removal of a pass already removed is refused as
already-removed. selfTestOnCopy proves both on a copy of a tracker.
Never run it on the real tracker: the test writes and removes passes.

1. Open the tracker. File > Make a copy. Open the copy. The copy carries
   its own copy of the script.
2. In the copy: Extensions > Apps Script. Paste the whole of
   mailbox/Code.gs into the editor's Code.gs. Save.
3. In the copy only: Project Settings (gear icon) > Script properties >
   Add script property. Property: SELFTEST. Value: the copy's own id,
   the long code between /d/ and /edit in the copy's address bar. Save.
   The test refuses to run unless SELFTEST holds the id of the file it
   runs in, so it can never run in the real tracker.
4. Pick selfTestOnCopy in the function list next to Debug and press Run.
   Allow the permission prompt if one appears.
5. The Execution log names the POI it used, shows one line per step and
   ends with ALL PASS. It picks the first POI whose N and Left hold a
   number above 0 or nothing, so a hand-typed 0 is never touched.
   Any FAIL line: stop, do not update the real tracker, and send the log
   to the planning chat.
6. Delete the copy (File > Move to trash).

Then update the real tracker as below. Never add SELFTEST to it.

## Updating the code later

Never create a second deployment. A new deployment gets a new URL, and
the tablet keeps talking to the old one, which keeps running the old
code.

1. Paste the new code into the editor's Code.gs. Save.
2. Deploy > Manage deployments > pencil icon on the existing deployment
   > Version: New version > Deploy.

The URL stays the same. ping answers with the new version number.
Running setupTargetColumn after an update is always safe.

## Notes for the app

- Send every request as POST with the body as plain text
  (Content-Type: text/plain) holding the JSON. Apps Script does not
  answer the browser's preflight request, so application/json fails.
- ping answers {ok:true, version}. Test connection uses it.
- Errors for the whole request: auth (wrong or missing key),
  bad-request (unreadable body or unknown action), no-route (pull for a
  route with no sheet of that name), busy (another push held the lock
  for 30 seconds, retry later), error (anything else). A GET answers
  use-post.
- pull reads text in B..H as 0 and does not report it. Column S of the
  sheet shows that error, the pull answer does not.
- Rejection reasons for a single event in push: bad-request, no-route,
  no-poi, text-in-cell, below-zero, already-removed, bad-target, error.
- Every event id is a UUID. Any other id is bad-request (v1.4).
- A removal (delta -1) must carry ref, the id of the pass it removes. A
  removal without a ref is bad-request, and a second removal of the same
  pass is already-removed (v1.4).
- After error nothing of that event stays in the tracker, so it may be
  sent again (v1.4). The one limit: if a cell cannot be put back, twice,
  the Log row stays too, so a resend answers duplicate, and column S
  shows a pass left half written.
- A push stops taking new events after 4 minutes, since Apps Script ends
  any run at 6. Its answer then names only the events it handled. Send
  the others again (v1.4).
- pull waits for a running push, like push does, and answers busy when
  it cannot (v1.4).
- The tablet treats applied and duplicate alike as delivered.
- A count that a removal brings to 0 is left as an empty cell, because
  a 0 typed by hand means "impossible maneuver".
