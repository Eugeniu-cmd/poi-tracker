/* POI Tracker tests — the app shows its version (prompt of 2026-10-30;
   screens.md v0.66, item 72; main-screen v0.46, frames O and V; app
   v0.22). The title line of the Sync panel's "This tablet" section holds
   "THIS TABLET" on the left and "App v0.22" on the right, on one line,
   the version in the title's size and colour, --w-bold, without its
   letter-spacing, and the panel keeps its height: 454 px at 800 x 1333
   after three passes, as app v0.21 measured before the change. The
   version is one constant in the app, APP_VERSION, read here from
   app/index.html on disk, so a later version does not edit this file;
   a guard keeps it equal to the header's latest entry and to the
   service worker's cache name, so a later step cannot bump one and
   forget the other.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const { test, expect, text, openSample, recordPass } = require('./fixtures');

const APP = path.join(__dirname, '..', 'app');
function appVersion() {
  const m = fs.readFileSync(path.join(APP, 'index.html'), 'utf8').match(/^\s*var APP_VERSION = '([^']+)';/m);
  expect(m, 'APP_VERSION in app/index.html').not.toBeNull();
  return m[1];
}
function style(locator) {
  return locator.evaluate(function (el) {
    var s = getComputedStyle(el);
    return { size: s.fontSize, weight: s.fontWeight, color: s.color, spacing: s.letterSpacing };
  });
}

test.use({ viewport: { width: 800, height: 1333 } });

for (const scheme of ['light', 'dark']) {
  test('Version · the "This tablet" title line shows the title and "App vX.Y" on one line, the panel 454 px tall, on ' + scheme, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await openSample(page);
    await recordPass(page, 'L', 'N');
    await recordPass(page, 'R', 'S');
    await recordPass(page, 'L', 'W');
    await page.locator('#syncBtn').click();
    const pop = page.locator('.pop.syncpop');
    await expect(pop).toBeVisible();

    // the title line: the section's .pt, its first span the title, .sver the version
    const line = pop.locator('.pt.shead');
    await expect(line).toHaveCount(1);
    const title = line.locator('span').first(), ver = line.locator('.sver');
    expect(await text(title)).toBe('THIS TABLET');
    const shown = await text(ver);
    expect(shown).toMatch(/^App v\d+\.\d+$/);
    expect(shown).toBe('App ' + appVersion());
    // the panel's first title does not change
    expect(await text(pop.locator('.pt').first())).toBe('SYNC · SAMPLE CITY');

    // one line: the same top within 2 px, the version to the right of the title
    const t = await title.boundingBox(), v = await ver.boundingBox();
    expect(Math.abs(t.y - v.y)).toBeLessThanOrEqual(2);
    expect(v.x).toBeGreaterThan(t.x + t.width);

    // the version's style: the title's size and colour, --w-bold, no letter-spacing
    const ts = await style(title), vs = await style(ver);
    expect(vs.size).toBe(ts.size);
    expect(vs.color).toBe(ts.color);
    expect(vs.weight).toBe('700');
    expect(['normal', '0px']).toContain(vs.spacing);
    expect(ts.spacing).not.toBe(vs.spacing);

    // the panel keeps its height
    const box = await pop.boundingBox();
    expect(box.height).toBe(454);
  });
}

test('Version · APP_VERSION equals the header\'s latest entry and the service worker\'s cache name', async () => {
  const html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
  // the file's own history is the comment before <html; the inlined tokens have theirs inside <style>
  const header = html.slice(0, html.indexOf('<html'));
  const entries = header.match(/^  v\d+\.\d+ \d{4}-\d{2}-\d{2} — /gm);
  expect(entries, 'version entries in the header').not.toBeNull();
  const latest = entries[entries.length - 1].match(/v\d+\.\d+/)[0];
  const v = appVersion();
  expect(v).toMatch(/^v\d+\.\d+$/);
  expect(v, 'APP_VERSION against the header\'s latest entry').toBe(latest);
  const sw = fs.readFileSync(path.join(APP, 'sw.js'), 'utf8');
  const cache = sw.match(/^var CACHE = '([^']+)';/m);
  expect(cache, 'CACHE in app/sw.js').not.toBeNull();
  expect(cache[1], 'the cache name against APP_VERSION').toBe('poi-app-' + v);
});
