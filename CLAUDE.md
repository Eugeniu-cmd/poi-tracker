# POI Tracker — Claude Code config

Project: tablet PWA. One tap = one intersection pass (POI), written into
the user's Google Sheets tracker via an Apps Script mailbox. The client's
(German) spreadsheet is NEVER touched by this project.

Stage: documentation skeleton. No app code yet.

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
7. App UI copy is Russian; all documentation and code identifiers are
   English.

Where to look:
| What | Where |
|---|---|
| Data model, Журнал sheet, mailbox contract | docs/data-model.md |
| Screen decision registry | docs/screens.md |
| Design tokens | docs/references/_tokens.css |
| Project context, spreadsheets, known bugs | docs/inputs/handoff_v2.md |
| RECON snapshots | _recon/ |
