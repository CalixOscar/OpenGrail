// SPDX-License-Identifier: MIT

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  settlePage,
  findChromeExecutable,
  startStaticAppServer,
  launchBrowser,
  runAxe,
  formatAxeViolations,
  gotoAppPage,
} from './browser-helper.js';

const chromePath = findChromeExecutable();

test(
  'Accessibility Smoke Suite (Track F Item 4 — axe-core)',
  {
    skip: !chromePath
      ? 'No supported Chrome/Chromium browser executable found on this system (set CHROME_PATH to enable)'
      : false,
  },
  async (t) => {
    let serverInfo;
    let browser;
    let page;

    t.before(async () => {
      serverInfo = await startStaticAppServer();
      browser = await launchBrowser(chromePath);
      page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
    });

    t.after(async () => {
      if (browser) {
        await browser.close();
      }
      if (serverInfo) {
        await serverInfo.close();
      }
    });

    await t.test('Main view accessibility (serious/critical violations only)', async () => {
      await gotoAppPage(page, serverInfo.baseUrl);
      await page.waitForSelector('.topbar', { timeout: 5000 });
      await page.waitForSelector('canvas', { timeout: 5000 });

      await settlePage(page);
      const { severeViolations } = await runAxe(page);
      assert.equal(
        severeViolations.length,
        0,
        `Main view contains ${severeViolations.length} serious/critical accessibility violation(s):\n\n${formatAxeViolations(severeViolations)}`,
      );
    });

    await t.test(
      'Comparison modal accessibility (#compare=christianity+islam)',
      async () => {
        await gotoAppPage(page, `${serverInfo.baseUrl}#compare=christianity+islam`);
        await page.waitForSelector('.comparison-overlay', { timeout: 5000 });

        await settlePage(page);
      const { severeViolations } = await runAxe(page);
        assert.equal(
          severeViolations.length,
          0,
          `Comparison modal contains ${severeViolations.length} serious/critical accessibility violation(s):\n\n${formatAxeViolations(severeViolations)}`,
        );
      },
    );

    await t.test(
      'Artifact lightbox accessibility (within comparison modal)',
      async () => {
        // Ensure comparison modal is active
        const overlay = await page.$('.comparison-overlay');
        if (!overlay) {
          await gotoAppPage(page, `${serverInfo.baseUrl}#compare=christianity+islam`);
          await page.waitForSelector('.comparison-overlay', { timeout: 5000 });
        }

        // Open artifact lightbox by clicking artifact card
        await page.waitForSelector('.comparison-artifact-card', { timeout: 5000 });
        await page.evaluate(() => {
          const card = document.querySelector('.comparison-artifact-card');
          if (card instanceof HTMLElement) {
            card.scrollIntoView({ block: 'center' });
            card.click();
          }
        });
        await page.waitForSelector('.artifact-lightbox-backdrop', { timeout: 5000 });

        // Wait for lightbox fadeIn animation (150ms) to settle
        await new Promise((resolve) => setTimeout(resolve, 250));

        await settlePage(page);
      const { severeViolations } = await runAxe(page);
        assert.equal(
          severeViolations.length,
          0,
          `Artifact lightbox contains ${severeViolations.length} serious/critical accessibility violation(s):\n\n${formatAxeViolations(severeViolations)}`,
        );
      },
    );
  },
);
