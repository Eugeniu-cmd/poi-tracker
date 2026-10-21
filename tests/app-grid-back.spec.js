/* POI Tracker tests — scenarios B7 and B8: the grid of all POIs and the
   back gesture closing exactly one layer (prompt Tests B; screens.md
   items 44, 59, 66).
   page.goBack() stands in for the Android back gesture: the app keeps one
   history entry per open layer.
*/
'use strict';
const { test, expect, text, store, layers, openSample, openHistory } = require('./fixtures');

// true when the row lies fully inside the visible part of the column's
// list: within its box and above the fade at its bottom edge, which is
// --s-3 tall (app/index.html, .list mask-image)
async function insideList(page, row, list) {
  const r = await row.boundingBox(), l = await list.boundingBox();
  expect(r).not.toBeNull();
  expect(l).not.toBeNull();
  const fade = await page.evaluate(function () { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s-3')) || 0; });
  expect(fade).toBeGreaterThan(0);
  return r.y >= l.y && r.y + r.height <= l.y + l.height - fade;
}

test('B7 · The grid', async ({ page }) => {
  await openSample(page);
  const sheet = page.locator('.sheet');
  const mmap = page.locator('#col .mmap');

  await mmap.click();
  await expect(sheet).toBeVisible();
  expect(await layers(page)).toBe(1);
  expect(await text(sheet.locator('.stitle'))).toBe('All POIs');
  expect(await text(sheet.locator('.sroute'))).toBe('SAMPLE-001');
  await expect(sheet.locator('.cell[data-poi]')).toHaveCount(197);
  await expect(sheet.locator('.cell[data-poi="136"]')).toHaveClass(/\bactive\b/);
  await expect(sheet.locator('.cell.active')).toHaveCount(1);

  await sheet.locator('.cell[data-poi="57"]').click();
  await expect(sheet).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);
  await expect(page.locator('#head .big')).toHaveText('57');
  const row = page.locator('#col .row[data-poi="57"]');
  await expect(row).toHaveClass(/\bactive\b/);
  await expect(page.locator('#col .row.active')).toHaveCount(1);
  expect(await insideList(page, row, page.locator('#col .list'))).toBe(true);

  // the grid over History returns to History when it closes (item 44)
  const hist = await openHistory(page);
  expect(await layers(page)).toBe(1);
  await mmap.click();
  await expect(sheet).toBeVisible();
  expect(await layers(page)).toBe(2);
  await page.goBack();
  await expect(sheet).toHaveCount(0);
  await expect(hist).toBeVisible();
  await expect.poll(() => layers(page)).toBe(1);

  await mmap.click();
  await expect(sheet).toBeVisible();
  await sheet.locator('.cell[data-poi="135"]').click();
  await expect(sheet).toHaveCount(0);
  await expect(hist).toBeVisible();
  expect(await text(hist.locator('.hsub .chip.amber'))).toBe('POI 135');
  await expect(page.locator('#head .big')).toHaveText('135');
  await expect.poll(() => layers(page)).toBe(1);
});

test('B8 · The back gesture closes exactly one layer', async ({ page }) => {
  await openSample(page);
  const stage = page.locator('#stage');

  // (a) the open sides
  await page.locator('#stage [data-man="L"]').click();
  await expect(stage).toHaveClass(/\bopen\b/);
  await expect(page.locator('#stage [data-side="S"]')).toBeVisible();
  expect(await layers(page)).toBe(1);
  await page.goBack();
  await expect(stage).not.toHaveClass(/\bopen\b/);
  await expect(page.locator('#stage [data-side="S"]')).toBeHidden();
  await expect.poll(() => layers(page)).toBe(0);
  await expect(page).toHaveURL('/app/');

  // (b) the route menu
  await page.locator('#routeBtn').click();
  const menu = page.locator('.rmenu');
  await expect(menu).toBeVisible();
  expect(await layers(page)).toBe(1);
  await page.goBack();
  await expect(menu).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);
  await expect(page).toHaveURL('/app/');

  // (c) the type menu
  await page.locator('#pill').click();
  const pop = page.locator('.pop');
  await expect(pop).toBeVisible();
  expect(await layers(page)).toBe(1);
  await page.goBack();
  await expect(pop).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);
  await expect(page).toHaveURL('/app/');

  // (d) the dialog of Undo last
  const before = JSON.stringify(await store(page));
  await page.locator('[data-act="undo"]').click();
  const dlg = page.locator('.dlg');
  await expect(dlg).toBeVisible();
  expect(await layers(page)).toBe(1);
  await page.goBack();
  await expect(dlg).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);
  expect(JSON.stringify(await store(page))).toBe(before);
  await expect(page).toHaveURL('/app/');

  // (e) History
  let hist = await openHistory(page);
  expect(await layers(page)).toBe(1);
  await page.goBack();
  await expect(hist).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);
  await expect(page).toHaveURL('/app/');

  // (f) History closed with its ✕: the entry is taken back
  hist = await openHistory(page);
  expect(await layers(page)).toBe(1);
  await hist.locator('[data-act="close-history"]').click();
  await expect(page.locator('section.hist')).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);
  await expect(page).toHaveURL('/app/');
});
