/**
 * POI Tracker mailbox.
 * Apps Script bound to one city's tracker spreadsheet. No UI.
 * The tablet app talks to it with three actions: ping, pull, push.
 * Contract: docs/data-model.md, section "Mailbox".
 * Install steps: mailbox/README.md.
 *
 * The access key is NOT in this file. It lives in
 * Project Settings > Script properties, under the name TOKEN.
 */

var VERSION = '1.4';
var LOG_SHEET = 'Log';
var LOG_HEADER = ['id', 'time', 'route', 'poi', 'side', 'maneuver', 'delta', 'ref', 'target'];
var TARGET_COL = 24;            // column X
var SIDE_COL = { N: 2, S: 3, W: 4, E: 5 };   // columns B..E
var MAN_COL = { L: 6, St: 7, R: 8 };         // columns F..H
var TARGETS = [70, 40, 0];
var DEFAULT_TARGET = 70;
var LOCK_WAIT_MS = 30000;
var PUSH_BUDGET_MS = 240000;    // a push stops taking new events after 4 minutes (Apps Script stops a run at 6)
var FIXED_TARGET = 'Generator!$B$4';   // the old fixed 70 in tracker formulas

function doGet() {
  return reply_({ ok: false, error: 'use-post', version: VERSION });
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e && e.postData ? e.postData.contents : '');
  } catch (err) {
    return reply_({ ok: false, error: 'bad-request' });
  }
  if (!body || typeof body !== 'object') {
    return reply_({ ok: false, error: 'bad-request' });
  }

  var expected = PropertiesService.getScriptProperties().getProperty('TOKEN');
  if (!expected || body.token !== expected) {
    return reply_({ ok: false, error: 'auth' });
  }

  try {
    if (body.action === 'ping') return reply_({ ok: true, version: VERSION });
    if (body.action === 'pull') return reply_(pull_(body.route));
    if (body.action === 'push') return reply_(push_(body.events, null));
    return reply_({ ok: false, error: 'bad-request' });
  } catch (err) {
    return reply_({ ok: false, error: 'error', message: String(err) });
  }
}

function reply_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- pull ---------- */

/** pull waits for a running push, so a load never reads a push half done. */
function pull_(route) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) return { ok: false, error: 'busy' };
  try {
    return pullUnlocked_(route);
  } finally {
    lock.releaseLock();
  }
}

function pullUnlocked_(route) {
  var sheet = routeSheet_(route);
  if (!sheet) return { ok: false, error: 'no-route' };

  var counts = {};
  var targets = {};
  var last = sheet.getLastRow();
  if (last >= 2) {
    var rows = sheet.getRange(2, 1, last - 1, TARGET_COL).getValues();
    for (var i = 0; i < rows.length; i++) {
      var poi = rows[i][0];
      if (!isPoiNumber_(poi)) continue;
      var seven = [];
      for (var c = 1; c <= 7; c++) {
        var v = rows[i][c];
        seven.push(typeof v === 'number' ? v : 0);
      }
      counts[poi] = seven;
      targets[poi] = readTarget_(rows[i][TARGET_COL - 1]);
    }
  }
  return { ok: true, counts: counts, targets: targets };
}

/* ---------- push ---------- */

/**
 * faultId is null for every real request. Only selfTestOnCopy passes an
 * event id there, to make that event fail after its writes and so prove
 * that the undo works.
 * A push that runs past PUSH_BUDGET_MS stops between two events. Its
 * answer names only the events it handled, and the tablet sends the rest
 * again (data-model.md).
 */
function push_(events, faultId) {
  if (!Array.isArray(events)) return { ok: false, error: 'bad-request' };

  var started = now_();   // the budget counts the wait for the lock too
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) return { ok: false, error: 'busy' };

  try {
    var log = logSheet_();
    var known = readLog_(log);
    var ctx = { log: log, seen: known.seen, removed: known.removed, sheets: {}, rows: {},
                faultId: faultId || null };
    var applied = [];
    var duplicate = [];
    var rejected = [];

    for (var i = 0; i < events.length; i++) {
      if (now_() - started > PUSH_BUDGET_MS) break;
      var ev = events[i];
      var id = ev && typeof ev.id === 'string' ? ev.id : null;
      var result;
      try {
        result = applyEvent_(ev, ctx);
      } catch (err) {
        result = 'error';
      }
      if (result === 'applied') applied.push(id);
      else if (result === 'duplicate') duplicate.push(id);
      else rejected.push({ id: id, reason: result });
    }

    SpreadsheetApp.flush();
    return { ok: true, applied: applied, duplicate: duplicate, rejected: rejected };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Returns 'applied', 'duplicate' or a rejection reason.
 * Order of writes: the Log row first, then the cells, then a flush, so a
 * failed write surfaces here and not later. If anything fails after the
 * Log row, undo_ puts the old cells back and clears that Log row, and the
 * error goes up to push_, which answers 'error'. A refused event leaves
 * no trace, so "Send again" applies it once (data-model.md).
 */
function applyEvent_(ev, ctx) {
  if (!ev || typeof ev !== 'object') return 'bad-request';
  if (!isEventId_(ev.id)) return 'bad-request';
  if (typeof ev.route !== 'string' || ev.route === '') return 'bad-request';
  if (!isPoiNumber_(ev.poi)) return 'bad-request';
  if (ev.kind !== 'pass' && ev.kind !== 'target') return 'bad-request';

  if (ctx.seen[ev.id]) return 'duplicate';

  var sheet = cachedSheet_(ev.route, ctx);
  if (!sheet) return 'no-route';

  var row = cachedRow_(ev.route, sheet, ev.poi, ctx);
  if (!row) return 'no-poi';

  var time = isFinite(Number(ev.ts)) && ev.ts !== null && ev.ts !== '' ? new Date(Number(ev.ts)) : new Date();

  if (ev.kind === 'pass') {
    var sideCol = SIDE_COL.hasOwnProperty(ev.side) ? SIDE_COL[ev.side] : 0;
    var manCol = MAN_COL.hasOwnProperty(ev.man) ? MAN_COL[ev.man] : 0;
    if (!sideCol || !manCol) return 'bad-request';
    if (ev.delta !== 1 && ev.delta !== -1) return 'bad-request';
    // a removal names the pass it removes, and a pass is removed only once
    if (ev.delta === -1) {
      if (!isEventId_(ev.ref)) return 'bad-request';
      if (ctx.removed[ev.ref]) return 'already-removed';
    }

    var range7 = sheet.getRange(row, 2, 1, 7);
    var seven = range7.getValues()[0];
    var forms = range7.getFormulas()[0];
    var oldS = seven[sideCol - 2];
    var oldM = seven[manCol - 2];
    if (!isCount_(oldS) || !isCount_(oldM)) return 'text-in-cell';

    var ns = (oldS === '' ? 0 : oldS) + ev.delta;
    var nm = (oldM === '' ? 0 : oldM) + ev.delta;
    if (ns < 0 || nm < 0) return 'below-zero';

    var cells = [[row, sideCol, oldS, forms[sideCol - 2]], [row, manCol, oldM, forms[manCol - 2]]];
    try {
      ctx.log.appendRow([ev.id, time, ev.route, ev.poi, ev.side, ev.man, ev.delta,
                         ev.delta === -1 ? ev.ref : '', '']);
      sheet.getRange(row, sideCol).setValue(cellValue_(ns));
      sheet.getRange(row, manCol).setValue(cellValue_(nm));
      SpreadsheetApp.flush();
      if (ctx.faultId === ev.id) throw new Error('self-test fault');
    } catch (err) {
      undo_(ctx, sheet, cells, ev.id);
      throw err;
    }
    ctx.seen[ev.id] = true;
    if (ev.delta === -1) ctx.removed[ev.ref] = true;
    return 'applied';
  }

  // kind === 'target'
  if (TARGETS.indexOf(ev.target) === -1) return 'bad-target';
  var xCell = sheet.getRange(row, TARGET_COL);
  var x = [[row, TARGET_COL, xCell.getValue(), xCell.getFormula()]];
  try {
    ctx.log.appendRow([ev.id, time, ev.route, ev.poi, '', '', '', '', ev.target]);
    xCell.setValue(ev.target);
    SpreadsheetApp.flush();
    if (ctx.faultId === ev.id) throw new Error('self-test fault');
  } catch (err) {
    undo_(ctx, sheet, x, ev.id);
    throw err;
  }
  ctx.seen[ev.id] = true;
  return 'applied';
}

/**
 * Undoes the writes of one failed event. Each cell gets its old content
 * back (its formula if it had one, text as text), flushed at once so a
 * failed restore shows here. Only when every cell is back is the Log row
 * that carries this event's id cleared: if a cell may still hold its new
 * value, the row stays, so a resend answers 'duplicate' and the tablet
 * and the sheet agree. The row is found by its id near the end of Log,
 * never assumed to be the last one, and cleared rather than deleted,
 * since a sheet refuses to delete its last unfrozen row. Every step is
 * tried twice, a second apart. The event is answered 'error' either way
 * (data-model.md names this limit).
 */
function undo_(ctx, sheet, cells, id) {
  var restored = true;
  for (var i = 0; i < cells.length; i++) {
    var c = cells[i];
    var done = tryTwice_(function () {
      restore_(sheet.getRange(c[0], c[1]), c[2], c[3]);
      SpreadsheetApp.flush();
    });
    if (!done) restored = false;
  }
  if (!restored) return;
  tryTwice_(function () {
    var last = ctx.log.getLastRow();
    var first = Math.max(2, last - 49);
    if (last < first) return;
    var ids = ctx.log.getRange(first, 1, last - first + 1, 1).getValues();
    for (var r = ids.length - 1; r >= 0; r--) {
      if (String(ids[r][0]) === id) {
        ctx.log.getRange(first + r, 1, 1, LOG_HEADER.length).clearContent();
        SpreadsheetApp.flush();
        return;
      }
    }
  });
}

/** Text goes back as text: an apostrophe keeps "40" from turning into 40, except in a cell formatted as plain text. */
function restore_(range, value, formula) {
  if (formula) range.setFormula(formula);
  else if (typeof value === 'string' && value !== '' && range.getNumberFormat() !== '@') range.setValue("'" + value);
  else range.setValue(value);
}

function tryTwice_(fn) {
  try {
    fn();
    return true;
  } catch (e) {
    try {
      Utilities.sleep(1000);
      fn();
      return true;
    } catch (e2) {
      return false;
    }
  }
}

/* ---------- helpers ---------- */

function isPoiNumber_(v) {
  return typeof v === 'number' && v > 0 && Math.floor(v) === v;
}

/** Event ids are UUIDs made on the tablet, or the self-test's own ids. */
function isEventId_(v) {
  return typeof v === 'string' &&
    (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ||
     /^selftest-[0-9]+-[a-z0-9-]+$/.test(v));
}

function now_() {
  return new Date().getTime();
}

function isCount_(v) {
  return v === '' || (typeof v === 'number' && isFinite(v));
}

/** A count of 0 is written as an empty cell: 0 by hand means "impossible maneuver". */
function cellValue_(n) {
  return n === 0 ? '' : n;
}

function readTarget_(v) {
  return TARGETS.indexOf(v) === -1 ? DEFAULT_TARGET : v;
}

/** A route sheet is any sheet with that exact name and "POI" in A1. */
function routeSheet_(route) {
  if (typeof route !== 'string' || route === '' || route === LOG_SHEET) return null;
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(route);
  if (!sheet) return null;
  if (sheet.getRange(1, 1).getValue() !== 'POI') return null;
  return sheet;
}

function cachedSheet_(route, ctx) {
  if (!ctx.sheets.hasOwnProperty(route)) ctx.sheets[route] = routeSheet_(route);
  return ctx.sheets[route];
}

/** Row number of a POI on its sheet, from column A. 0 if absent. */
function cachedRow_(route, sheet, poi, ctx) {
  if (!ctx.rows.hasOwnProperty(route)) {
    var map = {};
    var last = sheet.getLastRow();
    if (last >= 2) {
      var col = sheet.getRange(2, 1, last - 1, 1).getValues();
      for (var i = 0; i < col.length; i++) {
        if (isPoiNumber_(col[i][0]) && !map[col[i][0]]) map[col[i][0]] = i + 2;
      }
    }
    ctx.rows[route] = map;
  }
  return ctx.rows[route][poi] || 0;
}

function logSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var log = ss.getSheetByName(LOG_SHEET);
  if (!log) {
    log = ss.insertSheet(LOG_SHEET, ss.getNumSheets());
    log.getRange(1, 1, 1, LOG_HEADER.length).setValues([LOG_HEADER]);
    log.setFrozenRows(1);
  }
  return log;
}

/** The ids already in Log, and the passes a removal in Log already took out (column H). */
function readLog_(log) {
  var seen = {};
  var removed = {};
  var last = log.getLastRow();
  if (last >= 2) {
    var rows = log.getRange(2, 1, last - 1, 8).getValues();
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][0] !== '') seen[String(rows[i][0])] = true;
      if (rows[i][6] === -1 && rows[i][7] !== '') removed[String(rows[i][7])] = true;
    }
  }
  return { seen: seen, removed: removed };
}

/* ---------- one-time setup, run from the editor ---------- */

/**
 * Run once per tracker: in the Apps Script editor pick setupTargetColumn
 * in the function list and press Run. It switches "To go" (column I), the
 * status (column S) and the summary's norm from the fixed 70 to each
 * POI's target in column X. Running it again changes nothing: cells that
 * already read column X correctly are left alone, and cells written by
 * v1.2 with the wrong argument separator are repaired.
 * The result is in the Execution log.
 */
function setupTargetColumn() {
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  var sep = separator_(sheets);
  var report = ['Argument separator of this spreadsheet: "' + sep + '"'];
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    var name = sheet.getName();
    if (name === LOG_SHEET || name === 'Generator') continue;
    if (sheet.getRange(1, 1).getValue() === 'POI') {
      report.push(name + ': ' + switchRouteSheet_(sheet, sep) + ' cells written');
    } else {
      var n = switchSummarySheet_(sheet, sep);
      if (n > 0) report.push(name + ': ' + n + ' norm cells written');
    }
  }
  for (var j = 0; j < report.length; j++) Logger.log(report[j]);
  return report;
}

/**
 * Formulas come back from the spreadsheet in its own locale: "," between
 * arguments in some locales, ";" in others (Romanian, German). Read it off
 * the existing "To go" formulas, ignoring text inside quotes.
 */
function separator_(sheets) {
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getRange(1, 1).getValue() !== 'POI') continue;
    var last = sheets[i].getLastRow();
    if (last < 2) continue;
    var f = sheets[i].getRange(2, 9, Math.min(last - 1, 20), 1).getFormulas();
    for (var r = 0; r < f.length; r++) {
      var bare = f[r][0].replace(/"[^"]*"/g, '');
      if (bare.indexOf(';') !== -1) return ';';
      if (bare.indexOf(',') !== -1) return ',';
    }
  }
  return ',';
}

/** The target of the POI in a given row, as a formula: 40 or 0 from X, else 70. */
function targetExpr_(row, sep) {
  var x = '$X' + row;
  return 'IF(OR(' + x + '=40' + sep + 'AND(ISNUMBER(' + x + ')' + sep + x + '=0))' +
         sep + x + sep + FIXED_TARGET + ')';
}

/** A formula back in its original fixed-70 form, whatever was inserted before. */
function original_(f, row) {
  return f.split(targetExpr_(row, ',')).join(FIXED_TARGET)
          .split(targetExpr_(row, ';')).join(FIXED_TARGET);
}

function switchRouteSheet_(sheet, sep) {
  if (sheet.getRange(1, TARGET_COL).getValue() === '') sheet.getRange(1, TARGET_COL).setValue('Target');
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var n = last - 1;
  var pois = sheet.getRange(2, 1, n, 1).getValues();
  var count = 0;
  var cols = [9, 19];   // I: To go, S: status
  for (var c = 0; c < cols.length; c++) {
    var range = sheet.getRange(2, cols[c], n, 1);
    var formulas = range.getFormulas();
    var values = range.getValues();
    var out = [];
    var changed = [];
    var batchSafe = true;
    for (var r = 0; r < n; r++) {
      var f = formulas[r][0];
      var base = original_(f, r + 2);
      var want = base.split(FIXED_TARGET).join(targetExpr_(r + 2, sep));
      if (isPoiNumber_(pois[r][0]) && base.indexOf(FIXED_TARGET) !== -1 && want !== f) {
        out.push([want]);
        changed.push(r);
      } else {
        out.push([f]);
        if (f === '' && values[r][0] !== '') batchSafe = false;
      }
    }
    if (changed.length === 0) continue;
    if (batchSafe) {
      range.setFormulas(out);
    } else {
      for (var k = 0; k < changed.length; k++) {
        sheet.getRange(changed[k] + 2, cols[c]).setFormula(out[changed[k]][0]);
      }
    }
    count += changed.length;
  }
  return count;
}

/** The summary: "=$B4*Generator!$B$4" next to "=SUM('<route>'!$J$2:$J$198)". */
function switchSummarySheet_(sheet, sep) {
  var rows = Math.min(sheet.getLastRow(), 100);
  var cols = Math.min(sheet.getLastColumn(), 26);
  if (rows < 1 || cols < 2) return 0;
  var formulas = sheet.getRange(1, 1, rows, cols).getFormulas();
  var norm = /^=\$B(\d+)\*Generator!\$B\$4/;
  var done = /^=SUM\('((?:[^']|'')+)'!\$J\$(\d+):\$J\$(\d+)\)$/;
  var count = 0;
  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols - 1; c++) {
      var f = formulas[r][c];
      var head = norm.exec(f);
      if (!head) continue;
      var m = done.exec(formulas[r][c + 1]);
      if (!m) continue;
      var x = "'" + m[1] + "'!$X$" + m[2] + ':$X$' + m[3];
      var base = head[0];
      var known = [base, base + normTail_(x, ','), base + normTail_(x, ';')];
      if (known.indexOf(f) === -1) continue;   // hand-edited: leave it alone
      var want = base + normTail_(x, sep);
      if (want === f) continue;
      sheet.getRange(r + 1, c + 1).setFormula(want);
      count++;
    }
  }
  return count;
}

function normTail_(x, sep) {
  return '-COUNTIF(' + x + sep + '40)*(' + FIXED_TARGET + '-40)' +
         '-COUNTIF(' + x + sep + '0)*' + FIXED_TARGET;
}

/* ---------- self-test, run from the editor on a COPY of a tracker ---------- */

/**
 * Proves the undo and the guard against a second removal, on a copy of a
 * tracker only. It refuses to run unless the script property SELFTEST
 * holds this spreadsheet's own id (the long code between /d/ and /edit in
 * its address), which a copy never shares with the original.
 * It uses the first POI on any route sheet whose N and Left cells hold a
 * number above 0 or nothing. A pass that fails after its writes must
 * change nothing, the same pass then applies (N, Left and Log rows +1), a
 * resend is a duplicate, its removal applies (back to the start), a
 * second removal is refused, and a type change that fails after its
 * write must leave X as it was. The result is in the Execution log, one
 * line per step, and a last line ALL PASS or FAILED.
 */
function selfTestOnCopy() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (PropertiesService.getScriptProperties().getProperty('SELFTEST') !== ss.getId()) {
    Logger.log('Refused: on a copy, set the script property SELFTEST to this spreadsheet\'s id.');
    return 'refused';
  }
  var sheet = null;
  var row = 0;
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length && !sheet; i++) {
    var sh = sheets[i];
    if (sh.getName() === LOG_SHEET || sh.getRange(1, 1).getValue() !== 'POI') continue;
    var last = sh.getLastRow();
    if (last < 2) continue;
    var vals = sh.getRange(2, 1, last - 1, 6).getValues();
    for (var r = 0; r < vals.length; r++) {
      var n = vals[r][1];
      var l = vals[r][5];
      if (isPoiNumber_(vals[r][0]) && (n === '' || (typeof n === 'number' && n > 0)) &&
          (l === '' || (typeof l === 'number' && l > 0))) {
        sheet = sh;
        row = r + 2;
        break;
      }
    }
  }
  if (!sheet) {
    Logger.log('FAILED: no route sheet has a POI whose N and Left hold a number above 0 or nothing');
    return 'FAILED';
  }
  var route = sheet.getName();
  var poi = sheet.getRange(row, 1).getValue();

  var stamp = 'selftest-' + now_();
  var pass = { id: stamp + '-pass', ts: now_(), route: route, poi: poi, kind: 'pass', side: 'N', man: 'L', delta: 1 };
  var removal = { id: stamp + '-removal', ts: pass.ts, route: route, poi: poi, kind: 'pass', side: 'N', man: 'L', delta: -1, ref: pass.id };
  var again = { id: stamp + '-removal-2', ts: pass.ts, route: route, poi: poi, kind: 'pass', side: 'N', man: 'L', delta: -1, ref: pass.id };
  var target = { id: stamp + '-target', ts: pass.ts, route: route, poi: poi, kind: 'target', target: 40 };

  function count(v) { return v === '' ? 0 : v; }
  function snap() {
    return { n: count(sheet.getRange(row, 2).getValue()), l: count(sheet.getRange(row, 6).getValue()),
             x: sheet.getRange(row, TARGET_COL).getValue(), log: logSheet_().getLastRow() };
  }
  function show(s) { return 'N ' + s.n + ', Left ' + s.l + ', X ' + (s.x === '' ? 'empty' : s.x) + ', Log rows ' + s.log; }
  var lines = ['POI ' + poi + ' on ' + route + ' (row ' + row + ')'];
  var ok = true;
  function step(name, events, faultId, want, dn, dl, dlog) {
    var before = snap();
    var res = push_(events, faultId);
    var got = !res.ok ? res.error :
              res.applied.length ? 'applied' :
              res.duplicate.length ? 'duplicate' : res.rejected[0].reason;
    var after = snap();
    var good = got === want && after.n === before.n + dn && after.l === before.l + dl &&
               after.x === before.x && after.log === before.log + dlog;
    if (!good) ok = false;
    lines.push((good ? 'PASS ' : 'FAIL ') + name + ': answer ' + got + ' (want ' + want + '). ' +
               show(before) + ' -> ' + show(after));
  }
  var start = snap();
  step('a pass that fails after its writes changes nothing', [pass], pass.id, 'error', 0, 0, 0);
  step('the same pass sent again applies', [pass], null, 'applied', 1, 1, 1);
  step('the same pass once more is a duplicate', [pass], null, 'duplicate', 0, 0, 0);
  step('its removal applies', [removal], null, 'applied', -1, -1, 1);
  step('a second removal of the same pass is refused', [again], null, 'already-removed', 0, 0, 0);
  step('a type change that fails after its write leaves X as it was', [target], target.id, 'error', 0, 0, 0);
  var end = snap();
  var back = end.n === start.n && end.l === start.l && end.x === start.x;
  if (!back) ok = false;
  lines.push((back ? 'PASS ' : 'FAIL ') + 'N, Left and X end as they started. Two Log rows stay: the test pass and its removal.');
  lines.push(ok ? 'ALL PASS' : 'FAILED');
  for (var j = 0; j < lines.length; j++) Logger.log(lines[j]);
  return ok ? 'ALL PASS' : 'FAILED';
}
