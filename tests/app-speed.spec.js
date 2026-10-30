/* POI Tracker tests — speed step 2b: the Sync panel's "This tablet" section
   (prompt of 2026-10-30; screens.md v0.64, item 72; main-screen v0.45,
   frames O and V; app v0.20). The app measures its side taps and its
   freezes, in memory only, and shows them last in the Sync panel: "Last
   tap", "Slowest of 50" and "Freezes" over a status line from the slowest
   of 50, "Fast" with the dot in --ok at 200 ms or less, "Some taps slow"
   in --warn up to 500 ms, "Slow taps" in --err above, "No pass yet" in
   --ink-3 before the first pass, each "since" the time the app opened. A
   tap is timed from the side tap until the pass is on screen, and only a
   tap that recorded a pass counts. A reload resets the section, and
   nothing is written to the tablet's storage.
   Slow taps are made here: a capture listener on the side buttons busies
   the main thread for window.__busy ms before the app's handler runs, so
   the browser's event timing entry and the app's own time both hold it.
   The figure of a tap is final within a second of the tap (the app waits
   that long for the browser's entries), so the section is read 1.2 s
   after the pass. The passes go to POI 53 of the sample, which has none.
   The first chime of a session creates the app's AudioContext inside the
   tap, which takes about 300 ms in headless Chromium on this machine and
   would make the first pass read "Some taps slow"; where a test expects
   the first pass to be "Fast" it creates an AudioContext beforehand, so
   the app's own creation is cheap and the tap's figure is the tap's.
*/
'use strict';
const { test, expect, text, store, layers, holdsLock, openSample, recordPass } = require('./fixtures');

// the computed colour of a token, as getComputedStyle gives colours
function tokenColor(page, name) {
  return page.evaluate(function (v) {
    var e = document.createElement('span'); e.style.color = 'var(' + v + ')'; document.body.appendChild(e);
    var c = getComputedStyle(e).color; e.remove(); return c;
  }, name);
}
async function selectPoi(page, n) {
  await page.locator('#col .row[data-poi="' + n + '"]').click();
  await expect(page.locator('#head .big')).toHaveText(String(n));
}
// the busy listener on the side buttons: window.__busy ms of work before
// the app's handler, 0 until set
async function armBusy(page) {
  await page.evaluate(function () {
    window.__busy = 0;
    document.querySelectorAll('#stage [data-side]').forEach(function (b) {
      b.addEventListener('click', function () { var t = performance.now(); while (performance.now() - t < window.__busy) { /* busy */ } }, true);
    });
  });
}
function setBusy(page, ms) { return page.evaluate(function (v) { window.__busy = v; }, ms); }
// an AudioContext before the first chime, so its creation is not in the
// first tap's figure (see the header)
function warmAudio(page) { return page.evaluate(function () { window.__audio = new AudioContext(); }); }
// the Sync panel, opened from its control; closed by the same control
async function openPanel(page) {
  await page.locator('#syncBtn').click();
  const pop = page.locator('.pop.syncpop');
  await expect(pop).toBeVisible();
  return pop;
}
async function closePanel(page) {
  await page.locator('#syncBtn').click();
  await expect(page.locator('.pop.syncpop')).toHaveCount(0);
}
// the section as shown: the three figures, the status line, its class and
// the dot's colour
async function readSection(pop) {
  const b = await pop.locator('.sfig .ol b').allInnerTexts();
  expect(await pop.locator('.sfig .ol small').allInnerTexts()).toEqual(['Last tap', 'Slowest of 50', 'Freezes']);
  const line = pop.locator('.sline');
  return { last: b[0], slow: b[1], freezes: b[2], line: await text(line), cls: await line.getAttribute('class'),
           dot: await line.locator('.dot').evaluate(function (el) { return getComputedStyle(el).backgroundColor; }) };
}
// a figure "N ms" as the number N
function ms(s) {
  expect(s, 'a figure in whole ms').toMatch(/^\d[\d,]* ms$/);
  return Number(s.replace(/,| ms/g, ''));
}
// a pass with its figure settled
async function timedPass(page, man, side) {
  await recordPass(page, man, side);
  await page.waitForTimeout(1200);
}
// "since HH:MM": the app opened less than a minute ago, so this minute or
// the one before
function sinceOptions(page) {
  return page.evaluate(function () {
    function f(d) { return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }
    var now = new Date(); return [f(now), f(new Date(now.getTime() - 60000))];
  });
}
function localKeys(page) { return page.evaluate(function () { return Object.keys(localStorage).sort(); }); }

test('Speed · a fresh app: the section last, dashes, the freezes counted, "No pass yet"', async ({ page }) => {
  await openSample(page);
  const since = await sinceOptions(page);
  const pop = await openPanel(page);
  // last in the panel: a divider, the title, the figures and the status line
  const tail = await pop.evaluate(function (el) {
    return Array.prototype.slice.call(el.children, -4).map(function (c) { return c.className + (c.className === 'pt' ? ' ' + c.textContent : ''); });
  });
  expect(tail).toEqual(['sdiv', 'pt THIS TABLET', 'sfig', 'sline off']);
  const s = await readSection(pop);
  expect(s.last).toBe('–');
  expect(s.slow).toBe('–');
  expect(s.freezes).toMatch(/^\d+$/);
  expect(since.map(function (t) { return 'No pass yet · since ' + t; })).toContain(s.line);
  expect(s.cls).toBe('sline off');
  expect(s.dot).toBe(await tokenColor(page, '--ink-3'));
  // nothing in it takes a tap
  await expect(pop.locator('.sfig button, .sline button, .sfig [tabindex], .sline [tabindex]')).toHaveCount(0);
});

for (const scheme of ['light', 'dark']) {
  test('Speed · a pass is Fast, a 300 ms tap Some taps slow, a 600 ms tap Slow taps, the dots --ok, --warn and --err on ' + scheme, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await openSample(page);
    await selectPoi(page, 53);
    await armBusy(page);
    await warmAudio(page);

    // one pass: both times the same whole number above 0, "Fast" in --ok
    await timedPass(page, 'L', 'N');
    let pop = await openPanel(page), s = await readSection(pop);
    const n = ms(s.last);
    expect(n).toBeGreaterThan(0);
    expect(ms(s.slow)).toBe(n);
    expect(s.line).toMatch(/^Fast · since \d\d:\d\d$/);
    expect(s.cls).toBe('sline');
    expect(s.dot).toBe(await tokenColor(page, '--ok'));
    expect(s.freezes).toMatch(/^\d+$/);
    const freezes0 = Number(s.freezes);
    await closePanel(page);

    // a 300 ms tap: at least 300 ms, the slowest of 50 equals it, "Some
    // taps slow" in --warn, the freezes grew by at least one (the busy
    // tap is a long task itself)
    await setBusy(page, 300);
    await timedPass(page, 'R', 'S');
    await setBusy(page, 0);
    pop = await openPanel(page); s = await readSection(pop);
    expect(ms(s.last)).toBeGreaterThanOrEqual(300);
    expect(s.slow).toBe(s.last);
    expect(s.line).toMatch(/^Some taps slow · since \d\d:\d\d$/);
    expect(s.cls).toBe('sline wait');
    expect(s.dot).toBe(await tokenColor(page, '--warn'));
    expect(Number(s.freezes)).toBeGreaterThanOrEqual(freezes0 + 1);
    await closePanel(page);

    // a 600 ms tap: "Slow taps" in --err
    await setBusy(page, 600);
    await timedPass(page, 'L', 'W');
    await setBusy(page, 0);
    pop = await openPanel(page); s = await readSection(pop);
    expect(ms(s.last)).toBeGreaterThanOrEqual(600);
    expect(s.slow).toBe(s.last);
    expect(s.line).toMatch(/^Slow taps · since \d\d:\d\d$/);
    expect(s.cls).toBe('sline bad');
    expect(s.dot).toBe(await tokenColor(page, '--err'));
    await closePanel(page);
  });
}

test('Speed · a tap that records nothing changes no figure', async ({ page }) => {
  await openSample(page);
  await selectPoi(page, 53);
  await armBusy(page);
  await warmAudio(page);
  const stage = page.locator('#stage');
  const before = await store(page);

  await setBusy(page, 300);
  await page.locator('#stage [data-man="L"]').click();
  await expect(stage).toHaveClass(/\bopen\b/);
  const north = page.locator('#stage [data-side="N"]');
  await north.click();
  await setBusy(page, 0);
  await north.click({ force: true });   // the second tap, while the ring of the first still runs: ignored (item 7)
  await expect(stage).not.toHaveClass(/\bopen\b/);
  await expect.poll(() => layers(page)).toBe(0);
  const after = await store(page);
  expect(after.events).toHaveLength(before.events.length + 1);

  // the figures are the slow first tap's: a timed second tap would have
  // put its own small time in "Last tap"
  await page.waitForTimeout(1200);
  const s = await readSection(await openPanel(page));
  expect(ms(s.last)).toBeGreaterThanOrEqual(300);
  expect(s.slow).toBe(s.last);
  expect(s.line).toMatch(/^Some taps slow · since/);
});

test('Speed · after 51 fast passes the slow one has left the slowest of 50', async ({ page }) => {
  test.setTimeout(180000);
  await openSample(page);
  await selectPoi(page, 53);
  await armBusy(page);
  await warmAudio(page);
  const before = await store(page);

  await setBusy(page, 300);
  await recordPass(page, 'L', 'N');
  await setBusy(page, 0);
  // Left and Right in turn, so neither reaches its share of 28 (item 46)
  for (let i = 0; i < 49; i++) await recordPass(page, i % 2 ? 'L' : 'R', 'NSWE'[i % 4]);
  await page.waitForTimeout(1200);
  let s = await readSection(await openPanel(page));
  expect(ms(s.slow), 'the slow tap is still among the last 50 after 49 fast passes').toBeGreaterThanOrEqual(300);
  expect(ms(s.last)).toBeLessThan(300);
  expect(s.line).toMatch(/^Some taps slow · since/);
  await closePanel(page);

  for (let i = 49; i < 51; i++) await recordPass(page, i % 2 ? 'L' : 'R', 'NSWE'[i % 4]);
  await page.waitForTimeout(1200);
  s = await readSection(await openPanel(page));
  expect(ms(s.slow), 'the slow tap has left the last 50').toBeLessThan(300);
  expect(ms(s.last)).toBeLessThan(300);
  expect(s.line).not.toMatch(/^Slow taps/);
  const after = await store(page);
  expect(after.events).toHaveLength(before.events.length + 52);
});

test('Speed · a reload resets the section, and the storage holds no new key', async ({ page }) => {
  await openSample(page);
  await selectPoi(page, 53);
  await warmAudio(page);
  const keys = await localKeys(page);
  expect(keys).toContain('poi-app:store');

  await timedPass(page, 'L', 'N');
  let s = await readSection(await openPanel(page));
  expect(ms(s.last)).toBeGreaterThan(0);
  expect(s.line).toMatch(/^Fast · since/);
  await closePanel(page);
  expect(await localKeys(page)).toEqual(keys);

  await page.reload();
  await expect(page.locator('#city')).toHaveText('Sample city');
  await expect.poll(() => holdsLock(page)).toBe(true);
  await expect(page.locator('#head .big')).toHaveText('53');
  const since = await sinceOptions(page);
  s = await readSection(await openPanel(page));
  expect(s.last).toBe('–');
  expect(s.slow).toBe('–');
  expect(s.freezes).toMatch(/^\d+$/);
  expect(since.map(function (t) { return 'No pass yet · since ' + t; })).toContain(s.line);
  expect(s.cls).toBe('sline off');
  expect(await localKeys(page)).toEqual(keys);
});
