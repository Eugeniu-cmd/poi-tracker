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
   The app creates its AudioContext once, right after the first screen is
   drawn, so the first pass is as quick as the rest (app v0.21, screens.md
   v0.65, item 62); created inside the first side tap, as before, it took
   about 300 ms in headless Chromium and made the first pass read "Some
   taps slow". The last three tests count the contexts through a wrapper
   around window.AudioContext set before the page loads.
*/
'use strict';
const { test, expect, text, store, layers, holdsLock, openSample, recordPass, reloadWith } = require('./fixtures');

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

// ---- the ding ready before the first pass (app v0.21, screens.md v0.65,
// item 62): the app creates its AudioContext once, right after the first
// screen is drawn, while sound is on, so the first side tap creates none
// and its figure is the tap's. A wrapper around window.AudioContext, set
// before the page loads, counts the contexts and notes the time of each;
// with failFirst the first construction throws, as it would where the
// browser has no audio device, so the app's own path inside the tap runs.
function countAudio(page, failFirst) {
  return page.addInitScript(function (failFirst) {
    var Real = window.AudioContext;
    window.__audio = [];
    function Counted() {
      if (failFirst && !window.__audio.length) { window.__audio.push({ at: performance.now(), failed: true }); throw new Error('no audio device'); }
      var c = new Real();
      window.__audio.push({ at: performance.now(), state: c.state });
      return c;
    }
    Counted.prototype = Real.prototype;
    window.AudioContext = Counted;
    window.webkitAudioContext = Counted;
  }, !!failFirst);
}
function audioMade(page) { return page.evaluate(function () { return window.__audio; }); }
function now(page) { return page.evaluate(function () { return performance.now(); }); }
// the start has settled once the freezes are counted: that observer is
// set in the task after the one that makes the context
async function startSettled(page) {
  const pop = await openPanel(page);
  await expect(pop.locator('.sfig .ol b').nth(2)).toHaveText(/^\d+$/);
  await closePanel(page);
}
const STORE_KEYS = ['baseline', 'cities', 'device', 'dropped', 'events', 'schema', 'seq', 'types'];

test('Speed · the ding is ready: sound on makes one AudioContext before any tap, the first tap makes none and is Fast', async ({ page }) => {
  await countAudio(page);
  await openSample(page);
  await expect.poll(() => audioMade(page).then(function (a) { return a.length; })).toBe(1);
  const made = await audioMade(page), t0 = await now(page);
  expect(made[0].failed).toBeUndefined();
  expect(made[0].at).toBeLessThan(t0);   // before any tap
  // the store is as before: its keys, the device's keys, no new key in the storage
  const keys = await localKeys(page), s0 = await store(page);
  expect(keys).toContain('poi-app:store');
  expect(Object.keys(s0).sort()).toEqual(STORE_KEYS);
  expect(Object.keys(s0.device).sort()).toEqual(['cityId', 'sound', 'theme']);
  expect(s0.device.sound).toBe(true);

  await selectPoi(page, 53);
  await timedPass(page, 'L', 'N');
  expect(await audioMade(page)).toHaveLength(1);   // the tap created none
  const s = await readSection(await openPanel(page));
  expect(ms(s.last)).toBeGreaterThan(0);
  expect(s.line).toMatch(/^Fast · since \d\d:\d\d$/);
  expect(s.cls).toBe('sline');
  await closePanel(page);
  expect(await localKeys(page)).toEqual(keys);
  expect(Object.keys(await store(page)).sort()).toEqual(STORE_KEYS);
});

test('Speed · the ding is ready: sound off before start makes no AudioContext, nor does a pass', async ({ page }) => {
  await countAudio(page);
  await openSample(page);
  const s0 = await store(page);
  s0.device.sound = false;
  await reloadWith(page, s0);
  await expect(page.locator('#city')).toHaveText('Sample city');
  await startSettled(page);
  expect(await audioMade(page)).toEqual([]);
  await selectPoi(page, 53);
  await recordPass(page, 'L', 'N');
  expect(await audioMade(page)).toEqual([]);
  const s = await store(page);
  expect(s.device.sound).toBe(false);
  expect(s.events).toHaveLength(s0.events.length + 1);
});

test('Speed · the ding is ready: when the early creation fails, the first pass makes the context itself, as before, with no error', async ({ page }) => {
  await countAudio(page, true);
  await openSample(page);
  await startSettled(page);
  let made = await audioMade(page);
  expect(made).toHaveLength(1);
  expect(made[0].failed).toBe(true);
  const t0 = await now(page), before = await store(page);
  await selectPoi(page, 53);
  await recordPass(page, 'L', 'N');
  made = await audioMade(page);
  expect(made).toHaveLength(2);
  expect(made[1].failed).toBeUndefined();
  expect(made[1].at).toBeGreaterThan(t0);   // inside the tap
  await recordPass(page, 'R', 'S');   // the second chime reuses it
  expect(await audioMade(page)).toHaveLength(2);
  expect((await store(page)).events).toHaveLength(before.events.length + 2);
});
