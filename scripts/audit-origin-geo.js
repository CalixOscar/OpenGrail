// SPDX-License-Identifier: MIT
//
// Read-only audit of geographic and temporal provenance across data/.
//
// Reports two defects, both described in docs/origin-geo-fallback-remediation-plan.md:
//
//   1. Defaulted pins  - a tradition whose origin_geo is not researched, but is the
//                        cluster-wide fallback that scripts/enrich-all-locations.js
//                        applies when its id/path matcher finds nothing.
//   2. Zero origin_year - a tradition whose era_start did not parse, leaving it stamped
//                        at 1 CE and mis-placed on the timeline scrubber.
//
// Usage:
//   node scripts/audit-origin-geo.js            report
//   node scripts/audit-origin-geo.js --check    exit 1 if either count exceeds the baseline
//   node scripts/audit-origin-geo.js --write-baseline
//
// This script never writes to data/. Do not "fix" a finding by re-running
// enrich-all-locations.js; that re-applies the very fallback being reported.

import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { resolveLocation } from "./enrich-all-locations.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const GRAPH_FILE = path.join(PROJECT_ROOT, "public", "graph.json");
const BASELINE_FILE = path.join(PROJECT_ROOT, "tests", "origin-geo-baseline.json");

async function findMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return findMarkdownFiles(fullPath);
      return entry.isFile() && entry.name.endsWith(".md") ? [fullPath] : [];
    }),
  );
  return files.flat();
}

async function degreeByNodeId() {
  try {
    const graph = JSON.parse(await readFile(GRAPH_FILE, "utf8"));
    const degree = {};
    for (const link of graph.links ?? []) {
      const source = link.source?.id ?? link.source;
      const target = link.target?.id ?? link.target;
      degree[source] = (degree[source] ?? 0) + 1;
      degree[target] = (degree[target] ?? 0) + 1;
    }
    return degree;
  } catch {
    // graph.json is generated; auditing before a build is allowed, just less informative.
    return {};
  }
}

export async function auditOriginGeo() {
  const files = await findMarkdownFiles(DATA_DIR);
  const degree = await degreeByNodeId();

  const defaultedPins = [];
  const zeroOriginYears = [];

  for (const filePath of files) {
    const { data } = matter(await readFile(filePath, "utf8"));
    if (!data?.id) continue;

    const relPath = path.relative(PROJECT_ROOT, filePath);

    // A node opts out of having a pin at all; that is a decision, not a defect.
    const optedOut = data.origin_geo_precision === "none";
    const fallback = resolveLocation(data, filePath);
    if (
      !optedOut &&
      fallback?.isClusterFallback &&
      data.origin_geo?.place_name === fallback.place_name
    ) {
      defaultedPins.push({
        id: data.id,
        cluster: data.cluster ?? "(none)",
        pin: fallback.place_name,
        degree: degree[data.id] ?? 0,
        filePath: relPath,
      });
    }

    // origin_year 0 is only ever a parse failure unless explicitly acknowledged.
    if (data.origin_year === 0 && !data.origin_year_precision) {
      zeroOriginYears.push({
        id: data.id,
        cluster: data.cluster ?? "(none)",
        eraStart: data.era_start ?? "(missing)",
        filePath: relPath,
      });
    }
  }

  defaultedPins.sort((a, b) => b.degree - a.degree || a.id.localeCompare(b.id));
  zeroOriginYears.sort((a, b) => a.id.localeCompare(b.id));

  return { total: files.length, defaultedPins, zeroOriginYears };
}

function groupCount(rows, key) {
  const counts = {};
  for (const row of rows) counts[row[key]] = (counts[row[key]] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function report(result) {
  const { total, defaultedPins, zeroOriginYears } = result;

  console.log(`\nOrigin-geo audit over ${total} traditions\n`);

  console.log(`Defaulted pins: ${defaultedPins.length}`);
  for (const [cluster, count] of groupCount(defaultedPins, "cluster")) {
    console.log(`  ${String(count).padStart(4)}  ${cluster}`);
  }
  if (defaultedPins.length) {
    console.log("\n  Highest-degree offenders (these distort the globe most):");
    for (const row of defaultedPins.slice(0, 10)) {
      console.log(`    ${String(row.degree).padStart(3)} links  ${row.id} -> ${row.pin}`);
    }
  }

  console.log(`\nUnparsed era_start (origin_year 0): ${zeroOriginYears.length}`);
  for (const row of zeroOriginYears.slice(0, 10)) {
    console.log(`    ${row.id}  era_start: ${JSON.stringify(row.eraStart)}`);
  }
  if (zeroOriginYears.length > 10) {
    console.log(`    ... and ${zeroOriginYears.length - 10} more`);
  }
  console.log("");
}

async function readBaseline() {
  return JSON.parse(await readFile(BASELINE_FILE, "utf8"));
}

async function main() {
  const args = process.argv.slice(2);
  const result = await auditOriginGeo();
  report(result);

  if (args.includes("--write-baseline")) {
    const baseline = {
      _comment:
        "Ratchet for docs/origin-geo-fallback-remediation-plan.md. These numbers may only " +
        "go down. Regenerate with: npm run audit:geo -- --write-baseline. The plan is " +
        "complete when both are 0.",
      generated: new Date().toISOString().slice(0, 10),
      maxDefaultedPins: result.defaultedPins.length,
      maxZeroOriginYears: result.zeroOriginYears.length,
    };
    await writeFile(BASELINE_FILE, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
    console.log(`Wrote baseline to ${path.relative(PROJECT_ROOT, BASELINE_FILE)}\n`);
    return;
  }

  if (args.includes("--check")) {
    const baseline = await readBaseline();
    const failures = [];
    if (result.defaultedPins.length > baseline.maxDefaultedPins) {
      failures.push(
        `Defaulted pins rose to ${result.defaultedPins.length} (baseline ${baseline.maxDefaultedPins}).`,
      );
    }
    if (result.zeroOriginYears.length > baseline.maxZeroOriginYears) {
      failures.push(
        `Unparsed era_start rose to ${result.zeroOriginYears.length} (baseline ${baseline.maxZeroOriginYears}).`,
      );
    }
    if (failures.length) {
      console.error(`FAIL\n  ${failures.join("\n  ")}\n`);
      process.exitCode = 1;
      return;
    }
    console.log("OK - no regression against baseline.\n");
  }
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
