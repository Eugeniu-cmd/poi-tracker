/* POI Tracker tests — the done green of the grid (prompt "A brighter done
   green for the grid"; screens.md v0.58, items 58 and 59; _tokens.css
   v0.23, main-screen v0.42, app v0.12): on light a done tile of the All
   POIs grid, the legend's Done swatch and a done square of the mini-map
   take --ok-tile, #2F9447, on --ok-tile-bg, its own tint, since their
   large numbers need 3:1, while a done row of the POI column keeps --ok,
   #287030, on --ok-bg for its number and its word "done", small text that
   needs 4.5:1. On dark both pairs are one: --ok #5FE0A0 and --ok-bg.
   The light and dark tests emulate the system colour scheme before the
   app opens, so its "System" theme follows it.
*/
'use strict';
const { test, expect, text, layers, openSample } = require('./fixtures');

// the greens of _tokens.css v0.23, one value per theme
const TILE = { light: 'rgb(47, 148, 71)', dark: 'rgb(95, 224, 160)' };                   // --ok-tile: #2F9447 on light, --ok on dark
const TILE_BG = { light: 'rgba(47, 148, 71, 0.14)', dark: 'rgba(95, 224, 160, 0.16)' };   // --ok-tile-bg: its own tint on light, --ok-bg on dark
const OK = { light: 'rgb(40, 112, 48)', dark: 'rgb(95, 224, 160)' };                     // --ok
const OK_BG = { light: 'rgba(40, 112, 48, 0.14)', dark: 'rgba(95, 224, 160, 0.16)' };     // --ok-bg
const DONE = 79;   // done POIs of the sample route, "79 of 196 POIs done"

// a computed style property of the element
function css(locator, prop) {
  return locator.evaluate(function (el, p) { return getComputedStyle(el).getPropertyValue(p); }, prop);
}
// the distinct computed values of one property over every element the
// selector matches inside the locator, sorted
function distinct(locator, selector, prop) {
  return locator.evaluate(function (root, a) {
    var set = {};
    root.querySelectorAll(a.selector).forEach(function (el) { set[getComputedStyle(el).getPropertyValue(a.prop)] = true; });
    return Object.keys(set).sort();
  }, { selector: selector, prop: prop });
}

async function doneGreen(page, scheme) {
  const tile = TILE[scheme], tileBg = TILE_BG[scheme], ok = OK[scheme];
  await page.emulateMedia({ colorScheme: scheme });
  await openSample(page);

  // a. a done row of the POI column keeps --ok on --ok-bg: POI 130 is done
  //    in the sample; its number and its word "done" are small text
  const row = page.locator('#col .row[data-poi="130"]');
  await expect(row).toHaveClass(/\bdone\b/);
  expect(await text(row.locator('.rt'))).toBe('done');
  expect(await css(row.locator('.rn'), 'color')).toBe(ok);
  expect(await css(row.locator('.rt'), 'color')).toBe(ok);
  expect(await css(row, 'background-color')).toBe(OK_BG[scheme]);

  // b. a done square of the mini-map takes --ok-tile: the square of POI 130
  //    (index 129), and every done square
  const square = page.locator('#col .dots i').nth(129);
  await expect(square).toHaveClass('done');
  expect(await css(square, 'background-color')).toBe(tile);
  await expect(page.locator('#col .dots i.done')).toHaveCount(DONE);
  expect(await distinct(page.locator('#col .mmap'), '.dots i.done', 'background-color')).toEqual([tile]);

  // c. the grid: a done tile's number, check and border take --ok-tile, on
  //    the tint --ok-tile-bg; every done tile alike
  await page.locator('#col .mmap').click();
  const sheet = page.locator('.sheet');
  await expect(sheet).toBeVisible();
  expect(await layers(page)).toBe(1);
  const cell = sheet.locator('.cell[data-poi="130"]');
  await expect(cell).toHaveClass('cell done');
  expect(await css(cell.locator('.cn'), 'color')).toBe(tile);
  expect(await css(cell.locator('.ci'), 'color')).toBe(tile);
  expect(await css(cell, 'border-top-color')).toBe(tile);
  expect(await css(cell, 'background-color')).toBe(tileBg);
  await expect(sheet.locator('.cell.done')).toHaveCount(DONE);
  expect(await distinct(sheet, '.cell.done .cn', 'color')).toEqual([tile]);
  expect(await distinct(sheet, '.cell.done .ci', 'color')).toEqual([tile]);
  expect(await distinct(sheet, '.cell.done', 'border-top-color')).toEqual([tile]);
  expect(await distinct(sheet, '.cell.done', 'background-color')).toEqual([tileBg]);

  // d. the legend's Done swatch: the same green and tint, its check too
  const sw = sheet.locator('.legend .sw.done');
  await expect(sw).toHaveCount(1);
  expect(await css(sw, 'border-top-color')).toBe(tile);
  expect(await css(sw, 'background-color')).toBe(tileBg);
  expect(await css(sw.locator('.ci'), 'color')).toBe(tile);

  // e. the grid closes with the back gesture and nothing changed
  await page.goBack();
  await expect(sheet).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);
  await expect(page.locator('#head .big')).toHaveText('136');
}

test('Done green · light', async ({ page }) => { await doneGreen(page, 'light'); });

test('Done green · dark', async ({ page }) => { await doneGreen(page, 'dark'); });
