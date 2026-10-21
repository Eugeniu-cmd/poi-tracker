/* POI Tracker tests — Playwright configuration (CLAUDE.md rule 12).
   Setup once: cd tests, npm install, npx playwright install chromium.
   Run: cd tests, then npx playwright test.
   The suite starts serve.js itself and waits for http://localhost:8765/app/.
   One project, Chromium only, at the user's tablet viewport in portrait
   (800 x 1213, screens.md item 49). Playwright gives every test its own
   fresh browser context, so localStorage, the service worker and the Web
   Lock start empty in each test.
*/
// @ts-check
'use strict';
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.js$/,
  retries: 0,
  reporter: 'list',
  timeout: 30000,
  expect: { timeout: 5000 },
  use: {
    baseURL: 'http://localhost:8765',
    viewport: { width: 800, height: 1213 },
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ],
  webServer: {
    command: 'node serve.js',
    url: 'http://localhost:8765/app/',
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  }
});
