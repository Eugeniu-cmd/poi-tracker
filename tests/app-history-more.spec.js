/* POI Tracker tests — speed step 3, History of the whole route shows the
   newest 50 rows and "Show 50 more" (prompt of 2026-10-30; screens.md
   v0.67, item 48; history.html v0.33, frame J; app v0.23). In Route scope
   History draws the newest 50 rows first. Under the last drawn row, while
   older rows remain, a centred count, "50 of 130 shown", and a wide
   button, "Show 50 more", which draws the next 50 under the ones drawn
   and keeps the list where it is, "Show 30 more" when fewer remain; once
   every row is drawn both are gone, and the line of item 48 shows only
   then. The rows drawn stay while History is open, also when a row
   changes, and go back to 50 when History opens again or the scope
   changes. POI scope draws all its rows.
   The store is the sample's with 108 delivered passes added on SAMPLE-001,
   so Route scope holds 130 rows: 58 on POI 53, which has none in the
   sample, so POI scope has more than 50 rows there, and 50 on POIs 130
   and 131. The passes are injected as in app-type-dialog.spec.js; the
   counter follows the highest seq, so the added passes are the newest in
   History's order. With a dropped pass, the store records a pass of POI
   136 dropped by the 3,000 limit, as the app records one (item 48).
*/
'use strict';
const crypto = require('crypto');
const { test, expect, text, store, layers, openSample, openHistory, reloadWith } = require('./fixtures');

const TOTAL = 130;
function routeId(s) { return s.cities[0].routes[0].id; }   // SAMPLE-001
// a pass of this tablet at POI n of SAMPLE-001, as the app records one
function pass(rid, n, man, side, seq) {
  return { id: crypto.randomUUID(), seq: seq, ts: 1761480000000 + seq * 60000, city: 'sample', route: 'SAMPLE-001', routeId: rid, poi: n,
           kind: 'pass', side: side, man: man, delta: 1, state: 'delivered' };
}
// the sample's store with 108 delivered passes added on SAMPLE-001, 130
// rows in Route scope; with dropped, a pass of POI 136 recorded as dropped
async function inject(page, dropped) {
  const s = await store(page), rid = routeId(s);
  for (let i = 0; i < 58; i++) { s.seq += 1; s.events.push(pass(rid, 53, ['L', 'R', 'St'][i % 3], 'NSWE'[i % 4], s.seq)); }
  for (let i = 0; i < 50; i++) { s.seq += 1; s.events.push(pass(rid, 130 + (i % 2), ['R', 'L', 'St'][i % 3], 'NSWE'[i % 4], s.seq)); }
  expect(s.events.filter(function (e) { return e.routeId === rid; })).toHaveLength(TOTAL);
  if (dropped) s.dropped[rid] = { 136: 1 };
  await reloadWith(page, s);
  await expect(page.locator('#head .big')).toHaveText('136');
  return s;
}
// History in Route scope
async function routeScope(page) {
  const hist = await openHistory(page);
  await hist.locator('button[data-scope="route"]').click();
  await expect(hist.locator('button[data-scope="route"]')).toHaveClass(/\bon\b/);
  return hist;
}
function rows(hist) { return hist.locator('.hlist .hr'); }
// the count and the button under the last drawn row, or neither
async function expectMore(hist, count, button) {
  if (count === null) {
    await expect(hist.locator('.hshown')).toHaveCount(0);
    await expect(hist.locator('.hmore')).toHaveCount(0);
    return;
  }
  expect(await text(hist.locator('.hshown'))).toBe(count);
  expect(await text(hist.locator('.hmore'))).toBe(button);
  await expect(hist.locator('.hlist > .hr + .hshown + .hmore:last-child')).toHaveCount(1);   // inside the list, after the last row
}
// the ids of the rows drawn, in order: each row's Delete button names its pass
function drawnIds(hist) {
  return rows(hist).locator('.hdel').evaluateAll(function (els) { return els.map(function (e) { return e.getAttribute('data-del'); }); });
}
// the computed colour of a token, as getComputedStyle gives colours
function tokenColor(page, name) {
  return page.evaluate(function (v) {
    var e = document.createElement('span'); e.style.color = 'var(' + v + ')'; document.body.appendChild(e);
    var c = getComputedStyle(e).color; e.remove(); return c;
  }, name);
}
function token(page, name) {
  return page.evaluate(function (v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }, name);
}

test('Show more · Route scope draws 50 rows, "50 of 130 shown" and "Show 50 more"; a tap 100 and "Show 30 more"; a second tap 130, no count, no button', async ({ page }) => {
  await openSample(page);
  await inject(page, false);
  const hist = await routeScope(page);
  expect(await layers(page)).toBe(1);
  expect(await text(hist.locator('.hsub .chip:not(.gold)'))).toBe('130 passes');
  await expect(rows(hist)).toHaveCount(50);
  await expectMore(hist, '50 of 130 shown', 'Show 50 more');
  await expect(hist.locator('.hend')).toHaveCount(0);

  await hist.locator('.hmore').click();
  await expect(rows(hist)).toHaveCount(100);
  await expectMore(hist, '100 of 130 shown', 'Show 30 more');
  expect(await text(hist.locator('.hsub .chip:not(.gold)'))).toBe('130 passes');

  await hist.locator('.hmore').click();
  await expect(rows(hist)).toHaveCount(130);
  await expectMore(hist, null);
  await expect(hist.locator('.hlist > :not(.hr)')).toHaveCount(0);   // nothing under the last row
  expect(await layers(page)).toBe(1);   // the taps opened no layer
  expect(await text(hist.locator('.hfoot'))).toBe('History shows only what this tablet recorded');
});

test('Show more · the rows drawn are the newest, in History\'s order, the first rows of the full list', async ({ page }) => {
  await openSample(page);
  const s = await inject(page, false);
  const rid = routeId(s);
  const all = s.events.filter(function (e) { return e.routeId === rid; }).sort(function (a, b) { return b.seq - a.seq; });
  expect(all).toHaveLength(TOTAL);
  const ids = all.map(function (e) { return e.id; });

  const hist = await routeScope(page);
  await expect(rows(hist)).toHaveCount(50);
  expect(await drawnIds(hist)).toEqual(ids.slice(0, 50));
  expect(await text(rows(hist).first().locator('.hn'))).toBe(String(all[0].poi));
  await hist.locator('.hmore').click();
  await expect(rows(hist)).toHaveCount(100);
  expect(await drawnIds(hist)).toEqual(ids.slice(0, 100));
  await hist.locator('.hmore').click();
  await expect(rows(hist)).toHaveCount(130);
  expect(await drawnIds(hist)).toEqual(ids);
  expect(await text(rows(hist).last().locator('.hn'))).toBe('132');   // the sample's oldest pass
});

test('Show more · a tap on the button keeps the list where it is: the new rows appear below', async ({ page }) => {
  await openSample(page);
  await inject(page, false);
  const hist = await routeScope(page);
  const list = hist.locator('.hlist');
  // scrolled to the end, where the button is
  const before = await list.evaluate(function (el) {
    el.scrollTop = el.scrollHeight;
    var top = el.getBoundingClientRect().top, first = null;
    el.querySelectorAll('.hr').forEach(function (r) { if (!first && r.firstElementChild.getBoundingClientRect().top >= top - 1) first = r.querySelector('.hdel').getAttribute('data-del'); });
    return { top: el.scrollTop, max: el.scrollHeight - el.clientHeight, first: first };
  });
  expect(before.top).toBeGreaterThan(0);
  expect(before.top).toBe(before.max);
  const btn = hist.locator('.hmore');
  const lb = await list.boundingBox(), bb = await btn.boundingBox();
  expect(bb.y).toBeGreaterThanOrEqual(lb.y);
  expect(bb.y + bb.height).toBeLessThanOrEqual(lb.y + lb.height + 1);   // in view, no scrolling for the tap

  await btn.click();
  await expect(rows(hist)).toHaveCount(100);
  const after = await list.evaluate(function (el) {
    var top = el.getBoundingClientRect().top, first = null;
    el.querySelectorAll('.hr').forEach(function (r) { if (!first && r.firstElementChild.getBoundingClientRect().top >= top - 1) first = r.querySelector('.hdel').getAttribute('data-del'); });
    return { top: el.scrollTop, max: el.scrollHeight - el.clientHeight, first: first };
  });
  expect(after.top).toBe(before.top);
  expect(after.first).toBe(before.first);   // the same row at the top edge
  expect(after.max).toBeGreaterThan(before.max);   // the new rows are below
});

test('Show more · Delete on row 75 after one tap works as on any row, and 100 rows stay drawn; so does Cancel removal', async ({ page }) => {
  await openSample(page);
  const s = await inject(page, false);
  const hist = await routeScope(page);
  await hist.locator('.hmore').click();
  await expect(rows(hist)).toHaveCount(100);

  const row = rows(hist).nth(74);
  const id = await row.locator('.hdel').getAttribute('data-del');
  const deleted = s.events.find(function (e) { return e.id === id; });
  expect(deleted).toMatchObject({ kind: 'pass', delta: 1, state: 'delivered', poi: 53 });
  await row.locator('.hdel').click();
  const dlg = page.locator('.dlg');
  await expect(dlg).toBeVisible();
  expect(await text(dlg.locator('.dtitle'))).toBe('Delete this pass?');
  expect(await text(dlg.locator('.dbody'))).toBe('It is already in the sheet, so a removal is sent with the next sync.');
  await dlg.locator('[data-act="dlg-ok"]').click();
  await expect(dlg).toHaveCount(0);

  await expect(rows(hist)).toHaveCount(100);
  await expect(row).toHaveClass(/\bdel\b/);
  expect(await text(row.locator('.hst'))).toBe('Removal waiting');
  expect(await row.locator('.hdel').count()).toBe(0);
  expect(await text(hist.locator('.hq'))).toBe('1 removal waiting to be sent');
  await expectMore(hist, '100 of 130 shown', 'Show 30 more');
  expect(await text(hist.locator('.hsub .chip:not(.gold)'))).toBe('129 passes');
  const after = await store(page);
  expect(after.events).toHaveLength(s.events.length + 1);
  const added = after.events.filter(function (e) { return !s.events.some(function (x) { return x.id === e.id; }); });
  expect(added).toHaveLength(1);
  expect(added[0]).toMatchObject({ kind: 'pass', poi: 53, delta: -1, state: 'waiting', ref: id });

  // Cancel removal: the pass counts again, still 100 rows drawn
  await row.locator('[data-cancel]').click();
  await expect(row).not.toHaveClass(/\bdel\b/);
  expect(await text(row.locator('.hst'))).toBe('Sent');
  await expect(rows(hist)).toHaveCount(100);
  await expectMore(hist, '100 of 130 shown', 'Show 30 more');
  await expect(hist.locator('.hq')).toHaveCount(0);
  expect(await text(hist.locator('.hsub .chip:not(.gold)'))).toBe('130 passes');
  expect((await store(page)).events).toHaveLength(s.events.length);
});

test('Show more · switch to POI and back, or close and reopen History: 50 rows again', async ({ page }) => {
  await openSample(page);
  await inject(page, false);
  let hist = await routeScope(page);
  await hist.locator('.hmore').click();
  await expect(rows(hist)).toHaveCount(100);

  // the scope changes: POI 136's rows, all of them, then Route again at 50
  await hist.locator('button[data-scope="poi"]').click();
  await expect(hist.locator('button[data-scope="poi"]')).toHaveClass(/\bon\b/);
  expect(await text(hist.locator('.hsub .chip.gold'))).toBe('POI 136');
  await expect(rows(hist)).toHaveCount(10);
  await expectMore(hist, null);
  await hist.locator('button[data-scope="route"]').click();
  await expect(hist.locator('button[data-scope="route"]')).toHaveClass(/\bon\b/);
  await expect(rows(hist)).toHaveCount(50);
  await expectMore(hist, '50 of 130 shown', 'Show 50 more');

  // History closes and opens again, in Route scope still: 50 rows
  await hist.locator('.hmore').click();
  await expect(rows(hist)).toHaveCount(100);
  await hist.locator('[data-act="close-history"]').click();
  await expect(page.locator('section.hist')).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);
  hist = await openHistory(page);
  await expect(hist.locator('button[data-scope="route"]')).toHaveClass(/\bon\b/);
  await expect(rows(hist)).toHaveCount(50);
  await expectMore(hist, '50 of 130 shown', 'Show 50 more');
  expect(await layers(page)).toBe(1);
});

test('Show more · POI scope draws all its rows, 58 on POI 53, with no count and no button', async ({ page }) => {
  await openSample(page);
  await inject(page, false);
  await page.locator('#col .row[data-poi="53"]').click();
  await expect(page.locator('#head .big')).toHaveText('53');
  const hist = await openHistory(page);
  await expect(hist.locator('button[data-scope="poi"]')).toHaveClass(/\bon\b/);
  expect(await text(hist.locator('.hsub .chip.gold'))).toBe('POI 53');
  expect(await text(hist.locator('.hsub .chip:not(.gold)'))).toBe('58 passes');
  await expect(rows(hist)).toHaveCount(58);
  await expectMore(hist, null);
  await expect(hist.locator('.hlist > :not(.hr)')).toHaveCount(0);
  await expect(hist.locator('.hlist .hr .hn')).toHaveCount(0);
});

test('Show more · the line of item 48 shows only once the last row is drawn', async ({ page }) => {
  await openSample(page);
  await inject(page, true);
  const hist = await routeScope(page);
  const LINE = 'This tablet keeps its newest 3,000 passes and removals. Older sent ones are no longer listed.';
  await expect(rows(hist)).toHaveCount(50);
  await expectMore(hist, '50 of 130 shown', 'Show 50 more');
  await expect(hist.locator('.hend')).toHaveCount(0);
  await hist.locator('.hmore').click();
  await expect(rows(hist)).toHaveCount(100);
  await expectMore(hist, '100 of 130 shown', 'Show 30 more');
  await expect(hist.locator('.hend')).toHaveCount(0);
  await hist.locator('.hmore').click();
  await expect(rows(hist)).toHaveCount(130);
  await expectMore(hist, null);
  await expect(hist.locator('.hlist > .hr + .hend:last-child')).toHaveCount(1);   // under the last row
  expect(await text(hist.locator('.hend'))).toBe(LINE);

  // POI scope of 136, whose pass was dropped: all its rows and the line, as before
  await hist.locator('button[data-scope="poi"]').click();
  await expect(hist.locator('button[data-scope="poi"]')).toHaveClass(/\bon\b/);
  await expect(rows(hist)).toHaveCount(10);
  await expectMore(hist, null);
  await expect(hist.locator('.hlist > .hr + .hend:last-child')).toHaveCount(1);
  expect(await text(hist.locator('.hend'))).toBe(LINE);
});

// the button's look (history.html v0.33 frame J): --panel-inset with a
// hairline of --line and --r-sm, at least --tap-min tall, the full width
// of the list, the word centred in --t-body at --w-heavy, --ink; the count
// above it centred in --t-small, --ink-2, --w-bold
const INSET = { light: 'rgb(255, 253, 246)', dark: 'rgb(47, 71, 63)' };   // #FFFDF6, #2F473F of _tokens.css v0.24
for (const scheme of ['light', 'dark']) {
  test('Show more · the button\'s look on ' + scheme + ': --panel-inset, at least 56 px tall, the full width of the list, the word centred', async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await openSample(page);
    await inject(page, false);
    const hist = await routeScope(page);
    const btn = hist.locator('.hmore'), count = hist.locator('.hshown'), list = hist.locator('.hlist');
    await btn.scrollIntoViewIfNeeded();
    const b = await btn.boundingBox(), l = await list.boundingBox(), c = await count.boundingBox();
    expect(b.height).toBeGreaterThanOrEqual(56);
    expect(Math.abs(b.x - l.x)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(b.width - l.width)).toBeLessThanOrEqual(0.5);   // the full width of the list
    expect(Math.abs(c.width - l.width)).toBeLessThanOrEqual(0.5);
    expect(c.y + c.height).toBeLessThanOrEqual(b.y + 0.5);   // the count above the button

    const bs = await btn.evaluate(function (el) {
      var s = getComputedStyle(el), r = document.createRange(); r.selectNodeContents(el);
      var t = r.getBoundingClientRect(), box = el.getBoundingClientRect();
      return { bg: s.backgroundColor, color: s.color, border: s.borderTopWidth + ' ' + s.borderTopStyle, borderColor: s.borderTopColor,
               radius: s.borderRadius, size: s.fontSize, weight: s.fontWeight, minHeight: s.minHeight,
               dx: (t.left + t.width / 2) - (box.left + box.width / 2), dy: (t.top + t.height / 2) - (box.top + box.height / 2) };
    });
    expect(bs.bg).toBe(INSET[scheme]);
    expect(bs.bg).toBe(await tokenColor(page, '--panel-inset'));
    expect(bs.color).toBe(await tokenColor(page, '--ink'));
    expect(bs.borderColor).toBe(await tokenColor(page, '--line'));
    expect(bs.border).toBe('1px solid');
    expect(bs.radius).toBe(await token(page, '--r-sm'));
    expect(bs.size).toBe(await token(page, '--t-body'));
    expect(bs.weight).toBe(await token(page, '--w-heavy'));
    expect(bs.minHeight).toBe(await token(page, '--tap-min'));
    expect(Math.abs(bs.dx)).toBeLessThanOrEqual(1);   // the word centred
    expect(Math.abs(bs.dy)).toBeLessThanOrEqual(1);

    const cs = await count.evaluate(function (el) {
      var s = getComputedStyle(el); return { color: s.color, size: s.fontSize, weight: s.fontWeight, align: s.textAlign };
    });
    expect(cs.color).toBe(await tokenColor(page, '--ink-2'));
    expect(cs.size).toBe(await token(page, '--t-small'));
    expect(cs.weight).toBe(await token(page, '--w-bold'));
    expect(cs.align).toBe('center');
  });
}
