/* POI Tracker tests — speed step 1: the POI column redraws only the rows,
   dots and caption that changed (app v0.14; screens.md items 40, 56, 57
   and 58). After each action the column's markup, the mini-map, the list
   of rows and the rail, ignoring the scroll position, equals the column
   of the same store opened fresh in a new page, so the patched column
   never drifts from a full draw. The actions, one after the other on one
   page: a pass recorded, Undo last of a waiting pass, Delete of a sent
   pass in History, Cancel removal, a type change with no dialog, Undo on
   the type toast, another POI selected from the column, from the grid and
   by the rail, another route chosen and back, and a reload. After a pass
   on a POI already in view the list's scrollTop is unchanged and only
   that POI's row is a new element.
   The fresh page opens in a browser context of its own, with the suite's
   viewport and base URL, so it holds its own Web Lock; the store goes in
   as reloadWith does. Eleven fresh pages take longer than the suite's
   timeout, so the test sets its own.
*/
'use strict';
const { test, expect, text, store, holdsLock, expectToast, openSample, recordPass, openHistory, reloadWith } = require('./fixtures');

// the column's markup without its scroll position: the mini-map, the list
// of rows and the rail
function column(page) {
  return page.evaluate(function () {
    var col = document.getElementById('col');
    return { mmap: col.querySelector('.mmap').innerHTML, list: col.querySelector('.list').innerHTML, rail: col.querySelector('.rail').innerHTML };
  });
}
// the column of the store s opened fresh in a new page of its own context
async function freshColumn(browser, options, s) {
  const ctx = await browser.newContext(options);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', function (err) { errors.push('page error: ' + (err && err.message ? err.message : String(err))); });
  page.on('console', function (msg) { if (msg.type() === 'error') errors.push('console error: ' + msg.text()); });
  await page.goto('/app/');
  await expect(page.locator('#city')).toHaveText('No city');
  await reloadWith(page, s);
  await expect(page.locator('#city')).toHaveText('Sample city');
  const c = await column(page);
  expect(errors, 'the fresh page logged errors').toEqual([]);
  await ctx.close();
  return c;
}
// the column on screen, patched, equals the one of the same store drawn fresh
async function expectFresh(page, browser, options, what) {
  const s = await store(page);
  const patched = await column(page);
  const fresh = await freshColumn(browser, options, s);
  expect(patched, 'the patched column differs from a fresh draw ' + what).toEqual(fresh);
}
// marks every row of the list with its place and returns the scroll
function markRows(list) {
  return list.evaluate(function (el) {
    Array.prototype.forEach.call(el.children, function (row, i) { row.__drawn = i; });
    return el.scrollTop;
  });
}
// the scroll and the POIs whose rows are new elements since markRows
function newRows(list) {
  return list.evaluate(function (el) {
    var poi = [];
    Array.prototype.forEach.call(el.children, function (row, i) { if (row.__drawn !== i) poi.push(row.getAttribute('data-poi')); });
    return { top: el.scrollTop, poi: poi };
  });
}
// chooses type t from the pill's menu (as app-type-undo.spec.js)
async function pickType(page, t) {
  await page.locator('#pill').click();
  const pop = page.locator('.pop');
  await expect(pop).toBeVisible();
  await pop.locator('.opt[data-type="' + t + '"]').click();
  await expect(pop).toHaveCount(0);
}

test('The patched column equals a fresh draw after every action', async ({ page, browser, viewport, baseURL }) => {
  test.setTimeout(120000);
  const options = { viewport: viewport, baseURL: baseURL };
  await openSample(page);
  const list = page.locator('#col .list');
  const dlg = page.locator('.dlg');
  const toast = page.locator('#toast');

  // a pass recorded on POI 136, in view: the scroll stays where it was and
  // only the POI's row is a new element
  const top0 = await markRows(list);
  expect(top0).toBeGreaterThan(0);   // POI 136 is centred, so the list is scrolled
  await recordPass(page, 'L', 'S');
  await expect(page.locator('#col .row[data-poi="136"] .rt')).toHaveText('28 to go');
  expect(await newRows(list)).toEqual({ top: top0, poi: ['136'] });
  await expectFresh(page, browser, options, 'after a pass');

  // Undo last of the waiting pass
  await page.locator('[data-act="undo"]').click();
  await expect(dlg).toBeVisible();
  await dlg.locator('[data-act="dlg-ok"]').click();
  await expect(dlg).toHaveCount(0);
  await expectToast(page, 'Removed:', 'South · 41 of 70');
  await expect(page.locator('#col .row[data-poi="136"] .rt')).toHaveText('29 to go');
  await expectFresh(page, browser, options, 'after Undo last');

  // another POI selected from the column, with History open beside it
  const hist = await openHistory(page);
  await page.locator('#col .row[data-poi="135"]').click();
  await expect(page.locator('#head .big')).toHaveText('135');
  await expect(page.locator('#col .row.active')).toHaveCount(1);
  await expectFresh(page, browser, options, 'after a POI selected from the column');

  // Delete of a sent pass in History: the newest pass of POI 135
  const rows = hist.locator('.hlist .hr');
  await expect(rows).toHaveCount(5);
  const row = rows.first();
  await row.locator('.hdel').click();
  await expect(dlg).toBeVisible();
  await dlg.locator('[data-act="dlg-ok"]').click();
  await expect(dlg).toHaveCount(0);
  await expectToast(page, 'Removal queued:', 'East · 69 of 70');
  await expect(page.locator('#col .row[data-poi="135"] .rt')).toHaveText('1 to go');
  await expectFresh(page, browser, options, 'after Delete of a sent pass');

  // Cancel removal: the pass counts again
  const cancel = row.locator('.hacts .btn');
  expect(await text(cancel)).toBe('Cancel removal');
  await cancel.click();
  await expect(row).toHaveClass('hr');
  await expect(page.locator('#col .row[data-poi="135"] .rt')).toHaveText('done');
  await expectFresh(page, browser, options, 'after Cancel removal');
  await hist.locator('[data-act="close-history"]').click();
  await expect(hist).toHaveCount(0);

  // a type change with no dialog: POI 53, an Intersection with no passes,
  // to Straight only, 40 to go
  await page.locator('#col .row[data-poi="53"]').click();
  await expect(page.locator('#head .big')).toHaveText('53');
  await expect(page.locator('#col .row[data-poi="53"] .rt')).toHaveText('70 to go');
  await pickType(page, 'str');
  await expect(dlg).toHaveCount(0);
  await expect(toast).toHaveClass(/undo/);
  await expect(page.locator('#col .row[data-poi="53"] .rt')).toHaveText('40 to go');
  await expectFresh(page, browser, options, 'after a type change with no dialog');

  // Undo on the type toast: Not drivable asks nothing on a POI with no
  // passes and takes one POI out of the caption; Undo puts Straight only back
  await pickType(page, 'nd');
  await expect(dlg).toHaveCount(0);
  await expect(page.locator('#col .row[data-poi="53"] .rt')).toHaveText('not drivable');
  const undo = toast.locator('.tundo');
  expect(await text(undo)).toBe('Undo');
  await undo.click();
  await expect(page.locator('#col .row[data-poi="53"] .rt')).toHaveText('40 to go');
  await expectFresh(page, browser, options, 'after Undo on the type toast');

  // another POI selected from the grid
  await page.locator('#col .mmap').click();
  const sheet = page.locator('.sheet');
  await expect(sheet).toBeVisible();
  await sheet.locator('.cell[data-poi="57"]').click();
  await expect(sheet).toHaveCount(0);
  await expect(page.locator('#head .big')).toHaveText('57');
  await expectFresh(page, browser, options, 'after a POI selected from the grid');

  // another POI by the rail: a drag along it runs through the list and its
  // bubble names the POI brought into view; a tap on that row selects it
  const rail = page.locator('#col .rail');
  const b = await rail.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height * 0.75);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height * 0.77);
  const bubble = page.locator('#col .bubble');
  await expect(bubble).toBeVisible();
  const n = await text(bubble);
  expect(n).toMatch(/^1[0-9][0-9]$/);
  await page.mouse.up();
  await expect(bubble).toHaveCount(0);
  await expect(page.locator('#col .finger')).toHaveCount(0);
  await page.locator('#col .row[data-poi="' + n + '"]').click();
  await expect(page.locator('#head .big')).toHaveText(n);
  await expectFresh(page, browser, options, 'after a POI selected by the rail');

  // another route chosen and back
  const s = await store(page);
  const r1 = s.cities[0].routes[0], r2 = s.cities[0].routes[1];
  await page.locator('#routeBtn').click();
  const menu = page.locator('.rmenu');
  await expect(menu).toBeVisible();
  await menu.locator('.ritem[data-route="' + r2.id + '"]').click();
  await expect(menu).toHaveCount(0);
  await expect(page.locator('#routeBtn')).toContainText('SAMPLE-002');
  await expect(page.locator('#col .row')).toHaveCount(150);
  await expectFresh(page, browser, options, 'after another route chosen');
  await page.locator('#routeBtn').click();
  await expect(menu).toBeVisible();
  await menu.locator('.ritem[data-route="' + r1.id + '"]').click();
  await expect(menu).toHaveCount(0);
  await expect(page.locator('#routeBtn')).toContainText('SAMPLE-001');
  await expect(page.locator('#col .row')).toHaveCount(197);
  await expect(page.locator('#head .big')).toHaveText(n);
  await expectFresh(page, browser, options, 'after the route chosen back');

  // a reload
  await page.reload();
  await expect.poll(() => holdsLock(page)).toBe(true);
  await expect(page.locator('#head .big')).toHaveText(n);
  await expectFresh(page, browser, options, 'after a reload');
});
