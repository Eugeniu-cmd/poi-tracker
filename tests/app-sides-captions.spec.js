/* POI Tracker tests — the sides of a Straight only POI and the caption's
   priority (prompt Done step 2d; screens.md v0.55, items 10, 39 and 46,
   decisions D2 and D3 of 2026-10-25; main-screen.html v0.40 frames S, T
   and U): on a Straight only POI each side with passes reads against 20,
   "of 20" under its count, in the done colour at exactly 20, "+4 over" in
   the warning colour past it and "+16" alone ten or more past, a side at
   zero faded with no line, and every other type keeps plain counts with no
   line. One caption shows under the discs, the most urgent that applies:
   a sheet error, then passes to fix (a not drivable POI with passes among
   them) or the POI done, then Not drivable, then a maneuver over its
   share, then one done, then one the type does not allow, Left before
   Straight before Right. The locks do not change with the caption: the
   expected lock sets were read from v0.7 with the same stores.
   The stores are injected as in app-types-routes.spec.js: the sample with
   the active POI's type and seven counts rewritten.
*/
'use strict';
const { test, expect, text, store, openSample, reloadWith } = require('./fixtures');

const TARGET = { int: 70, nost: 70, nol: 70, nor: 70, str: 40, nd: 0 };

function routeId(s) { return s.cities[0].routes[0].id; }
// the sample's store with POI n active, of type t, with the seven counts c
// (N, S, W, E, Left, Straight, Right) in the sheet and the type's target
async function inject(page, s, n, t, c) {
  const rid = routeId(s);
  s.cities[0].routes[0].lastPoi = n;
  s.baseline[rid][String(n)] = { c: c, target: TARGET[t] };
  s.types[rid][String(n)] = t;
  await reloadWith(page, s);
  await expect(page.locator('#head .big')).toHaveText(String(n));
}
// the rose's diamonds, N, E, W, S: the classes, the count, the line's text
// as rendered (its hidden " over" left out) and whether the line shows
function rose(page) {
  return page.locator('#card .rose .dm').evaluateAll(function (els) {
    return els.map(function (el) {
      var of = el.querySelector('.of');
      return { side: el.querySelector('.dl').textContent, cls: el.className, count: el.querySelector('.dv').textContent,
               line: of ? of.innerText : null, shown: !!of && getComputedStyle(of).display !== 'none' };
    });
  });
}
// the computed colour of the element
function colorOf(locator) { return locator.evaluate(function (el) { return getComputedStyle(el).color; }); }
// the computed colour a token gives, read through an element that uses it
function tokenColor(page, name) {
  return page.evaluate(function (v) {
    var e = document.createElement('span'); e.style.color = 'var(' + v + ')'; document.body.appendChild(e);
    var c = getComputedStyle(e).color; e.remove(); return c;
  }, name);
}
// the maneuvers whose disc is locked, in L, St, R order
function locked(page) {
  return page.locator('#stage .disc').evaluateAll(function (els) {
    return els.filter(function (el) { return el.classList.contains('locked'); }).map(function (el) { return el.getAttribute('data-man'); });
  });
}
async function expectCaption(page, cls, t, locks) {
  const lock = page.locator('#lock');
  await expect(lock).toBeVisible();
  await expect(lock).toHaveText(t);
  await expect(lock).toHaveClass('lock ' + cls);
  expect(await locked(page), 'locked discs with the caption "' + t + '"').toEqual(locks);
}

test('Sides · a Straight only POI reads its sides against 20', async ({ page }) => {
  await openSample(page);
  const s = await store(page);
  const ok = await tokenColor(page, '--ok'), warn = await tokenColor(page, '--warn');
  expect(ok).not.toBe(warn);

  // POI 131 Straight only with 36, 24, 20 and 14 from its sides (not frame
  // S's counts): "+16" alone, "+4 over" on the wide card, 20 in the done
  // colour and 14 over "of 20"
  await inject(page, s, 131, 'str', [36, 24, 20, 14, 26, 40, 28]);
  const dm = page.locator('#card .rose .dm');
  await expect(dm).toHaveCount(4);
  expect(await rose(page)).toEqual([
    { side: 'N', cls: 'dm ov', count: '36', line: '+16', shown: true },
    { side: 'E', cls: 'dm', count: '14', line: 'of 20', shown: true },
    { side: 'W', cls: 'dm ok', count: '20', line: 'of 20', shown: true },
    { side: 'S', cls: 'dm ov', count: '24', line: '+4 over', shown: true }
  ]);
  // the markup of frame T for ten or more past 20, of frame S under ten
  expect(await dm.nth(0).locator('.of').innerHTML()).toBe('+16');
  expect(await dm.nth(3).locator('.of').innerHTML()).toBe('+4<span> over</span>');
  expect(await dm.nth(3).locator('.of')).toHaveText('+4 over');
  // the colours: the done colour at 20, the warning colour past it, on the
  // count and on the line; the plain side keeps neither
  expect(await colorOf(dm.nth(2).locator('.dv'))).toBe(ok);
  expect(await colorOf(dm.nth(2).locator('.of'))).toBe(ok);
  expect(await colorOf(dm.nth(0).locator('.dv'))).toBe(warn);
  expect(await colorOf(dm.nth(0).locator('.of'))).toBe(warn);
  expect(await colorOf(dm.nth(3).locator('.dv'))).toBe(warn);
  expect(await colorOf(dm.nth(3).locator('.of'))).toBe(warn);
  expect([ok, warn]).not.toContain(await colorOf(dm.nth(1).locator('.dv')));
  expect([ok, warn]).not.toContain(await colorOf(dm.nth(1).locator('.of')));
  // nothing locks because of a side: the locks and the caption come from
  // the rings, every one closed with 54 Left and Right passes to fix
  await expectCaption(page, 'fix', '54 passes to fix in the sheet', ['L', 'St', 'R']);

  // POI 152 as frame U: 20 in the done colour, 14 over "of 20", East and
  // West a faded 0 with no line
  await inject(page, s, 152, 'str', [20, 14, 0, 0, 0, 34, 0]);
  expect(await rose(page)).toEqual([
    { side: 'N', cls: 'dm ok', count: '20', line: 'of 20', shown: true },
    { side: 'E', cls: 'dm z', count: '0', line: null, shown: false },
    { side: 'W', cls: 'dm z', count: '0', line: null, shown: false },
    { side: 'S', cls: 'dm', count: '14', line: 'of 20', shown: true }
  ]);
  await expectCaption(page, 'info', 'Straight only at this POI', ['L', 'R']);

  // an Intersection with the same sides: plain counts, no line anywhere
  await inject(page, s, 136, 'int', [36, 24, 20, 14, 28, 14, 28]);
  await expect(page.locator('#card .rose .of')).toHaveCount(0);
  expect(await rose(page)).toEqual([
    { side: 'N', cls: 'dm', count: '36', line: null, shown: false },
    { side: 'E', cls: 'dm', count: '14', line: null, shown: false },
    { side: 'W', cls: 'dm', count: '20', line: null, shown: false },
    { side: 'S', cls: 'dm', count: '24', line: null, shown: false }
  ]);
});

test('Sides · the narrow card keeps "+4" and the small card no line', async ({ page }) => {
  await openSample(page);
  const s = await store(page);
  await inject(page, s, 131, 'str', [36, 24, 20, 14, 26, 40, 28]);
  const dm = page.locator('#card .rose .dm');
  const card = page.locator('#card');

  // 720 x 1000: a card narrower than 480 px, "+4" without " over"
  await page.setViewportSize({ width: 720, height: 1000 });
  expect((await card.boundingBox()).width).toBeLessThan(480);
  expect(await rose(page)).toEqual([
    { side: 'N', cls: 'dm ov', count: '36', line: '+16', shown: true },
    { side: 'E', cls: 'dm', count: '14', line: 'of 20', shown: true },
    { side: 'W', cls: 'dm ok', count: '20', line: 'of 20', shown: true },
    { side: 'S', cls: 'dm ov', count: '24', line: '+4', shown: true }
  ]);
  await expect(dm.nth(3).locator('.of span')).toBeHidden();

  // 1000 x 600: a card of 380 px or less, no line under any side
  await page.setViewportSize({ width: 1000, height: 600 });
  expect((await card.boundingBox()).width).toBeLessThanOrEqual(380);
  const r = await rose(page);
  expect(r.map(function (d) { return d.shown; })).toEqual([false, false, false, false]);
  expect(r.map(function (d) { return d.cls; })).toEqual(['dm ov', 'dm', 'dm ok', 'dm ov']);
  await expect(page.locator('#card .rose .of')).toHaveCount(4);
  for (let i = 0; i < 4; i++) await expect(dm.nth(i).locator('.of')).toBeHidden();
});

test('Captions · one caption, the most urgent that applies', async ({ page }) => {
  await openSample(page);
  const s = await store(page);

  // a sheet error on a Not drivable POI shows the sheet error (its sides
  // and maneuvers disagree: 5 against 0)
  await inject(page, s, 168, 'nd', [5, 0, 0, 0, 0, 0, 0]);
  await expectCaption(page, 'err', 'Sheet error: sides and maneuvers disagree', ['L', 'St', 'R']);

  // a Not drivable POI with 66 passes in the sheet reads its passes to fix
  // (decision D3), in the warning colour
  await inject(page, s, 122, 'nd', [22, 18, 16, 10, 26, 13, 27]);
  await expectCaption(page, 'fix', '66 passes to fix in the sheet', ['L', 'St', 'R']);
  expect(await colorOf(page.locator('#lock'))).toBe(await tokenColor(page, '--warn'));

  // a Not drivable POI with no passes
  await inject(page, s, 168, 'nd', [0, 0, 0, 0, 0, 0, 0]);
  await expectCaption(page, 'info', 'This POI is not drivable', ['L', 'St', 'R']);

  // an Intersection with Left done and Right over its share: over before done
  await inject(page, s, 136, 'int', [20, 20, 14, 10, 28, 5, 31]);
  await expectCaption(page, 'info', 'Right is over its share: 31 of 28', ['L', 'R']);

  // Left done and Straight not yet done: Left is done, Straight still asks
  await inject(page, s, 124, 'int', [24, 20, 14, 10, 28, 13, 27]);
  await expectCaption(page, 'info', 'Left is done: 28 of 28', ['L']);

  // a No straight POI with Left done: done before not allowed
  await inject(page, s, 138, 'nost', [15, 12, 10, 8, 35, 0, 10]);
  await expectCaption(page, 'info', 'Left is done: 35 of 35', ['L', 'St']);

  // a Straight only POI with Left and Right passes and Straight still
  // asking (frame S): the type's own caption, not allowed whatever the passes
  await inject(page, s, 131, 'str', [24, 19, 13, 10, 26, 13, 27]);
  await expectCaption(page, 'info', 'Straight only at this POI', ['L', 'R']);

  // every ring closed with passes to fix (frame T), and done with none
  await inject(page, s, 141, 'str', [36, 17, 20, 20, 26, 40, 27]);
  await expectCaption(page, 'fix', '53 passes to fix in the sheet', ['L', 'St', 'R']);
  await inject(page, s, 135, 'int', [25, 21, 14, 10, 28, 14, 28]);
  await expectCaption(page, 'ok', 'This POI is done: 70 of 70', ['L', 'St', 'R']);
});
