/* POI Tracker tests — the gold (prompts Gold step 2, Card step 2 and Done
   step 2c; screens.md v0.55, items 2, 5, 19, 39, 40, 41, 60; _tokens.css
   v0.22): the one gold, --gold-line, #D9A92A on light and #E6B83E on dark,
   on the arrows' ring, the card's ring fill, the icons under its rings and
   beside LAST (--card-glyph) and the bar of a POI in progress; the arrows
   on the discs and the type tile on --man-glyph, the gold on light and a
   deep gold, #A67C00, on the ivory discs of the dark theme; a gold N on
   the compass and gold sides (--side, #E0B43A and #E6B83E), a locked
   arrow without the ring, the gold History chip, the pill's numbers in
   ink, none of the old colours left in any computed colour, and the gold
   icon with its manifest entries (the icon keeps its colours until a step
   of its own recolours it).
   The light and dark tests emulate the system colour scheme before the
   app opens, so its "System" theme follows it.
*/
'use strict';
const { test, expect, layers, openSample, openHistory } = require('./fixtures');

// the golds of _tokens.css v0.22, one value per theme
const GOLD = { light: 'rgb(224, 180, 58)', dark: 'rgb(230, 184, 62)' };      // --side, --compass-n
const EDGE = { light: 'rgb(126, 95, 10)', dark: 'rgba(0, 0, 0, 0)' };        // --compass-n-edge: #7E5F0A on light, transparent on dark
const LINE = { light: 'rgb(217, 169, 42)', dark: 'rgb(230, 184, 62)' };      // --gold-line: --man-ring, --card-fill, --card-glyph and --prog in both themes
const GLYPH = { light: 'rgb(217, 169, 42)', dark: 'rgb(166, 124, 0)' };      // --man-glyph: --gold-line on light, #A67C00 on the ivory discs of dark
const SOFT = { light: 'rgba(224, 180, 58, 0.18)', dark: 'rgba(230, 184, 62, 0.2)' };   // --side-soft
const OLD = ['242, 168, 29', '184, 116, 0', '255, 177, 61', '163, 127, 34', '212, 175, 55', '139, 113, 30', '204, 167, 53'];   // the old side colour, the old light and dark --warn, #A37F22, the gold of tokens v0.18 that never reached the app, and the golds of tokens v0.20: #D4AF37, #8B711E and #CCA735
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
  const gold = GOLD[scheme], line = LINE[scheme], glyph = GLYPH[scheme];
  const ring = line + ' 0px 0px 0px 4px';   // 0 0 0 var(--s-1) var(--man-ring)
  await page.emulateMedia({ colorScheme: scheme });
  await openSample(page);
  const stage = page.locator('#stage');
  const left = page.locator('#stage [data-man="L"]');

  // a. the arrows on the three discs of POI 136 take --man-glyph: the gold on
  //    light, a deep gold on the ivory discs of dark (item 5, v0.40); the Left
  //    arrow, not locked, carries the ring in --man-ring, the one gold
  const discs = page.locator('#stage .disc');
  await expect(discs).toHaveCount(3);
  for (let i = 0; i < 3; i++) expect(await css(discs.nth(i), 'color'), 'disc ' + i).toBe(glyph);
  await expect(left).not.toHaveClass(/\blocked\b/);
  const shadowA = await css(left, 'box-shadow');
  expect(shadowA.startsWith(ring), 'box-shadow "' + shadowA + '" should start with the ring').toBe(true);

  // b. the type pill's tile: --man-glyph too
  const tile = page.locator('#pill .ticon');
  await expect(tile).toHaveCount(1);
  expect(await css(tile, 'color')).toBe(glyph);

  // c. the compass: a gold N, outlined on light. On the sample it has no
  //    heading, so it is idle (item 19): its gold half is a dashed outline
  //    without fill and the halo is not displayed. The gold fill of the
  //    half is checked with idle taken off for a moment, then put back.
  //    The old class is gone.
  await expect(page.locator('.compass')).toHaveClass(/\bidle\b/);
  const cn = page.locator('.compass .cn');
  await expect(cn).toHaveCount(1);
  expect(await css(cn, 'fill')).toBe(gold);
  expect(await css(cn, 'stroke')).toBe(EDGE[scheme]);
  const half = page.locator('.compass .gold');
  await expect(half).toHaveCount(1);
  expect(await css(half, 'fill')).toBe('none');
  expect(await css(half, 'stroke-dasharray')).toBe('3px, 2.2px');
  expect(await css(page.locator('.compass .halo'), 'display')).toBe('none');
  const goldFill = await page.evaluate(function () {
    var svg = document.querySelector('.compass');
    svg.classList.remove('idle');
    var fill = getComputedStyle(svg.querySelector('.gold')).getPropertyValue('fill');
    svg.classList.add('idle');
    return fill;
  });
  expect(goldFill).toBe(gold);
  await expect(page.locator('.compass .amber')).toHaveCount(0);

  // h. the card and the column on POI 136, the sides closed: the fill of a
  //    ring, the icons under the rings and the icon of LAST (--card-glyph,
  //    the bright gold in both themes, v0.40) and the bar of the POI in
  //    progress take the one gold; the pill's numbers are in ink, the colour
  //    of the big number
  const fg = page.locator('#card .mz .fg').first();
  await expect(fg).toHaveCount(1);
  expect(await css(fg, 'stroke')).toBe(line);
  const mnIcons = page.locator('#card .mn .ic');
  await expect(mnIcons).toHaveCount(3);
  for (let i = 0; i < 3; i++) expect(await css(mnIcons.nth(i), 'color'), 'icon under ring ' + i).toBe(line);
  const lpIcon = page.locator('#card .lp .ic');
  await expect(lpIcon).toHaveCount(1);
  expect(await css(lpIcon, 'color')).toBe(line);
  expect(await css(page.locator('#col .row[data-poi="136"] .rb i'), 'background-color')).toBe(line);
  const ink = await css(page.locator('#head .big'), 'color');
  expect(await css(page.locator('#pill .tn').first(), 'color')).toBe(ink);

  // g. no old colour anywhere, closed
  expect(await oldColours(page)).toEqual([]);

  // d. the open compass: four gold sides, the ring stays on the arrow
  await left.click();
  await expect(stage).toHaveClass(/\bopen\b/);
  const sides = page.locator('#stage [data-side]');
  await expect(sides).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    await expect(sides.nth(i)).toBeVisible();
    expect(await css(sides.nth(i), 'background-color')).toBe(gold);
  }
  await expect(left).toHaveClass(/\bon\b/);
  const shadowD = await css(left, 'box-shadow');
  expect(shadowD.startsWith(ring), 'box-shadow "' + shadowD + '" should start with the ring').toBe(true);
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
  expect(shadowE.includes(line.slice(4, -1)), 'box-shadow "' + shadowE + '" should carry no ring').toBe(false);

  // f. History's gold chip
  const hist = await openHistory(page);
  const chip = hist.locator('.hsub .chip.gold');
  await expect(chip).toHaveCount(1);
  expect(await css(chip, 'background-color')).toBe(SOFT[scheme]);
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
