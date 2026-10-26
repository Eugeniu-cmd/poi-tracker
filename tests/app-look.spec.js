/* POI Tracker tests — the new look (prompt Done step 2c; screens.md v0.55,
   items 51, 67 and 68; _tokens.css v0.22, main-screen.html v0.40): the
   working area ends where the reference's does. With no overlay open, the
   bottom edge of .body sits where it sits in main-screen.html frame A at
   the same preset, within 1 px, since the overlays container and the toast
   take no place in the screen's flex column (v0.6 ended 18 px higher: its
   empty overlays container was an in-flow item that added one gap).
   The reference opens in a second page of the same context, as in
   app-card.spec.js: a font it fetches from the web never counts as an
   error of the app's page.
*/
'use strict';
const { test, expect, layers, openSample } = require('./fixtures');

// the bottom edge of the first .body under root, relative to the top of
// the first .app under it, in CSS pixels
function bodyBottom(root) {
  return root.evaluate(function (el) {
    var a = el.querySelector('.app').getBoundingClientRect(), b = el.querySelector('.body').getBoundingClientRect();
    return b.bottom - a.top;
  });
}

test('Look · the working area ends where frame A\'s does', async ({ page }) => {
  const ref = await page.context().newPage();
  await ref.goto('/docs/references/main-screen.html', { waitUntil: 'domcontentloaded' });
  const frameA = ref.locator('.frame:has(.app[data-state="A"])');
  await expect(frameA).toHaveCount(1);

  await openSample(page);
  await expect.poll(() => layers(page)).toBe(0);
  for (const [w, h] of [[800, 1333], [1000, 600]]) {
    const at = ' at ' + w + ' × ' + h;
    await page.setViewportSize({ width: w, height: h });
    await ref.locator('[data-preset="' + w + 'x' + h + '"]').click();
    await expect(frameA).toHaveCSS('height', h + 'px');
    const app = await bodyBottom(page.locator('.host'));
    const frame = await bodyBottom(frameA);
    expect(Math.abs(app - frame), '.body ends ' + app + ' px under the top in the app, ' + frame + ' px in frame A' + at).toBeLessThanOrEqual(1);
  }
  await ref.close();
});
