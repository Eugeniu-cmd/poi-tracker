/* POI Tracker tests — the card (prompt Card step 2; screens.md v0.52, items
   9, 39, 60 and 68; _tokens.css v0.19): the "Still needed" card drawn as the
   canon draws it, three progress rings in a pyramid and a rose of the four
   sides under TO GO, with the last pass of the POI at the head's right, the
   type pill and its menu without passes and with "Change type", and the
   card's rings and rose sized by its own width.
   Tests a and b drive the app's clock with Playwright's clock, installed
   before the page opens at 2026-10-22 12:00 local time and left running,
   so the times of the sample's passes are fixed: its newest pass on POI 136
   is 2 minutes old, its passes on POI 133 a day older.
*/
'use strict';
const { test, expect, text, layers, openSample, recordPass } = require('./fixtures');

const CLOCK = new Date(2026, 9, 22, 12, 0, 0);   // local time

// markup without the whitespace between its tags and with every time hh:mm
// replaced by one placeholder, so the app's card compares with a frame of
// the reference drawn at another time of day
function norm(html) {
  return html.replace(/>\s+</g, '><').trim().replace(/\b\d{2}:\d{2}\b/g, 'hh:mm');
}
// a computed style property of the element
function css(locator, prop) {
  return locator.evaluate(function (el, p) { return getComputedStyle(el).getPropertyValue(p); }, prop);
}
// the width and the height of the element's bounding box
function box(locator) {
  return locator.evaluate(function (el) { var b = el.getBoundingClientRect(); return { w: b.width, h: b.height }; });
}
// every descendant of the element with a width whose bounding box leaves
// the element's box by more than 0.5 px, as "tag.classes by N px"
function outside(locator) {
  return locator.evaluate(function (el) {
    var c = el.getBoundingClientRect(), out = [];
    el.querySelectorAll('*').forEach(function (d) {
      var b = d.getBoundingClientRect();
      if (!b.width) return;
      var over = Math.max(c.left - b.left, b.right - c.right, c.top - b.top, b.bottom - c.bottom);
      if (over > 0.5) out.push(d.tagName.toLowerCase() + '.' + (d.getAttribute('class') || '').trim().split(/\s+/).join('.') + ' by ' + over.toFixed(2) + ' px');
    });
    return out;
  });
}
// selects a POI in the column
async function selectPoi(page, n) {
  await page.locator('#col .row[data-poi="' + n + '"]').click();
  await expect(page.locator('#head .big')).toHaveText(String(n));
}

test('Card · the markup of the canon', async ({ page }) => {
  await page.clock.install({ time: CLOCK });
  // the reference, in a second page of the same context: a font it fetches
  // from the web never counts as an error of the app's page
  const ref = await page.context().newPage();
  await ref.goto('/docs/references/main-screen.html', { waitUntil: 'domcontentloaded' });
  const frameA = norm(await ref.locator('.app[data-state="A"] .card').innerHTML());
  const frameE = norm(await ref.locator('.app[data-state="E"] .card').innerHTML());
  await ref.close();
  expect(frameA).toContain('<div class="khead">');
  expect(frameE).toContain('<div class="khead">');

  // POI 136 is frame A, POI 135 frame E
  await openSample(page);
  const card = page.locator('#card');
  expect(norm(await card.innerHTML())).toBe(frameA);
  await selectPoi(page, 135);
  expect(norm(await card.innerHTML())).toBe(frameE);

  // the pill: the split alone, in its numbers, and "Change type"
  await selectPoi(page, 136);
  expect(await text(page.locator('#pill small'))).toBe('28 · 14 · 28');
  expect(await text(page.locator('#pill .tchg'))).toBe('Change type');

  // the menu: six types with their splits, no passes
  await page.locator('#pill').click();
  const pop = page.locator('.pop');
  await expect(pop).toBeVisible();
  const opts = pop.locator('.opt');
  await expect(opts).toHaveCount(6);
  expect(await text(opts.first())).toBe('Intersection 28 · 14 · 28');
  expect(await text(pop)).not.toContain('passes');
  await page.goBack();
  await expect(pop).toHaveCount(0);
  await expect.poll(() => layers(page)).toBe(0);
});

test('Card · LAST is the pass Undo last would remove', async ({ page }) => {
  await page.clock.install({ time: CLOCK });
  await openSample(page);
  const lp = page.locator('#card .lp');

  // POI 136: its newest pass on this tablet, Left from South, 2 minutes ago
  await expect(lp).toHaveAttribute('aria-label', 'Last pass: Left from South at 11:58');
  await expect(lp.locator('use')).toHaveAttribute('href', '#i-left');
  expect(await text(lp)).toBe('LAST S · 11:58');

  // a new pass takes its place
  await recordPass(page, 'R', 'E');
  await expect(lp).toHaveAttribute('aria-label', 'Last pass: Right from East at 12:00');

  // Undo last offers that same pass; removed, LAST steps back
  await page.locator('#bar [data-act="undo"]').click();
  const dlg = page.locator('.dlg');
  await expect(dlg).toBeVisible();
  expect(await text(dlg.locator('.dchip'))).toBe('POI 136 · Right from East · 12:00');
  await dlg.locator('[data-act="dlg-ok"]').click();
  await expect(dlg).toHaveCount(0);
  await expect(lp).toHaveAttribute('aria-label', 'Last pass: Left from South at 11:58');

  // POI 133: a pass of the day before shows its date
  await selectPoi(page, 133);
  await expect(lp).toHaveAttribute('aria-label', 'Last pass: Straight from North at 21.10 10:58');

  // POI 140: no pass on this tablet, the head holds TO GO alone
  await selectPoi(page, 140);
  await expect(lp).toHaveCount(0);
  expect(await text(page.locator('#card .khead'))).toBe('TO GO');
});

test('Card · its size follows its width', async ({ page }) => {
  await openSample(page);
  const card = page.locator('#card');
  const sizes = [
    { w: 800, h: 1333, card: 'wide', wheel: 76, rose: 184 },
    { w: 1333, h: 800, card: 'wide', wheel: 76, rose: 184 },
    { w: 720, h: 1000, card: 'narrow', wheel: 62, rose: 160 },
    { w: 1000, h: 600, card: 'small', wheel: 52, rose: 128 }
  ];
  for (const v of sizes) {
    const at = ' at ' + v.w + ' × ' + v.h;
    await page.setViewportSize({ width: v.w, height: v.h });
    await selectPoi(page, 136);
    const cw = (await box(card)).w;
    if (v.card === 'wide') expect(cw, 'card width' + at).toBeGreaterThanOrEqual(480);
    else if (v.card === 'narrow') expect(cw, 'card width' + at).toBeLessThan(480);
    else expect(cw, 'card width' + at).toBeLessThanOrEqual(380);
    expect(Math.round((await box(page.locator('#card .mz .wheel').first())).w), 'wheel' + at).toBe(v.wheel);
    expect(Math.round((await box(page.locator('#card .rose'))).w), 'rose' + at).toBe(v.rose);
    const more = page.locator('#card .mz .in small');
    await expect(more).toHaveCount(3);   // POI 136: every maneuver still has passes to go
    for (let i = 0; i < 3; i++) expect(await css(more.nth(i), 'display'), '"more"' + at).toBe(v.card === 'small' ? 'none' : 'block');
    expect(await outside(card), 'outside the card on POI 136' + at).toEqual([]);
    const h136 = (await box(card)).h;

    // POI 140 has no LAST: the head, and so the card, keep their height
    await selectPoi(page, 140);
    await expect(page.locator('#card .lp')).toHaveCount(0);
    expect(await outside(card), 'outside the card on POI 140' + at).toEqual([]);
    const h140 = (await box(card)).h;
    expect(Math.abs(h140 - h136), 'card height ' + h140 + ' without LAST, ' + h136 + ' with' + at).toBeLessThanOrEqual(0.5);
  }
});
