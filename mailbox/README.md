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
  there (70, 40 or 0). An empty or non-numeric cell reads as 70.
- No sheet named Log. The mailbox creates it on the first push, at the
  end of the tab list, and only ever appends to it.

## Install (once per city)

1. Open the tracker. Extensions > Apps Script.
2. Delete everything in the editor's Code.gs. Paste the whole of
   mailbox/Code.gs. Save.
3. Project Settings (gear icon) > Script properties > Add script
   property. Property: TOKEN. Value: the access key you made up. Save.
   The key never goes into any file of this project, a prompt or a chat.
4. Deploy > New deployment > Select type: Web app.
   Execute as: Me. Who has access: Anyone. Deploy.
5. The first deployment asks for permission. Allow it. If Google shows
   "Google hasn't verified this app", choose Advanced, then Go to the
   project. It is your own script, running under your own account.
6. Copy the Web app URL. It ends with /exec.
7. On the tablet: Settings > the city > Connection. Paste the URL into
   Script URL and the key into Access key. Test connection, then Save.

Each city has its own tracker, so its own copy of the script, its own
URL and its own key.

## Updating the code later

Never create a second deployment. A new deployment gets a new URL, and
the tablet keeps talking to the old one, which keeps running the old
code.

1. Paste the new code into the editor's Code.gs. Save.
2. Deploy > Manage deployments > pencil icon on the existing deployment
   > Version: New version > Deploy.

The URL stays the same.

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
