/* POI Tracker tests — the temporary test switch for the band on the
   tablet (prompt of 2026-10-27, app v0.15). On the tablet a band around
   the discs went black or filled with noise while a locked disc showed
   beside an active Left. app/?lab=0 to app/?lab=4 puts the class lab-N on
   the root element for that page load, shows "Test N" in --warn right
   after the city name and draws a locked disc another way, one change
   per variant: lab-0 as before, lab-1 without its shadow, lab-2 opaque
   in its colours mixed with --bg at --o-locked, the shadow kept, lab-3
   with every disc on its own layer (will-change: opacity), lab-4 without
   the opacity fade. Without lab, and with a value that is not a whole
   number 0 to 4, nothing changes. The locked disc is Straight on the
   sample's POI 53 set to No straight from the pill, Left active, as on
   the tablet. Light and dark. The switch touches no storage: the store
   stays the only key. These tests go when the switch goes.
*/
'use strict';
const { test, expect, KEY, text, holdsLock } = require('./fixtures');

// the locked disc as v0.14 draws it, per theme: --disc, --man-glyph, --bg,
// --shadow and --warn of the label
const DISC = { light: [5, 84, 63], dark: [240, 233, 210] };
const GLYPH = { light: [217, 169, 42], dark: [166, 124, 0] };
const BG = { light: [245, 242, 232], dark: [4, 33, 26] };
const SHADOW = { light: 'rgba(5, 84, 63, 0.14) 0px 6px 20px 0px', dark: 'rgba(0, 0, 0, 0.45) 0px 6px 20px 0px' };
const WARN = { light: 'rgb(126, 95, 10)', dark: 'rgb(235, 199, 94)' };
const LOCKED = 0.28;                                          // --o-locked
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';                // --ease-out
const MOVE = 'left 0.26s ' + EASE + ', top 0.26s ' + EASE;    // --dur-move
const FADE = MOVE + ', opacity 0.16s ' + EASE;                // and --dur-fade
const VARIANTS = [
  'draws a locked disc as before',
  'drops a locked disc\'s shadow',
  'draws a locked disc opaque, mixed with --bg',
  'puts every disc on its own layer',
  'drops the disc\'s opacity fade'
];

// a computed style property of the element
function css(locator, prop) {
  return locator.evaluate(function (el, p) { return getComputedStyle(el).getPropertyValue(p); }, prop);
}
// a computed colour as three channels from 0 to 1: rgb() in 0 to 255, or
// color(srgb) as color-mix serializes it
function channels(c) {
  const m = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(c);
  if (m) return [1, 2, 3].map(function (i) { return Number(m[i]) / 255; });
  const s = /^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(c);
  if (s) return [1, 2, 3].map(function (i) { return Number(s[i]); });
  throw new Error('not a colour: ' + c);
}
// color-mix(in srgb, fg LOCKED * 100%, bg), as three channels from 0 to 1
function mix(fg, bg) {
  return fg.map(function (v, i) { return (LOCKED * v + (1 - LOCKED) * bg[i]) / 255; });
}
function rgb(c) { return c.map(function (v) { return v / 255; }); }
function expectColour(got, want, what) {
  const g = channels(got);
  g.forEach(function (v, i) { expect(Math.abs(v - want[i]), what + ' ' + got + ', want ' + want.join(' ')).toBeLessThan(0.002); });
}
// the locked disc of variant v (null without the switch) on a theme
function want(v, scheme) {
  return {
    opacity: v === 2 ? '1' : String(LOCKED),
    bg: v === 2 ? mix(DISC[scheme], BG[scheme]) : rgb(DISC[scheme]),
    color: v === 2 ? mix(GLYPH[scheme], BG[scheme]) : rgb(GLYPH[scheme]),
    shadow: v === 1 ? 'none' : SHADOW[scheme],
    transition: v === 4 ? MOVE : FADE,
    willChange: v === 3 ? 'opacity' : 'auto'
  };
}

// /app/?sample with the query's rest, on a theme
async function openWith(page, scheme, rest) {
  await page.emulateMedia({ colorScheme: scheme });
  await page.goto('/app/?sample' + rest);
  await expect(page.locator('#city')).toHaveText('Sample city');
  await expect(page.locator('#cnt')).toHaveText('41 of 70');
  await expect.poll(() => holdsLock(page)).toBe(true);
}
// POI 53, an Intersection with no passes, set to No straight from the
// pill: no dialog, Straight locks while Left stays active; returns the
// Straight disc
async function noStraightAt53(page) {
  await page.locator('#col .row[data-poi="53"]').click();
  await expect(page.locator('#head .big')).toHaveText('53');
  await page.locator('#pill').click();
  const pop = page.locator('.pop');
  await expect(pop).toBeVisible();
  await pop.locator('.opt[data-type="nost"]').click();
  await expect(pop).toHaveCount(0);
  await expect(page.locator('.dlg')).toHaveCount(0);
  const st = page.locator('#stage [data-man="St"]');
  await expect(st).toHaveClass(/\blocked\b/);
  await expect(page.locator('#stage [data-man="L"]')).not.toHaveClass(/\blocked\b/);
  return st;
}
// the lab classes on the root element
function labClasses(page) {
  return page.evaluate(function () { return Array.from(document.documentElement.classList).filter(function (c) { return /^lab-/.test(c); }); });
}
// the locked disc's computed styles once its fade has ended
async function expectDisc(st, w, at) {
  await expect.poll(() => css(st, 'opacity'), 'opacity' + at).toBe(w.opacity);
  expectColour(await css(st, 'background-color'), w.bg, 'background' + at);
  expectColour(await css(st, 'color'), w.color, 'arrow colour' + at);
  expect(await css(st, 'box-shadow'), 'box-shadow' + at).toBe(w.shadow);
  expect(await css(st, 'transition'), 'transition' + at).toBe(w.transition);
  expect(await css(st, 'will-change'), 'will-change' + at).toBe(w.willChange);
}
// no storage but the store
async function expectOnlyTheStore(page) {
  expect(await page.evaluate(function () { return Object.keys(localStorage); })).toEqual([KEY]);
  expect(await page.evaluate(function () { return sessionStorage.length; })).toBe(0);
}

for (const scheme of ['light', 'dark']) {
  VARIANTS.forEach(function (name, v) {
    test('Lab · ?lab=' + v + ' ' + name + ' · ' + scheme, async ({ page }) => {
      await openWith(page, scheme, '&lab=' + v);
      expect(await labClasses(page)).toEqual(['lab-' + v]);
      // the label right after the city name, in --warn
      const label = page.locator('#city + .lab');
      await expect(label).toHaveCount(1);
      expect(await text(label)).toBe('Test ' + v);
      expect(await css(label, 'color')).toBe(WARN[scheme]);
      await expect(page.locator('.lab')).toHaveCount(1);
      const st = await noStraightAt53(page);
      await expectDisc(st, want(v, scheme), ' at ?lab=' + v + ', ' + scheme);
      await expectOnlyTheStore(page);
    });
  });

  for (const rest of ['', '&lab=7', '&lab=x']) {
    const named = rest ? '?' + rest.slice(1) : 'no lab';
    test('Lab · ' + named + ' changes nothing · ' + scheme, async ({ page }) => {
      await openWith(page, scheme, rest);
      expect(await labClasses(page)).toEqual([]);
      await expect(page.locator('.lab')).toHaveCount(0);
      const st = await noStraightAt53(page);
      await expectDisc(st, want(null, scheme), ' at ' + named + ', ' + scheme);
      await expectOnlyTheStore(page);
    });
  }
}
