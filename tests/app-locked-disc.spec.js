/* POI Tracker tests — a locked disc has no shadow (prompt of 2026-10-28;
   screens.md v0.60, item 5; main-screen v0.43, app v0.16). On the tablet a
   band across the middle of the screen went black or filled with noise
   whenever a maneuver disc was locked: its GPU cannot draw an element that
   is both half-transparent and carries a blurred shadow. The test switch
   of app v0.15 showed that the disc without its shadow is the drawing that
   works, so .disc.locked keeps --o-locked and loses --shadow. The locked
   disc is Straight on the sample's POI 53 set to No straight from the
   pill, Left active beside it, as on the tablet. Light and dark: the
   locked disc's computed box-shadow is none and its opacity 0.28, while
   the active disc keeps its gold ring and its lift shadow.
*/
'use strict';
const { test, expect, openSample } = require('./fixtures');

const LOCKED = '0.28';                                                                              // --o-locked
const RING = { light: 'rgb(217, 169, 42) 0px 0px 0px 4px', dark: 'rgb(230, 184, 62) 0px 0px 0px 4px' };   // 0 0 0 var(--s-1) var(--man-ring)
const LIFT = { light: 'rgba(5, 84, 63, 0.26) 0px 10px 26px 0px', dark: 'rgba(0, 0, 0, 0.55) 0px 10px 26px 0px' };   // --shadow-lift

// a computed style property of the element
function css(locator, prop) {
  return locator.evaluate(function (el, p) { return getComputedStyle(el).getPropertyValue(p); }, prop);
}
// POI 53, an Intersection with no passes, set to No straight from the
// pill: no dialog, Straight locks while Left stays active
async function noStraightAt53(page) {
  await page.locator('#col .row[data-poi="53"]').click();
  await expect(page.locator('#head .big')).toHaveText('53');
  await page.locator('#pill').click();
  const pop = page.locator('.pop');
  await expect(pop).toBeVisible();
  await pop.locator('.opt[data-type="nost"]').click();
  await expect(pop).toHaveCount(0);
  await expect(page.locator('.dlg')).toHaveCount(0);
  await expect(page.locator('#stage [data-man="St"]')).toHaveClass(/\blocked\b/);
  await expect(page.locator('#stage [data-man="L"]')).not.toHaveClass(/\blocked\b/);
}

for (const scheme of ['light', 'dark']) {
  test('Locked disc · no shadow at --o-locked, the active disc keeps its ring and lift · ' + scheme, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await openSample(page);
    await noStraightAt53(page);
    const st = page.locator('#stage [data-man="St"]');
    const left = page.locator('#stage [data-man="L"]');
    // the locked disc, once its fade has ended: no shadow, --o-locked
    await expect.poll(() => css(st, 'opacity'), 'locked opacity').toBe(LOCKED);
    expect(await css(st, 'box-shadow'), 'locked box-shadow').toBe('none');
    // the active disc beside it: opaque, the gold ring and the lift shadow
    expect(await css(left, 'opacity'), 'active opacity').toBe('1');
    const shadow = await css(left, 'box-shadow');
    expect(shadow, 'active box-shadow').not.toBe('none');
    expect(shadow, 'active box-shadow').toBe(RING[scheme] + ', ' + LIFT[scheme]);
  });
}
