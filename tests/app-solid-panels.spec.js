/* POI Tracker tests — solid panels (prompt of 2026-10-30; screens.md v0.62,
   item 68; _tokens.css v0.24, main-screen v0.44, app v0.19). On the tablet
   the see-through panels were drawn about twice too light in dark, went to
   their designed colour for a moment at every pass, turned lighter while
   the type menu was open, and the rail flipped between two shades with no
   tap; the test switch of app v0.18 showed that opaque panels are the
   drawing that works. --panel, --panel-strong and --panel-edge are opaque,
   the colours the translucent ones gave over --bg, and a strong surface
   inside a panel takes the new --panel-inset. Light and dark, the dark of
   the system and the dark the app sets on the root element against a
   light system: the computed backgrounds of the route button
   (--panel-strong), the column and the card (--panel), the mini-map, the
   rail and the bar's first button (--panel-inset) and the column's border
   (--panel-edge) are the decided colours as rgb(), alpha 1 everywhere.
   The switch of v0.18 is gone: without lab and with ?lab=1 the root
   element carries no lab class and no "Test" label shows.
*/
'use strict';
const { test, expect, store, holdsLock, openSample, reloadWith } = require('./fixtures');

// the opaque panel tokens of _tokens.css v0.24, per theme
const SOLID = {
  light: { panel: 'rgb(252, 250, 242)', strong: 'rgb(254, 252, 245)', inset: 'rgb(255, 253, 246)', edge: 'rgb(255, 254, 253)' },   // #FCFAF2, #FEFCF5, #FFFDF6, #FFFEFD
  dark: { panel: 'rgb(19, 46, 39)', strong: 'rgb(34, 60, 52)', inset: 'rgb(47, 71, 63)', edge: 'rgb(52, 76, 67)' }                  // #132E27, #223C34, #2F473F, #344C43
};

// a computed style property of the element
function css(locator, prop) {
  return locator.evaluate(function (el, p) { return getComputedStyle(el).getPropertyValue(p); }, prop);
}
// the panel surfaces of the working screen and the column's border: an
// rgb() value is opaque, an rgba() one would carry an alpha under 1
async function expectSolidPanels(page, want, at) {
  expect(await css(page.locator('#routeBtn'), 'background-color'), 'route button' + at).toBe(want.strong);
  expect(await css(page.locator('#col'), 'background-color'), 'column' + at).toBe(want.panel);
  expect(await css(page.locator('#card'), 'background-color'), 'card' + at).toBe(want.panel);
  expect(await css(page.locator('#col .mmap'), 'background-color'), 'mini-map' + at).toBe(want.inset);
  expect(await css(page.locator('#col .rail'), 'background-color'), 'rail' + at).toBe(want.inset);
  expect(await css(page.locator('#bar .btn').first(), 'background-color'), 'bar button' + at).toBe(want.inset);
  expect(await css(page.locator('#col'), 'border-top-color'), 'column border' + at).toBe(want.edge);
}
// no lab class on the root element and no "Test N" label anywhere
async function expectNoSwitch(page, at) {
  const labs = await page.evaluate(function () {
    return Array.from(document.documentElement.classList).filter(function (c) { return c.indexOf('lab-') === 0; });
  });
  expect(labs, 'lab classes' + at).toEqual([]);
  await expect(page.locator('.lab'), 'lab label' + at).toHaveCount(0);
  await expect(page.getByText(/^Test [0-9]$/), '"Test" label' + at).toHaveCount(0);
}

for (const scheme of ['light', 'dark']) {
  test('Solid panels · the opaque colours on the system\'s ' + scheme + ' theme, no switch', async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await openSample(page);
    await expectSolidPanels(page, SOLID[scheme], ' on ' + scheme);
    await expectNoSwitch(page, ' on ' + scheme);
  });
}

// the theme the app sets on the root element wins over the system's
test('Solid panels · the opaque dark colours on the app\'s own dark theme over a light system', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await openSample(page);
  const s = await store(page);
  s.device.theme = 'dark';
  await reloadWith(page, s);
  await expect(page.locator('#city')).toHaveText('Sample city');
  expect(await page.evaluate(function () { return document.documentElement.getAttribute('data-theme'); })).toBe('dark');
  await expectSolidPanels(page, SOLID.dark, ' on the app\'s dark');
  await expectNoSwitch(page, ' on the app\'s dark');
});

// the switch of v0.18 is gone: ?lab=1 puts no class on the root element,
// shows no label and changes no colour
test('Solid panels · ?lab=1 changes nothing', async ({ page }) => {
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/app/?sample&lab=1');
    await expect(page.locator('#city')).toHaveText('Sample city');
    await expect.poll(() => holdsLock(page)).toBe(true);
    await expectNoSwitch(page, ' at ?lab=1 on ' + scheme);
    await expectSolidPanels(page, SOLID[scheme], ' at ?lab=1 on ' + scheme);
  }
});
