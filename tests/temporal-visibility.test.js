// SPDX-License-Identifier: MIT

import test from "node:test";
import assert from "node:assert/strict";
import {
  isNodeTemporallyVisible,
  isLinkTemporallyVisible,
  isNodeExtinct,
  isNodeFuture,
  DEFAULT_TEMPORAL_MODE,
} from "../src/state/temporalVisibility.ts";

test("Temporal Visibility Selector Unit Tests", async (t) => {
  await t.test("Default temporal mode is emergent", () => {
    assert.equal(DEFAULT_TEMPORAL_MODE, "emergent");
  });

  await t.test("isNodeTemporallyVisible in emergent mode (cumulative history)", () => {
    const tradition = { origin_year: 500, extinct_year: 1200 };

    // Before emergence
    assert.equal(isNodeTemporallyVisible(tradition, 499, "emergent"), false);

    // Exactly at origin_year (visible)
    assert.equal(isNodeTemporallyVisible(tradition, 500, "emergent"), true);

    // During active period
    assert.equal(isNodeTemporallyVisible(tradition, 800, "emergent"), true);

    // At extinction year (emergent mode keeps it visible)
    assert.equal(isNodeTemporallyVisible(tradition, 1200, "emergent"), true);

    // After extinction year (emergent mode keeps it visible)
    assert.equal(isNodeTemporallyVisible(tradition, 2026, "emergent"), true);

    // Default mode argument should be emergent
    assert.equal(isNodeTemporallyVisible(tradition, 2026), true);
  });

  await t.test("isNodeTemporallyVisible in active mode (era-specific)", async (sub) => {
    const tradition = { origin_year: 500, extinct_year: 1200 };

    await sub.test("Before emergence is hidden", () => {
      assert.equal(isNodeTemporallyVisible(tradition, 499, "active"), false);
    });

    await sub.test("origin_year exactly equal to year is visible", () => {
      assert.equal(isNodeTemporallyVisible(tradition, 500, "active"), true);
    });

    await sub.test("During active lifespan is visible", () => {
      assert.equal(isNodeTemporallyVisible(tradition, 1199, "active"), true);
    });

    await sub.test("year === extinct_year counts as EXTINCT (hidden)", () => {
      // Critical boundary condition: the extinction year itself is extinct
      assert.equal(isNodeTemporallyVisible(tradition, 1200, "active"), false);
    });

    await sub.test("year > extinct_year is hidden", () => {
      assert.equal(isNodeTemporallyVisible(tradition, 1201, "active"), false);
      assert.equal(isNodeTemporallyVisible(tradition, 2026, "active"), false);
    });

    await sub.test("extinct_year null is living and ongoing", () => {
      const living = { origin_year: -500, extinct_year: null };
      assert.equal(isNodeTemporallyVisible(living, -501, "active"), false);
      assert.equal(isNodeTemporallyVisible(living, -500, "active"), true);
      assert.equal(isNodeTemporallyVisible(living, 0, "active"), true);
      assert.equal(isNodeTemporallyVisible(living, 2026, "active"), true);
    });

    await sub.test("extinct_year undefined is living and ongoing", () => {
      const living = { origin_year: 1517 };
      assert.equal(isNodeTemporallyVisible(living, 1516, "active"), false);
      assert.equal(isNodeTemporallyVisible(living, 1517, "active"), true);
      assert.equal(isNodeTemporallyVisible(living, 2026, "active"), true);
    });
  });

  await t.test("Handles camelCase and snake_case alias pairs seamlessly", () => {
    // snake_case
    const snake = { origin_year: 300, extinct_year: 800 };
    // camelCase
    const camel = { originYear: 300, extinctYear: 800 };
    // mixed
    const mixed1 = { origin_year: 300, extinctYear: 800 };
    const mixed2 = { originYear: 300, extinct_year: 800 };

    for (const item of [snake, camel, mixed1, mixed2]) {
      assert.equal(isNodeTemporallyVisible(item, 299, "emergent"), false);
      assert.equal(isNodeTemporallyVisible(item, 300, "emergent"), true);
      assert.equal(isNodeTemporallyVisible(item, 800, "emergent"), true);

      assert.equal(isNodeTemporallyVisible(item, 299, "active"), false);
      assert.equal(isNodeTemporallyVisible(item, 300, "active"), true);
      assert.equal(isNodeTemporallyVisible(item, 799, "active"), true);
      assert.equal(isNodeTemporallyVisible(item, 800, "active"), false); // Extinct at 800
      assert.equal(isNodeTemporallyVisible(item, 801, "active"), false);
    }
  });

  await t.test("Handles null and undefined node gracefully", () => {
    assert.equal(isNodeTemporallyVisible(null, 2026, "emergent"), false);
    assert.equal(isNodeTemporallyVisible(undefined, 2026, "emergent"), false);
    assert.equal(isNodeTemporallyVisible(null, 2026, "active"), false);
    assert.equal(isNodeTemporallyVisible(undefined, 2026, "active"), false);
  });

  await t.test("isLinkTemporallyVisible unit tests", async (sub) => {
    const ancient = { origin_year: -1000, extinct_year: -300 };
    const classical = { origin_year: -500, extinct_year: 400 };
    const modern = { origin_year: 1500, extinct_year: null };

    await sub.test("Visible when both endpoints are visible", () => {
      // In emergent mode at year 0: both ancient and classical have emerged
      assert.equal(isLinkTemporallyVisible(ancient, classical, 0, "emergent"), true);
      // In active mode at year -400: both ancient and classical are active
      assert.equal(isLinkTemporallyVisible(ancient, classical, -400, "active"), true);
    });

    await sub.test("Hidden when one endpoint has not yet emerged", () => {
      // In emergent mode at year 0: modern has not yet emerged
      assert.equal(isLinkTemporallyVisible(classical, modern, 0, "emergent"), false);
      assert.equal(isLinkTemporallyVisible(modern, classical, 0, "emergent"), false);
    });

    await sub.test("Hidden when one endpoint is extinct in active mode", () => {
      // In active mode at year 0: ancient is extinct (-300), classical is active (-500 to 400)
      assert.equal(isLinkTemporallyVisible(ancient, classical, 0, "active"), false);
      assert.equal(isLinkTemporallyVisible(classical, ancient, 0, "active"), false);
    });

    await sub.test("Hidden when one or both endpoints are missing (null/undefined)", () => {
      assert.equal(isLinkTemporallyVisible(null, classical, 2026), false);
      assert.equal(isLinkTemporallyVisible(classical, null, 2026), false);
      assert.equal(isLinkTemporallyVisible(undefined, classical, 2026), false);
      assert.equal(isLinkTemporallyVisible(classical, undefined, 2026), false);
      assert.equal(isLinkTemporallyVisible(null, null, 2026), false);
      assert.equal(isLinkTemporallyVisible(undefined, undefined, 2026), false);
    });
  });

  await t.test("isNodeExtinct helper", () => {
    const living = { origin_year: 0, extinct_year: null };
    const extinct = { origin_year: 0, extinct_year: 500 };

    assert.equal(isNodeExtinct(living, 2026), false);
    assert.equal(isNodeExtinct(extinct, 499), false);
    assert.equal(isNodeExtinct(extinct, 500), true); // boundary: year === extinct_year is extinct
    assert.equal(isNodeExtinct(extinct, 501), true);
    assert.equal(isNodeExtinct(null, 2026), false);
    assert.equal(isNodeExtinct(undefined, 2026), false);
  });

  await t.test("isNodeFuture helper", () => {
    const tradition = { origin_year: 1000 };

    assert.equal(isNodeFuture(tradition, 999), true);
    assert.equal(isNodeFuture(tradition, 1000), false);
    assert.equal(isNodeFuture(tradition, 1001), false);
    assert.equal(isNodeFuture(null, 2026), false);
    assert.equal(isNodeFuture(undefined, 2026), false);
  });
});
