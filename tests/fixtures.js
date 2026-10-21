/* POI Tracker tests — the shared test object and helpers.
   test: Playwright's test with one rule added: a test fails when the page
   logs a page error or a console error (prompt Tests A, Part 3).
   The helpers read the app through the hooks of app/index.html: the store
   in localStorage key poi-app:store, the number of open layers in
   history.state.poiLayer, the arrows button[data-man], the sides
   button[data-side], the counter #cnt, the toast #toast.
*/
'use strict';
const base = require('@playwright/test');
const { expect } = base;

const KEY = 'poi-app:store';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const test = base.test.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', function (err) { errors.push('page error: ' + (err && err.message ? err.message : String(err))); });
    page.on('console', function (msg) { if (msg.type() === 'error') errors.push('console error: ' + msg.text()); });
    await use(page);
    expect(errors, 'the page logged errors').toEqual([]);
  }
});

// visible text with its whitespace collapsed to single spaces
async function text(locator) {
  return (await locator.innerText()).replace(/\s+/g, ' ').trim();
}
// the whole store, parsed; null when the key is missing
function store(page) {
  return page.evaluate(function (k) { var raw = localStorage.getItem(k); return raw === null ? null : JSON.parse(raw); }, KEY);
}
// the number of open layers: history.state.poiLayer, 0 when none is open
function layers(page) {
  return page.evaluate(function () { var s = history.state; return s && typeof s.poiLayer === 'number' ? s.poiLayer : 0; });
}
// true once this page holds the Web Lock on the store, that is, once the
// app has finished its start and can record
function holdsLock(page) {
  return page.evaluate(function (k) {
    return navigator.locks.query().then(function (q) { return q.held.some(function (l) { return l.name === k; }); });
  }, KEY);
}
// the toast: on, starting with the first word and ending with the rest
// (an icon sits between them)
async function expectToast(page, first, rest) {
  const toast = page.locator('#toast');
  await expect(toast).toHaveClass(/\bon\b/);
  const t = await text(toast);
  expect(t.startsWith(first), 'toast "' + t + '" should start with "' + first + '"').toBe(true);
  expect(t.endsWith(rest), 'toast "' + t + '" should end with "' + rest + '"').toBe(true);
}

// /app/ with empty storage: the clean start
async function openClean(page) {
  await page.goto('/app/');
  await expect(page.locator('#city')).toHaveText('No city');
  await expect.poll(() => holdsLock(page)).toBe(true);
}
// /app/?sample: the sample city, POI 136 of SAMPLE-001 on screen
async function openSample(page) {
  await page.goto('/app/?sample');
  await expect(page.locator('#city')).toHaveText('Sample city');
  await expect(page.locator('#cnt')).toHaveText('41 of 70');
  await expect.poll(() => holdsLock(page)).toBe(true);
}
// records one pass as in A4: the arrow, then the side; waits until the
// sides have closed again and the layer is gone
async function recordPass(page, man, side) {
  const stage = page.locator('#stage');
  await page.locator('#stage [data-man="' + man + '"]').click();
  await expect(stage).toHaveClass(/\bopen\b/);
  await page.locator('#stage [data-side="' + side + '"]').click();
  await expect(stage).not.toHaveClass(/\bopen\b/);
  await expect.poll(() => layers(page)).toBe(0);
}

module.exports = { test, expect, KEY, UUID, UUID_V4, text, store, layers, holdsLock, expectToast, openClean, openSample, recordPass };
