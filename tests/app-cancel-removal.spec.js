/* POI Tracker tests — Cancel removal of a waiting removal (prompt Done
   step 2f; screens.md v0.56, items 12, 13 and 38; data-model.md "Event";
   history.html v0.26 frame C): a sent pass deleted in History stays in
   the list struck through as "Removal waiting" and carries "Cancel
   removal" under its row, in the markup of frame C. A tap drops the
   waiting removal in one write of the store, with no dialog and no toast:
   the pass reads "Sent" with "Delete" again, the POI's count, its row,
   History's chip and the line of removals waiting return to what they
   were before the delete, and nothing else in the store changes. A
   refused removal keeps its "Cancel removal" as before.
   The app sends nothing yet, so no removal is inside a push: the rule
   that a removal already posted waits for its answer comes with sending.
   The reference opens in a second page of the same context, as in
   app-card.spec.js: a font it fetches from the web never counts as an
   error of the app's page.
*/
'use strict';
const crypto = require('crypto');
const { test, expect, KEY, text, store, layers, expectToast, openSample, openHistory, reloadWith } = require('./fixtures');

// markup without the whitespace between its tags, with every time hh:mm
// replaced by one placeholder and the app's data-cancel attribute taken
// off, so a row of the app compares with a row of the reference
function norm(html) {
  return html.replace(/>\s+</g, '><').trim().replace(/\b\d{2}:\d{2}\b/g, 'hh:mm').replace(/ data-cancel="[^"]*"/g, '');
}
// counts the writes of the store from now on (as app-type-dialog.spec.js)
function countWrites(page) {
  return page.evaluate(function (k) {
    if (window.__writes === undefined) {
      var o = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, v) { if (key === k) window.__writes += 1; return o.call(this, key, v); };
    }
    window.__writes = 0;
  }, KEY);
}
function writes(page) { return page.evaluate(function () { return window.__writes; }); }
function ids(s) { return s.events.map(function (e) { return e.id; }); }

test('Cancel removal · a waiting removal is dropped and the pass counts again', async ({ page }) => {
  // frame C of the reference: POI 136 with its Straight · West pass deleted
  const ref = await page.context().newPage();
  await ref.goto('/docs/references/history.html', { waitUntil: 'domcontentloaded' });
  const frameC = norm(await ref.locator('.app[data-state="C"] .hlist .hr.del').innerHTML());
  await ref.close();
  expect(frameC).toContain('<div class="hacts"><button class="btn" type="button">Cancel removal</button></div>');

  await openSample(page);
  const s0 = await store(page);
  const hist = await openHistory(page);
  const rows = hist.locator('.hlist .hr');
  await expect(rows).toHaveCount(10);
  // the third newest pass of POI 136 is Straight from West, as frame C's
  const row = rows.nth(2);
  expect(await text(row.locator('.hmv'))).toBe('West');
  const passId = await row.locator('.hdel').getAttribute('data-del');
  expect(s0.events.find(function (e) { return e.id === passId; })).toMatchObject({ poi: 136, man: 'St', side: 'W', delta: 1, state: 'delivered' });
  await expect(hist.locator('.hq')).toHaveCount(0);
  expect(await text(hist.locator('.hsub .chip:not(.gold)'))).toBe('10 passes');

  // Delete: the removal waits and the row carries "Cancel removal" in the
  // markup of frame C (items 12, 13)
  await row.locator('.hdel').click();
  const dlg = page.locator('.dlg');
  await expect(dlg).toBeVisible();
  await dlg.locator('[data-act="dlg-ok"]').click();
  await expect(dlg).toHaveCount(0);
  await expectToast(page, 'Removal queued:', 'West · 40 of 70');
  const s1 = await store(page);
  expect(s1.events).toHaveLength(s0.events.length + 1);
  const rm = s1.events.find(function (e) { return e.ref === passId; });
  expect(rm).toMatchObject({ kind: 'pass', poi: 136, side: 'W', man: 'St', delta: -1, state: 'waiting', ref: passId });
  await expect(rows).toHaveCount(10);
  await expect(row).toHaveClass('hr del');
  expect(await text(row.locator('.hst'))).toBe('Removal waiting');
  await expect(row.locator('.hdel')).toHaveCount(0);
  const cancel = row.locator('.hacts .btn');
  await expect(cancel).toHaveCount(1);
  expect(await text(cancel)).toBe('Cancel removal');
  await expect(cancel).toHaveAttribute('type', 'button');
  await expect(cancel).toHaveAttribute('data-cancel', rm.id);
  expect(norm(await row.innerHTML())).toBe(frameC);
  expect(await text(hist.locator('.hq'))).toBe('1 removal waiting to be sent');
  expect(await text(hist.locator('.hsub .chip:not(.gold)'))).toBe('9 passes');
  await expect(page.locator('#cnt')).toHaveText('40 of 70');
  await expect(page.locator('#head .rest')).toHaveText('30 to go');
  await expect(page.locator('#col .row[data-poi="136"] .rt')).toHaveText('30 to go');
  const sync = await text(page.locator('#syncBtn'));
  const toast = page.locator('#toast');
  await expect(toast).not.toHaveClass(/\bon\b/, { timeout: 5000 });   // the Delete's toast has gone

  // Cancel removal: one write, no dialog, no toast, and the pass counts
  // again, its row "Sent" with "Delete" (data-model.md "Event": a waiting
  // event may be dropped)
  await countWrites(page);
  await cancel.click();
  await expect(row).toHaveClass('hr');
  expect(await writes(page), 'writes of the store by "Cancel removal"').toBe(1);
  await expect(dlg).toHaveCount(0);
  await expect(toast).not.toHaveClass(/\bon\b/);
  expect(await layers(page)).toBe(1);   // History alone
  expect(await text(row.locator('.hst'))).toBe('Sent');
  const del = row.locator('.hdel');
  await expect(del).toHaveCount(1);
  expect(await text(del)).toBe('Delete');
  await expect(del).toHaveAttribute('data-del', passId);
  await expect(hist.locator('.hacts')).toHaveCount(0);
  await expect(hist.locator('.hq')).toHaveCount(0);
  expect(await text(hist.locator('.hsub .chip:not(.gold)'))).toBe('10 passes');
  await expect(rows).toHaveCount(10);
  await expect(page.locator('#cnt')).toHaveText('41 of 70');
  await expect(page.locator('#head .rest')).toHaveText('29 to go');
  await expect(page.locator('#col .row[data-poi="136"] .rt')).toHaveText('29 to go');
  expect(await text(page.locator('#syncBtn'))).toBe(sync);
  // the store: the removal event gone, nothing else changed
  const s2 = await store(page);
  expect(s2).toEqual(Object.assign({}, s1, { events: s1.events.filter(function (e) { return e.id !== rm.id; }) }));
  expect(ids(s2)).toEqual(ids(s0));
  expect(s2.seq).toBe(s0.seq + 1);   // the counter never goes back
});

test('Cancel removal · a refused removal keeps its button', async ({ page }) => {
  await openSample(page);
  const s = await store(page);
  const p = s.events.find(function (e) { return e.poi === 136 && e.man === 'St' && e.side === 'W'; });
  s.seq += 1;
  const rm = { id: crypto.randomUUID(), seq: s.seq, ts: Date.now(), city: 'sample', route: 'SAMPLE-001', routeId: p.routeId, poi: 136,
               kind: 'pass', side: 'W', man: 'St', delta: -1, ref: p.id, state: 'rejected', reason: 'no-poi' };
  s.events.push(rm);
  await reloadWith(page, s);
  await expect(page.locator('#cnt')).toHaveText('41 of 70');   // a refused removal takes no part in the counts
  const hist = await openHistory(page);
  const row = hist.locator('.hlist .hr.rej.del');
  await expect(row).toHaveCount(1);
  expect(await text(row.locator('.hst'))).toBe('Not accepted');
  const acts = row.locator('.hacts .btn');
  await expect(acts).toHaveText(['Send again', 'Cancel removal']);
  await expect(acts.nth(1)).toHaveAttribute('data-cancel', rm.id);
  await expect(hist.locator('.hq')).toHaveCount(0);
  await acts.nth(1).click();
  await expect(hist.locator('.hlist .hr.rej')).toHaveCount(0);
  await expect(hist.locator('.hacts')).toHaveCount(0);
  await expect(page.locator('.dlg')).toHaveCount(0);
  const a = await store(page);
  expect(a.events.some(function (e) { return e.id === rm.id; })).toBe(false);
  expect(a.events).toHaveLength(s.events.length - 1);
  await expect(page.locator('#cnt')).toHaveText('41 of 70');
});
