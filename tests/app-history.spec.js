/* POI Tracker tests — scenarios B1 to B6: History of a POI, Route scope,
   the live column beside it, Delete on a sent and on a waiting pass, the
   empty states (prompt Tests B; screens.md items 12, 13, 38, 41, 44, 45,
   63; data-model.md "Event").
*/
'use strict';
const { test, expect, text, store, layers, expectToast, openClean, openSample, recordPass, openHistory } = require('./fixtures');

function ids(s) { return s.events.map(function (e) { return e.id; }).sort(); }
const TIME = '(\\d{2}\\.\\d{2} )?\\d{2}:\\d{2}';   // HH:MM today, DD.MM HH:MM on an earlier day

test('B1 · History of a POI', async ({ page }) => {
  await openSample(page);
  await recordPass(page, 'L', 'S');
  const hist = await openHistory(page);
  expect(await layers(page)).toBe(1);

  expect(await text(hist.locator('.ht'))).toBe('History');
  await expect(hist.locator('button[data-scope="poi"]')).toHaveClass(/\bon\b/);
  await expect(hist.locator('button[data-scope="route"]')).not.toHaveClass(/\bon\b/);
  expect(await text(hist.locator('.hsub .chip.amber'))).toBe('POI 136');
  expect(await text(hist.locator('.hsub .hctx'))).toBe('SAMPLE-001 · Sample city');
  expect(await text(hist.locator('.hsub .chip:not(.amber)'))).toBe('11 passes');

  const rows = hist.locator('.hlist .hr');
  await expect(rows).toHaveCount(11);
  const expected = [['South', 'Waiting'], ['South', 'Sent'], ['North', 'Sent']];   // newest first
  for (let i = 0; i < expected.length; i++) {
    expect(await text(rows.nth(i).locator('.hmv'))).toBe(expected[i][0]);
    expect(await text(rows.nth(i).locator('.hst'))).toBe(expected[i][1]);
  }
  for (let i = 0; i < 11; i++) {
    const del = rows.nth(i).locator('.hdel');
    await expect(del).toHaveCount(1);
    expect(await text(del)).toBe('Delete');
  }
  expect(await text(hist.locator('.hfoot'))).toBe('History shows only what this tablet recorded');
});

test('B2 · Route scope', async ({ page }) => {
  await openSample(page);
  await recordPass(page, 'L', 'S');
  const hist = await openHistory(page);
  expect(await layers(page)).toBe(1);
  const rows = hist.locator('.hlist .hr');
  await expect(rows).toHaveCount(11);

  await hist.locator('button[data-scope="route"]').click();
  await expect(hist.locator('button[data-scope="route"]')).toHaveClass(/\bon\b/);
  await expect(hist.locator('button[data-scope="poi"]')).not.toHaveClass(/\bon\b/);
  expect(await text(hist.locator('.hsub .chip.amber'))).toBe('SAMPLE-001');
  expect(await text(hist.locator('.hsub .hctx'))).toBe('Sample city');
  expect(await text(hist.locator('.hsub .chip:not(.amber)'))).toBe('23 passes');
  await expect(rows).toHaveCount(23);
  const nums = hist.locator('.hlist .hr .hn');
  await expect(nums).toHaveCount(23);   // each row carries a POI number
  expect(await text(nums.first())).toBe('136');
  expect(await text(nums.last())).toBe('132');

  await hist.locator('button[data-scope="poi"]').click();
  await expect(hist.locator('button[data-scope="poi"]')).toHaveClass(/\bon\b/);
  expect(await text(hist.locator('.hsub .chip.amber'))).toBe('POI 136');
  await expect(rows).toHaveCount(11);
  await expect(hist.locator('.hlist .hr .hn')).toHaveCount(0);
  expect(await layers(page)).toBe(1);
});

test('B3 · The column stays live', async ({ page }) => {
  await openSample(page);
  const hist = await openHistory(page);
  expect(await layers(page)).toBe(1);

  await page.locator('#col .row[data-poi="135"]').click();
  await expect(hist).toBeVisible();
  expect(await layers(page)).toBe(1);
  expect(await text(hist.locator('.hsub .chip.amber'))).toBe('POI 135');
  const rows = hist.locator('.hlist .hr');
  await expect(rows).toHaveCount(5);
  await expect(rows.locator('.hst')).toHaveText(['Sent', 'Sent', 'Sent', 'Sent', 'Sent']);
  await expect(page.locator('#head .big')).toHaveText('135');
});

test('B4 · Delete a sent pass', async ({ page }) => {
  await openSample(page);
  const sample = await store(page);
  const hist = await openHistory(page);
  await page.locator('#col .row[data-poi="135"]').click();
  expect(await text(hist.locator('.hsub .chip.amber'))).toBe('POI 135');
  const rows = hist.locator('.hlist .hr');
  await expect(rows).toHaveCount(5);

  const first = rows.first();
  const del = first.locator('.hdel');
  const deletedId = await del.getAttribute('data-del');
  const deleted = sample.events.find(function (e) { return e.id === deletedId; });
  expect(deleted).toMatchObject({ poi: 135, man: 'R', side: 'E', delta: 1, state: 'delivered' });
  await del.click();

  const dlg = page.locator('.dlg');
  await expect(dlg).toBeVisible();
  expect(await text(dlg.locator('.dtitle'))).toBe('Delete this pass?');
  expect(await text(dlg.locator('.dchip'))).toMatch(new RegExp('^POI 135 · Right from East · ' + TIME + '$'));
  expect(await text(dlg.locator('.dbody'))).toBe('It is already in the sheet, so a removal is sent with the next sync.');
  const ok = dlg.locator('[data-act="dlg-ok"]');
  expect(await text(ok)).toBe('Delete');
  await expect(ok).toHaveClass(/\bdanger\b/);
  await ok.click();
  await expect(dlg).toHaveCount(0);
  await expectToast(page, 'Removal queued:', 'East · 69 of 70');

  await expect(rows).toHaveCount(5);
  await expect(first).toHaveClass(/\bdel\b/);
  expect(await text(first.locator('.hst'))).toBe('Removal waiting');
  await expect(first.locator('.hdel')).toHaveCount(0);
  expect(await text(hist.locator('.hq'))).toBe('1 removal waiting to be sent');
  expect(await text(hist.locator('.hsub .chip:not(.amber)'))).toBe('4 passes');
  await expect(page.locator('#cnt')).toHaveText('69 of 70');
  await expect(page.locator('#head .rest')).toHaveText('1 to go');

  const after = await store(page);
  expect(after.events).toHaveLength(23);
  const added = after.events.filter(function (e) { return !ids(sample).includes(e.id); });
  expect(added).toHaveLength(1);
  expect(added[0]).toMatchObject({ kind: 'pass', poi: 135, delta: -1, state: 'waiting', ref: deletedId });
});

test('B5 · Delete a waiting pass', async ({ page }) => {
  await openSample(page);
  const sample = await store(page);
  await recordPass(page, 'L', 'S');
  const hist = await openHistory(page);
  const rows = hist.locator('.hlist .hr');
  await expect(rows).toHaveCount(11);
  expect(await text(rows.first().locator('.hst'))).toBe('Waiting');

  await rows.first().locator('.hdel').click();
  const dlg = page.locator('.dlg');
  await expect(dlg).toBeVisible();
  expect(await text(dlg.locator('.dtitle'))).toBe('Delete this pass?');
  expect(await text(dlg.locator('.dbody'))).toBe('It has not been sent yet, so it is simply dropped from this tablet.');
  const ok = dlg.locator('[data-act="dlg-ok"]');
  expect(await text(ok)).toBe('Delete');
  await ok.click();
  await expect(dlg).toHaveCount(0);
  await expectToast(page, 'Removed:', 'South · 41 of 70');

  await expect(rows).toHaveCount(10);
  const after = await store(page);
  expect(after.events).toHaveLength(22);
  expect(ids(after)).toEqual(ids(sample));
  for (const e of after.events) expect(e.state).toBe('delivered');
});

test('B6 · Empty History', async ({ page }) => {
  // (a) the clean start
  await openClean(page);
  let hist = await openHistory(page);
  expect(await layers(page)).toBe(1);
  expect(await text(hist.locator('.hempty b'))).toBe('No passes yet');
  await expect(hist.locator('.hempty p')).toHaveCount(0);
  expect(await text(hist.locator('.hsub .hctx'))).toBe('No city');
  expect(await text(hist.locator('.hsub .chip:not(.amber)'))).toBe('0 passes');
  await expect(hist.locator('.hsub .chip.amber')).toHaveCount(0);
  await expect(hist.locator('.hlist .hr')).toHaveCount(0);

  // (b) a POI whose passes were typed into the sheet by hand
  await openSample(page);
  await page.locator('#col .row[data-poi="57"]').click();
  await expect(page.locator('#head .big')).toHaveText('57');
  hist = await openHistory(page);
  expect(await layers(page)).toBe(1);
  expect(await text(hist.locator('.hsub .chip.amber'))).toBe('POI 57');
  expect(await text(hist.locator('.hempty b'))).toBe('No passes from this tablet');
  expect(await text(hist.locator('.hempty p'))).toBe('The 46 passes of POI 57 reached the sheet another way, typed in by hand. Correct them in the sheet.');
  await expect(hist.locator('.hlist .hr')).toHaveCount(0);
  await hist.locator('[data-act="close-history"]').click();
  await expect(page.locator('section.hist')).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);

  // (c) a route with no passes from this tablet
  await page.locator('#routeBtn').click();
  const menu = page.locator('.rmenu');
  await expect(menu).toBeVisible();
  await menu.locator('.ritem', { hasText: 'SAMPLE-002' }).click();
  await expect(menu).toHaveCount(0);
  await expect(page.locator('#routeBtn')).toHaveText('SAMPLE-002');
  await expect(page.locator('#head .big')).toHaveText('61');
  await expect.poll(() => layers(page)).toBe(0);
  hist = await openHistory(page);
  await hist.locator('button[data-scope="route"]').click();
  await expect(hist.locator('button[data-scope="route"]')).toHaveClass(/\bon\b/);
  expect(await text(hist.locator('.hempty b'))).toBe('No passes on this route yet');
  await expect(hist.locator('.hempty p')).toHaveCount(0);
  expect(await text(hist.locator('.hsub .chip.amber'))).toBe('SAMPLE-002');
  expect(await text(hist.locator('.hsub .chip:not(.amber)'))).toBe('0 passes');
  await expect(hist.locator('.hlist .hr')).toHaveCount(0);
  expect(await layers(page)).toBe(1);
});
