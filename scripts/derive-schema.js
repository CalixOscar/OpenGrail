// SPDX-License-Identifier: MIT

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  generateTemplateMarkdown,
  generateContributingMarkdown,
  generateSchemaTypescript,
} from "./schema.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");

const TEMPLATE_FILE = path.join(PROJECT_ROOT, "data", "_template.md");
const CONTRIBUTING_FILE = path.join(PROJECT_ROOT, "CONTRIBUTING.md");
const TYPES_SCHEMA_FILE = path.join(PROJECT_ROOT, "src", "types", "schema.ts");

export async function deriveAllArtifacts() {
  // 1. Derive data/_template.md
  const templateContent = generateTemplateMarkdown();
  await writeFile(TEMPLATE_FILE, templateContent, "utf8");
  console.log(`Derived ${path.relative(PROJECT_ROOT, TEMPLATE_FILE)}`);

  // 2. Derive CONTRIBUTING.md
  let existingContributing = "";
  try {
    existingContributing = await readFile(CONTRIBUTING_FILE, "utf8");
  } catch {
    // File may not exist yet
  }
  const contributingContent = generateContributingMarkdown(existingContributing);
  await writeFile(CONTRIBUTING_FILE, contributingContent, "utf8");
  console.log(`Derived ${path.relative(PROJECT_ROOT, CONTRIBUTING_FILE)}`);

  // 3. Derive src/types/schema.ts
  const schemaTypesContent = generateSchemaTypescript();
  await writeFile(TYPES_SCHEMA_FILE, schemaTypesContent, "utf8");
  console.log(`Derived ${path.relative(PROJECT_ROOT, TYPES_SCHEMA_FILE)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  deriveAllArtifacts().catch((err) => {
    console.error("Failed to derive schema artifacts:", err);
    process.exit(1);
  });
}
