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
  end of the tab list, and only ever appends to it.
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
  bad-request (unreadable body or unknown action), busy (another push
  held the lock for 30 seconds, retry later), error (anything else).
- Rejection reasons for a single event in push: bad-request, no-route,
  no-poi, text-in-cell, below-zero, bad-target, error.
- The tablet treats applied and duplicate alike as delivered.
- A count that a removal brings to 0 is left as an empty cell, because
  a 0 typed by hand means "impossible maneuver".
