/* POI Tracker tests — scenarios A4, A5 and A9: recording a pass, a reload
   keeping it, the sides closing after 12 s (prompt Tests A; screens.md
   items 7, 8, 36; data-model.md "Event").
   A4 and A9 drive the app's timers with Playwright's clock: installed
   before the page opens, paused once the app has started, then advanced.
*/
'use strict';
const { test, expect, UUID_V4, text, store, layers, expectToast, openSample, recordPass } = require('./fixtures');

const EVENT_FIELDS = ['id', 'seq', 'ts', 'city', 'route', 'routeId', 'poi', 'kind', 'side', 'man', 'delta', 'state'].sort();

// pauses the app's clock a second ahead of its current time
async function pauseClock(page) {
  const now = await page.evaluate(function () { return Date.now(); });
  await page.clock.pauseAt(now + 1000);
}

test('A4 · Record a pass', async ({ page }) => {
  await page.clock.install({ time: Date.now() });
  await openSample(page);
  await pauseClock(page);
  const before = await store(page);
  const knownIds = new Set(before.events.map(function (e) { return e.id; }));
  const route = before.cities[0].routes[0];
  const stage = page.locator('#stage');

  await page.locator('#stage [data-man="L"]').click();
  await expect(stage).toHaveClass(/\bopen\b/);
  expect(await layers(page)).toBe(1);

  const south = page.locator('#stage [data-side="S"]');
  await south.click();
  await south.click({ force: true });   // the second tap, while the ring of the first still runs (the clock is paused)

  const after = await store(page);
  const added = after.events.filter(function (e) { return !knownIds.has(e.id); });
  expect(added).toHaveLength(1);
  expect(after.events).toHaveLength(23);
  const e = added[0];
  expect(e).toMatchObject({ kind: 'pass', side: 'S', man: 'L', delta: 1, poi: 136, route: 'SAMPLE-001', routeId: route.id, city: 'sample', state: 'waiting', seq: 23 });
  expect(e.id).toMatch(UUID_V4);
  expect(typeof e.ts).toBe('number');
  expect(Object.keys(e).sort()).toEqual(EVENT_FIELDS);

  await expectToast(page, 'Saved:', 'South · 42 of 70');
  await expect(page.locator('#toast use')).toHaveAttribute('href', '#i-left');

  await expect(stage).toHaveClass(/\bopen\b/);   // the ring still runs: nothing closed yet
  await page.clock.runFor(600);
  await expect(stage).not.toHaveClass(/\bopen\b/);
  await expect(page.locator('#stage [data-side="S"]')).toBeHidden();
  await expect.poll(() => layers(page)).toBe(0);
  await expect(page.locator('#cnt')).toHaveText('42 of 70');
});

test('A5 · A reload keeps it', async ({ page }) => {
  await openSample(page);
  await recordPass(page, 'L', 'S');
  await expect(page.locator('#cnt')).toHaveText('42 of 70');

  await page.reload();
  await expect(page.locator('#city')).toHaveText('Sample city');
  await expect(page.locator('#head .big')).toHaveText('136');
  await expect(page.locator('#cnt')).toHaveText('42 of 70');
  const s = await store(page);
  expect(s.events).toHaveLength(23);
  const waiting = s.events.filter(function (e) { return e.state === 'waiting'; });
  expect(waiting).toHaveLength(1);
  expect(waiting[0]).toMatchObject({ poi: 136, man: 'L', side: 'S', delta: 1 });
});

test('A9 · The sides close after 12 s', async ({ page }) => {
  await page.clock.install({ time: Date.now() });
  await openSample(page);
  await pauseClock(page);
  const before = await store(page);
  const stage = page.locator('#stage');

  await page.locator('#stage [data-man="R"]').click();
  await expect(stage).toHaveClass(/\bopen\b/);
  await expect(page.locator('#stage [data-side="N"]')).toBeVisible();
  expect(await layers(page)).toBe(1);

  await page.clock.runFor(11900);
  await expect(stage).toHaveClass(/\bopen\b/);   // not yet: 12 s have not passed
  await page.clock.runFor(600);
  await expect(stage).not.toHaveClass(/\bopen\b/);
  await expect(page.locator('#stage [data-side="N"]')).toBeHidden();
  await expect.poll(() => layers(page)).toBe(0);
  const toast = page.locator('#toast');
  await expect(toast).toHaveClass(/\bon\b/);
  expect(await text(toast)).toBe('Closed after 12 s: nothing recorded');

  const after = await store(page);
  expect(after.events).toHaveLength(22);
  expect(after.events.map(function (e) { return e.id; })).toEqual(before.events.map(function (e) { return e.id; }));
  await expect(page.locator('#cnt')).toHaveText('41 of 70');
});
