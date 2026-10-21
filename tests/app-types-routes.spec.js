/* POI Tracker tests — scenarios C1 to C7: a type change with and without
   consequences, Not drivable, passes of a maneuver the new type forbids,
   the captions under the arrows and the route menu (prompt Tests C;
   screens.md items 4, 10, 39, 43, 46, 60, 63, 64; data-model.md "Targets
   per POI", "Event").
*/
'use strict';
const { test, expect, UUID_V4, text, store, layers, holdsLock, openSample, recordPass, openHistory, reloadWith } = require('./fixtures');

const TYPE_KEYS = ['int', 'nost', 'nol', 'nor', 'str', 'nd'];
const TYPE_NAMES = ['Intersection', 'No straight', 'No left', 'No right', 'Straight only', 'Not drivable'];

function targets(s) { return s.events.filter(function (e) { return e.kind === 'target'; }); }
function routeId(s) { return s.cities[0].routes[0].id; }   // SAMPLE-001
// the toast on, reading exactly t (a type change shows no icon)
async function expectToastText(page, t) {
  const toast = page.locator('#toast');
  await expect(toast).toHaveClass(/\bon\b/);
  await expect(toast).toHaveText(t);
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
  await expect(page.locator('#cnt')).toHaveText('66 of 40');
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
  await expect(ok).toHaveClass(/\bprimary\b/);
  expect(await text(dlg.locator('.dbody'))).toBe('It already has 66 passes. Straight only needs 40, so the POI becomes done with 26 passes over its target. The sheet will flag it as over target. It has 26 Left and 27 Right passes in the sheet. Straight only does not allow Left or Right, so they no longer count. Delete them in History if they were a mistake.');
  await ok.click();
  await expect(dlg).toHaveCount(0);

  await expectToastText(page, 'Type set: Straight only');
  expect(await text(page.locator('#pill b'))).toBe('Straight only');
  await expect(page.locator('#cnt')).toHaveText('66 of 40');
  await expect(page.locator('#head .rest')).toHaveText('Done · 26 over target');
  await expect(page.locator('#col .row[data-poi="122"] .rt')).toHaveText('done +26');
  const lock = page.locator('#lock');
  await expect(lock).toBeVisible();
  await expect(lock).toHaveText('This POI is done: 66 of 40');

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
  expect(await text(page.locator('#pill small'))).toBe('70 passes · 56 · 14');
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
  expect(await text(dlg.locator('.dbody'))).toBe('It has 41 passes in the sheet. They stay there, and the app stops counting this POI.');
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
  await ok.click();
  await expect(dlg).toHaveCount(0);
  await expectToastText(page, 'Type set: Not drivable');
  await expect(page.locator('#cnt')).toHaveText('Not drivable');
  await expect(page.locator('#head .rest')).toHaveText('Not counted');
  const lock = page.locator('#lock');
  await expect(lock).toBeVisible();
  await expect(lock).toHaveText('This POI is not drivable');
  for (const man of ['L', 'St', 'R']) {
    await expect(page.locator('#stage [data-man="' + man + '"]')).toHaveClass(/\blocked\b/);
  }
  await expect(page.locator('#col .row[data-poi="136"] .rt')).toHaveText('not drivable');
  await expect(page.locator('#sumport')).toContainText('79 of 195 POIs done');
  s = await store(page);
  expect(s.types[rid]['136']).toBe('nd');
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
  expect(await text(dlg.locator('.dbody'))).toBe('It has 2 Straight passes waiting on this tablet. No straight does not allow Straight, so they no longer count. Delete them in History if they were a mistake.');
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
  await expect(page.locator('#cnt')).toHaveText('31 of 70');
  const lock = page.locator('#lock');
  await expect(lock).toBeVisible();
  await expect(lock).toHaveText('Left is over its share: 31 of 28');
  await expect(page.locator('#stage [data-man="L"]')).toHaveClass(/\blocked\b/);
  const tiles = page.locator('.need .nc');
  await expect(tiles).toHaveCount(3);
  const left = tiles.first();
  await expect(left.locator('.nh')).toContainText('Left');
  await expect(left).toHaveClass(/\bover\b/);
  await expect(left.locator('.nv')).toContainText('+3');

  // (b) Left done: POI 124 of the sample, Left 28 of 28
  await selectPoi(page, 124);
  await expect(lock).toBeVisible();
  await expect(lock).toHaveText('Left is done: 28 of 28');
  await expect(page.locator('#stage [data-man="L"]')).toHaveClass(/\blocked\b/);
  await expect(left.locator('.nv')).toHaveText('Done');
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
