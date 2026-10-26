/* POI Tracker tests — Undo on the "Type set" toast, scenarios U1 to U7
   (prompt Done step 2g; screens.md v0.59, items 31, 36, 63 and 64;
   data-model.md "Event" and "Targets per POI"; _tokens.css v0.23; app
   v0.13): a type change made from the pill or its dialog shows "Type set:
   Straight only" with a gold button "Undo" for six seconds,
   --dur-toast-undo. Undo puts the old type back on the POI whose type
   changed through the path of the pill, so a way back with consequences
   asks first (item 64) and the target event is dropped or queued by the
   rules of setType; it never restores passes the dialog's switch deleted.
   Its own toast and the one of "Cancel change" in History carry no button
   and stay two seconds, --dur-toast. The Undo toast closes at once when
   the active POI or route changes. The button is --side-glyph on --side
   in both themes, at least --tap-min tall, and the toast grows to 72 px
   to hold it.
   The clock is Playwright's, installed before the page opens and paused
   once the store is injected, as in app-record.spec.js; the stores are
   injected as in app-type-dialog.spec.js.
*/
'use strict';
const crypto = require('crypto');
const { test, expect, text, store, layers, openSample, openHistory, reloadWith } = require('./fixtures');

const TARGET = { int: 70, nost: 70, nol: 70, nor: 70, str: 40, nd: 0 };
const SAMPLE_EVENTS = 22;   // the sample's delivered passes
const KEEP = 'The app stops counting them, but the sheet keeps them and the export sends them to the client until they are deleted.';
const HAND = 'They were typed in by hand: delete them in the sheet.';
// the gold of _tokens.css v0.23, one value per theme
const SIDE = { light: 'rgb(224, 180, 58)', dark: 'rgb(230, 184, 62)' };   // --side: #E0B43A, #E6B83E
const SIDE_GLYPH = { light: 'rgb(10, 42, 33)', dark: 'rgb(4, 33, 26)' };   // --side-glyph: #0A2A21, #04211A

function routeId(s) { return s.cities[0].routes[0].id; }   // SAMPLE-001
function targets(s) { return s.events.filter(function (e) { return e.kind === 'target'; }); }
function removals(s) { return s.events.filter(function (e) { return e.kind === 'pass' && e.delta < 0; }); }
function copy(s) { return JSON.parse(JSON.stringify(s)); }
// a pass of this tablet at POI n of SAMPLE-001, as the app records one
function pass(rid, n, man, side, seq, state) {
  return { id: crypto.randomUUID(), seq: seq, ts: 1761480000000 + seq * 60000, city: 'sample', route: 'SAMPLE-001', routeId: rid, poi: n,
           kind: 'pass', side: side, man: man, delta: 1, state: state };
}
// the sample's store with POI n active, its type t and its seven counts c
// (N, S, W, E, Left, Straight, Right) in the sheet when given, and this
// tablet's events added; the counter follows the highest seq
async function inject(page, s, n, t, c, events) {
  const rid = routeId(s);
  s.cities[0].routes[0].lastPoi = n;
  if (c) s.baseline[rid][String(n)] = { c: c, target: TARGET[t] };
  if (t) s.types[rid][String(n)] = t;
  (events || []).forEach(function (e) { s.events.push(e); if (e.seq > s.seq) s.seq = e.seq; });
  await reloadWith(page, s);
  await expect(page.locator('#head .big')).toHaveText(String(n));
}
// pauses the app's clock a second ahead of its current time
async function pauseClock(page) {
  const now = await page.evaluate(function () { return Date.now(); });
  await page.clock.pauseAt(now + 1000);
}
// chooses type t from the pill's menu
async function pickType(page, t) {
  await page.locator('#pill').click();
  const pop = page.locator('.pop');
  await expect(pop).toBeVisible();
  await pop.locator('.opt[data-type="' + t + '"]').click();
  await expect(pop).toHaveCount(0);
}
// a computed style property of the element
function css(locator, prop) {
  return locator.evaluate(function (el, p) { return getComputedStyle(el).getPropertyValue(p); }, prop);
}
// the width and the height of the element's bounding box
function box(locator) {
  return locator.evaluate(function (el) { var b = el.getBoundingClientRect(); return { w: b.width, h: b.height }; });
}
// the colour a token resolves to in the page's theme
function tokenColor(page, name) {
  return page.evaluate(function (n) {
    var e = document.createElement('div'); e.style.color = 'var(' + n + ')'; document.body.appendChild(e);
    var c = getComputedStyle(e).color; e.remove(); return c;
  }, name);
}
// the toast's own words, without its button's
function message(toast) {
  return toast.evaluate(function (el) {
    return Array.from(el.childNodes).filter(function (n) { return n.nodeType === 3; }).map(function (n) { return n.textContent; }).join('').replace(/\s+/g, ' ').trim();
  });
}
// the toast on with "Undo": its words, one button named Undo, enabled, and
// the toast taking taps; returns the button
async function expectUndoToast(page, words) {
  const toast = page.locator('#toast');
  await expect(toast).toHaveClass(/\bon\b/);
  await expect(toast).toHaveClass(/\bundo\b/);
  expect(await message(toast)).toBe(words);
  const b = toast.locator('button');
  await expect(b).toHaveCount(1);
  await expect(b).toHaveClass('tundo');
  await expect(b).toHaveAccessibleName('Undo');
  await expect(b).toBeEnabled();
  expect(await css(toast, 'pointer-events')).toBe('auto');
  return b;
}
// the toast on without a button, taking no taps
async function expectPlainToast(page, words) {
  const toast = page.locator('#toast');
  await expect(toast).toHaveClass(/\bon\b/);
  await expect(toast).not.toHaveClass(/\bundo\b/);
  expect(await message(toast)).toBe(words);
  await expect(toast.locator('button')).toHaveCount(0);
  expect(await css(toast, 'pointer-events')).toBe('none');
}
// the sample's POI 53, Intersection with no passes, set to Straight only
// from the pill: no consequence, so at once, with the Undo toast
async function poi53ToStraightOnly(page, s) {
  await inject(page, s, 53, null, null, []);
  await expect(page.locator('#cnt')).toHaveText('0 of 70');
  await pauseClock(page);
  await pickType(page, 'str');
  await expect(page.locator('.dlg')).toHaveCount(0);
  expect(await layers(page)).toBe(0);
  const undo = await expectUndoToast(page, 'Type set: Straight only');
  await expect(page.locator('#cnt')).toHaveText('0 of 40');
  return undo;
}

test('U1 · The toast carries Undo for six seconds, the target event stored', async ({ page }) => {
  await page.clock.install({ time: Date.now() });
  await openSample(page);
  const s = await store(page);
  const rid = routeId(s);
  const undo = await poi53ToStraightOnly(page, s);
  const toast = page.locator('#toast');
  // one target event of 40 is stored, with the type it replaced
  const a = await store(page);
  expect(a.types[rid]['53']).toBe('str');
  expect(targets(a)).toHaveLength(1);
  expect(targets(a)[0]).toMatchObject({ kind: 'target', poi: 53, routeId: rid, route: 'SAMPLE-001', city: 'sample', target: 40, fromType: 'int', state: 'waiting', seq: 23 });
  expect(a.events).toHaveLength(SAMPLE_EVENTS + 1);
  // still shown at 5.5 s, gone after 6 s, its button then out of reach
  await page.clock.runFor(5500);
  await expect(toast).toHaveClass(/\bon\b/);
  await expect(undo).toBeEnabled();
  await page.clock.runFor(600);
  await expect(toast).not.toHaveClass(/\bon\b/);
  await expect(undo).toBeDisabled();
  expect(await css(toast, 'pointer-events')).toBe('none');
  expect(await store(page)).toEqual(a);
});

test('U2 · Undo within six seconds: Intersection again, the target event dropped, no button, two seconds', async ({ page }) => {
  await page.clock.install({ time: Date.now() });
  await openSample(page);
  const s = await store(page);
  const rid = routeId(s);
  const undo = await poi53ToStraightOnly(page, s);
  const toast = page.locator('#toast');
  await page.clock.runFor(3000);
  // by keyboard: the button can be reached and reads Undo
  await undo.focus();
  await expect(undo).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.dlg')).toHaveCount(0);   // the way back has no consequence
  await expectPlainToast(page, 'Type set: Intersection');
  await expect(page.locator('#cnt')).toHaveText('0 of 70');
  // the target event is dropped: the sheet's target is 70, so nothing is
  // queued (data-model.md "Event": a waiting event may be dropped)
  const b = await store(page);
  expect(b.types[rid]['53']).toBe('int');
  expect(targets(b)).toHaveLength(0);
  expect(b.events).toHaveLength(SAMPLE_EVENTS);
  expect(b.seq).toBe(23);   // seq only counts up
  // gone after two seconds
  await page.clock.runFor(1900);
  await expect(toast).toHaveClass(/\bon\b/);
  await page.clock.runFor(200);
  await expect(toast).not.toHaveClass(/\bon\b/);
  expect(await store(page)).toEqual(b);
});

test('U3 · After the dialog with the switch on, Undo puts the type back and keeps the removals', async ({ page }) => {
  // frame I: POI 122 with 26 Left, 13 Straight and 27 Right in the sheet,
  // one Left and one Right of them sent from this tablet
  await page.clock.install({ time: Date.now() });
  await openSample(page);
  const s = await store(page);
  const rid = routeId(s);
  const sent = [pass(rid, 122, 'L', 'N', 23, 'delivered'), pass(rid, 122, 'R', 'S', 24, 'delivered')];
  await inject(page, s, 122, null, null, sent);
  await expect(page.locator('#cnt')).toHaveText('66 of 70');
  await pauseClock(page);
  await pickType(page, 'str');
  const dlg = page.locator('.dlg');
  await expect(dlg).toBeVisible();
  expect(await text(dlg.locator('.dtitle'))).toBe('Change POI 122 to Straight only?');
  await expect(dlg.locator('.switch')).toHaveAttribute('aria-checked', 'true');
  await dlg.locator('[data-act="dlg-ok"]').click();
  await expect(dlg).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);
  const undo = await expectUndoToast(page, 'Type set: Straight only');
  const a = await store(page);
  expect(a.types[rid]['122']).toBe('str');
  expect(targets(a)).toHaveLength(1);
  const rems = removals(a);
  expect(rems).toHaveLength(2);
  expect(rems.map(function (r) { return r.ref; }).sort()).toEqual(sent.map(function (e) { return e.id; }).sort());
  await expect(page.locator('#cnt')).toHaveText('13 of 40');

  await page.clock.runFor(2000);
  await undo.click();
  await expect(page.locator('.dlg')).toHaveCount(0);   // 25 Left, 13 Straight and 26 Right fit Intersection: no dialog
  await expectPlainToast(page, 'Type set: Intersection');
  const b = await store(page);
  expect(b.types[rid]['122']).toBe('int');
  expect(targets(b)).toHaveLength(0);
  expect(removals(b)).toEqual(rems);   // the two removals stay as they were
  expect(b.events).toHaveLength(SAMPLE_EVENTS + 2 + 2);
  sent.forEach(function (e) { expect(b.events.find(function (x) { return x.id === e.id; })).toMatchObject({ state: 'delivered' }); });
  await expect(page.locator('#cnt')).toHaveText('64 of 70');
  await expect(page.locator('#head .rest')).toHaveText('6 to go');
  const hist = await openHistory(page);
  await expect(hist.locator('.hlist .hr.del')).toHaveCount(2);
  expect(await text(hist.locator('.hq'))).toBe('2 removals waiting to be sent');
});

test('U4 · A way back with a consequence asks first', async ({ page }) => {
  // Intersection with 40 Straight in the sheet, 10 from each side: Straight
  // only fits every pass, so the change applies at once; the way back to
  // Intersection does not fit 26 of them, so Undo opens the dialog of item
  // 64 instead of applying. Once with Cancel, once with Change.
  await page.clock.install({ time: Date.now() });
  await openSample(page);
  const s0 = await store(page);
  const rid = routeId(s0);
  const BODY = 'It has 40 Straight passes in the sheet. Intersection allows 14, so 26 do not fit. ' + KEEP + ' ' + HAND;
  const toast = page.locator('#toast');
  for (const ok of [false, true]) {
    await inject(page, copy(s0), 122, 'int', [10, 10, 10, 10, 0, 40, 0], []);
    await expect(page.locator('#cnt')).toHaveText('14 of 70');
    await expect(page.locator('#head .rest')).toHaveText('56 to go · 26 to fix');
    await pauseClock(page);
    await pickType(page, 'str');
    await expect(page.locator('.dlg')).toHaveCount(0);
    const undo = await expectUndoToast(page, 'Type set: Straight only');
    await expect(page.locator('#cnt')).toHaveText('40 of 40');
    expect(targets(await store(page))).toHaveLength(1);

    await undo.click();
    const dlg = page.locator('.dlg');
    await expect(dlg).toBeVisible();
    expect(await text(dlg.locator('.dtitle'))).toBe('Change POI 122 to Intersection?');
    expect(await text(dlg.locator('.dbody'))).toBe(BODY);
    await expect(dlg.locator('.drow')).toHaveCount(0);   // no pass of this tablet: no switch
    await expect(toast).not.toHaveClass(/\bon\b/);   // the toast went with the tap
    let a = await store(page);   // nothing applied yet
    expect(a.types[rid]['122']).toBe('str');
    expect(targets(a)).toHaveLength(1);

    await dlg.locator(ok ? '[data-act="dlg-ok"]' : '[data-act="dlg-cancel"]').click();
    await expect(dlg).toHaveCount(0);
    await expect.poll(() => layers(page)).toBe(0);
    a = await store(page);
    if (ok) {
      await expectPlainToast(page, 'Type set: Intersection');
      expect(a.types[rid]['122']).toBe('int');
      expect(targets(a)).toHaveLength(0);
      await expect(page.locator('#cnt')).toHaveText('14 of 70');
    } else {
      await expect(toast).not.toHaveClass(/\bon\b/);
      expect(a.types[rid]['122']).toBe('str');
      expect(targets(a)).toHaveLength(1);
      await expect(page.locator('#cnt')).toHaveText('40 of 40');
    }
    expect(a.events).toHaveLength(SAMPLE_EVENTS + targets(a).length);
    await page.clock.resume();
  }
});

test('U5 · Another POI or route closes the Undo toast, the first POI unchanged', async ({ page }) => {
  await page.clock.install({ time: Date.now() });
  await openSample(page);
  const s = await store(page);
  const rid = routeId(s), r2 = s.cities[0].routes[1].id;
  const undo = await poi53ToStraightOnly(page, s);
  const toast = page.locator('#toast');
  // (a) another POI from the column: the toast closes at once
  await page.locator('#col .row[data-poi="54"]').click();
  await expect(page.locator('#head .big')).toHaveText('54');
  await expect(toast).not.toHaveClass(/\bon\b/);
  await expect(undo).toBeDisabled();
  let a = await store(page);
  expect(a.types[rid]['53']).toBe('str');
  expect(targets(a)).toHaveLength(1);
  expect(targets(a)[0]).toMatchObject({ poi: 53, target: 40, fromType: 'int' });
  expect(a.types[rid]).not.toHaveProperty('54');
  await page.clock.runFor(6000);
  expect(await store(page)).toEqual(a);
  // (b) a tap on the active POI's own row changes nothing and keeps the
  // toast; another route closes it
  await page.locator('#col .row[data-poi="53"]').click();
  await expect(page.locator('#head .big')).toHaveText('53');
  await pickType(page, 'int');   // back from the pill: the sheet's type, so the 40 is dropped
  await expectUndoToast(page, 'Type set: Intersection');
  await page.locator('#col .row[data-poi="53"]').click();
  await expect(page.locator('#head .big')).toHaveText('53');
  await expect(toast).toHaveClass(/\bon\b/);
  await page.locator('[data-act="routes"]').click();
  const menu = page.locator('.rmenu');
  await expect(menu).toBeVisible();
  await menu.locator('[data-route="' + r2 + '"]').click();
  await expect(page.locator('#routeBtn')).toContainText('SAMPLE-002');
  await expect(toast).not.toHaveClass(/\bon\b/);
  a = await store(page);
  expect(a.types[rid]['53']).toBe('int');
  expect(targets(a)).toHaveLength(0);
  expect(a.events).toHaveLength(SAMPLE_EVENTS);
});

for (const scheme of ['light', 'dark']) {
  test('U6 · The button is --side-glyph on --side, as tall as a control, the toast 72 px (' + scheme + ')', async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.clock.install({ time: Date.now() });
    await openSample(page);
    const s = await store(page);
    const undo = await poi53ToStraightOnly(page, s);
    const toast = page.locator('#toast');
    expect(await css(undo, 'background-color')).toBe(await tokenColor(page, '--side'));
    expect(await css(undo, 'color')).toBe(await tokenColor(page, '--side-glyph'));
    expect(await css(undo, 'background-color')).toBe(SIDE[scheme]);
    expect(await css(undo, 'color')).toBe(SIDE_GLYPH[scheme]);
    expect(await css(undo, 'font-weight')).toBe('800');   // --w-heavy
    expect(await css(undo, 'border-radius')).toBe('10px');   // --r-md less --s-2
    const b = await box(undo), t = await box(toast);
    expect(b.h, 'the button is at least --tap-min tall').toBeGreaterThanOrEqual(56);
    expect(t.h, 'the toast is --s-2 + --tap-min + --s-2 tall').toBe(72);
    expect(await css(toast, 'padding')).toBe('8px 8px 8px 24px');   // --s-2 --s-2 --s-2 --s-5
    expect(await css(toast, 'gap')).toBe('16px');   // --s-4
  });
}

test('U7 · "Cancel change" in History gives the toast without the button, two seconds', async ({ page }) => {
  // POI 122 as Straight only with a refused target event of 40 that
  // replaced Intersection: Cancel change puts Intersection back, every
  // pass fits, and the toast carries no Undo
  await page.clock.install({ time: Date.now() });
  await openSample(page);
  const s = await store(page);
  const rid = routeId(s);
  const refused = { id: crypto.randomUUID(), seq: 23, ts: 1761480000000, city: 'sample', route: 'SAMPLE-001', routeId: rid, poi: 122,
                    kind: 'target', target: 40, fromType: 'int', state: 'rejected', reason: 'no-poi' };
  await inject(page, s, 122, 'str', null, [refused]);
  await expect(page.locator('#cnt')).toHaveText('13 of 40');
  await pauseClock(page);
  const hist = await openHistory(page);
  const row = hist.locator('.hlist .hr.rej').first();
  await expect(row).toBeVisible();
  expect(await text(row.locator('.hmv'))).toBe('Type: Straight only');
  const cancel = row.locator('[data-cancel="' + refused.id + '"]');
  expect(await text(cancel)).toBe('Cancel change');
  await cancel.click();
  await expect(page.locator('.dlg')).toHaveCount(0);
  await expectPlainToast(page, 'Type set: Intersection');
  const toast = page.locator('#toast');
  const a = await store(page);
  expect(a.types[rid]['122']).toBe('int');
  expect(targets(a)).toHaveLength(0);
  expect(a.events).toHaveLength(SAMPLE_EVENTS);
  await page.clock.runFor(1900);
  await expect(toast).toHaveClass(/\bon\b/);
  await page.clock.runFor(200);
  await expect(toast).not.toHaveClass(/\bon\b/);
  await page.locator('[data-act="close-history"]').click();
  await expect(hist).toHaveCount(0);
  await expect(page.locator('#cnt')).toHaveText('66 of 70');
});
