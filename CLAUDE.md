# POI Tracker — Claude Code config

Project: tablet PWA. One tap = one intersection pass (POI), written into
the user's Google Sheets tracker via an Apps Script mailbox. The client's
(German) spreadsheet is NEVER touched by this project.

Stage: the mailbox (mailbox/) is built and runs in the Vienna tracker.
The tablet app is not built yet: references first, then app/index.html.

Stack: one self-contained page app/index.html (vanilla JS, CSS and JS
inside the file, no build step, no frameworks) + Google Apps Script inside
the user's tracker. Screen references: static HTML in docs/references/.

Hard rules:
1. Do only what the current prompt asks. Smallest working change.
2. "Insert verbatim" blocks go in character-for-character.
3. ACCEPTANCE CHECK runs by fresh reads AFTER the edit, never from memory.
4. docs/inputs/ holds user-provided input files: read-only, never modify.
5. Secrets (mailbox URL, password) never enter project files.
6. Columns B..H of tracker route sheets take numbers only; any text breaks
   the user's generator.
7. App UI copy, documentation and code identifiers are all English. The
   only exception is a verbatim quotation of a name or value that exists
   in the user's spreadsheet.
8. Your own output is English too: chat replies, task reports,
   acceptance-check output, notes and commit messages. This holds
   whatever language the prompt or the user writes in.

Where to look:
| What | Where |
|---|---|
| Data model, Log sheet, mailbox contract | docs/data-model.md |
| Screen decision registry | docs/screens.md |
| Design tokens | docs/references/_tokens.css |
| Working screen reference | docs/references/main-screen.html |
| Settings reference | docs/references/settings.html |
| History reference | docs/references/history.html |
| Spreadsheet layouts, export procedure, bug rules | docs/spreadsheets.md |
| Superseded planning dump (Russian, historical) | docs/inputs/ARCHIVE_handoff_v2_2026-09-02.md |
| RECON snapshots | _recon/ |
| Mailbox (Apps Script) | mailbox/Code.gs, mailbox/README.md |

This file carries no version tag or history on purpose: it is a config
Claude Code reads at startup, not a registry of decisions.
