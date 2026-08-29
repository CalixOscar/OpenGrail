// SPDX-License-Identifier: MIT

import test from "node:test";
import assert from "node:assert/strict";
import { checkDrift, checkTemplateBuild } from "../scripts/verify-contributor-contract.js";

test("Contributor Contract Suite (Track C Invariants)", async (t) => {
  await t.test("Schema derivation synchronization (no drift between schema.js, template.md, CONTRIBUTING.md, and schema.ts)", async () => {
    await assert.doesNotReject(async () => {
      await checkDrift();
    }, "Schema derivation should not have drifted");
  });

  await t.test("Contributor template builds cleanly into graph", async () => {
    await assert.doesNotReject(async () => {
      await checkTemplateBuild();
    }, "Template tradition file must compile and build cleanly");
  });
});
