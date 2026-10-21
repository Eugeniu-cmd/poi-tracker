/* POI Tracker tests — scenarios A1 to A3: the clean start, the controls of a
   later build, the sample city (prompt Tests A; screens.md items 76, 77;
   data-model.md "Tablet storage").
*/
'use strict';
const { test, expect, KEY, UUID, UUID_V4, text, store, openClean } = require('./fixtures');

const LATER = 'Settings come in a later version';

test('A1 · Clean start', async ({ page }) => {
  await openClean(page);
  await expect(page.locator('#city')).toHaveText('No city');
  await expect(page.locator('#routeBtn')).toHaveText('No routes yet');
  const sync = page.locator('#syncBtn');
  await expect(sync).toHaveText('Connection not set up');
  await expect(sync).toHaveClass(/\boff\b/);

  const colButtons = page.locator('#col button');
  await expect(colButtons).toHaveCount(1);
  await expect(colButtons.first()).toHaveClass(/\boff\b/);
  expect(await text(colButtons.first())).toBe('Add your first city');

  const lock = page.locator('#lock');
  await expect(lock).toBeVisible();
  expect(await text(lock)).toBe('Add a city to start');
  for (const man of ['L', 'St', 'R']) {
    await expect(page.locator('#stage [data-man="' + man + '"]')).toHaveClass(/\blocked\b/);
  }

  await expect(page.locator('[data-act="undo"]')).toHaveClass(/\boff\b/);
  const note = page.locator('#bar .barnote');
  await expect(note).toBeVisible();
  expect(await text(note)).toBe('Nothing to undo');

  expect(await page.evaluate(function (k) { return localStorage.getItem(k); }, KEY)).toBeNull();
});

test('A2 · Controls of a later build', async ({ page }) => {
  await openClean(page);
  const toast = page.locator('#toast');

  await page.locator('.gear').click({ force: true });
  await expect(toast).toHaveClass(/\bon\b/);
  expect(await text(toast)).toBe(LATER);
  await expect(toast).not.toHaveClass(/\bon\b/);   // the toast fades before the next check

  await page.locator('#col .colbtn').click({ force: true });
  await expect(toast).toHaveClass(/\bon\b/);
  expect(await text(toast)).toBe(LATER);
  await expect(toast).not.toHaveClass(/\bon\b/);

  await page.locator('#syncBtn').click();
  const panel = page.locator('.syncpop');
  await expect(panel).toBeVisible();
  const row = panel.locator('[data-act="later"]');
  await expect(row).toHaveCount(1);
  expect(await text(row.locator('b'))).toBe('Set up connection');
  await row.click({ force: true });
  await expect(toast).toHaveClass(/\bon\b/);
  expect(await text(toast)).toBe(LATER);
  await expect(panel).toHaveCount(0);
  await expect(page.locator('#syncBtn')).toHaveAttribute('aria-expanded', 'false');
});

test('A3 · Sample city', async ({ page }) => {
  await page.goto('/app/?sample');
  await expect(page).toHaveURL('/app/');
  await expect(page.locator('#city')).toHaveText('Sample city');
  await expect(page.locator('#routeBtn')).toHaveText('SAMPLE-001');
  await expect(page.locator('#head .big')).toHaveText('136');
  await expect(page.locator('#cnt')).toHaveText('41 of 70');

  const s = await store(page);
  expect(s).not.toBeNull();
  expect(s.schema).toBe(1);
  expect(s.device.cityId).toBe('sample');
  expect(s.cities).toHaveLength(1);
  const c = s.cities[0];
  expect(c).toMatchObject({ id: 'sample', name: 'Sample city', sample: true, mailboxUrl: null });
  expect(c.routes.map(function (r) { return r.code; })).toEqual(['SAMPLE-001', 'SAMPLE-002']);
  for (const r of c.routes) expect(r.id).toMatch(UUID);
  expect(s.events).toHaveLength(22);
  for (const e of s.events) {
    expect(e.state).toBe('delivered');
    expect(e.id).toMatch(UUID_V4);
  }
});
