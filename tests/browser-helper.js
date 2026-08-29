// SPDX-License-Identifier: MIT

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import axe from 'axe-core';

export const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');
export const DIST_DIR = path.join(PROJECT_ROOT, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * Resolves Chrome/Chromium executable path in order:
 * 1. process.env.CHROME_PATH if set and accessible
 * 2. Conventional platform-specific locations (macOS, Linux, Windows)
 * Returns null if no executable is found.
 */
export function findChromeExecutable() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const platform = os.platform();
  const candidates = [];

  if (platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    );
  } else if (platform === 'linux') {
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
    );
  } else if (platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA;
    const programFiles = process.env.PROGRAMFILES;
    const programFilesX86 = process.env['PROGRAMFILES(X86)'];

    candidates.push(
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      localAppData ? path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe') : null,
      programFiles ? path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe') : null,
      programFilesX86 ? path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe') : null,
    );
  }

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Ensures dist/ has been built and starts a static HTTP server on an ephemeral port.
 */
export async function startStaticAppServer() {
  // Always rebuild. Building only when dist/ is missing means the browser tests
  // validate whatever stale bundle happens to be on disk: a real violation in
  // src/ passes because the served bundle predates it. Correctness beats the
  // few seconds this costs.
  execSync('npm run build', { cwd: PROJECT_ROOT, stdio: 'inherit' });

  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url || '/', 'http://127.0.0.1');
    let pathname = decodeURIComponent(parsedUrl.pathname);

    if (pathname === '/' || pathname === '/opengrail') {
      res.writeHead(302, { Location: '/opengrail/' });
      res.end();
      return;
    }

    if (!pathname.startsWith('/opengrail/')) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const relativePath = pathname.slice('/opengrail/'.length);
    let filePath = path.join(DIST_DIR, relativePath);

    // Prevent directory traversal attacks
    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    // SPA fallback: if file does not exist and has no extension, serve index.html
    if (!fs.existsSync(filePath) && !path.extname(relativePath)) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Not Found: ${pathname}`);
    }
  });

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}/opengrail/`;

  return {
    server,
    port,
    baseUrl,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

/**
 * Launches Puppeteer browser instance using resolved executable path.
 */
export async function launchBrowser(executablePath) {
  return await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
}

/**
 * Runs axe-core on the current page and returns violations.
 */
export async function runAxe(page) {
  await page.evaluate(axe.source);
  const results = await page.evaluate(async () => {
    return await window.axe.run();
  });

  const severeViolations = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );

  return {
    allViolations: results.violations,
    severeViolations,
  };
}

/**
 * Formats axe violations into an actionable human-readable string.
 */
export function formatAxeViolations(violations) {
  return violations
    .map((v) => {
      const targets = v.nodes
        .map((n) => `    - Target: ${n.target.join(', ')}\n      Summary: ${n.failureSummary}`)
        .join('\n');
      return `[${(v.impact || 'unknown').toUpperCase()}] ${v.id}: ${v.description}\n  Help: ${v.helpUrl}\n${targets}`;
    })
    .join('\n\n');
}
