/* POI Tracker tests — the second temporary test switch, for the dark-mode
   blink of the see-through panels on the tablet (prompt of 2026-10-28,
   app v0.18). On the tablet in dark the type pill, the "To go" card, the
   route and connection buttons and the rail were drawn darker at every
   tap, and the rail flipped between two shades with no tap at all.
   app/?lab=0 to app/?lab=3 puts the class lab-N on the root element for
   that page load, shows "Test N" in --warn right after the city name and
   draws one thing another way: lab-0 as before, lab-1 the three panel
   tokens opaque (the colours the translucent ones give over --bg), lab-2
   no animation and no transition anywhere in the app, lab-3 both. Without
   lab, and with a value that is not a whole number 0 to 3, nothing
   changes. Light and dark, the theme of the system and the theme the app
   sets on the root element against it. The switch touches no storage:
   the store stays the only key. These tests go when the switch goes.
*/
'use strict';
const { test, expect, KEY, text, store, holdsLock } = require('./fixtures');

// the panel tokens of _tokens.css v0.23 as v0.17 draws them, and the
// opaque colours of lab-1 and lab-3, per theme
const PANEL = {
  light: { panel: 'rgba(255, 253, 246, 0.72)', strong: 'rgba(255, 253, 246, 0.92)', edge: 'rgba(255, 255, 255, 0.85)' },
  dark: { panel: 'rgba(255, 255, 240, 0.06)', strong: 'rgba(255, 255, 240, 0.12)', edge: 'rgba(255, 255, 240, 0.14)' }
};
const SOLID = {
  light: { panel: 'rgb(252, 250, 242)', strong: 'rgb(254, 252, 245)', edge: 'rgb(254, 253, 252)' },   // #FCFAF2, #FEFCF5, #FEFDFC
  dark: { panel: 'rgb(19, 46, 39)', strong: 'rgb(34, 60, 52)', edge: 'rgb(39, 64, 56)' }              // #132E27, #223C34, #274038
};
const WARN = { light: 'rgb(126, 95, 10)', dark: 'rgb(235, 199, 94)' };
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';                                                  // --ease-out
const DISC_MOTION = 'left 0.26s ' + EASE + ', top 0.26s ' + EASE + ', opacity 0.16s ' + EASE;   // --dur-move, --dur-fade
const VARIANTS = [
  'draws as before',
  'makes the panels opaque',
  'stops all motion',
  'makes the panels opaque and stops all motion'
];

// a computed style property of the element
function css(locator, prop) {
  return locator.evaluate(function (el, p) { return getComputedStyle(el).getPropertyValue(p); }, prop);
}
// /app/?sample with the query's rest, on a theme
async function openWith(page, scheme, rest) {
  await page.emulateMedia({ colorScheme: scheme });
  await page.goto('/app/?sample' + rest);
  await expect(page.locator('#city')).toHaveText('Sample city');
  await expect(page.locator('#cnt')).toHaveText('41 of 70');
  await expect.poll(() => holdsLock(page)).toBe(true);
}
// the lab classes on the root element
function labClasses(page) {
  return page.evaluate(function () { return Array.from(document.documentElement.classList).filter(function (c) { return /^lab-/.test(c); }); });
}
// the label right after the city name, in --warn, and no other
async function expectLabel(page, v, scheme) {
  const label = page.locator('#city + .lab');
  await expect(label).toHaveCount(1);
  expect(await text(label)).toBe('Test ' + v);
  expect(await css(label, 'color')).toBe(WARN[scheme]);
  await expect(page.locator('.lab')).toHaveCount(1);
}
// the three panel tokens as the route button (--panel-strong, its border
// --panel-edge), the rail (--panel-strong) and the card (--panel) draw them
async function expectPanels(page, want, at) {
  expect(await css(page.locator('#routeBtn'), 'background-color'), 'route button' + at).toBe(want.strong);
  expect(await css(page.locator('#col .rail'), 'background-color'), 'rail' + at).toBe(want.strong);
  expect(await css(page.locator('#routeBtn'), 'border-top-color'), 'route button border' + at).toBe(want.edge);
  expect(await css(page.locator('#card'), 'background-color'), 'card' + at).toBe(want.panel);
}
// today's motion, or none: the disc's move and fade, the sides' bloom,
// the toast's fade
async function expectMotion(page, still, at) {
  const disc = page.locator('#stage .disc').first();
  const transition = await css(disc, 'transition');
  if (still) {
    expect(transition, 'disc transition' + at).not.toContain('left');
    expect(await css(disc, 'transition-duration'), 'disc transition-duration' + at).toBe('0s');
    expect(await css(page.locator('#stage [data-side="N"]'), 'animation-name'), 'side animation' + at).toBe('none');
    expect(await css(page.locator('#toast'), 'transition-duration'), 'toast transition-duration' + at).toBe('0s');
  } else {
    expect(transition, 'disc transition' + at).toBe(DISC_MOTION);
    expect(await css(page.locator('#stage [data-side="N"]'), 'animation-name'), 'side animation' + at).toBe('bloom');
    expect(await css(page.locator('#toast'), 'transition-duration'), 'toast transition-duration' + at).toBe('0.16s');
  }
}
// no storage but the store
async function expectOnlyTheStore(page) {
  expect(await page.evaluate(function () { return Object.keys(localStorage); })).toEqual([KEY]);
  expect(await page.evaluate(function () { return sessionStorage.length; })).toBe(0);
}

for (const scheme of ['light', 'dark']) {
  VARIANTS.forEach(function (name, v) {
    test('Lab 2 · ?lab=' + v + ' ' + name + ' · ' + scheme, async ({ page }) => {
      const at = ' at ?lab=' + v + ', ' + scheme;
      await openWith(page, scheme, '&lab=' + v);
      expect(await labClasses(page)).toEqual(['lab-' + v]);
      await expectLabel(page, v, scheme);
      await expectPanels(page, v === 1 || v === 3 ? SOLID[scheme] : PANEL[scheme], at);
      await expectMotion(page, v === 2 || v === 3, at);
      await expectOnlyTheStore(page);
    });
  });

  for (const rest of ['', '&lab=7', '&lab=x']) {
    const named = rest ? '?' + rest.slice(1) : 'no lab';
    test('Lab 2 · ' + named + ' changes nothing · ' + scheme, async ({ page }) => {
      const at = ' at ' + named + ', ' + scheme;
      await openWith(page, scheme, rest);
      expect(await labClasses(page)).toEqual([]);
      await expect(page.locator('.lab')).toHaveCount(0);
      await expectPanels(page, PANEL[scheme], at);
      await expectMotion(page, false, at);
      await expectOnlyTheStore(page);
    });
  }
}

// the theme the app sets on the root element wins over the system's, and
// the opaque panels follow it: data-theme="dark" on a light system takes
// the dark colours, data-theme="light" on a dark system the light ones
for (const [system, chosen] of [['light', 'dark'], ['dark', 'light']]) {
  test('Lab 2 · ?lab=1 follows the app\'s ' + chosen + ' theme on a ' + system + ' system', async ({ page }) => {
    await openWith(page, system, '');
    const s = await store(page);
    s.device.theme = chosen;
    await page.evaluate(function (a) { localStorage.setItem(a.k, JSON.stringify(a.s)); }, { k: KEY, s: s });
    for (const v of [1, 0]) {
      const at = ' at ?lab=' + v + ', ' + chosen + ' theme on a ' + system + ' system';
      await page.goto('/app/?lab=' + v);
      await expect(page.locator('#city')).toHaveText('Sample city');
      await expect.poll(() => holdsLock(page)).toBe(true);
      expect(await page.evaluate(function () { return document.documentElement.getAttribute('data-theme'); })).toBe(chosen);
      expect(await labClasses(page)).toEqual(['lab-' + v]);
      await expectLabel(page, v, chosen);
      await expectPanels(page, v === 1 ? SOLID[chosen] : PANEL[chosen], at);
      await expectOnlyTheStore(page);
    }
  });
}
