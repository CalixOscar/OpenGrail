// SPDX-License-Identifier: MIT

import { readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  generateTemplateMarkdown,
  generateContributingMarkdown,
  generateSchemaTypescript,
} from "./schema.js";
import { buildGraph } from "./build-graph.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");

const TEMPLATE_FILE = path.join(PROJECT_ROOT, "data", "_template.md");
const TEST_TRADITION_FILE = path.join(PROJECT_ROOT, "data", "example-tradition.md");
const CONTRIBUTING_FILE = path.join(PROJECT_ROOT, "CONTRIBUTING.md");
const TYPES_SCHEMA_FILE = path.join(PROJECT_ROOT, "src", "types", "schema.ts");

export async function checkDrift() {
  console.log("1. Checking schema derivation synchronization...");

  const currentTemplate = await readFile(TEMPLATE_FILE, "utf8");
  const expectedTemplate = generateTemplateMarkdown();
  if (currentTemplate !== expectedTemplate) {
    throw new Error("data/_template.md has drifted from scripts/schema.js. Run `npm run derive:schema`.");
  }

  const currentContributing = await readFile(CONTRIBUTING_FILE, "utf8");
  const expectedContributing = generateContributingMarkdown(currentContributing);
  if (currentContributing !== expectedContributing) {
    throw new Error("CONTRIBUTING.md frontmatter reference has drifted from scripts/schema.js. Run `npm run derive:schema`.");
  }

  const currentTypesSchema = await readFile(TYPES_SCHEMA_FILE, "utf8");
  const expectedTypesSchema = generateSchemaTypescript();
  if (currentTypesSchema !== expectedTypesSchema) {
    throw new Error("src/types/schema.ts has drifted from scripts/schema.js. Run `npm run derive:schema`.");
  }

  console.log("   ✓ All derived artifacts match scripts/schema.js exactly.");
}

export async function checkTemplateBuild() {
  console.log("2. Testing contributor template compilation...");
  
  const templateSource = await readFile(TEMPLATE_FILE, "utf8");
  
  // Verify copying data/_template.md to data/example-tradition.md
  // with id: example-tradition and relation target: christianity
  let testContent = templateSource;
  testContent = testContent.replace(/^id:\s*.+$/m, "id: example-tradition");
  testContent = testContent.replace(/target:\s*.+$/m, "target: christianity");

  try {
    await writeFile(TEST_TRADITION_FILE, testContent, "utf8");
    console.log("   Created temporary test file data/example-tradition.md");

    // Run buildGraph with the template file present (574 nodes)
    await buildGraph();
    console.log("   ✓ data/example-tradition.md built and passed all validation checks cleanly.");
  } finally {
    try {
      await unlink(TEST_TRADITION_FILE);
      console.log("   Cleaned up temporary test file data/example-tradition.md");
    } catch {
      // Ignore if already deleted
    }
  }

  // Restore canonical 573-node graph.json
  await buildGraph();
  console.log("   ✓ Restored canonical graph.json (573 nodes).");
}

export async function verifyContributorContract() {
  console.log("=== Running Track C Contributor Contract Verification ===");
  await checkDrift();
  await checkTemplateBuild();
  console.log("=== Track C Verification Passed! ===");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  verifyContributorContract().catch((err) => {
    console.error("Contributor contract verification FAILED:", err);
    process.exit(1);
  });
}
