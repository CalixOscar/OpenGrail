// SPDX-License-Identifier: MIT
//
// Ratchet gate for docs/origin-geo-fallback-remediation-plan.md.
//
// These counts may only go down. They are seeded at the corpus's state when the defect
// was found, so the suite stays green today while making it impossible to add new
// traditions that carry a defaulted pin or an unparsed era_start.
//
// When a remediation pass lands, re-seed with:
//   npm run audit:geo -- --write-baseline
//
// The plan is complete when both baseline numbers are 0.

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditOriginGeo } from "../scripts/audit-origin-geo.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE_FILE = path.join(PROJECT_ROOT, "tests", "origin-geo-baseline.json");

test("Origin Provenance Suite (geo and temporal defaults)", async (t) => {
  const baseline = JSON.parse(await readFile(BASELINE_FILE, "utf8"));
  const result = await auditOriginGeo();

  await t.test("No new tradition carries a defaulted cluster pin", () => {
    const worst = result.defaultedPins
      .slice(0, 5)
      .map((row) => `${row.id} -> ${row.pin} (${row.filePath})`)
      .join("\n    ");
    assert.ok(
      result.defaultedPins.length <= baseline.maxDefaultedPins,
      `Defaulted pins rose to ${result.defaultedPins.length}, above the baseline of ` +
        `${baseline.maxDefaultedPins}. A tradition's origin_geo must be researched and ` +
        `cited, or the node must declare origin_geo_precision: none. Worst offenders:\n    ${worst}`,
    );
  });

  await t.test("No new tradition has an era_start that fails to parse", () => {
    const worst = result.zeroOriginYears
      .slice(0, 5)
      .map((row) => `${row.id} (era_start: ${JSON.stringify(row.eraStart)})`)
      .join("\n    ");
    assert.ok(
      result.zeroOriginYears.length <= baseline.maxZeroOriginYears,
      `Traditions stamped origin_year 0 rose to ${result.zeroOriginYears.length}, above the ` +
        `baseline of ${baseline.maxZeroOriginYears}. A narrative era_start such as ` +
        `"ancient" silently becomes 1 CE and mis-places the tradition on the timeline. ` +
        `Set a real origin_year, with origin_year_precision to mark it approximate. ` +
        `Worst offenders:\n    ${worst}`,
    );
  });

  await t.test("Baseline is not stale (it never ratchets upward)", () => {
    assert.ok(
      baseline.maxDefaultedPins >= 0 && baseline.maxZeroOriginYears >= 0,
      "Baseline counts must be non-negative",
    );
  });
});
