/* POI Tracker tests — no zoom, and leaving the app cancels a half-made
   pass (screens.md v0.61, items 8 and 52; app v0.17, decided 2026-10-27).
   The page is made hidden the way Chrome does it when the app leaves the
   screen: document.visibilityState and document.hidden are overridden
   and visibilitychange is dispatched, then restored and dispatched again.
   Two tests drive the app's timers with Playwright's clock, as
   app-record.spec.js does: installed before the page opens, paused once
   the app has started, then advanced.
*/
'use strict';
const { test, expect, store, layers, openSample } = require('./fixtures');

const VIEWPORT = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';

// pauses the app's clock a second ahead of its current time
async function pauseClock(page) {
  const now = await page.evaluate(function () { return Date.now(); });
  await page.clock.pauseAt(now + 1000);
}
// the app leaves the screen: the page becomes hidden
function hide(page) {
  return page.evaluate(function () {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: function () { return 'hidden'; } });
    Object.defineProperty(document, 'hidden', { configurable: true, get: function () { return true; } });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}
// the app is back on the screen: the browser's own values again
function show(page) {
  return page.evaluate(function () {
    delete document.visibilityState;
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
}
// the markup of the working screen's stage (discs, sides, caption) and
// of its action bar (Undo last, History, the summary, Cancel while open)
function screen(page) {
  return page.evaluate(function () { return document.getElementById('stage').outerHTML + document.getElementById('bar').innerHTML; });
}
// POI 53 of the sample on screen: an Intersection with no passes, so
// every disc is free and the counter reads 0 of 70
async function openPoi53(page) {
  await openSample(page);
  await page.locator('#col .row[data-poi="53"]').click();
  await expect(page.locator('#head .big')).toHaveText('53');
  await expect(page.locator('#cnt')).toHaveText('0 of 70');
}

test('No zoom: the viewport tag and the touch action of the app', async ({ page }) => {
  await openSample(page);
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', VIEWPORT);
  expect(await page.locator('#app').evaluate(function (e) { return getComputedStyle(e).touchAction; })).toBe('pan-x pan-y');
  expect(await page.locator('#col .rail').evaluate(function (e) { return getComputedStyle(e).touchAction; })).toBe('none');
});

test('Leaving the app closes the open sides as Cancel does', async ({ page }) => {
  await openPoi53(page);
  const stage = page.locator('#stage');
  const before = await screen(page);
  const kept = JSON.stringify(await store(page));

  await page.locator('#stage [data-man="L"]').click();
  await expect(stage).toHaveClass(/\bopen\b/);
  await expect(page.locator('#stage [data-side="S"]')).toBeVisible();
  await expect(page.locator('#bar [data-act="cancel"]')).toBeVisible();
  expect(await layers(page)).toBe(1);

  await hide(page);
  await expect(stage).not.toHaveClass(/\bopen\b/);
  await expect(page.locator('#stage [data-side="S"]')).toBeHidden();
  await expect(page.locator('#bar [data-act="cancel"]')).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);
  expect(JSON.stringify(await store(page))).toBe(kept);
  await expect(page.locator('#toast')).not.toHaveClass(/\bon\b/);

  await show(page);
  expect(await screen(page)).toBe(before);
  await expect(page.locator('#cnt')).toHaveText('0 of 70');
  expect(await layers(page)).toBe(0);
  // no history entry is left for the closed layer: with nothing open the
  // back gesture (page.goBack(), history.back() as in app-grid-back)
  // reopens nothing and leaves the app (item 66), here to the tab's blank
  // page
  await page.goBack();
  await expect(page).toHaveURL(/^about:blank$/);
  await expect(page.locator('#stage.open')).toHaveCount(0);
});

test('A pass whose side was tapped is saved and finishes while the app is away', async ({ page }) => {
  await page.clock.install({ time: Date.now() });
  await openPoi53(page);
  await pauseClock(page);
  const stage = page.locator('#stage');
  const before = await store(page);
  const knownIds = new Set(before.events.map(function (e) { return e.id; }));

  await page.locator('#stage [data-man="L"]').click();
  await expect(stage).toHaveClass(/\bopen\b/);
  const south = page.locator('#stage [data-side="S"]');
  await south.click();
  await expect(south).toHaveClass(/\bring\b/);

  await hide(page);
  await expect(stage).toHaveClass(/\bopen\b/);   // the ring still runs: the pass finishes as usual
  await page.clock.runFor(600);
  await expect(stage).not.toHaveClass(/\bopen\b/);
  await expect(south).toBeHidden();
  await expect.poll(() => layers(page)).toBe(0);
  await show(page);

  const after = await store(page);
  const added = after.events.filter(function (e) { return !knownIds.has(e.id); });
  expect(added).toHaveLength(1);
  expect(added[0]).toMatchObject({ kind: 'pass', side: 'S', man: 'L', delta: 1, poi: 53, state: 'waiting' });
  await expect(stage).not.toHaveClass(/\bopen\b/);
  await expect(page.locator('#bar [data-act="cancel"]')).toHaveCount(0);
  await expect(page.locator('#cnt')).toHaveText('1 of 70');
  expect(await layers(page)).toBe(0);
});

test('Leaving with nothing open changes nothing', async ({ page }) => {
  await openPoi53(page);
  const before = await screen(page);
  const kept = JSON.stringify(await store(page));
  await hide(page);
  expect(await screen(page)).toBe(before);
  await show(page);
  expect(await screen(page)).toBe(before);
  expect(JSON.stringify(await store(page))).toBe(kept);
  expect(await layers(page)).toBe(0);
});

test('An open type menu stays open while the app is away', async ({ page }) => {
  await openPoi53(page);
  await page.locator('#pill').click();
  const pop = page.locator('.pop');
  await expect(pop).toBeVisible();
  expect(await layers(page)).toBe(1);
  await hide(page);
  await expect(pop).toBeVisible();
  expect(await layers(page)).toBe(1);
  await show(page);
  await expect(pop).toBeVisible();
  expect(await layers(page)).toBe(1);
});

test('No "Closed after 12 s" toast after the app left with the sides open', async ({ page }) => {
  await page.clock.install({ time: Date.now() });
  await openPoi53(page);
  await pauseClock(page);
  const stage = page.locator('#stage');
  const toast = page.locator('#toast');

  await page.locator('#stage [data-man="L"]').click();
  await expect(stage).toHaveClass(/\bopen\b/);
  await hide(page);
  await expect(stage).not.toHaveClass(/\bopen\b/);
  await expect.poll(() => layers(page)).toBe(0);

  await page.clock.runFor(13000);
  await expect(toast).not.toHaveClass(/\bon\b/);
  await expect(toast).not.toContainText('Closed after 12 s');
  await show(page);
  await expect(stage).not.toHaveClass(/\bopen\b/);
  await expect(toast).not.toHaveClass(/\bon\b/);
});
