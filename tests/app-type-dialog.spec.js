/* POI Tracker tests — the type change dialog, scenarios D1 to D8 (prompt
   Done step 2e; screens.md v0.56, items 13, 36, 46, 63 and 64, decision
   D1; data-model.md "Event" and "Targets per POI"; main-screen.html v0.40
   frame I): the dialog's sentences on the passes that do not fit the new
   type and where they are, in the sheet, sent from this tablet, typed in
   by hand or waiting on this tablet, and its switch, on by default, which
   deletes this tablet's passes that do not fit exactly as Delete in
   History does, a waiting pass dropped and a sent one given a removal, in
   the one write of the change. Of an allowed maneuver with a smaller
   share the switch takes the newest passes by seq, as many as do not fit.
   Not drivable counts every pass, and a POI with a sheet error asks with
   the error named first. A change where every pass fits applies at once.
   Cancel change of a refused type change without fromType puts back the
   type the sheet's target reads as.
   The stores are injected as in app-types-routes.spec.js: the sample with
   a POI's type, counts and this tablet's events rewritten.
*/
'use strict';
const crypto = require('crypto');
const { test, expect, KEY, UUID_V4, text, store, layers, openSample, recordPass, openHistory, reloadWith } = require('./fixtures');

const TARGET = { int: 70, nost: 70, nol: 70, nor: 70, str: 40, nd: 0 };
const SAMPLE_EVENTS = 22;   // the sample's delivered passes
const KEEP = 'The app stops counting them, but the sheet keeps them and the export sends them to the client until they are deleted.';
const NEVER = 'Not drivable counts none of them. The sheet keeps them and the export sends them to the client until they are deleted.';
const HAND = 'They were typed in by hand: delete them in the sheet.';
// item 64's first example, frame I
const FRAME_I = 'It has 26 Left and 27 Right passes in the sheet. Straight only does not allow Left or Right. ' + KEEP +
  ' 2 of them were sent from this tablet, the other 51 were typed in by hand: delete those in the sheet.';
const LINE_STR = 'They do not fit Straight only. A waiting pass is dropped, a sent one gets a removal.';
const LINE_INT = 'They do not fit Intersection. A waiting pass is dropped, a sent one gets a removal.';

function routeId(s) { return s.cities[0].routes[0].id; }   // SAMPLE-001
function targets(s) { return s.events.filter(function (e) { return e.kind === 'target'; }); }
function removals(s) { return s.events.filter(function (e) { return e.kind === 'pass' && e.delta < 0; }); }
function copy(s) { return JSON.parse(JSON.stringify(s)); }
// a pass of this tablet at POI n of SAMPLE-001, as the app records one
function pass(rid, n, man, side, seq, state) {
  return { id: crypto.randomUUID(), seq: seq, ts: 1761480000000 + seq * 60000, city: 'sample', route: 'SAMPLE-001', routeId: rid, poi: n,
           kind: 'pass', side: side, man: man, delta: 1, state: state };
}
// the sample's store with POI n active, its type t and its seven counts c
// (N, S, W, E, Left, Straight, Right) in the sheet when given, and this
// tablet's events added; the counter follows the highest seq
async function inject(page, s, n, t, c, events) {
  const rid = routeId(s);
  s.cities[0].routes[0].lastPoi = n;
  if (c) s.baseline[rid][String(n)] = { c: c, target: TARGET[t] };
  if (t) s.types[rid][String(n)] = t;
  (events || []).forEach(function (e) { s.events.push(e); if (e.seq > s.seq) s.seq = e.seq; });
  await reloadWith(page, s);
  await expect(page.locator('#head .big')).toHaveText(String(n));
}
// chooses type t from the pill's menu
async function pickType(page, t) {
  await page.locator('#pill').click();
  const pop = page.locator('.pop');
  await expect(pop).toBeVisible();
  await pop.locator('.opt[data-type="' + t + '"]').click();
  await expect(pop).toHaveCount(0);
}
// chooses type t and checks the dialog's title and sentences
async function openDialogFor(page, n, t, label, body) {
  await pickType(page, t);
  const dlg = page.locator('.dlg');
  await expect(dlg).toBeVisible();
  expect(await text(dlg.locator('.dtitle'))).toBe('Change POI ' + n + ' to ' + label + '?');
  expect(await text(dlg.locator('.dbody'))).toBe(body);
  return dlg;
}
// the switch row under the sentences: its label, its line, the switch on
// with the label as its name, between the sentences and the buttons
async function expectSwitch(dlg, label, line) {
  const row = dlg.locator('.drow');
  await expect(row).toHaveCount(1);
  expect(await text(row.locator('.ol b'))).toBe(label);
  expect(await text(row.locator('.ol small'))).toBe(line);
  const sw = row.locator('.switch');
  await expect(sw).toHaveAttribute('role', 'switch');
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await expect(sw).toHaveAttribute('aria-label', label);
  expect(await dlg.evaluate(function (el) { return Array.from(el.children).map(function (c) { return c.className; }); })).toEqual(['dtitle', 'dbody', 'drow', 'dbtns']);
}
// counts the writes of the store from now on (the counter is installed
// once per page load, so a second call only resets it)
function countWrites(page) {
  return page.evaluate(function (k) {
    if (window.__writes === undefined) {
      var o = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, v) { if (key === k) window.__writes += 1; return o.call(this, key, v); };
    }
    window.__writes = 0;
  }, KEY);
}
function writes(page) { return page.evaluate(function () { return window.__writes; }); }
async function expectToastText(page, t) {
  const toast = page.locator('#toast');
  await expect(toast).toHaveClass(/\bon\b/);
  await expect(toast).toHaveText(t);
}
// "Change": the dialog closes, the toast names the type, the store was
// written once; returns the store
async function change(page, dlg, label) {
  await countWrites(page);
  await dlg.locator('[data-act="dlg-ok"]').click();
  await expect(dlg).toHaveCount(0);
  await expectToastText(page, 'Type set: ' + label);
  expect(await writes(page), 'writes of the store by "Change"').toBe(1);
  await expect.poll(() => layers(page)).toBe(0);
  return store(page);
}
// the removals of the store are one per pass given, as removePass builds
// them: waiting, delta -1, ref the pass, its side and maneuver, a new v4
// UUID, no fromType
function expectRemovals(s, passes, rid, n) {
  const rems = removals(s);
  expect(rems.map(function (r) { return r.ref; }).sort()).toEqual(passes.map(function (e) { return e.id; }).sort());
  rems.forEach(function (r) {
    const p = passes.find(function (e) { return e.id === r.ref; });
    expect(r).toMatchObject({ kind: 'pass', delta: -1, state: 'waiting', poi: n, route: 'SAMPLE-001', routeId: rid, city: 'sample', side: p.side, man: p.man });
    expect(r.id).toMatch(UUID_V4);
    expect(r).not.toHaveProperty('fromType');
    expect(r).not.toHaveProperty('target');
  });
  return rems;
}
function gone(s, events) { events.forEach(function (e) { expect(s.events.some(function (x) { return x.id === e.id; }), 'pass ' + e.id + ' dropped').toBe(false); }); }

test('D1 · Frame I: the sentences, the switch and Change', async ({ page }) => {
  await openSample(page);
  const s = await store(page);
  const rid = routeId(s);
  // the sample's POI 122, 26 Left, 13 Straight and 27 Right in the sheet,
  // with two of them sent from this tablet, one Left and one Right
  const sent = [pass(rid, 122, 'L', 'N', 23, 'delivered'), pass(rid, 122, 'R', 'S', 24, 'delivered')];
  await inject(page, s, 122, null, null, sent);
  await expect(page.locator('#cnt')).toHaveText('66 of 70');
  const dlg = await openDialogFor(page, 122, 'str', 'Straight only', FRAME_I);
  await expectSwitch(dlg, 'Also delete the 2 passes of this tablet', LINE_STR);
  const ok = dlg.locator('[data-act="dlg-ok"]');
  expect(await text(ok)).toBe('Change');
  await expect(ok).toHaveClass(/\bdanger\b/);
  expect(await text(dlg.locator('[data-act="dlg-cancel"]'))).toBe('Cancel');

  const a = await change(page, dlg, 'Straight only');
  expect(a.types[rid]['122']).toBe('str');
  const tev = targets(a);
  expect(tev).toHaveLength(1);
  expect(tev[0]).toMatchObject({ poi: 122, target: 40, fromType: 'int', state: 'waiting', seq: 25 });
  const rems = expectRemovals(a, sent, rid, 122);
  expect(rems.map(function (r) { return r.seq; }).sort()).toEqual([26, 27]);
  expect(a.seq).toBe(27);
  expect(a.events).toHaveLength(SAMPLE_EVENTS + 2 + 1 + 2);
  // the two passes keep their state, and the waiting removals already
  // leave the counts: 25 Left and 26 Right are to fix (items 4, 46)
  sent.forEach(function (e) { expect(a.events.find(function (x) { return x.id === e.id; })).toMatchObject({ state: 'delivered' }); });
  await expect(page.locator('#cnt')).toHaveText('13 of 40');
  await expect(page.locator('#head .rest')).toHaveText('27 to go · 51 to fix');
  // History: both passes "Removal waiting", the line above the list (item 13)
  const hist = await openHistory(page);
  await expect(hist.locator('.hlist .hr.del')).toHaveCount(2);
  expect(await text(hist.locator('.hq'))).toBe('2 removals waiting to be sent');
});

test('D2 · The switch off: the type changes, nothing is deleted', async ({ page }) => {
  await openSample(page);
  const s = await store(page);
  const rid = routeId(s);
  const sent = [pass(rid, 122, 'L', 'N', 23, 'delivered'), pass(rid, 122, 'R', 'S', 24, 'delivered')];
  await inject(page, s, 122, null, null, sent);
  const dlg = await openDialogFor(page, 122, 'str', 'Straight only', FRAME_I);
  const sw = dlg.locator('.switch');
  // a tap anywhere on the row toggles it: the row, its label, the switch
  await dlg.locator('.drow').click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  expect(await text(dlg.locator('.dbody'))).toBe(FRAME_I);   // the sentences do not follow the switch
  await dlg.locator('.drow .ol b').click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  const a = await change(page, dlg, 'Straight only');
  expect(a.types[rid]['122']).toBe('str');
  expect(targets(a)).toHaveLength(1);
  expect(removals(a)).toHaveLength(0);
  expect(a.events).toHaveLength(SAMPLE_EVENTS + 2 + 1);
  await expect(page.locator('#head .rest')).toHaveText('27 to go · 53 to fix');

  // Cancel and a tap outside change nothing (item 63)
  await pickType(page, 'int');   // back, with no consequence: at once
  await expect(page.locator('.dlg')).toHaveCount(0);
  await expectToastText(page, 'Type set: Intersection');
  expect(targets(await store(page))).toHaveLength(0);
  const d2 = await openDialogFor(page, 122, 'str', 'Straight only', FRAME_I);
  await d2.locator('[data-act="dlg-cancel"]').click();
  await expect(d2).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);
  const d3 = await openDialogFor(page, 122, 'str', 'Straight only', FRAME_I);
  await page.locator('.scrim.top').click({ position: { x: 10, y: 10 } });
  await expect(d3).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);
  const b = await store(page);
  expect(b.types[rid]['122']).toBe('int');
  expect(b.events).toHaveLength(SAMPLE_EVENTS + 2);
  await expect(page.locator('#cnt')).toHaveText('66 of 70');
});

test('D3 · Waiting passes are named apart and dropped', async ({ page }) => {
  // (a) frame I's POI 122 with 2 Right passes waiting on this tablet too
  await openSample(page);
  const s = await store(page);
  const rid = routeId(s);
  const sent = [pass(rid, 122, 'L', 'N', 23, 'delivered'), pass(rid, 122, 'R', 'S', 24, 'delivered')];
  const waiting = [pass(rid, 122, 'R', 'N', 25, 'waiting'), pass(rid, 122, 'R', 'E', 26, 'waiting')];
  await inject(page, s, 122, null, null, sent.concat(waiting));
  await expect(page.locator('#cnt')).toHaveText('67 of 70');
  const dlg = await openDialogFor(page, 122, 'str', 'Straight only',
    'It has 26 Left and 27 Right passes in the sheet and 2 Right passes waiting on this tablet. Straight only does not allow Left or Right. ' + KEEP +
    ' 2 of them were sent from this tablet, the other 51 were typed in by hand: delete those in the sheet.');
  await expectSwitch(dlg, 'Also delete the 4 passes of this tablet', LINE_STR);
  const a = await change(page, dlg, 'Straight only');
  expect(a.types[rid]['122']).toBe('str');
  expect(targets(a)).toHaveLength(1);
  gone(a, waiting);
  expectRemovals(a, sent, rid, 122);
  expect(a.events).toHaveLength(SAMPLE_EVENTS + 4 - 2 + 1 + 2);
  await expect(page.locator('#head .rest')).toHaveText('27 to go · 51 to fix');

  // (b) passes of this tablet alone, recorded by taps: POI 140 to No
  // straight; both are dropped, and the change between two types at 70
  // sends nothing
  await page.locator('#col .row[data-poi="140"]').click();
  await expect(page.locator('#head .big')).toHaveText('140');
  await recordPass(page, 'St', 'S');
  await recordPass(page, 'St', 'N');
  await expect(page.locator('#cnt')).toHaveText('2 of 70');
  const before = (await store(page)).events.length;
  const d2 = await openDialogFor(page, 140, 'nost', 'No straight', 'It has 2 Straight passes waiting on this tablet. No straight does not allow Straight. ' + KEEP);
  await expectSwitch(d2, 'Also delete the 2 passes of this tablet', 'They do not fit No straight. A waiting pass is dropped, a sent one gets a removal.');
  const b = await change(page, d2, 'No straight');
  expect(b.types[rid]['140']).toBe('nost');
  expect(b.events).toHaveLength(before - 2);
  expect(b.events.filter(function (e) { return e.poi === 140; })).toHaveLength(0);
  await expect(page.locator('#cnt')).toHaveText('0 of 70');
  await expect(page.locator('#head .rest')).toHaveText('70 to go');
});

test('D4 · Extra passes: the newest of this tablet, as many as do not fit', async ({ page }) => {
  // (a) Straight only, 38 Straight in the sheet, 3 of them sent from this
  // tablet, and 2 waiting, to Intersection: 26 do not fit, the switch
  // takes the 5 newest (the 2 waiting and the 3 sent), 21 were typed in
  // by hand
  await openSample(page);
  const s0 = await store(page);
  const rid = routeId(s0);
  const sent = [pass(rid, 122, 'St', 'N', 23, 'delivered'), pass(rid, 122, 'St', 'S', 24, 'delivered'), pass(rid, 122, 'St', 'N', 25, 'delivered')];
  const waiting = [pass(rid, 122, 'St', 'W', 26, 'waiting'), pass(rid, 122, 'St', 'E', 27, 'waiting')];
  await inject(page, copy(s0), 122, 'str', [10, 10, 10, 8, 0, 38, 0], sent.concat(waiting));
  await expect(page.locator('#cnt')).toHaveText('40 of 40');
  let dlg = await openDialogFor(page, 122, 'int', 'Intersection',
    'It has 38 Straight passes in the sheet and 2 Straight passes waiting on this tablet. Intersection allows 14, so 26 do not fit. ' + KEEP +
    ' 3 of them were sent from this tablet, the other 21 were typed in by hand: delete those in the sheet.');
  await expectSwitch(dlg, 'Also delete the 5 passes of this tablet', LINE_INT);
  let a = await change(page, dlg, 'Intersection');
  expect(a.types[rid]['122']).toBe('int');
  expect(targets(a)).toHaveLength(1);
  expect(targets(a)[0]).toMatchObject({ poi: 122, target: 70, fromType: 'str', state: 'waiting', seq: 28 });
  gone(a, waiting);
  expectRemovals(a, sent, rid, 122);
  expect(a.events).toHaveLength(SAMPLE_EVENTS + 5 - 2 + 1 + 3);
  await expect(page.locator('#cnt')).toHaveText('14 of 70');
  await expect(page.locator('#head .rest')).toHaveText('56 to go · 21 to fix');

  // (b) fewer passes of this tablet than the extra: No straight with 40
  // Left, 10 of them this tablet's, to Intersection: 12 do not fit, the
  // switch takes all 10, 2 were typed in by hand
  const ten = [];
  for (let i = 0; i < 10; i++) ten.push(pass(rid, 122, 'L', 'NSWE'[i % 4], 23 + i, 'delivered'));
  await inject(page, copy(s0), 122, 'nost', [20, 20, 10, 10, 40, 0, 20], ten);
  dlg = await openDialogFor(page, 122, 'int', 'Intersection',
    'It has 40 Left passes in the sheet. Intersection allows 28, so 12 do not fit. ' + KEEP + ' 10 of them were sent from this tablet, the other 2 were typed in by hand: delete those in the sheet.');
  await expectSwitch(dlg, 'Also delete the 10 passes of this tablet', LINE_INT);
  a = await change(page, dlg, 'Intersection');
  expect(a.types[rid]['122']).toBe('int');
  expect(targets(a)).toHaveLength(0);   // 70 to 70 sends nothing
  expectRemovals(a, ten, rid, 122);
  expect(a.events).toHaveLength(SAMPLE_EVENTS + 10 + 10);

  // (c) more than the extra: 31 Left, 10 of them this tablet's, to
  // Intersection: 3 do not fit, the switch takes this tablet's 3 newest
  // Left passes by seq, whatever their place in the store
  const seqs = [30, 23, 27, 32, 25, 29, 24, 31, 26, 28];
  const mixed = seqs.map(function (q, i) { return pass(rid, 122, 'L', 'NSWE'[i % 4], q, 'delivered'); });
  await inject(page, copy(s0), 122, 'nost', [16, 15, 10, 10, 31, 0, 20], mixed);
  dlg = await openDialogFor(page, 122, 'int', 'Intersection',
    'It has 31 Left passes in the sheet. Intersection allows 28, so 3 do not fit. ' + KEEP + ' They were sent from this tablet.');
  await expectSwitch(dlg, 'Also delete the 3 passes of this tablet', LINE_INT);
  a = await change(page, dlg, 'Intersection');
  const newest = mixed.filter(function (e) { return e.seq >= 30; });
  expect(newest).toHaveLength(3);
  expectRemovals(a, newest, rid, 122);
  expect(a.events).toHaveLength(SAMPLE_EVENTS + 10 + 3);
  await expect(page.locator('#cnt')).toHaveText('48 of 70');
  await expect(page.locator('#head .rest')).toHaveText('22 to go');
});

test('D5 · Not drivable: every pass, and a sheet error named first', async ({ page }) => {
  // (a) POI 122 with 2 passes sent from this tablet and 2 waiting
  await openSample(page);
  const s0 = await store(page);
  const rid = routeId(s0);
  const sent = [pass(rid, 122, 'L', 'N', 23, 'delivered'), pass(rid, 122, 'R', 'S', 24, 'delivered')];
  const waiting = [pass(rid, 122, 'R', 'N', 25, 'waiting'), pass(rid, 122, 'R', 'E', 26, 'waiting')];
  await inject(page, copy(s0), 122, null, null, sent.concat(waiting));
  let dlg = await openDialogFor(page, 122, 'nd', 'Not drivable',
    'It has 66 passes in the sheet and 2 passes waiting on this tablet. ' + NEVER +
    ' Passes waiting on this tablet are still sent unless the switch below deletes them. 2 of them were sent from this tablet, the other 64 were typed in by hand: delete those in the sheet.');
  await expectSwitch(dlg, 'Also delete the 4 passes of this tablet', 'Not drivable counts none of them. A waiting pass is dropped, a sent one gets a removal.');
  let a = await change(page, dlg, 'Not drivable');
  expect(a.types[rid]['122']).toBe('nd');
  expect(targets(a)).toHaveLength(1);
  expect(targets(a)[0]).toMatchObject({ poi: 122, target: 0, fromType: 'int', state: 'waiting' });
  gone(a, waiting);
  expectRemovals(a, sent, rid, 122);
  expect(a.events).toHaveLength(SAMPLE_EVENTS + 4 - 2 + 1 + 2);
  await expect(page.locator('#cnt')).toHaveText('Not drivable');
  await expect(page.locator('#head .rest')).toHaveText('64 to fix');

  // (b) the sample's POI 57, sides 46 and maneuvers 44 in the sheet: the
  // error first, the larger total, and no switch without a pass of this
  // tablet
  await page.locator('#col .row[data-poi="57"]').click();
  await expect(page.locator('#head .big')).toHaveText('57');
  dlg = await openDialogFor(page, 57, 'nd', 'Not drivable',
    'The sheet shows an error at this POI: its sides and maneuvers disagree. It has 46 passes in the sheet. ' + NEVER + ' ' + HAND);
  await expect(dlg.locator('.drow')).toHaveCount(0);
  await dlg.locator('[data-act="dlg-cancel"]').click();
  await expect(dlg).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);
  expect((await store(page)).types[rid]).not.toHaveProperty('57');

  // (c) 5 maneuvers and no side, then 5 sides and no maneuver: the dialog
  // shows either way, with the error first
  for (const c of [[0, 0, 0, 0, 5, 0, 0], [5, 0, 0, 0, 0, 0, 0]]) {
    await inject(page, copy(s0), 140, 'int', c, []);
    await expect(page.locator('#lock')).toHaveText('Sheet error: sides and maneuvers disagree');
    dlg = await openDialogFor(page, 140, 'nd', 'Not drivable',
      'The sheet shows an error at this POI: its sides and maneuvers disagree. It has 5 passes in the sheet. ' + NEVER + ' ' + HAND);
    await expect(dlg.locator('.drow')).toHaveCount(0);
    a = await change(page, dlg, 'Not drivable');
    expect(a.types[rid]['140']).toBe('nd');
    expect(targets(a)).toHaveLength(1);
    expect(targets(a)[0]).toMatchObject({ poi: 140, target: 0, fromType: 'int', state: 'waiting' });
    expect(a.events).toHaveLength(SAMPLE_EVENTS + 1);
  }
});

test('D6 · Every pass fits: the change applies at once', async ({ page }) => {
  // Straight only with 13 Straight, one of them this tablet's, to
  // Intersection: no dialog, the toast, the target event, nothing deleted
  await openSample(page);
  const s = await store(page);
  const rid = routeId(s);
  const mine = pass(rid, 122, 'St', 'N', 23, 'delivered');
  await inject(page, s, 122, 'str', [4, 4, 3, 2, 0, 13, 0], [mine]);
  await expect(page.locator('#cnt')).toHaveText('13 of 40');
  await pickType(page, 'int');
  await expect(page.locator('.dlg')).toHaveCount(0);
  await expectToastText(page, 'Type set: Intersection');
  expect(await layers(page)).toBe(0);
  const a = await store(page);
  expect(a.types[rid]['122']).toBe('int');
  expect(targets(a)).toHaveLength(1);
  expect(targets(a)[0]).toMatchObject({ poi: 122, target: 70, fromType: 'str', state: 'waiting' });
  expect(removals(a)).toHaveLength(0);
  expect(a.events.find(function (x) { return x.id === mine.id; })).toMatchObject({ state: 'delivered' });
  await expect(page.locator('#cnt')).toHaveText('13 of 70');
  await expect(page.locator('#head .rest')).toHaveText('57 to go');
});

test('D7 · Cancel change without fromType keeps the sheet\'s type', async ({ page }) => {
  // the sheet says 40, Straight only, for POI 122; the tablet holds
  // Intersection with a refused target event of 70 that has no fromType:
  // Cancel change puts back Straight only, the type the sheet's target
  // reads as, and queues nothing (finding A3 of the type change audit)
  await openSample(page);
  const s = await store(page);
  const rid = routeId(s);
  const refused = { id: crypto.randomUUID(), seq: 23, ts: 1761480000000, city: 'sample', route: 'SAMPLE-001', routeId: rid, poi: 122,
                    kind: 'target', target: 70, state: 'rejected', reason: 'no-poi' };
  s.baseline[rid]['122'] = { c: [4, 4, 3, 2, 0, 13, 0], target: 40 };   // the sheet's target, not the stored type's
  await inject(page, s, 122, 'int', null, [refused]);
  await expect(page.locator('#cnt')).toHaveText('13 of 70');
  const hist = await openHistory(page);
  const row = hist.locator('.hlist .hr.rej').first();
  await expect(row).toBeVisible();
  expect(await text(row.locator('.hmv'))).toBe('Type: Intersection');
  const cancel = row.locator('[data-cancel="' + refused.id + '"]');
  expect(await text(cancel)).toBe('Cancel change');
  await cancel.click();
  await expect(page.locator('.dlg')).toHaveCount(0);
  await expectToastText(page, 'Type set: Straight only');
  const a = await store(page);
  expect(a.types[rid]['122']).toBe('str');
  expect(targets(a)).toHaveLength(0);
  expect(a.events).toHaveLength(SAMPLE_EVENTS);
  await page.locator('[data-act="close-history"]').click();
  await expect(hist).toHaveCount(0);
  await expect(page.locator('#cnt')).toHaveText('13 of 40');
  await expect(page.locator('#head .rest')).toHaveText('27 to go');
});

test('D8 · More cases of item 64: a forbidden maneuver, past a share, one pass', async ({ page }) => {
  await openSample(page);
  const s0 = await store(page);
  const rid = routeId(s0);
  const CASES = [
    { name: 'Intersection to No straight with 14 Straight in the sheet', from: 'int', c: [25, 20, 12, 10, 26, 14, 27], to: 'nost', label: 'No straight',
      body: 'It has 14 Straight passes in the sheet. No straight does not allow Straight. ' + KEEP + ' ' + HAND, targets: 0 },
    { name: 'No straight with Left 35 and Right 35 to Intersection', from: 'nost', c: [20, 20, 15, 15, 35, 0, 35], to: 'int', label: 'Intersection',
      body: 'It has 35 Left passes in the sheet. Intersection allows 28, so 7 do not fit. It has 35 Right passes in the sheet. Intersection allows 28, so 7 do not fit. ' + KEEP + ' ' + HAND, targets: 0 },
    { name: 'Straight only to No left with 5 Left and 40 Straight', from: 'str', c: [15, 15, 10, 5, 5, 40, 0], to: 'nol', label: 'No left',
      body: 'It has 5 Left passes in the sheet. No left does not allow Left. It has 40 Straight passes in the sheet. No left allows 14, so 26 do not fit. ' + KEEP + ' ' + HAND, targets: 1 },
    { name: 'one Right pass sent from this tablet to No right', from: 'int', c: [1, 0, 0, 0, 0, 0, 1], to: 'nor', label: 'No right', one: true,
      body: 'It has 1 Right pass in the sheet. No right does not allow Right. The app stops counting it, but the sheet keeps it and the export sends it to the client until it is deleted. It was sent from this tablet.',
      sw: ['Also delete the pass of this tablet', 'It does not fit No right. A waiting pass is dropped, a sent one gets a removal.'], targets: 0 }
  ];
  for (const k of CASES) {
    const mine = k.one ? [pass(rid, 122, 'R', 'N', 23, 'delivered')] : [];
    await inject(page, copy(s0), 122, k.from, k.c, mine);
    const dlg = await openDialogFor(page, 122, k.to, k.label, k.body);
    if (k.sw) await expectSwitch(dlg, k.sw[0], k.sw[1]);
    else await expect(dlg.locator('.drow'), k.name + ': no switch without a pass of this tablet').toHaveCount(0);
    const a = await change(page, dlg, k.label);
    expect(a.types[rid]['122'], k.name).toBe(k.to);
    expect(targets(a), k.name).toHaveLength(k.targets);
    expectRemovals(a, mine, rid, 122);
    expect(a.events, k.name).toHaveLength(SAMPLE_EVENTS + k.targets + mine.length * 2);
  }
});
