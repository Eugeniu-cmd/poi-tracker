/* POI Tracker tests — the size frame tools/app-frame.html: the tablet's two
   sizes, Fit and 1:1, the theme switch, Load sample, Reload and the choices
   kept across a reload (prompt Size frame; screens.md items 49, 54, 55).
   The frame is a checking tool; the app inside it comes from /app/ as in
   the other specs. The test runs at a laptop viewport of 1400 x 900.
*/
'use strict';
const { test, expect } = require('./fixtures');

test.use({ viewport: { width: 1400, height: 900 } });
const W = 1400, H = 900;

// the iframe's bounding box, transforms included, lies inside the viewport
async function expectInside(frame) {
  const b = await frame.boundingBox();
  expect(b).not.toBeNull();
  expect(b.width).toBeLessThanOrEqual(W);
  expect(b.height).toBeLessThanOrEqual(H);
  expect(b.x).toBeGreaterThanOrEqual(0);
  expect(b.y).toBeGreaterThanOrEqual(0);
  expect(b.x + b.width).toBeLessThanOrEqual(W);
  expect(b.y + b.height).toBeLessThanOrEqual(H);
}
// the iframe's computed CSS size: what the app's container queries see
async function expectSize(frame, w, h) {
  await expect(frame).toHaveCSS('width', w + 'px');
  await expect(frame).toHaveCSS('height', h + 'px');
}
// the marked button of a group, and only it
async function expectMarked(page, attr, value) {
  await expect(page.locator('[' + attr + '="' + value + '"]')).toHaveClass(/\bon\b/);
  await expect(page.locator('[' + attr + '].on')).toHaveCount(1);
}
// true while the iframe still shows the window the mark was set on
function marked(page) {
  return page.evaluate(function () { return !!document.getElementById('frame').contentWindow.poiFrameMark; });
}

test('Frame · sizes, scale, theme, sample', async ({ page }) => {
  await page.goto('/tools/app-frame.html');
  const frame = page.locator('#frame');
  const app = page.frameLocator('#frame');
  const root = app.locator('html');
  const label = page.locator('#label');

  // 1. the defaults: portrait, Fit, System, inside the viewport, the app inside
  await expectSize(frame, 800, 1333);
  await expect(label).toContainText('800 × 1333');
  await expectMarked(page, 'data-size', 'portrait');
  await expectMarked(page, 'data-scale', 'fit');
  await expectMarked(page, 'data-theme', 'system');
  await expectInside(frame);
  await expect(app.locator('#city')).toHaveText('No city');

  // 2. landscape
  await page.locator('[data-size="landscape"]').click();
  await expectSize(frame, 1333, 800);
  await expect(label).toContainText('1333 × 800');
  await expectMarked(page, 'data-size', 'landscape');
  await expectInside(frame);

  // 3. 1:1, then Fit again
  await page.locator('[data-scale="one"]').click();
  await expectMarked(page, 'data-scale', 'one');
  expect((await frame.boundingBox()).width).toBe(1333);
  await expect(page.locator('#scale')).toHaveText('× 1');
  await page.locator('[data-scale="fit"]').click();
  await expectMarked(page, 'data-scale', 'fit');
  await expectInside(frame);

  // 4. the theme on the iframe document's root element
  await page.locator('[data-theme="dark"]').click();
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await page.locator('[data-theme="light"]').click();
  await expect(root).toHaveAttribute('data-theme', 'light');
  await page.locator('[data-theme="system"]').click();
  await expect(root).not.toHaveAttribute('data-theme');

  // 5. Load sample: the sample city inside, the choices unchanged
  await page.locator('[data-act="sample"]').click();
  await expect(app.locator('#city')).toHaveText('Sample city');
  await expectSize(frame, 1333, 800);
  await expectMarked(page, 'data-size', 'landscape');
  await expectMarked(page, 'data-scale', 'fit');
  await expectMarked(page, 'data-theme', 'system');
  await expect(root).not.toHaveAttribute('data-theme');

  // 6. a reload of the page restores them from storage
  await page.reload();
  await expectSize(frame, 1333, 800);
  await expect(label).toContainText('1333 × 800');
  await expectMarked(page, 'data-size', 'landscape');
  await expectMarked(page, 'data-scale', 'fit');
  await expectMarked(page, 'data-theme', 'system');
  await expect(root).not.toHaveAttribute('data-theme');
  const keys = await page.evaluate(function () {
    return Object.keys(localStorage).filter(function (k) { return k.indexOf('poi-frame:') === 0; }).sort();
  });
  expect(keys).toEqual(['poi-frame:scale', 'poi-frame:size', 'poi-frame:theme']);

  // 7. Reload applies the theme again after the load: the app removes the
  // attribute at its start, the frame sets it back once the iframe loaded
  await page.locator('[data-theme="dark"]').click();
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await page.evaluate(function () { document.getElementById('frame').contentWindow.poiFrameMark = true; });
  await page.locator('[data-act="reload"]').click();
  await expect.poll(() => marked(page)).toBe(false);
  await expect(app.locator('#city')).toHaveText('Sample city');
  await expect(root).toHaveAttribute('data-theme', 'dark');
});
