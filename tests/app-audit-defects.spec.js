/* POI Tracker tests — the small defects of the type change audit of
   2026-10-23 (prompt Done step 2f; screens.md v0.56, items 2, 3, 4, 43,
   46, 58, 59 and 60; data-model.md "Targets per POI"; main-screen.html
   v0.40 frames F, G, H and K): no count on screen below 0 under a waiting
   removal of a pass whose sheet count is 0, the sheet error still read
   from the numbers as they are; the Not drivable pill in the markup of
   frame G, the class nd on the button, and the menu's tile as frame H; a
   baseline target stored as text read as the sheet reads it, "40" as
   Straight only, so that choosing Intersection queues a target event of
   70; and a sheet error on a Not drivable POI shown on its row, its grid
   tile, its mini-map square, the head's line and in the summary as on any
   other POI.
   The stores are injected as in app-type-dialog.spec.js, here with the
   whole baseline entry of the POI, since its target may be text. The
   reference opens in a second page of the same context, as in
   app-card.spec.js.
*/
'use strict';
const crypto = require('crypto');
const { test, expect, text, store, layers, openSample, openHistory, reloadWith } = require('./fixtures');

function routeId(s) { return s.cities[0].routes[0].id; }   // SAMPLE-001
function copy(s) { return JSON.parse(JSON.stringify(s)); }
function targets(s) { return s.events.filter(function (e) { return e.kind === 'target'; }); }
// markup without the whitespace between its tags
function norm(html) { return html.replace(/>\s+</g, '><').trim(); }
// a pass of this tablet at POI n of SAMPLE-001, as the app records one
function pass(rid, n, man, side, seq, state) {
  return { id: crypto.randomUUID(), seq: seq, ts: 1761480000000 + seq * 60000, city: 'sample', route: 'SAMPLE-001', routeId: rid, poi: n,
           kind: 'pass', side: side, man: man, delta: 1, state: state };
}
// the waiting removal of pass e, as the app queues one (data-model.md "Event")
function removal(e, seq) {
  return { id: crypto.randomUUID(), seq: seq, ts: e.ts + 60000, city: e.city, route: e.route, routeId: e.routeId, poi: e.poi,
           kind: 'pass', side: e.side, man: e.man, delta: -1, ref: e.id, state: 'waiting' };
}
// the sample's store with POI n active, its stored type t (none when
// null), its baseline entry b ({ c, target }) when given, and this
// tablet's events added; the counter follows the highest seq
async function inject(page, s, n, t, b, events) {
  const rid = routeId(s);
  s.cities[0].routes[0].lastPoi = n;
  if (b) s.baseline[rid][String(n)] = b;
  if (t) s.types[rid][String(n)] = t; else delete s.types[rid][String(n)];
  (events || []).forEach(function (e) { s.events.push(e); if (e.seq > s.seq) s.seq = e.seq; });
  await reloadWith(page, s);
  await expect(page.locator('#head .big')).toHaveText(String(n));
}
async function selectPoi(page, n) {
  await page.locator('#col .row[data-poi="' + n + '"]').click();
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
async function expectToastText(page, t) {
  const toast = page.locator('#toast');
  await expect(toast).toHaveClass(/\bon\b/);
  await expect(toast).toHaveText(t);
}
// every number below 0 in the element's text, as "-N"; a minus after a
// letter or digit, as in the route code SAMPLE-001, is not one
function negatives(locator) {
  return locator.evaluate(function (el) { return el.innerText.match(/(?<![A-Za-z0-9])-\d+/g) || []; });
}

test('Audit · no count below 0 under a waiting removal', async ({ page }) => {
  await openSample(page);
  const s0 = await store(page);
  const rid = routeId(s0);
  const sum = page.locator('#sumport');
  const sum0 = await text(sum);
  // POI 140 with 0 in every cell of the sheet, a pass this tablet sent
  // earlier (the sheet's count went to 0 by hand since) and its removal
  // waiting: 0 of 70 everywhere, never -1 (finding A3)
  const p = pass(rid, 140, 'L', 'N', 23, 'delivered');
  await inject(page, copy(s0), 140, null, { c: [0, 0, 0, 0, 0, 0, 0], target: 70 }, [p, removal(p, 24)]);
  await expect(page.locator('#cnt')).toHaveText('0 of 70');
  await expect(page.locator('#head .rest')).toHaveText('70 to go');
  const row = page.locator('#col .row[data-poi="140"]');
  await expect(row).toHaveClass('row active');
  await expect(row.locator('.rt')).toHaveText('70 to go');
  await expect(row.locator('.rt svg')).toHaveCount(0);
  expect(await row.locator('.rb i').evaluate(function (el) { return el.style.width; })).toBe('0%');
  await expect(page.locator('#card .mz .rv')).toHaveText(['28', '14', '28']);
  await expect(page.locator('#card .mz .fg')).toHaveCount(0);
  await expect(page.locator('#card .rose .dv')).toHaveText(['0', '0', '0', '0']);
  await expect(page.locator('#card .rose .dm')).toHaveClass(['dm z', 'dm z', 'dm z', 'dm z']);
  await expect(page.locator('#card .lp')).toHaveCount(0);   // no pass Undo last would remove
  await expect(page.locator('#lock')).toBeHidden();
  expect(await text(sum)).toBe(sum0);
  for (const sel of ['#head', '#col', '#card', '#sumport']) expect(await negatives(page.locator(sel)), sel).toEqual([]);
  let hist = await openHistory(page);
  expect(await text(hist.locator('.hsub .chip:not(.gold)'))).toBe('0 passes');
  expect(await text(hist.locator('.hq'))).toBe('1 removal waiting to be sent');
  const hr = hist.locator('.hlist .hr');
  await expect(hr).toHaveCount(1);
  await expect(hr).toHaveClass('hr del');
  expect(await text(hr.locator('.hacts .btn'))).toBe('Cancel removal');
  expect(await negatives(hist)).toEqual([]);
  await selectPoi(page, 136);
  await expect(page.locator('#col .dots i').nth(139)).toHaveClass('');
  await page.locator('[data-act="close-history"]').click();
  await expect(hist).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);
  await page.locator('#col .mmap').click();
  const cell = page.locator('.sheet .cell[data-poi="140"]');
  await expect(cell).toHaveClass('cell');
  expect(await cell.locator('.cb i').evaluate(function (el) { return el.style.width; })).toBe('0%');
  await page.goBack();
  await expect(page.locator('.sheet')).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);

  // the sheet error is decided from the numbers as they are: a sheet with
  // no side and 1 Left is in error, and stays so under the removal of a
  // Left pass from North, though every number on screen reads 0
  await inject(page, copy(s0), 140, null, { c: [0, 0, 0, 0, 1, 0, 0], target: 70 }, [p, removal(p, 24)]);
  await expect(row).toHaveClass('row err active');
  await expect(row.locator('.rt')).toHaveText('error');
  await expect(page.locator('#cnt')).toHaveText('0 of 70');
  await expect(page.locator('#head .rest')).toHaveText('Sides 0 · maneuvers 0');
  const lock = page.locator('#lock');
  await expect(lock).toHaveText('Sheet error: sides and maneuvers disagree');
  await expect(lock).toHaveClass('lock err');
  await expect(sum.locator('span.err')).toHaveText('2 errors');   // with the sample's POI 57
  for (const sel of ['#head', '#col', '#card', '#sumport', '#lock']) expect(await negatives(page.locator(sel)), sel).toEqual([]);
  hist = await openHistory(page);
  expect(await negatives(hist)).toEqual([]);
});

test('Audit · the Not drivable pill carries the class nd', async ({ page }) => {
  // frame G's pill and frame H's Not drivable option of the reference
  const ref = await page.context().newPage();
  await ref.goto('/docs/references/main-screen.html', { waitUntil: 'domcontentloaded' });
  const pillG = ref.locator('.app[data-state="G"] .typebtn');
  await expect(pillG).toHaveClass('typebtn nd');
  await expect(pillG).toHaveAttribute('aria-label', 'POI type, tap to change');
  const frameG = norm(await pillG.innerHTML());
  const frameH = norm(await ref.locator('.app[data-state="H"] .opt:has(.ticon.nd)').innerHTML());
  await ref.close();
  expect(frameG).toContain('<span class="ticon"><svg class="sb">');
  expect(frameH).toContain('<span class="ticon nd"><svg class="sb">');

  await openSample(page);
  const pill = page.locator('#pill');
  await expect(pill).toHaveClass('typebtn');
  await selectPoi(page, 168);
  await expect(pill).toHaveClass('typebtn nd');
  await expect(pill).toHaveAttribute('aria-label', 'POI type, tap to change');
  expect(norm(await pill.innerHTML())).toBe(frameG);
  // the menu keeps the class on its tile (frame H)
  await pill.click();
  const pop = page.locator('.pop');
  await expect(pop).toBeVisible();
  await expect(pill).toHaveClass('typebtn nd');
  const opt = pop.locator('.opt[data-type="nd"]');
  await expect(opt).toHaveClass('opt on');
  expect(norm(await opt.innerHTML())).toBe(frameH);
  await page.goBack();
  await expect(pop).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);
  await selectPoi(page, 136);
  await expect(pill).toHaveClass('typebtn');
  await expect(pill.locator('.ticon')).toHaveClass('ticon');
});

test('Audit · a target stored as text reads as the sheet reads it', async ({ page }) => {
  await openSample(page);
  const s0 = await store(page);
  const rid = routeId(s0);
  const pill = page.locator('#pill');
  // "40" as text, no stored type: Straight only, 13 of 40; Intersection
  // fits every pass, so it applies at once and queues a target of 70
  // (finding A1)
  await inject(page, copy(s0), 122, null, { c: [4, 4, 3, 2, 0, 13, 0], target: '40' }, []);
  expect(await text(pill.locator('.tl b'))).toBe('Straight only');
  await expect(page.locator('#cnt')).toHaveText('13 of 40');
  await expect(page.locator('#head .rest')).toHaveText('27 to go');
  await pickType(page, 'int');
  await expect(page.locator('.dlg')).toHaveCount(0);
  await expectToastText(page, 'Type set: Intersection');
  let a = await store(page);
  expect(a.types[rid]['122']).toBe('int');
  expect(targets(a)).toHaveLength(1);
  expect(targets(a)[0]).toMatchObject({ poi: 122, target: 70, fromType: 'str', state: 'waiting' });
  expect(a.events).toHaveLength(s0.events.length + 1);
  await expect(page.locator('#cnt')).toHaveText('13 of 70');
  await expect(page.locator('#head .rest')).toHaveText('57 to go');

  // a text that is not a whole number reads as 70, like an empty cell:
  // Intersection, and Straight only queues 40
  await inject(page, copy(s0), 122, null, { c: [4, 4, 3, 2, 0, 13, 0], target: 'x' }, []);
  expect(await text(pill.locator('.tl b'))).toBe('Intersection');
  await expect(page.locator('#cnt')).toHaveText('13 of 70');
  await pickType(page, 'str');
  await expect(page.locator('.dlg')).toHaveCount(0);
  await expectToastText(page, 'Type set: Straight only');
  a = await store(page);
  expect(targets(a)).toHaveLength(1);
  expect(targets(a)[0]).toMatchObject({ poi: 122, target: 40, fromType: 'int', state: 'waiting' });
  await expect(page.locator('#cnt')).toHaveText('13 of 40');

  // "70" as text: Intersection, and No straight, at 70 too, queues nothing
  await inject(page, copy(s0), 122, null, { c: [5, 5, 2, 2, 7, 0, 7], target: '70' }, []);
  expect(await text(pill.locator('.tl b'))).toBe('Intersection');
  await expect(page.locator('#cnt')).toHaveText('14 of 70');
  await pickType(page, 'nost');
  await expect(page.locator('.dlg')).toHaveCount(0);
  await expectToastText(page, 'Type set: No straight');
  a = await store(page);
  expect(a.types[rid]['122']).toBe('nost');
  expect(targets(a)).toHaveLength(0);
  expect(a.events).toHaveLength(s0.events.length);
});

test('Audit · a sheet error on a Not drivable POI is never hidden', async ({ page }) => {
  await openSample(page);
  const s0 = await store(page);
  const sum = page.locator('#sumport');
  const sum0 = await text(sum);
  await expect(sum.locator('span.err')).toHaveText('1 error');   // the sample's POI 57
  await expect(sum).toContainText('79 of 196 POIs done');
  // POI 168, Not drivable, with 5 sides and no maneuver in the sheet: the
  // error shows on the row, the head, the caption, the grid tile, the
  // mini-map square and in the summary, and the POI stays out of the
  // drivable count (items 3, 43, 46, 58, 59)
  await inject(page, copy(s0), 168, 'nd', { c: [5, 0, 0, 0, 0, 0, 0], target: 0 }, []);
  const row = page.locator('#col .row[data-poi="168"]');
  await expect(row).toHaveClass('row err active');
  await expect(row.locator('.rt')).toHaveText('error');
  await expect(row.locator('.rt svg')).toHaveCount(0);
  await expect(page.locator('#cnt')).toHaveText('Not drivable');
  await expect(page.locator('#head .rest')).toHaveText('Sides 5 · maneuvers 0');
  await expect(page.locator('#pill')).toHaveClass('typebtn nd');
  const lock = page.locator('#lock');
  await expect(lock).toHaveText('Sheet error: sides and maneuvers disagree');
  await expect(lock).toHaveClass('lock err');
  for (const man of ['L', 'St', 'R']) await expect(page.locator('#stage [data-man="' + man + '"]')).toHaveClass(/\blocked\b/);
  await expect(sum.locator('span.err')).toHaveText('2 errors');
  await expect(sum).toContainText('79 of 196 POIs done');
  expect(await text(sum)).toBe(sum0.replace('1 error', '2 errors'));
  await page.locator('#col .mmap').click();
  const sheet = page.locator('.sheet');
  await expect(sheet).toBeVisible();
  const cell = sheet.locator('.cell[data-poi="168"]');
  await expect(cell).toHaveClass('cell err active');
  await expect(cell.locator('svg.ci use')).toHaveAttribute('href', '#i-alert');
  await expect(cell.locator('.cb')).toHaveCount(0);
  await sheet.locator('.cell[data-poi="136"]').click();
  await expect(sheet).toHaveCount(0);
  await expect(page.locator('#head .big')).toHaveText('136');
  await expect.poll(() => layers(page)).toBe(0);
  await expect(page.locator('#col .dots i').nth(167)).toHaveClass('err');
  await expect(row).toHaveClass('row err');

  // with its sides and maneuvers agreeing the POI is not drivable as
  // before, its 5 passes to fix (item 46)
  await inject(page, copy(s0), 168, 'nd', { c: [5, 0, 0, 0, 5, 0, 0], target: 0 }, []);
  await expect(row).toHaveClass('row nd active');
  await expect(row.locator('.rt')).toHaveText('not drivable');
  await expect(row.locator('.rt svg.rfix')).toHaveCount(1);
  await expect(page.locator('#cnt')).toHaveText('Not drivable');
  await expect(page.locator('#head .rest')).toHaveText('5 to fix');
  await expect(lock).toHaveText('5 passes to fix in the sheet');
  await expect(sum.locator('span.err')).toHaveText('1 error');
  await expect(sum).toContainText('79 of 196 POIs done');
  await selectPoi(page, 136);
  await expect(page.locator('#col .dots i').nth(167)).toHaveClass('nd');
});
