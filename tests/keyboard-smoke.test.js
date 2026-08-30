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

    await t.test(
      'Opening view tab order invariant: collapsed rail contains no tradition navigator nodes',
      async () => {
        await page.goto(serverInfo.baseUrl, { waitUntil: 'networkidle2' });
        await page.waitForSelector('.topbar', { timeout: 5000 });
        await page.waitForSelector('.sidebar--collapsed', { timeout: 5000 });

        const tabbables = await page.$$eval(
          '.sidebar--collapsed button, .sidebar--collapsed [tabindex="0"], .sidebar--collapsed a[href], .sidebar--collapsed input',
          (els) =>
            els
              .filter((el) => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden';
              })
              .map((el) => ({
                tagName: el.tagName,
                ariaLabel: el.getAttribute('aria-label') || '',
                title: el.getAttribute('title') || '',
                text: el.textContent?.trim() || '',
              })),
        );

        // Invariant 1: The tradition navigator (114 nodes) is not resident in the collapsed rail.
        // No tradition-selection controls (nothing matching "Open <name>" or tradition titles).
        const traditionControls = tabbables.filter(
          (t) =>
            (t.ariaLabel && /^Open\s+/i.test(t.ariaLabel)) ||
            (t.title && /^Open\s+/i.test(t.title)),
        );
        assert.equal(
          traditionControls.length,
          0,
          `Collapsed rail must not contain any tradition navigation controls, found: ${JSON.stringify(traditionControls)}`,
        );

        // Invariant 2: Every control in the rail has a non-empty accessible name.
        for (const control of tabbables) {
          const accessibleName = control.ariaLabel || control.title || control.text;
          assert.ok(
            accessibleName.trim().length > 0,
            `Every control in collapsed rail must have a non-empty accessible name: ${JSON.stringify(control)}`,
          );
        }

        // Invariant 3: The rail's tabbable count stays at or below a small explicit bound.
        // Bound explanation: expand control (1) plus the view switcher modes (3: Brain Cluster, World Map, List View).
        // Any change that adds tradition nodes or decorative buttons must fail this bound.
        const MAX_EXPECTED_RAIL_CONTROLS = 4;
        assert.ok(
          tabbables.length <= MAX_EXPECTED_RAIL_CONTROLS,
          `Collapsed rail tabbable count (${tabbables.length}) exceeds maximum expected bound of ${MAX_EXPECTED_RAIL_CONTROLS} (expand control + view switcher). Found: ${JSON.stringify(tabbables)}`,
        );
        assert.ok(
          tabbables.length >= 1,
          'Collapsed rail must contain at least the expand control',
        );
      },
    );

    await t.test(
      'Summoned cluster legend interaction and localStorage persistence',
      async () => {
        await page.goto(serverInfo.baseUrl, { waitUntil: 'networkidle2' });
        await page.waitForSelector('.topbar', { timeout: 5000 });

        // Ensure legend is hidden by default
        let legendElement = await page.$('.cluster-legend');
        assert.equal(legendElement, null, 'Cluster legend must start hidden by default');

        const legendToggle = await page.waitForSelector('button[title="Toggle cluster legend"]', {
          timeout: 5000,
        });
        assert.ok(legendToggle, 'Legend toggle button must exist in LAYERS topbar group');

        let ariaPressed = await page.$eval('button[title="Toggle cluster legend"]', (el) =>
          el.getAttribute('aria-pressed'),
        );
        assert.equal(ariaPressed, 'false', 'Legend toggle aria-pressed must be false initially');

        // Summon legend by clicking toggle
        await legendToggle.click();
        await page.waitForSelector('.cluster-legend', { timeout: 5000 });

        ariaPressed = await page.$eval('button[title="Toggle cluster legend"]', (el) =>
          el.getAttribute('aria-pressed'),
        );
        assert.equal(ariaPressed, 'true', 'Legend toggle aria-pressed must be true when open');

        let isStoredShown = await page.evaluate(() =>
          localStorage.getItem('opengrail_cluster_legend_shown'),
        );
        assert.equal(isStoredShown, 'true', 'localStorage must record opengrail_cluster_legend_shown = "true"');

        // Dismiss via the X button inside legend
        const dismissBtn = await page.waitForSelector('.cluster-legend__dismiss', { timeout: 5000 });
        await dismissBtn.click();
        await page.waitForSelector('.cluster-legend', { hidden: true, timeout: 5000 });

        ariaPressed = await page.$eval('button[title="Toggle cluster legend"]', (el) =>
          el.getAttribute('aria-pressed'),
        );
        assert.equal(ariaPressed, 'false', 'Legend toggle aria-pressed must be false after dismissal');

        isStoredShown = await page.evaluate(() =>
          localStorage.getItem('opengrail_cluster_legend_shown'),
        );
        assert.equal(isStoredShown, null, 'localStorage key must be cleared after dismissal');
      },
    );
  },
);
