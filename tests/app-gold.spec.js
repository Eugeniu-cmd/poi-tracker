/* POI Tracker tests — the gold (prompt Gold step 2; screens.md v0.49, items
   5, 19, 40, 41, 60; _tokens.css v0.16): gold arrows with a gold ring, the
   gold type tile, a gold N on the compass, gold sides, a locked arrow
   without the ring, the gold History chip, none of the old colours left in
   any computed colour, and the gold icon with its manifest entries.
   The light and dark tests emulate the system colour scheme before the
   app opens, so its "System" theme follows it.
*/
'use strict';
const { test, expect, layers, openSample, openHistory } = require('./fixtures');

const GOLD = 'rgb(212, 175, 55)';          // --side, --man-ring, --compass-n; --man-glyph and --warn on light
const DARK_GOLD = 'rgb(139, 113, 30)';     // --compass-n-edge on light; --man-glyph and --warn on dark
const RING = 'rgb(212, 175, 55) 0px 0px 0px 4px';   // 0 0 0 var(--s-1) var(--man-ring)
const OLD = ['242, 168, 29', '184, 116, 0', '255, 177, 61'];   // the old side colour and the old light and dark --warn
const PROPS = ['color', 'background-color', 'border-top-color', 'border-left-color', 'outline-color', 'fill', 'stroke', 'box-shadow'];

// a computed style property of the element
function css(locator, prop) {
  return locator.evaluate(function (el, p) { return getComputedStyle(el).getPropertyValue(p); }, prop);
}
// every element in the document whose computed colours still carry one of
// the old values, as "tag.classes property: value"
function oldColours(page) {
  return page.evaluate(function (a) {
    var out = [];
    document.querySelectorAll('*').forEach(function (el) {
      var cs = getComputedStyle(el);
      var name = el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : '');
      a.props.forEach(function (p) {
        var v = cs.getPropertyValue(p);
        a.old.forEach(function (o) { if (v.indexOf(o) >= 0) out.push(name + ' ' + p + ': ' + v); });
      });
    });
    return out;
  }, { props: PROPS, old: OLD });
}

async function goldScreen(page, scheme) {
  const dark = scheme === 'dark';
  await page.emulateMedia({ colorScheme: scheme });
  await openSample(page);
  const stage = page.locator('#stage');
  const left = page.locator('#stage [data-man="L"]');

  // a. the Left arrow of POI 136: a gold arrow and the gold ring
  await expect(left).not.toHaveClass(/\blocked\b/);
  expect(await css(left, 'color')).toBe(dark ? DARK_GOLD : GOLD);
  const shadowA = await css(left, 'box-shadow');
  expect(shadowA.startsWith(RING), 'box-shadow "' + shadowA + '" should start with the ring').toBe(true);

  // b. the type pill's tile
  const tile = page.locator('#pill .ticon');
  await expect(tile).toHaveCount(1);
  expect(await css(tile, 'color')).toBe(dark ? DARK_GOLD : GOLD);

  // c. the compass: a gold N, outlined on light; the gold half; the old class is gone
  const cn = page.locator('.compass .cn');
  await expect(cn).toHaveCount(1);
  expect(await css(cn, 'fill')).toBe(GOLD);
  expect(await css(cn, 'stroke')).toBe(dark ? 'rgba(0, 0, 0, 0)' : DARK_GOLD);
  const half = page.locator('.compass .gold');
  await expect(half).toHaveCount(1);
  expect(await css(half, 'fill')).toBe(GOLD);
  await expect(page.locator('.compass .amber')).toHaveCount(0);

  // g. no old colour anywhere, closed
  expect(await oldColours(page)).toEqual([]);

  // d. the open compass: four gold sides, the ring stays on the arrow
  await left.click();
  await expect(stage).toHaveClass(/\bopen\b/);
  const sides = page.locator('#stage [data-side]');
  await expect(sides).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    await expect(sides.nth(i)).toBeVisible();
    expect(await css(sides.nth(i), 'background-color')).toBe(GOLD);
  }
  await expect(left).toHaveClass(/\bon\b/);
  const shadowD = await css(left, 'box-shadow');
  expect(shadowD.startsWith(RING), 'box-shadow "' + shadowD + '" should start with the ring').toBe(true);
  // g. no old colour anywhere, with the sides open
  expect(await oldColours(page)).toEqual([]);
  await page.goBack();
  await expect(stage).not.toHaveClass(/\bopen\b/);
  await expect.poll(() => layers(page)).toBe(0);

  // e. POI 124, its Left share full: the arrow locks and loses the ring
  await page.locator('#col .row[data-poi="124"]').click();
  await expect(page.locator('#head .big')).toHaveText('124');
  await expect(left).toHaveClass(/\blocked\b/);
  const shadowE = await css(left, 'box-shadow');
  expect(shadowE.includes('212, 175, 55'), 'box-shadow "' + shadowE + '" should carry no ring').toBe(false);

  // f. History's gold chip
  const hist = await openHistory(page);
  const chip = hist.locator('.hsub .chip.gold');
  await expect(chip).toHaveCount(1);
  expect(await css(chip, 'background-color')).toBe(dark ? 'rgba(212, 175, 55, 0.22)' : 'rgba(212, 175, 55, 0.16)');
  // g. no old colour anywhere, with History open
  expect(await oldColours(page)).toEqual([]);
}

test('Gold · light', async ({ page }) => { await goldScreen(page, 'light'); });

test('Gold · dark', async ({ page }) => { await goldScreen(page, 'dark'); });

test('Gold · icon', async ({ page }) => {
  await page.goto('/app/');
  await expect(page.locator('#city')).toHaveText('No city');
  const r = await page.evaluate(function () {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        var x = c.getContext('2d');
        x.drawImage(img, 0, 0);
        var d = x.getImageData(0, 0, c.width, c.height).data;
        function px(X, Y) { var i = (Y * c.width + X) * 4; return [d[i], d[i + 1], d[i + 2], d[i + 3]]; }
        var old = 0;
        for (var i = 0; i < d.length; i += 4) {
          if (Math.abs(d[i] - 242) <= 12 && Math.abs(d[i + 1] - 168) <= 12 && Math.abs(d[i + 2] - 29) <= 12) old += 1;
        }
        resolve({ w: c.width, h: c.height, right: px(286, 311), left: px(226, 311), corner: px(10, 10), old: old });
      };
      img.onerror = function () { reject(new Error('the icon did not load')); };
      img.src = '/app/icon-512.png?t=' + Date.now();
    });
  });
  expect([r.w, r.h]).toEqual([512, 512]);
  function near(p, rgb) { return p[3] === 255 && Math.abs(p[0] - rgb[0]) <= 3 && Math.abs(p[1] - rgb[1]) <= 3 && Math.abs(p[2] - rgb[2]) <= 3; }
  expect(near(r.right, [212, 175, 55]), 'pixel (286, 311) is rgba(' + r.right + '), expected gold').toBe(true);
  expect(near(r.left, [241, 243, 250]), 'pixel (226, 311) is rgba(' + r.left + '), expected the light disc colour').toBe(true);
  expect(near(r.corner, [28, 32, 48]), 'pixel (10, 10) is rgba(' + r.corner + '), expected the dark disc colour').toBe(true);
  expect(r.old, 'pixels within 12 of the old side colour').toBe(0);

  const manifest = await (await page.request.get('/app/manifest.webmanifest')).json();
  const icons = manifest.icons.filter(function (i) { return i.src === 'icon-512.png'; });
  expect(icons.map(function (i) { return i.purpose; }).sort()).toEqual(['any', 'maskable']);
  for (const i of icons) expect(i).toMatchObject({ sizes: '512x512', type: 'image/png' });
});
