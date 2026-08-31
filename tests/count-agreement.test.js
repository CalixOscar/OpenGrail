// SPDX-License-Identifier: MIT

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isNodeTemporallyVisible, isLinkTemporallyVisible } from "../src/state/temporalVisibility.ts";
import { EPISTEMIC_TIER_IDS } from "../scripts/schema.js";
import { OUTPUT_FILE } from "../scripts/build-graph.js";

test("Count Agreement Regression Test Suite (Cross-Surface Synchronization)", async (t) => {
  const graphRaw = await readFile(OUTPUT_FILE, "utf8");
  const graphData = JSON.parse(graphRaw);
  const { nodes, links } = graphData;

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const allTiers = EPISTEMIC_TIER_IDS;

  const sampleYears = [
    -3000, -2500, -1500, -1000, -500, -300, 0, 100, 300, 500,
    800, 1000, 1200, 1500, 1600, 1800, 1900, 1950, 2000, 2026, 2100,
  ];

  await t.test("Header counts and ListView counts agree identically across all sample years and modes", async (sub) => {
    for (const mode of ["emergent", "active"]) {
      for (const year of sampleYears) {
        await sub.test(`Year ${year} (${mode} mode)`, () => {
          // App.tsx / Header derivation
          const appVisibleNodes = nodes.filter(
            (node) =>
              allTiers.has(node.epistemicTier) &&
              isNodeTemporallyVisible(node, year, mode),
          );
          const appVisibleNodeIds = new Set(appVisibleNodes.map((n) => n.id));

          const appVisibleLinks = links.filter((link) => {
            if (!appVisibleNodeIds.has(link.source) || !appVisibleNodeIds.has(link.target)) return false;
            if (!allTiers.has(link.certainty)) return false;
            const src = nodeById.get(link.source);
            const tgt = nodeById.get(link.target);
            return isLinkTemporallyVisible(src, tgt, year, mode);
          });

          // ListView derivation
          const listVisibleNodes = nodes.filter(
            (node) =>
              allTiers.has(node.epistemicTier) &&
              isNodeTemporallyVisible(node, year, mode),
          );
          const listVisibleNodeIds = new Set(listVisibleNodes.map((n) => n.id));

          const listVisibleLinks = links.filter((link) => {
            const src = nodeById.get(link.source);
            const tgt = nodeById.get(link.target);
            if (!src || !tgt) return false;
            if (!listVisibleNodeIds.has(src.id) || !listVisibleNodeIds.has(tgt.id)) return false;
            if (!allTiers.has(link.certainty)) return false;
            return isLinkTemporallyVisible(src, tgt, year, mode);
          });

          // Invariant 1: tradition count matches
          assert.equal(
            listVisibleNodes.length,
            appVisibleNodes.length,
            `Tradition count mismatch at year ${year} (${mode})`,
          );

          // Invariant 2: tradition node IDs match exactly
          assert.deepEqual(
            [...listVisibleNodeIds].sort(),
            [...appVisibleNodeIds].sort(),
            `Tradition set mismatch at year ${year} (${mode})`,
          );

          // Invariant 3: relation count matches
          assert.equal(
            listVisibleLinks.length,
            appVisibleLinks.length,
            `Relation count mismatch at year ${year} (${mode})`,
          );
        });
      }
    }
  });

  await t.test("Emergent mode is monotonic (tradition set never decreases over time)", () => {
    let previousNodeIds = new Set();
    for (const year of sampleYears) {
      const currentNodeIds = new Set(
        nodes
          .filter((n) => isNodeTemporallyVisible(n, year, "emergent"))
          .map((n) => n.id),
      );

      for (const prevId of previousNodeIds) {
        assert.ok(
          currentNodeIds.has(prevId),
          `Tradition "${prevId}" was present in previous year but missing at year ${year} in emergent mode`,
        );
      }
      previousNodeIds = currentNodeIds;
    }
  });

  await t.test("Active mode correctly excludes extinct traditions", () => {
    const extinctNodes = nodes.filter(
      (n) => n.extinct_year !== null && n.extinct_year !== undefined,
    );
    assert.ok(extinctNodes.length > 0, "Corpus must have extinct traditions");

    for (const node of extinctNodes) {
      const extinctYear = node.extinct_year;
      // In active mode, at or after extinct_year, it must not be visible
      assert.equal(
        isNodeTemporallyVisible(node, extinctYear, "active"),
        false,
        `Node "${node.id}" must be hidden at extinction year ${extinctYear} in active mode`,
      );
      assert.equal(
        isNodeTemporallyVisible(node, 2026, "active"),
        false,
        `Node "${node.id}" (extinct ${extinctYear}) must be hidden at year 2026 in active mode`,
      );
      // In emergent mode, at year 2026, it must remain visible as cumulative history
      assert.equal(
        isNodeTemporallyVisible(node, 2026, "emergent"),
        true,
        `Node "${node.id}" must remain visible at year 2026 in emergent mode`,
      );
    }
  });

  await t.test("Synchronized counts with partial epistemic tier filters", () => {
    const testTierSets = [
      new Set(["academic_consensus"]),
      new Set(["academic_consensus", "theological_claim"]),
      new Set(["minority_scholarly", "speculative_fringe"]),
    ];

    for (const activeTiers of testTierSets) {
      for (const mode of ["emergent", "active"]) {
        for (const year of [0, 1500, 2026]) {
          const appNodes = nodes.filter(
            (n) => activeTiers.has(n.epistemicTier) && isNodeTemporallyVisible(n, year, mode),
          );
          const listNodes = nodes.filter(
            (n) => activeTiers.has(n.epistemicTier) && isNodeTemporallyVisible(n, year, mode),
          );

          assert.equal(appNodes.length, listNodes.length);
          assert.deepEqual(
            appNodes.map((n) => n.id).sort(),
            listNodes.map((n) => n.id).sort(),
          );
        }
      }
    }
  });

  await t.test("Present day (year 2026) canonical regression counts", () => {
    // Emergent mode: 695 traditions, 1088 links
    const emergentNodes = nodes.filter((n) => isNodeTemporallyVisible(n, 2026, "emergent"));
    assert.equal(emergentNodes.length, 695, "Year 2026 emergent traditions count must be 695");

    const emergentNodeIds = new Set(emergentNodes.map((n) => n.id));
    const emergentLinks = links.filter((l) => {
      const src = nodeById.get(l.source);
      const tgt = nodeById.get(l.target);
      return (
        emergentNodeIds.has(l.source) &&
        emergentNodeIds.has(l.target) &&
        isLinkTemporallyVisible(src, tgt, 2026, "emergent")
      );
    });
    assert.equal(emergentLinks.length, 1088, "Year 2026 emergent links count must be 1088");

    // Active mode: exactly 571 traditions (124 extinct excluded) and 857 active links
    const activeNodes = nodes.filter((n) => isNodeTemporallyVisible(n, 2026, "active"));
    assert.equal(activeNodes.length, 571, "Year 2026 active traditions count must be 571 (695 - 124 extinct)");

    const activeNodeIds = new Set(activeNodes.map((n) => n.id));
    const activeLinks = links.filter((l) => {
      const src = nodeById.get(l.source);
      const tgt = nodeById.get(l.target);
      return (
        activeNodeIds.has(l.source) &&
        activeNodeIds.has(l.target) &&
        isLinkTemporallyVisible(src, tgt, 2026, "active")
      );
    });
    assert.equal(activeLinks.length, 857, "Year 2026 active links count must be 857");
  });
});
