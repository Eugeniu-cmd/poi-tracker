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

var VERSION = '1.3';
var LOG_SHEET = 'Log';
var LOG_HEADER = ['id', 'time', 'route', 'poi', 'side', 'maneuver', 'delta', 'ref', 'target'];
var TARGET_COL = 24;            // column X
var SIDE_COL = { N: 2, S: 3, W: 4, E: 5 };   // columns B..E
var MAN_COL = { L: 6, St: 7, R: 8 };         // columns F..H
var TARGETS = [70, 40, 0];
var DEFAULT_TARGET = 70;
var LOCK_WAIT_MS = 30000;
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
    if (body.action === 'push') return reply_(push_(body.events));
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

function pull_(route) {
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

function push_(events) {
  if (!Array.isArray(events)) return { ok: false, error: 'bad-request' };

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) return { ok: false, error: 'busy' };

  try {
    var log = logSheet_();
    var seen = existingIds_(log);
    var ctx = { log: log, seen: seen, sheets: {}, rows: {} };
    var applied = [];
    var duplicate = [];
    var rejected = [];

    for (var i = 0; i < events.length; i++) {
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
 * Order of writes: the Log row first, then the cells.
 */
function applyEvent_(ev, ctx) {
  if (!ev || typeof ev !== 'object') return 'bad-request';
  if (typeof ev.id !== 'string' || ev.id === '') return 'bad-request';
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

    var seven = sheet.getRange(row, 2, 1, 7).getValues()[0];
    var sv = seven[sideCol - 2];
    var mv = seven[manCol - 2];
    if (!isCount_(sv) || !isCount_(mv)) return 'text-in-cell';
    sv = sv === '' ? 0 : sv;
    mv = mv === '' ? 0 : mv;

    var ns = sv + ev.delta;
    var nm = mv + ev.delta;
    if (ns < 0 || nm < 0) return 'below-zero';

    ctx.log.appendRow([ev.id, time, ev.route, ev.poi, ev.side, ev.man, ev.delta,
                       typeof ev.ref === 'string' ? ev.ref : '', '']);
    sheet.getRange(row, sideCol).setValue(cellValue_(ns));
    sheet.getRange(row, manCol).setValue(cellValue_(nm));
    ctx.seen[ev.id] = true;
    return 'applied';
  }

  // kind === 'target'
  if (TARGETS.indexOf(ev.target) === -1) return 'bad-target';
  ctx.log.appendRow([ev.id, time, ev.route, ev.poi, '', '', '', '', ev.target]);
  sheet.getRange(row, TARGET_COL).setValue(ev.target);
  ctx.seen[ev.id] = true;
  return 'applied';
}

/* ---------- helpers ---------- */

function isPoiNumber_(v) {
  return typeof v === 'number' && v > 0 && Math.floor(v) === v;
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

function existingIds_(log) {
  var seen = {};
  var last = log.getLastRow();
  if (last >= 2) {
    var ids = log.getRange(2, 1, last - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (ids[i][0] !== '') seen[String(ids[i][0])] = true;
    }
  }
  return seen;
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
