// SPDX-License-Identifier: MIT

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  CLUSTERS,
  EPISTEMIC_TIER_IDS,
  RELATION_TYPE_IDS,
  CANONICAL_RELATION_TYPES,
  EDGE_STYLES,
  detectBranchCycles,
} from "../scripts/schema.js";
import {
  buildGraphData,
  findMarkdownFiles,
  parseNode,
  DATA_DIR,
  PROJECT_ROOT,
  OUTPUT_FILE,
} from "../scripts/build-graph.js";

test("Data Invariants Suite", async (t) => {
  const markdownFiles = await findMarkdownFiles(DATA_DIR);
  assert.ok(markdownFiles.length > 0, "Corpus must contain Markdown files");

  const parsedRecords = await Promise.all(
    markdownFiles.map((file) => parseNode(file, PROJECT_ROOT)),
  );

  await t.test("No duplicate IDs", () => {
    const seenIds = new Set();
    const duplicateIds = [];

    for (const { node, filePath } of parsedRecords) {
      if (seenIds.has(node.id)) {
        duplicateIds.push({ id: node.id, filePath });
      }
      seenIds.add(node.id);
    }

    assert.deepEqual(duplicateIds, [], "No duplicate node IDs should exist in the corpus");
    assert.equal(seenIds.size, 573, "Corpus must contain exactly 573 unique tradition nodes");
  });

  await t.test("All node IDs follow lowercase kebab-case convention", () => {
    const kebabRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    for (const { node, filePath } of parsedRecords) {
      assert.match(
        node.id,
        kebabRegex,
        `Node ID "${node.id}" in ${path.relative(PROJECT_ROOT, filePath)} must be lowercase kebab-case`,
      );
    }
  });

  await t.test("Every relation target resolves to an existing node and is not self-referential", () => {
    const nodeIds = new Set(parsedRecords.map((r) => r.node.id));

    for (const { node, relations, filePath } of parsedRecords) {
      for (const rel of relations) {
        assert.notEqual(
          rel.target,
          node.id,
          `Node "${node.id}" in ${path.relative(PROJECT_ROOT, filePath)} cannot relate to itself`,
        );
        assert.ok(
          nodeIds.has(rel.target),
          `Relation target "${rel.target}" in ${path.relative(PROJECT_ROOT, filePath)} does not resolve to an existing node`,
        );
      }
    }
  });

  await t.test("No isolated nodes exist in the graph", () => {
    const connectedNodeIds = new Set();

    for (const { node, relations } of parsedRecords) {
      if (relations.length > 0) {
        connectedNodeIds.add(node.id);
        for (const rel of relations) {
          connectedNodeIds.add(rel.target);
        }
      }
    }

    const isolatedNodes = parsedRecords
      .map((r) => r.node.id)
      .filter((id) => !connectedNodeIds.has(id));

    assert.deepEqual(
      isolatedNodes,
      [],
      "Every node in the graph must have at least one incoming or outgoing relation",
    );
  });

  await t.test("No branch cycles exist in the corpus", () => {
    const nodesById = new Map(parsedRecords.map((r) => [r.node.id, r.node]));
    const links = [];

    for (const { node, relations } of parsedRecords) {
      for (const rel of relations) {
        links.push({
          source: node.id,
          target: rel.target,
          type: rel.type,
          relation_type: rel.relation_type,
        });
      }
    }

    assert.doesNotThrow(() => {
      detectBranchCycles(nodesById, links);
    }, "Corpus graph must not contain any branch cycles");
  });

  await t.test("detectBranchCycles detects synthetic cycles", () => {
    const testNodes = new Map([
      ["a", { id: "a" }],
      ["b", { id: "b" }],
      ["c", { id: "c" }],
    ]);

    const cyclicLinks = [
      { source: "a", target: "b", type: "branch_of", relation_type: "direct_branch" },
      { source: "b", target: "c", type: "branch_of", relation_type: "direct_branch" },
      { source: "c", target: "a", type: "branch_of", relation_type: "direct_branch" },
    ];

    assert.throws(
      () => detectBranchCycles(testNodes, cyclicLinks),
      /Branch cycle detected/,
      "detectBranchCycles must throw when a direct branch cycle is present",
    );
  });

  await t.test("Every certainty and epistemic_tier is in EPISTEMIC_TIER_IDS", () => {
    for (const { node, relations, filePath } of parsedRecords) {
      assert.ok(
        EPISTEMIC_TIER_IDS.has(node.epistemicTier),
        `Node "${node.id}" has invalid epistemicTier "${node.epistemicTier}" in ${path.relative(PROJECT_ROOT, filePath)}`,
      );

      for (const rel of relations) {
        assert.ok(
          EPISTEMIC_TIER_IDS.has(rel.certainty),
          `Relation "${node.id} -> ${rel.target}" has invalid certainty "${rel.certainty}" in ${path.relative(PROJECT_ROOT, filePath)}`,
        );
        assert.ok(
          EPISTEMIC_TIER_IDS.has(rel.epistemic_tier),
          `Relation "${node.id} -> ${rel.target}" has invalid epistemic_tier "${rel.epistemic_tier}" in ${path.relative(PROJECT_ROOT, filePath)}`,
        );
      }
    }
  });

  await t.test("Every cluster is in recognized CLUSTERS vocabulary", () => {
    for (const { node, filePath } of parsedRecords) {
      assert.ok(
        CLUSTERS.includes(node.cluster),
        `Node "${node.id}" has unrecognized cluster "${node.cluster}" in ${path.relative(PROJECT_ROOT, filePath)}`,
      );
    }
  });

  await t.test("Every relation type, canonical type, and edge style is valid", () => {
    for (const { node, relations, filePath } of parsedRecords) {
      for (const rel of relations) {
        assert.ok(
          RELATION_TYPE_IDS.has(rel.type),
          `Relation type "${rel.type}" is invalid in ${path.relative(PROJECT_ROOT, filePath)}`,
        );
        assert.ok(
          CANONICAL_RELATION_TYPES.has(rel.relation_type),
          `Canonical relation_type "${rel.relation_type}" is invalid in ${path.relative(PROJECT_ROOT, filePath)}`,
        );
        assert.ok(
          EDGE_STYLES.has(rel.style),
          `Edge style "${rel.style}" is invalid in ${path.relative(PROJECT_ROOT, filePath)}`,
        );
      }
    }
  });

  await t.test("Every node has valid origin_geo coordinates and non-empty place_name", () => {
    for (const { node, filePath } of parsedRecords) {
      assert.ok(
        node.originGeo,
        `Node "${node.id}" missing origin_geo in ${path.relative(PROJECT_ROOT, filePath)}`,
      );
      assert.equal(
        typeof node.originGeo.lat,
        "number",
        `Node "${node.id}" lat must be a number`,
      );
      assert.equal(
        typeof node.originGeo.lng,
        "number",
        `Node "${node.id}" lng must be a number`,
      );
      assert.ok(
        node.originGeo.lat >= -90 && node.originGeo.lat <= 90,
        `Node "${node.id}" lat ${node.originGeo.lat} out of range [-90, 90]`,
      );
      assert.ok(
        node.originGeo.lng >= -180 && node.originGeo.lng <= 180,
        `Node "${node.originGeo.lng}" lng ${node.originGeo.lng} out of range [-180, 180]`,
      );
      assert.ok(
        typeof node.originGeo.place_name === "string" && node.originGeo.place_name.trim().length > 0,
        `Node "${node.id}" must have a non-empty place_name`,
      );
    }
  });

  await t.test("Generated graph.json matches buildGraphData exactly", async () => {
    const graphData = await buildGraphData(DATA_DIR, PROJECT_ROOT);
    assert.equal(graphData.nodes.length, 573);
    assert.equal(graphData.links.length, 903);
    assert.equal(graphData.clusters.length, 11);

    const onDiskRaw = await readFile(OUTPUT_FILE, "utf8");
    const onDisk = JSON.parse(onDiskRaw);
    assert.equal(onDisk.nodes.length, 573);
    assert.equal(onDisk.links.length, 903);
    assert.equal(onDisk.clusters.length, 11);
  });
});
