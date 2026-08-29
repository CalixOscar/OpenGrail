// SPDX-License-Identifier: MIT

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findChromeExecutable,
  startStaticAppServer,
  launchBrowser,
} from './browser-helper.js';

const chromePath = findChromeExecutable();

test(
  'Keyboard-only Browser Smoke Suite (Track F Item 5)',
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

    await t.test(
      'Verify trusted keyboard delivery and document.activeElement focus movement',
      async () => {
        await page.goto(serverInfo.baseUrl, { waitUntil: 'networkidle2' });
        await page.waitForSelector('.topbar', { timeout: 5000 });

        // Verify Tab moves activeElement away from BODY
        await page.keyboard.press('Tab');
        const activeElementInfo = await page.evaluate(() => ({
          tagName: document.activeElement?.tagName,
          className: document.activeElement?.className,
          id: document.activeElement?.id,
        }));

        assert.notEqual(
          activeElementInfo.tagName,
          'BODY',
          'Keyboard Tab event must move document.activeElement away from BODY',
        );
      },
    );

    await t.test(
      'Complete keyboard-driven workflow: search, arrow navigation, enter selection, document pane, comparison modal, escape close',
      async () => {
        await page.goto(serverInfo.baseUrl, { waitUntil: 'networkidle2' });
        await page.waitForSelector('.topbar', { timeout: 5000 });
        await page.waitForSelector('#graph-search-input', { timeout: 5000 });

        // Step 1: Focus search input
        await page.focus('#graph-search-input');
        const isSearchFocused = await page.evaluate(
          () => document.activeElement?.id === 'graph-search-input',
        );
        assert.ok(
          isSearchFocused,
          'Search input #graph-search-input must receive keyboard focus',
        );

        // Step 2: Type a search query
        await page.keyboard.type('buddhism');
        await page.waitForSelector('#graph-search-input-listbox', { timeout: 5000 });

        const isExpanded = await page.$eval('#graph-search-input', (el) =>
          el.getAttribute('aria-expanded'),
        );
        assert.equal(
          isExpanded,
          'true',
          'Search combobox aria-expanded must be "true" when query matches are found',
        );

        const options = await page.$$eval(
          '#graph-search-input-listbox [role="option"]',
          (els) =>
            els.map((el) => ({
              id: el.id,
              title: el.querySelector('strong')?.textContent?.trim() || '',
            })),
        );
        assert.ok(
          options.length >= 2,
          `Search results must yield at least 2 options for "buddhism", found: ${options.length}`,
        );

        // Step 3: Move highlight with arrow keys
        // Press ArrowDown to highlight first option
        await page.keyboard.press('ArrowDown');
        let activeDescendant = await page.$eval('#graph-search-input', (el) =>
          el.getAttribute('aria-activedescendant'),
        );
        assert.equal(
          activeDescendant,
          options[0].id,
          'First ArrowDown must highlight the first option',
        );

        let firstOptionSelected = await page.$eval(`#${options[0].id}`, (el) =>
          el.getAttribute('aria-selected'),
        );
        assert.equal(
          firstOptionSelected,
          'true',
          'First option must have aria-selected="true"',
        );

        // Press ArrowDown again to advance highlight to second option
        await page.keyboard.press('ArrowDown');
        activeDescendant = await page.$eval('#graph-search-input', (el) =>
          el.getAttribute('aria-activedescendant'),
        );
        assert.equal(
          activeDescendant,
          options[1].id,
          'Second ArrowDown must advance highlight to the second option',
        );

        let secondOptionSelected = await page.$eval(`#${options[1].id}`, (el) =>
          el.getAttribute('aria-selected'),
        );
        assert.equal(
          secondOptionSelected,
          'true',
          'Second option must have aria-selected="true"',
        );

        const targetTradition = options[1];
        assert.ok(
          targetTradition.title.length > 0,
          'Highlighted target tradition must have a non-empty title',
        );

        // Step 4: Press Enter to select the highlighted tradition
        await page.keyboard.press('Enter');
        await page.waitForSelector('#graph-search-input-listbox', {
          hidden: true,
          timeout: 5000,
        });

        const afterEnterExpanded = await page.$eval('#graph-search-input', (el) =>
          el.getAttribute('aria-expanded'),
        );
        assert.equal(
          afterEnterExpanded,
          'false',
          'Search combobox aria-expanded must be "false" after selection',
        );

        // Step 5: Confirm document pane opens for the specific tradition that was highlighted
        await page.waitForSelector('.document-pane--open', { timeout: 5000 });
        const isDocOpen = await page.$eval('.document-pane', (el) =>
          el.getAttribute('data-open'),
        );
        assert.equal(
          isDocOpen,
          'true',
          'Document pane data-open attribute must be "true"',
        );

        const docTitle = await page.$eval('.document-pane__title', (el) =>
          el.textContent?.trim(),
        );
        assert.equal(
          docTitle,
          targetTradition.title,
          `Document pane must open with title matching highlighted option "${targetTradition.title}", found: "${docTitle}"`,
        );

        // Step 6: Open comparison modal via keyboard
        await page.focus('.document-pane__compare-btn');
        const isCompareFocused = await page.evaluate(
          () =>
            document.activeElement?.classList.contains(
              'document-pane__compare-btn',
            ),
        );
        assert.ok(
          isCompareFocused,
          'Compare button in document pane must receive keyboard focus',
        );

        await page.keyboard.press('Enter');
        await page.waitForSelector('.comparison-overlay', { timeout: 5000 });

        const modalRole = await page.$eval('.comparison-overlay', (el) =>
          el.getAttribute('role'),
        );
        assert.equal(
          modalRole,
          'dialog',
          'Comparison modal must render with role="dialog"',
        );

        const compTitleA = await page.$eval(
          '.comparison-selector-card .comparison-selector-card__title',
          (el) => el.textContent?.trim(),
        );
        assert.equal(
          compTitleA,
          targetTradition.title,
          `Comparison modal Tradition A must match selected tradition "${targetTradition.title}", found: "${compTitleA}"`,
        );

        // Step 7: Close comparison modal via Escape key
        await page.keyboard.press('Escape');
        await page.waitForSelector('.comparison-overlay', {
          hidden: true,
          timeout: 5000,
        });

        const overlayRemaining = await page.$('.comparison-overlay');
        assert.equal(
          overlayRemaining,
          null,
          'Comparison modal overlay must be closed and removed from DOM after Escape',
        );
      },
    );
  },
);
