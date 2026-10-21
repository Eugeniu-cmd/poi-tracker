/* POI Tracker tests — scenarios A6, A7 and A8: Undo last on a waiting pass,
   Undo last on a sent pass, the Sync panel (prompt Tests A; screens.md
   items 9, 34, 36, 63, 66, 72; data-model.md "Event").
*/
'use strict';
const { test, expect, UUID_V4, text, store, layers, expectToast, openSample, recordPass } = require('./fixtures');

function ids(s) { return s.events.map(function (e) { return e.id; }).sort(); }

test('A6 · Undo a waiting pass', async ({ page }) => {
  await openSample(page);
  const sample = await store(page);
  await recordPass(page, 'L', 'S');
  await expect(page.locator('#cnt')).toHaveText('42 of 70');

  await page.locator('[data-act="undo"]').click();
  const dlg = page.locator('.dlg');
  await expect(dlg).toBeVisible();
  expect(await text(dlg.locator('.dtitle'))).toBe('Remove the last pass?');
  expect(await text(dlg.locator('.dbody'))).toBe('It has not been sent yet, so it is simply dropped from this tablet.');
  expect(await text(dlg.locator('.dchip'))).toMatch(/^POI 136 · Left from South · \d{2}:\d{2}$/);

  const ok = dlg.locator('[data-act="dlg-ok"]');
  expect(await text(ok)).toBe('Remove');
  await ok.click();
  await expect(dlg).toHaveCount(0);
  await expectToast(page, 'Removed:', 'South · 41 of 70');

  const after = await store(page);
  expect(after.events).toHaveLength(22);
  expect(ids(after)).toEqual(ids(sample));
  for (const e of after.events) expect(e.state).toBe('delivered');
  await expect(page.locator('#cnt')).toHaveText('41 of 70');
});

test('A7 · Undo a sent pass', async ({ page }) => {
  await openSample(page);
  const sample = await store(page);
  // the newest sample pass of POI 136, by seq: Left from South
  const passes136 = sample.events.filter(function (e) { return e.poi === 136 && e.kind === 'pass' && e.delta === 1; });
  const newest = passes136.reduce(function (a, b) { return b.seq > a.seq ? b : a; });
  expect(newest).toMatchObject({ man: 'L', side: 'S', state: 'delivered' });

  await page.locator('[data-act="undo"]').click();
  const dlg = page.locator('.dlg');
  await expect(dlg).toBeVisible();
  expect(await text(dlg.locator('.dtitle'))).toBe('Remove the last pass?');
  expect(await text(dlg.locator('.dbody'))).toBe('It is already in the sheet, so a removal is sent with the next sync.');
  expect(await text(dlg.locator('.dchip'))).toMatch(/^POI 136 · Left from South · (\d{2}\.\d{2} )?\d{2}:\d{2}$/);
  const ok = dlg.locator('[data-act="dlg-ok"]');
  expect(await text(ok)).toBe('Remove');
  await ok.click();
  await expect(dlg).toHaveCount(0);
  await expectToast(page, 'Removal queued:', 'South · 40 of 70');

  const after = await store(page);
  expect(after.events).toHaveLength(23);
  const added = after.events.filter(function (e) { return !ids(sample).includes(e.id); });
  expect(added).toHaveLength(1);
  expect(added[0]).toMatchObject({ kind: 'pass', poi: 136, route: 'SAMPLE-001', side: 'S', man: 'L', delta: -1, state: 'waiting', seq: 23, ref: newest.id });
  expect(added[0].id).toMatch(UUID_V4);
  await expect(page.locator('#cnt')).toHaveText('40 of 70');

  // a pass with a removal is skipped: the next newest pass of POI 136
  await page.locator('[data-act="undo"]').click();
  await expect(dlg).toBeVisible();
  expect(await text(dlg.locator('.dchip'))).toMatch(/^POI 136 · Right from North · (\d{2}\.\d{2} )?\d{2}:\d{2}$/);
  const cancel = dlg.locator('[data-act="dlg-cancel"]');
  expect(await text(cancel)).toBe('Cancel');
  await cancel.click();
  await expect(dlg).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);
  expect((await store(page)).events).toHaveLength(23);
});

test('A8 · The Sync panel', async ({ page }) => {
  await openSample(page);
  await recordPass(page, 'L', 'S');
  await expect(page.locator('#cnt')).toHaveText('42 of 70');
  const stage = page.locator('#stage');

  await page.locator('#syncBtn').click();
  const panel = page.locator('.syncpop');
  await expect(panel).toBeVisible();
  expect(await text(panel.locator('.pt'))).toBe('SYNC · SAMPLE CITY');
  expect(await text(panel.locator('.sstat b'))).toBe('Connection not set up');
  expect(await text(panel.locator('.sstat small'))).toBe('1 pass is kept on this tablet until it is set up.');
  expect(await layers(page)).toBe(1);

  await page.locator('#stage [data-man="St"]').click();
  await expect(panel).toHaveCount(0);
  await expect(stage).not.toHaveClass(/\bopen\b/);
  await expect(page.locator('#stage [data-side="N"]')).toBeHidden();
  await expect(page.locator('#stage [data-man="St"]')).not.toHaveClass(/\bon\b/);
  await expect.poll(() => layers(page)).toBe(0);
  expect((await store(page)).events).toHaveLength(23);
});
