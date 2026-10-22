# POI Tracker — Claude Code config

Project: tablet PWA. One tap = one intersection pass (POI), written into
the user's Google Sheets tracker via an Apps Script mailbox. The client's
(German) spreadsheet is NEVER touched by this project.

Stage: chapter 6 builds the tablet app, app/index.html, from the
references and the working prototype (_recon/recon-2026-10-18.md).
Mailbox v1.3 was installed in the Vienna tracker on 2026-10-04. v1.4
(mailbox/) is installed nowhere yet: selfTestOnCopy on a copy comes first.

Stack: app/ holds the tablet app: index.html (vanilla JS, its CSS and
JS inside), sw.js (the service worker that keeps it opening offline),
manifest.webmanifest and the icon. No build step, no frameworks, no
CDN, the fonts inside the app. Plus Google Apps Script inside the
user's tracker. Screen references: static HTML in docs/references/.

Hard rules:
1. Do only what the current prompt asks. Smallest working change.
2. "Insert verbatim" blocks go in character-for-character.
3. ACCEPTANCE CHECK runs by fresh reads AFTER the edit, never from memory.
4. docs/inputs/ holds user-provided input files: read-only, never modify.
5. Secrets (mailbox URL, password) never enter project files.
6. Columns B..H of tracker route sheets take numbers only; any text breaks
   the user's generator.
7. App UI copy, documentation and code identifiers are all English.
   Documentation may quote a name or value from the user's spreadsheet
   verbatim. The app UI never does: it describes such a value in English.
8. Your own output is English too: chat replies, task reports,
   acceptance-check output, notes and commit messages. This holds
   whatever language the prompt or the user writes in.
9. Every visual value of the app screen (colour, font size and weight,
   size, spacing, radius, opacity, shadow, motion) comes from
   docs/references/_tokens.css through var(), in references and in
   app/index.html alike. A value missing there is added to _tokens.css
   first, never typed in as a literal (screens.md item 68).
10. Every icon is an official Lucide icon (lucide.dev): its SVG path
    data copied verbatim from the Lucide source, never drawn, merged,
    cropped or edited. Allowed: size, colour, stroke-width 2.6, and
    several icons side by side. A text character never stands in for an
    icon (no ←, →, ↑, ›). The live compass is a drawn widget, not an
    icon (screens.md item 69).
11. Application code, tools and tests are written by you from a spec
    prompt (decided 2026-10-20). Read the files the prompt names first,
    follow the patterns already in the repository (references, tokens,
    the app's own code) and keep to the one sub-problem the prompt asks.
    If it turns out bigger, stop and report.
12. Prove the work with checks you run yourself: the test suite in
    tests/ after every change to app/ or tests/, plus the prompt's own
    checks. Run the suite through the test-runner subagent
    (.claude/agents/test-runner.md): it runs the tests in its own
    context and names the cause of every failure. A single test may be
    run directly (cd tests, then npx playwright test <file>). The report
    shows the command and its output, never a bare tick.
13. Before committing code, the spec-reviewer subagent
    (.claude/agents/spec-reviewer.md), which did not write it, reviews
    the diff against the prompt, docs/screens.md and docs/data-model.md,
    and reports correctness gaps only, not style. Fix what it finds or
    report it.

Where to look:
| What | Where |
|---|---|
| The tablet app: index.html, sw.js, manifest.webmanifest, icon-512.png (v0.3 sends nothing yet, and ?sample in the address loads a sample city) | app/ |
| The app icon's source, rendered to app/icon-512.png | docs/references/app-icon.svg |
| Automated tests of the app (Playwright, run from tests/) | tests/ |
| Project subagents: spec-reviewer (rule 13), test-runner (rule 12) | .claude/agents/ |
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
| Size frame: the app at the tablet's two sizes on a laptop, scaled to fit, theme switch | tools/app-frame.html |
| Measure a tablet's viewport | tools/viewport.html |
| Sensor test: GPS, raw gyroscope, turn and heading | tools/sensor-test.html |
| Working prototype, frozen at v19.7 on 2026-10-21 (testing moves to the app): this page opens it, named in tools/prototype-latest.txt | tools/poi-tracker-prototype.html |

This file carries no version tag or history on purpose: it is a config
Claude Code reads at startup, not a registry of decisions.
