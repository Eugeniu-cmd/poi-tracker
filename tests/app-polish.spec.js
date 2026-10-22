/* POI Tracker tests — the polish (prompt Polish step 2; screens.md v0.50,
   items 7, 19 and 62; _tokens.css v0.17): a tapped side keeps its place
   while it dips under the finger and a gold ring leaves it like a sonar
   ping, and a compass with no heading is a dashed outline.
*/
'use strict';
const { test, expect, openSample } = require('./fixtures');

const GOLD = 'rgb(212, 175, 55)';   // --compass-n

// a computed style property of the element
function css(locator, prop) {
  return locator.evaluate(function (el, p) { return getComputedStyle(el).getPropertyValue(p); }, prop);
}
// the centre of the element's bounding box, in viewport pixels
function centre(locator) {
  return locator.evaluate(function (el) { var b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
}

test('Polish · a tapped side keeps its place under the sonar ring', async ({ page }) => {
  await openSample(page);
  const stage = page.locator('#stage');
  const left = page.locator('#stage [data-man="L"]');
  expect(await css(left, 'translate')).toBe('-50% -50%');
  expect(await css(left, 'transform')).toBe('none');

  await left.click();
  await expect(stage).toHaveClass(/\bopen\b/);
  const south = page.locator('#stage [data-side="S"]');
  await expect(south).toBeVisible();
  // after the bloom
  await south.evaluate(function (el) { return Promise.all(el.getAnimations().map(function (a) { return a.finished; })); });
  expect(await css(south, 'translate')).toBe('-50% -50%');
  expect(await css(south, 'transform')).toBe('none');
  const rest = await centre(south);

  await south.click();
  // every 30 ms for about 180 ms: the centre of its bounding box, its
  // computed scale and the computed scale of its ::after, the ring
  const r = await south.evaluate(function (el) {
    function num(v) { return v === 'none' ? 1 : parseFloat(v); }
    return new Promise(function (resolve) {
      var samples = [], t0 = performance.now();
      function take() {
        var b = el.getBoundingClientRect();
        samples.push({ t: Math.round(performance.now() - t0), x: b.left + b.width / 2, y: b.top + b.height / 2,
                       scale: num(getComputedStyle(el).scale), ring: num(getComputedStyle(el, '::after').scale) });
        if (performance.now() - t0 < 180) { setTimeout(take, 30); return; }
        resolve({ samples: samples, cls: el.className, anim: getComputedStyle(el).animationName,
                  ringAnim: getComputedStyle(el, '::after').animationName });
      }
      take();
    });
  });
  const trace = JSON.stringify(r.samples);
  expect(r.samples.length, 'samples: ' + trace).toBeGreaterThanOrEqual(5);
  for (const s of r.samples) {
    expect(Math.abs(s.x - rest.x), 'the side moved sideways at ' + s.t + ' ms (at rest ' + rest.x + '): ' + trace).toBeLessThanOrEqual(1);
    expect(Math.abs(s.y - rest.y), 'the side moved up or down at ' + s.t + ' ms (at rest ' + rest.y + '): ' + trace).toBeLessThanOrEqual(1);
    expect(s.scale, 'the side grew at ' + s.t + ' ms: ' + trace).toBeLessThanOrEqual(1);
  }
  expect(Math.min.apply(null, r.samples.map(function (s) { return s.scale; })), 'the side never dipped: ' + trace).toBeLessThan(1);
  expect(Math.max.apply(null, r.samples.map(function (s) { return s.ring; })), 'no ring left the side: ' + trace).toBeGreaterThan(1.1);
  expect(r.cls.split(/\s+/)).toContain('ring');
  expect(r.anim).toBe('dip');
  expect(r.ringAnim).toBe('sonar');
  await expect(stage).not.toHaveClass(/\bopen\b/, { timeout: 2000 });
});

test('Polish · a compass with no heading is a dashed outline', async ({ page }) => {
  await openSample(page);
  const compass = page.locator('.compass');
  await expect(compass).toHaveCount(1);
  await expect(compass).toHaveClass(/\bidle\b/);
  for (const half of ['.gold', '.dark']) {
    const path = page.locator('.compass ' + half);
    await expect(path).toHaveCount(1);
    expect(await css(path, 'fill'), half + ' fill').toBe('none');
    expect(await css(path, 'stroke-dasharray'), half + ' stroke-dasharray').toBe('3px, 2.2px');
    expect(await css(path, 'stroke-width'), half + ' stroke-width').toBe('1.4px');
  }
  expect(await css(page.locator('.compass .halo'), 'display')).toBe('none');
  expect(await css(page.locator('.compass .cn'), 'fill')).toBe(GOLD);
});
