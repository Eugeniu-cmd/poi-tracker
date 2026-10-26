/* POI Tracker tests — scenarios C1 to C11: a type change with and without
   consequences, Not drivable, passes of a maneuver the new type forbids,
   the captions under the arrows, the route menu, and done by rings: the
   counter and every total count the passes that fit the type, passes
   that do not fit are "to fix" on the head, the row, the grid and the
   summary, a POI is done only when every ring is closed, a maneuver the
   type does not allow reads "+26 over" when it has passes, the toast
   counts what fits and a not-drivable POI with passes is to fix (prompt
   Tests C, prompts Done step 2a and 2b; screens.md items 3, 4, 10, 36,
   39, 40, 43, 46, 59, 60, 63, 64, decision D1; data-model.md "Targets
   per POI", "Event").
*/
'use strict';
const { test, expect, UUID_V4, text, store, layers, holdsLock, openSample, recordPass, openHistory, reloadWith } = require('./fixtures');

const TYPE_KEYS = ['int', 'nost', 'nol', 'nor', 'str', 'nd'];
const TYPE_NAMES = ['Intersection', 'No straight', 'No left', 'No right', 'Straight only', 'Not drivable'];

function targets(s) { return s.events.filter(function (e) { return e.kind === 'target'; }); }
function routeId(s) { return s.cities[0].routes[0].id; }   // SAMPLE-001
// the split of every type (screens.md item 46) and the type a sheet target
// reads as, as app/index.html holds them
const SPLIT = { int: { L: 28, St: 14, R: 28 }, nost: { L: 35, St: 0, R: 35 }, nol: { L: 0, St: 14, R: 56 },
                nor: { L: 56, St: 14, R: 0 }, str: { L: 0, St: 40, R: 0 }, nd: { L: 0, St: 0, R: 0 } };
const BY_TARGET = { 70: 'int', 40: 'str', 0: 'nd' };
const AT = { N: 0, S: 1, W: 2, E: 3, L: 4, St: 5, R: 6 };
// the POIs of route rid with passes to fix, counted from the store the way
// the app counts them (item 3): the baseline plus the waiting passes,
// against the split of the stored type or of the baseline's target; a
// not-drivable POI allows no maneuver, so every pass of it is to fix
// (item 46)
function toFixOf(s, rid) {
  const r = s.cities[0].routes.find(function (q) { return q.id === rid; });
  const bl = s.baseline[rid] || {}, ty = s.types[rid] || {};
  let n = 0;
  for (let p = 1; p <= r.poiCount; p++) {
    const b = bl[p], c = b ? b.c.slice() : [0, 0, 0, 0, 0, 0, 0];
    s.events.forEach(function (e) {
      if (e.routeId !== rid || e.poi !== p || e.kind !== 'pass' || e.state !== 'waiting') return;
      c[AT[e.side]] += e.delta; c[AT[e.man]] += e.delta;
    });
    const t = ty[p] || (b ? (BY_TARGET[b.target] || 'int') : 'int');
    const sp = SPLIT[t];
    const fix = Math.max(0, c[4] - sp.L) + Math.max(0, c[5] - sp.St) + Math.max(0, c[6] - sp.R);
    if (fix > 0) n += 1;
  }
  return n;
}
// the toast on, reading exactly t (a type change shows no icon)
async function expectToastText(page, t) {
  const toast = page.locator('#toast');
  await expect(toast).toHaveClass(/\bon\b/);
  await expect(toast).toHaveText(t);
}
// true when the warning triangle stands first in a row's tag, before the
// words (item 40)
function markFirst(rt) {
  return rt.evaluate(function (el) { var f = el.firstElementChild; return !!f && f.classList.contains('rfix'); });
}
// selects a POI in the column
async function selectPoi(page, n) {
  await page.locator('#col .row[data-poi="' + n + '"]').click();
  await expect(page.locator('#head .big')).toHaveText(String(n));
}
// opens the type menu from the pill and returns it
async function openTypes(page) {
  await page.locator('#pill').click();
  const pop = page.locator('.pop');
  await expect(pop).toBeVisible();
  return pop;
}
// chooses type t from the pill's menu; the menu closes whether a dialog
// opens or not
async function pickType(page, t) {
  const pop = await openTypes(page);
  await pop.locator('.opt[data-type="' + t + '"]').click();
  await expect(pop).toHaveCount(0);
}
// the steps of C1 without its checks: POI 122 set to Straight only
async function setStraightOnly122(page) {
  await selectPoi(page, 122);
  await pickType(page, 'str');
  const dlg = page.locator('.dlg');
  await expect(dlg).toBeVisible();
  await dlg.locator('[data-act="dlg-ok"]').click();
  await expect(dlg).toHaveCount(0);
  await expect(page.locator('#cnt')).toHaveText('13 of 40');
}

test('C1 · A type change with consequences', async ({ page }) => {
  await openSample(page);
  const rid = routeId(await store(page));
  await selectPoi(page, 122);
  await expect(page.locator('#cnt')).toHaveText('66 of 70');

  const pop = await openTypes(page);
  expect(await text(pop.locator('.pt'))).toBe('POI 122 TYPE');
  const opts = pop.locator('.opt');
  await expect(opts).toHaveCount(6);
  for (let i = 0; i < 6; i++) {
    await expect(opts.nth(i)).toHaveAttribute('data-type', TYPE_KEYS[i]);
    expect(await text(opts.nth(i).locator('b'))).toBe(TYPE_NAMES[i]);
  }
  await expect(pop.locator('.opt.on')).toHaveCount(1);
  await expect(pop.locator('.opt[data-type="int"]')).toHaveClass(/\bon\b/);

  await pop.locator('.opt[data-type="str"]').click();
  await expect(pop).toHaveCount(0);
  const dlg = page.locator('.dlg');
  await expect(dlg).toBeVisible();
  expect(await text(dlg.locator('.dtitle'))).toBe('Change POI 122 to Straight only?');
  const ok = dlg.locator('[data-act="dlg-ok"]');
  expect(await text(ok)).toBe('Change');
  await expect(ok).toHaveClass(/\bdanger\b/);
  // item 64 (app v0.9): the sentences of its first example; the sample's
  // POI 122 has no pass of this tablet, so every pass that does not fit
  // was typed in by hand and no switch shows (app-type-dialog.spec.js has
  // frame I's two sent passes)
  expect(await text(dlg.locator('.dbody'))).toBe('It has 26 Left and 27 Right passes in the sheet. Straight only does not allow Left or Right. The app stops counting them, but the sheet keeps them and the export sends them to the client until they are deleted. They were typed in by hand: delete them in the sheet.');
  await expect(dlg.locator('.drow')).toHaveCount(0);
  await ok.click();
  await expect(dlg).toHaveCount(0);

  await expectToastText(page, 'Type set: Straight only');
  expect(await text(page.locator('#pill b'))).toBe('Straight only');
  // decision D1: 13 Straight fit, 26 Left and 27 Right are to fix, the
  // Straight ring still asks (items 4, 40, 46)
  await expect(page.locator('#cnt')).toHaveText('13 of 40');
  const rest = page.locator('#head .rest');
  await expect(rest).toHaveText('27 to go · 53 to fix');
  await expect(rest.locator('.fix')).toHaveText('53 to fix');
  await expect(rest).not.toHaveClass(/\bok\b/);
  // item 40: while the Straight ring still asks, the row carries the
  // triangle before "27 to go" and no class fix, so only the triangle is
  // in the warning colour (frame S)
  const row = page.locator('#col .row[data-poi="122"]');
  await expect(row).not.toHaveClass(/\bfix\b/);
  await expect(row).not.toHaveClass(/\bdone\b/);
  await expect(row.locator('.rt')).toHaveText('27 to go');
  await expect(row.locator('.rt svg.rfix use')).toHaveAttribute('href', '#i-alert');
  expect(await markFirst(row.locator('.rt'))).toBe(true);
  // item 39: Left and Right, which Straight only does not allow, read
  // "+26 over" and "+27 over" on a full ring, the plus in its own span
  // (frame S)
  const rings = page.locator('#card .mz');
  await expect(rings).toHaveCount(3);
  for (const [i, v] of [[0, '+26 over'], [2, '+27 over']]) {
    await expect(rings.nth(i)).toHaveClass(/\bover\b/);
    await expect(rings.nth(i)).not.toHaveClass(/\boff\b/);
    expect(await text(rings.nth(i).locator('.in'))).toBe(v);
    expect(await text(rings.nth(i).locator('.rv span.pl'))).toBe('+');
    await expect(rings.nth(i).locator('.fg')).toHaveAttribute('stroke-dasharray', '100 100');
  }
  const lock = page.locator('#lock');
  await expect(lock).toBeVisible();
  await expect(lock).toHaveText('Straight only at this POI');

  const s = await store(page);
  expect(s.types[rid]['122']).toBe('str');
  const tev = targets(s);
  expect(tev).toHaveLength(1);
  expect(tev[0]).toMatchObject({ poi: 122, target: 40, fromType: 'int', state: 'waiting', seq: 23 });
  expect(tev[0].id).toMatch(UUID_V4);

  const hist = await openHistory(page);
  expect(await layers(page)).toBe(1);
  expect(await text(hist.locator('.hsub .chip.gold'))).toBe('POI 122');
  const first = hist.locator('.hlist .hr').first();
  await expect(first).toBeVisible();
  expect(await text(first.locator('.hmv'))).toBe('Type: Straight only');
  expect(await text(first.locator('.hst'))).toBe('Waiting');
  await expect(first.locator('button')).toHaveCount(0);
});

test('C2 · Back to the old type drops the change', async ({ page }) => {
  await openSample(page);
  const rid = routeId(await store(page));
  await setStraightOnly122(page);
  expect(targets(await store(page))).toHaveLength(1);

  await pickType(page, 'int');
  await expect(page.locator('.dlg')).toHaveCount(0);
  await expectToastText(page, 'Type set: Intersection');
  expect(await layers(page)).toBe(0);
  const s = await store(page);
  expect(targets(s)).toHaveLength(0);
  expect(s.types[rid]['122']).toBe('int');
  await expect(page.locator('#cnt')).toHaveText('66 of 70');
  await expect(page.locator('#head .rest')).toHaveText('4 to go');
});

test('C3 · A change with no consequence', async ({ page }) => {
  await openSample(page);
  const rid = routeId(await store(page));
  await selectPoi(page, 140);
  await expect(page.locator('#cnt')).toHaveText('0 of 70');

  await pickType(page, 'nor');
  await expect(page.locator('.dlg')).toHaveCount(0);
  await expectToastText(page, 'Type set: No right');
  expect(await layers(page)).toBe(0);
  const s = await store(page);
  expect(targets(s)).toHaveLength(0);
  expect(s.types[rid]['140']).toBe('nor');
  expect(await text(page.locator('#pill b'))).toBe('No right');
  expect(await text(page.locator('#pill small'))).toBe('56 · 14');
  // the Right ring: a dash on an empty track, faded
  const off = page.locator('#card .mz').nth(2);
  await expect(off).toHaveClass(/\boff\b/);
  await expect(off.locator('.fg')).toHaveCount(0);
  expect(await text(off.locator('.in'))).toBe('—');
  await expect(page.locator('#stage [data-man="R"]')).toHaveClass(/\blocked\b/);
  await expect(page.locator('#stage [data-man="L"]')).not.toHaveClass(/\blocked\b/);
  await expect(page.locator('#stage [data-man="St"]')).not.toHaveClass(/\blocked\b/);
  const lock = page.locator('#lock');
  await expect(lock).toBeVisible();
  await expect(lock).toHaveText('No right turn at this POI');
});

test('C4 · Not drivable', async ({ page }) => {
  await openSample(page);
  const rid = routeId(await store(page));
  await expect(page.locator('#head .big')).toHaveText('136');
  await expect(page.locator('#sumport')).toContainText('79 of 196 POIs done');

  await pickType(page, 'nd');
  const dlg = page.locator('.dlg');
  await expect(dlg).toBeVisible();
  expect(await text(dlg.locator('.dtitle'))).toBe('Change POI 136 to Not drivable?');
  // item 64 (app v0.9): the Not drivable sentences; the switch offers the
  // sample's 10 passes of POI 136 (app-type-dialog.spec.js takes it up)
  expect(await text(dlg.locator('.dbody'))).toBe('It has 41 passes in the sheet. Not drivable counts none of them. The sheet keeps them and the export sends them to the client until they are deleted. 10 of them were sent from this tablet, the other 31 were typed in by hand: delete those in the sheet.');
  expect(await text(dlg.locator('.drow .ol b'))).toBe('Also delete the 10 passes of this tablet');
  await expect(dlg.locator('.switch')).toHaveAttribute('aria-checked', 'true');
  const cancel = dlg.locator('[data-act="dlg-cancel"]');
  expect(await text(cancel)).toBe('Cancel');
  await cancel.click();
  await expect(dlg).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);
  let s = await store(page);
  expect(s.types[rid]).not.toHaveProperty('136');
  expect(s.events).toHaveLength(22);
  expect(targets(s)).toHaveLength(0);
  await expect(page.locator('#cnt')).toHaveText('41 of 70');

  await pickType(page, 'nd');
  await expect(dlg).toBeVisible();
  expect(await text(dlg.locator('.dtitle'))).toBe('Change POI 136 to Not drivable?');
  const ok = dlg.locator('[data-act="dlg-ok"]');
  expect(await text(ok)).toBe('Change');
  // the switch off: the 41 passes stay, and this test reads the POI with them
  await dlg.locator('.drow').click();
  await expect(dlg.locator('.switch')).toHaveAttribute('aria-checked', 'false');
  await ok.click();
  await expect(dlg).toHaveCount(0);
  await expectToastText(page, 'Type set: Not drivable');
  await expect(page.locator('#cnt')).toHaveText('Not drivable');
  // item 46: its 41 passes in the sheet are to fix (C11 has the row and the summary)
  await expect(page.locator('#head .rest')).toHaveText('41 to fix');
  await expect(page.locator('#head .rest span.fix')).toHaveText('41 to fix');
  // decision D3 (item 46, v0.8): a not-drivable POI with passes reads its
  // passes to fix in the warning colour, not "This POI is not drivable"
  const lock = page.locator('#lock');
  await expect(lock).toBeVisible();
  await expect(lock).toHaveText('41 passes to fix in the sheet');
  await expect(lock).toHaveClass('lock fix');
  for (const man of ['L', 'St', 'R']) {
    await expect(page.locator('#stage [data-man="' + man + '"]')).toHaveClass(/\blocked\b/);
  }
  await expect(page.locator('#col .row[data-poi="136"] .rt')).toHaveText('not drivable');
  await expect(page.locator('#sumport')).toContainText('79 of 195 POIs done');
  s = await store(page);
  expect(s.types[rid]['136']).toBe('nd');
  expect(s.events).toHaveLength(23);   // the target event alone: the switch was off
  const tev = targets(s);
  expect(tev).toHaveLength(1);
  expect(tev[0]).toMatchObject({ poi: 136, target: 0, fromType: 'int', state: 'waiting' });
});

test('C5 · Passes of a maneuver the new type forbids', async ({ page }) => {
  await openSample(page);
  const rid = routeId(await store(page));
  await selectPoi(page, 140);
  await recordPass(page, 'St', 'S');
  await recordPass(page, 'St', 'S');
  await expect(page.locator('#cnt')).toHaveText('2 of 70');
  const before = await store(page);
  expect(before.events).toHaveLength(24);
  expect(before.types[rid]).not.toHaveProperty('140');

  await pickType(page, 'nost');
  const dlg = page.locator('.dlg');
  await expect(dlg).toBeVisible();
  expect(await text(dlg.locator('.dtitle'))).toBe('Change POI 140 to No straight?');
  // item 64 (app v0.9): waiting passes named apart, the switch on by default;
  // none of them is in the sheet, so the dialog names no sheet and says the
  // waiting passes last (app v0.10)
  expect(await text(dlg.locator('.dbody'))).toBe('It has 2 Straight passes waiting on this tablet. No straight does not allow Straight. The app stops counting them. Passes waiting on this tablet are still sent unless the switch below deletes them.');
  expect(await text(dlg.locator('.drow .ol b'))).toBe('Also delete the 2 passes of this tablet');
  await expect(dlg.locator('.switch')).toHaveAttribute('aria-checked', 'true');
  await dlg.locator('[data-act="dlg-cancel"]').click();
  await expect(dlg).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);
  const s = await store(page);
  expect(s.types[rid]).not.toHaveProperty('140');
  expect(targets(s)).toHaveLength(0);
  expect(s.events).toHaveLength(24);
  expect(await text(page.locator('#pill b'))).toBe('Intersection');
  await expect(page.locator('#cnt')).toHaveText('2 of 70');
});

test('C6 · Captions of a full share', async ({ page }) => {
  // (a) Left over its share: the baseline of POI 136 rewritten
  await openSample(page);
  const s = await store(page);
  const rid = routeId(s);
  s.baseline[rid]['136'] = { c: [10, 10, 6, 5, 31, 0, 0], target: 70 };
  await reloadWith(page, s);
  await expect(page.locator('#city')).toHaveText('Sample city');
  await expect(page.locator('#head .big')).toHaveText('136');
  // decision D1: 28 of the 31 Left fit, 3 are to fix, the POI is in progress
  await expect(page.locator('#cnt')).toHaveText('28 of 70');
  const rest = page.locator('#head .rest');
  await expect(rest).toHaveText('42 to go · 3 to fix');
  await expect(rest.locator('.fix')).toHaveText('3 to fix');
  // item 40: the triangle before "42 to go" and no class fix while the
  // rings still ask
  const row136 = page.locator('#col .row[data-poi="136"]');
  await expect(row136).not.toHaveClass(/\bfix\b/);
  await expect(row136.locator('.rt')).toHaveText('42 to go');
  await expect(row136.locator('.rt svg.rfix')).toHaveCount(1);
  expect(await markFirst(row136.locator('.rt'))).toBe(true);
  const lock = page.locator('#lock');
  await expect(lock).toBeVisible();
  await expect(lock).toHaveText('Left is over its share: 31 of 28');
  await expect(page.locator('#stage [data-man="L"]')).toHaveClass(/\blocked\b/);
  const rings = page.locator('#card .mz');
  await expect(rings).toHaveCount(3);
  const left = rings.first();
  await expect(left.locator('.mn')).toContainText('Left');
  await expect(left).toHaveClass(/\bover\b/);
  expect(await text(left.locator('.in'))).toBe('+3 over');
  expect(await text(left.locator('.rv span.pl'))).toBe('+');   // the plus, as big as the digits (item 39)
  await expect(left.locator('.fg')).toHaveAttribute('stroke-dasharray', '100 100');
  expect(await left.locator('.rv').evaluate(function (el) { return getComputedStyle(el).color; })).toBe('rgb(126, 95, 10)');   // --warn on light

  // (b) Left done: POI 124 of the sample, Left 28 of 28
  await selectPoi(page, 124);
  await expect(lock).toBeVisible();
  await expect(lock).toHaveText('Left is done: 28 of 28');
  await expect(page.locator('#stage [data-man="L"]')).toHaveClass(/\blocked\b/);
  expect(await text(left.locator('.in'))).toBe('Done');
  // 68 of 70 in the sample, nothing to fix: no mark and no "to fix"
  await expect(page.locator('#cnt')).toHaveText('68 of 70');
  await expect(rest).toHaveText('2 to go');
  await expect(rest.locator('.fix')).toHaveCount(0);
  const row124 = page.locator('#col .row[data-poi="124"]');
  await expect(row124).not.toHaveClass(/\bfix\b/);
  await expect(row124.locator('.rt')).toHaveText('2 to go');
  await expect(row124.locator('.rt svg.rfix')).toHaveCount(0);
});

test('C7 · The route menu and the POI it opens', async ({ page }) => {
  await openSample(page);
  await page.locator('#routeBtn').click();
  const menu = page.locator('.rmenu');
  await expect(menu).toBeVisible();
  const items = menu.locator('.ritem');
  await expect(items).toHaveCount(2);
  expect(await text(items.nth(0))).toBe('SAMPLE-001 79 of 196 done');
  expect(await text(items.nth(1))).toBe('SAMPLE-002 60 of 150 done');
  await expect(items.nth(0)).toHaveClass(/\bon\b/);
  await expect(items.nth(1)).not.toHaveClass(/\bon\b/);

  await items.nth(1).click();
  await expect(menu).toHaveCount(0);
  await expect(page.locator('#routeBtn')).toHaveText('SAMPLE-002');
  await expect(page.locator('#head .big')).toHaveText('61');
  await expect(page.locator('#cnt')).toHaveText('0 of 70');
  await expect(page.locator('#sumport')).toContainText('60 of 150 POIs done');

  await selectPoi(page, 70);
  await page.reload();
  await expect(page.locator('#city')).toHaveText('Sample city');
  await expect(page.locator('#routeBtn')).toHaveText('SAMPLE-002');
  await expect(page.locator('#head .big')).toHaveText('70');
  await expect.poll(() => holdsLock(page)).toBe(true);

  await page.locator('#routeBtn').click();
  await expect(menu).toBeVisible();
  await menu.locator('.ritem', { hasText: 'SAMPLE-001' }).click();
  await expect(menu).toHaveCount(0);
  await expect(page.locator('#routeBtn')).toHaveText('SAMPLE-001');
  await expect(page.locator('#head .big')).toHaveText('136');
  await expect(page.locator('#cnt')).toHaveText('41 of 70');
});

test('C8 · Done is every ring closed', async ({ page }) => {
  // (a) rings open: POI 122 Straight only, 13 Straight of 40, 26 Left and
  // 27 Right to fix; Straight is live, Left and Right locked with the
  // per-maneuver caption (items 4, 26, 46)
  await openSample(page);
  const s0 = await store(page);
  const rid = routeId(s0);
  await setStraightOnly122(page);
  await expect(page.locator('#cnt')).toHaveText('13 of 40');
  const rest = page.locator('#head .rest');
  await expect(rest).toHaveText('27 to go · 53 to fix');
  await expect(page.locator('#stage [data-man="St"]')).not.toHaveClass(/\blocked\b/);
  await expect(page.locator('#stage [data-man="L"]')).toHaveClass(/\blocked\b/);
  await expect(page.locator('#stage [data-man="R"]')).toHaveClass(/\blocked\b/);
  const lock = page.locator('#lock');
  await expect(lock).toBeVisible();
  await expect(lock).toHaveText('Straight only at this POI');
  await expect(lock).toHaveClass(/\binfo\b/);

  // (b) rings closed: Straight reaches 40 in the sheet (the sides of
  // main-screen.html frame T, 93 in all), the 53 stay to fix, so the POI
  // is not done: every disc locked, the caption names the sheet, the row
  // reads "to fix" and is not green (items 40, 46)
  const s1 = await store(page);
  s1.baseline[rid]['122'] = { c: [36, 17, 20, 20, 26, 40, 27], target: 40 };
  await reloadWith(page, s1);
  await expect(page.locator('#city')).toHaveText('Sample city');
  await expect(page.locator('#head .big')).toHaveText('122');
  await expect(page.locator('#cnt')).toHaveText('40 of 40');
  await expect(rest).toHaveText('53 to fix');
  await expect(rest).toHaveClass(/\bfix\b/);
  await expect(rest).not.toHaveClass(/\bok\b/);
  await expect(rest.locator('.fix')).toHaveText('53 to fix');
  for (const man of ['L', 'St', 'R']) {
    await expect(page.locator('#stage [data-man="' + man + '"]')).toHaveClass(/\blocked\b/);
  }
  await expect(lock).toBeVisible();
  await expect(lock).toHaveText('53 passes to fix in the sheet');
  await expect(lock).toHaveClass(/\bfix\b/);
  const row = page.locator('#col .row[data-poi="122"]');
  await expect(row).toHaveClass(/\bfix\b/);
  await expect(row).toHaveClass(/\bactive\b/);
  await expect(row).not.toHaveClass(/\bdone\b/);
  await expect(row.locator('.rt')).toHaveText('to fix');
  await expect(row.locator('.rt svg.rfix')).toHaveCount(0);
  expect(await row.locator('.rt').evaluate(function (el) { return getComputedStyle(el).color; })).toBe('rgb(126, 95, 10)');   // --warn on light, not --ok
  // item 39: the over rings keep their plus (frame T)
  const rings = page.locator('#card .mz');
  for (const [i, v] of [[0, '+26 over'], [2, '+27 over']]) {
    await expect(rings.nth(i)).toHaveClass(/\bover\b/);
    expect(await text(rings.nth(i).locator('.in'))).toBe(v);
    expect(await text(rings.nth(i).locator('.rv span.pl'))).toBe('+');
  }
  // the summary: not among the POIs done, counted in "to fix" (item 3)
  const sum = page.locator('#sumport');
  await expect(sum).toContainText('79 of 196 POIs done');
  const toFix = toFixOf(s1, rid);
  expect(toFix).toBeGreaterThan(0);
  await expect(sum.locator('span.fix')).toHaveText(new RegExp('^' + toFix + ' to fix( ·)?$'));

  // (c) the sample as it was, no POI with passes to fix: no "to fix"
  // segment, POI 124 in progress
  await reloadWith(page, s0);
  await expect(page.locator('#city')).toHaveText('Sample city');
  await selectPoi(page, 124);
  await expect(page.locator('#cnt')).toHaveText('68 of 70');
  await expect(rest).toHaveText('2 to go');
  expect(toFixOf(s0, rid)).toBe(0);
  await expect(sum.locator('span.fix')).toHaveCount(0);
  await expect(sum).toContainText('79 of 196 POIs done');
});

test('C9 · The summary and the grid count to fix', async ({ page }) => {
  await openSample(page);
  const rid = routeId(await store(page));
  await setStraightOnly122(page);
  const s1 = await store(page);
  const toFix = toFixOf(s1, rid);
  expect(toFix).toBeGreaterThan(0);
  // the segment "N to fix" in the warning class, before the error segment
  const sum = page.locator('#sumport');
  const seg = sum.locator('span.fix');
  await expect(seg).toHaveCount(1);
  await expect(seg).toHaveText(new RegExp('^' + toFix + ' to fix ·$'));
  await expect(sum.locator('span.fix + span.err')).toHaveText('1 error');
  await expect(sum.locator('span').last()).toHaveClass(/\berr\b/);
  expect(await seg.evaluate(function (el) { return getComputedStyle(el).color; })).toBe('rgb(126, 95, 10)');   // --warn on light

  // the grid: the legend has "To fix" between "Not started" and "Sheet
  // error"; POI 122, whose Straight ring still asks, keeps its bar (item 59)
  const mmap = page.locator('#col .mmap');
  await mmap.click();
  const sheet = page.locator('.sheet');
  await expect(sheet).toBeVisible();
  const legend = sheet.locator('.legend .lg');
  await expect(legend).toHaveCount(7);
  expect(await legend.allInnerTexts()).toEqual(['Current', 'Done', 'In progress', 'Not started', 'To fix', 'Sheet error', 'Not drivable']);
  await expect(legend.nth(4).locator('.sw.fix svg.ci use')).toHaveAttribute('href', '#i-alert');
  const cell = sheet.locator('.cell[data-poi="122"]');
  await expect(cell).toHaveClass(/\bpart\b/);
  await expect(cell).not.toHaveClass(/\bfix\b/);
  await expect(cell.locator('.cb')).toHaveCount(1);
  await expect(cell.locator('.ci')).toHaveCount(0);
  await sheet.locator('[data-act="close-grid"]').first().click();
  await expect(sheet).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);

  // every ring closed and 53 to fix: the tile takes the fix class and the
  // alert sign, the dot keeps the part colour (items 58, 59)
  s1.baseline[rid]['122'] = { c: [36, 17, 20, 20, 26, 40, 27], target: 40 };
  await reloadWith(page, s1);
  await expect(page.locator('#cnt')).toHaveText('40 of 40');
  await expect(sum.locator('span.fix')).toHaveText(new RegExp('^' + toFixOf(s1, rid) + ' to fix ·$'));
  await expect(page.locator('#col .dots i').nth(121)).toHaveClass(/^act$/);
  await selectPoi(page, 124);
  await expect(page.locator('#col .dots i').nth(121)).toHaveClass(/^part$/);
  await mmap.click();
  await expect(sheet).toBeVisible();
  await expect(cell).toHaveClass(/\bfix\b/);
  await expect(cell).not.toHaveClass(/\bpart\b/);
  await expect(cell.locator('.cb')).toHaveCount(0);
  await expect(cell.locator('svg.ci use')).toHaveAttribute('href', '#i-alert');
  expect(await cell.locator('.ci').evaluate(function (el) { return getComputedStyle(el).color; })).toBe('rgb(126, 95, 10)');   // --warn on light
  await sheet.locator('[data-act="close-grid"]').first().click();
  await expect(sheet).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);
});

test('C10 · The toast counts what fits', async ({ page }) => {
  // POI 122 Straight only, 13 Straight of 40 and 53 passes to fix: a
  // Straight pass toasts the passes that fit, as the counter reads them
  // (items 4, 36)
  await openSample(page);
  await setStraightOnly122(page);
  await recordPass(page, 'St', 'N');
  const toast = page.locator('#toast');
  await expect(toast).toHaveClass(/\bon\b/);
  expect(await text(toast)).toBe('Saved: North · 14 of 40');   // the arrow icon sits between the words
  await expect(page.locator('#cnt')).toHaveText('14 of 40');
  await expect(page.locator('#head .rest')).toHaveText('26 to go · 53 to fix');
});

test('C11 · A not-drivable POI with passes is to fix', async ({ page }) => {
  // POI 122, 66 passes in the sheet, set to Not drivable: the counter
  // reads "Not drivable", the rest line "66 to fix", the row "not
  // drivable" with the triangle, and the summary counts it among the POIs
  // to fix (item 46)
  await openSample(page);
  const rid = routeId(await store(page));
  await selectPoi(page, 122);
  await pickType(page, 'nd');
  const dlg = page.locator('.dlg');
  await expect(dlg).toBeVisible();
  await dlg.locator('[data-act="dlg-ok"]').click();
  await expect(dlg).toHaveCount(0);
  await expectToastText(page, 'Type set: Not drivable');
  await expect(page.locator('#cnt')).toHaveText('Not drivable');
  const rest = page.locator('#head .rest');
  await expect(rest).toHaveText('66 to fix');
  await expect(rest.locator('span.fix')).toHaveText('66 to fix');
  const row = page.locator('#col .row[data-poi="122"]');
  await expect(row).toHaveClass(/\bnd\b/);
  await expect(row).toHaveClass(/\bactive\b/);
  await expect(row).not.toHaveClass(/\bfix\b/);
  await expect(row.locator('.rt')).toHaveText('not drivable');
  await expect(row.locator('.rt svg.rfix use')).toHaveAttribute('href', '#i-alert');
  expect(await markFirst(row.locator('.rt'))).toBe(true);
  const s = await store(page);
  expect(s.types[rid]['122']).toBe('nd');
  const toFix = toFixOf(s, rid);
  expect(toFix).toBeGreaterThan(0);
  const sum = page.locator('#sumport');
  await expect(sum.locator('span.fix')).toHaveText(new RegExp('^' + toFix + ' to fix ·$'));
  await expect(sum).toContainText('79 of 195 POIs done');

  // the sample's 168, not drivable with no passes: "Not counted" and no
  // triangle
  await selectPoi(page, 168);
  await expect(page.locator('#cnt')).toHaveText('Not drivable');
  await expect(rest).toHaveText('Not counted');
  await expect(rest.locator('span.fix')).toHaveCount(0);
  const row168 = page.locator('#col .row[data-poi="168"]');
  await expect(row168).toHaveClass(/\bnd\b/);
  await expect(row168.locator('.rt')).toHaveText('not drivable');
  await expect(row168.locator('.rt svg.rfix')).toHaveCount(0);
});
