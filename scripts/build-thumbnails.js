// SPDX-License-Identifier: MIT

import { readFile, writeFile, stat, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const GRAPH_FILE = path.join(PROJECT_ROOT, "public", "graph.json");
const ARTIFACTS_DIR = path.join(PROJECT_ROOT, "public", "artifacts");

export function parseArgs(args = process.argv.slice(2)) {
  const options = {
    dryRun: false,
    limit: 0,
    outDir: "",
    skipFrontmatter: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--skip-frontmatter" || arg === "--no-rewrite") {
      options.skipFrontmatter = true;
    } else if (arg === "--limit") {
      options.limit = Number.parseInt(args[++i], 10) || 0;
    } else if (arg.startsWith("--limit=")) {
      options.limit = Number.parseInt(arg.split("=")[1], 10) || 0;
    } else if (arg === "--out-dir") {
      options.outDir = args[++i] || "";
    } else if (arg.startsWith("--out-dir=")) {
      options.outDir = arg.split("=")[1] || "";
    }
  }

  return options;
}

export async function buildThumbnails(cliOptions = {}) {
  const startTime = Date.now();
  const options = { ...parseArgs(), ...cliOptions };
  const projectRoot = options.projectRoot || PROJECT_ROOT;
  const graphPath = options.graphFile || GRAPH_FILE;
  const sourceArtifactsDir = options.artifactsDir || ARTIFACTS_DIR;
  const targetArtifactsDir = options.outDir
    ? path.resolve(projectRoot, options.outDir)
    : sourceArtifactsDir;

  const graphRaw = await readFile(graphPath, "utf8");
  const graph = JSON.parse(graphRaw);

  const allArtifactEntries = [];
  for (const node of graph.nodes) {
    if (!Array.isArray(node.artifacts)) continue;
    for (let index = 0; index < node.artifacts.length; index++) {
      const artifact = node.artifacts[index];
      allArtifactEntries.push({
        nodeId: node.id,
        nodeTitle: node.title,
        sourcePath: node.sourcePath,
        artifactIndex: index,
        artifact,
      });
    }
  }

  const totalInCorpus = allArtifactEntries.length;
  const entriesToProcess = options.limit > 0
    ? allArtifactEntries.slice(0, options.limit)
    : allArtifactEntries;

  let countHighTier = 0;
  let countStandardTier = 0;
  const missingSourceFiles = [];
  const processedItems = [];

  for (const item of entriesToProcess) {
    const { artifact } = item;
    const isHigh = artifact.detail === "high";
    if (isHigh) {
      countHighTier++;
    } else {
      countStandardTier++;
    }

    const currentUrl = artifact.imageUrl || artifact.url || "";
    const originalFilename = path.basename(currentUrl);
    const sourceFilePath = path.join(sourceArtifactsDir, originalFilename);

    if (!existsSync(sourceFilePath)) {
      missingSourceFiles.push({
        nodeId: item.nodeId,
        filename: originalFilename,
        expectedPath: sourceFilePath,
      });
    }

    const parsed = path.parse(originalFilename);
    const targetFilename = `${parsed.name}.webp`;
    const targetFilePath = path.join(targetArtifactsDir, targetFilename);
    const newImageUrl = `/artifacts/${targetFilename}`;
    const targetTierSize = isHigh ? 1600 : 640;

    processedItems.push({
      ...item,
      originalFilename,
      sourceFilePath,
      targetFilename,
      targetFilePath,
      targetTierSize,
      isHigh,
      newImageUrl,
      oldImageUrl: currentUrl,
    });
  }

  console.log("==================================================");
  console.log("OpenGrail Thumbnail Builder");
  console.log("==================================================");
  console.log(`Corpus total artifacts:    ${totalInCorpus}`);
  console.log(`Artifacts to process:      ${processedItems.length}`);
  console.log(`  - 1600px tier (high):    ${countHighTier}`);
  console.log(`  - 640px tier (standard): ${countStandardTier}`);
  console.log(`Source directory:          ${sourceArtifactsDir}`);
  console.log(`Target directory:          ${targetArtifactsDir}`);
  console.log(`Dry run mode:              ${options.dryRun ? "YES (no files written or modified)" : "NO"}`);
  console.log(`Skip frontmatter rewrite:  ${options.skipFrontmatter ? "YES" : "NO"}`);

  if (missingSourceFiles.length > 0) {
    console.error(`\nERROR: ${missingSourceFiles.length} source file(s) missing from disk:`);
    for (const m of missingSourceFiles.slice(0, 10)) {
      console.error(`  - [${m.nodeId}] ${m.filename} -> ${m.expectedPath}`);
    }
    if (missingSourceFiles.length > 10) {
      console.error(`  ... and ${missingSourceFiles.length - 10} more`);
    }
    throw new Error(`Missing ${missingSourceFiles.length} source artifact files in ${sourceArtifactsDir}`);
  }

  if (!options.dryRun && targetArtifactsDir !== sourceArtifactsDir) {
    await mkdir(targetArtifactsDir, { recursive: true });
  }

  let totalInputBytes = 0;
  let totalOutputBytes = 0;

  // Process image conversions
  console.log(`\nEncoding ${processedItems.length} thumbnails...`);

  await Promise.all(
    processedItems.map(async (item) => {
      const { sourceFilePath, targetFilePath, targetTierSize } = item;
      const sourceStat = await stat(sourceFilePath);
      totalInputBytes += sourceStat.size;

      if (options.dryRun) {
        return;
      }

      const image = sharp(sourceFilePath);
      const pipeline = image
        .resize({
          width: targetTierSize,
          height: targetTierSize,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80 });

      await pipeline.toFile(targetFilePath);
      const outStat = await stat(targetFilePath);
      totalOutputBytes += outStat.size;
    }),
  );

  // Frontmatter rewrite if enabled
  let rewrittenFilesCount = 0;
  if (!options.dryRun && !options.skipFrontmatter) {
    console.log("\nRewriting Markdown frontmatter imageUrls under data/...");
    const itemsBySourcePath = new Map();
    for (const item of processedItems) {
      const list = itemsBySourcePath.get(item.sourcePath) || [];
      list.push(item);
      itemsBySourcePath.set(item.sourcePath, list);
    }

    for (const [sourcePathRel, items] of itemsBySourcePath.entries()) {
      const fullPath = path.resolve(projectRoot, sourcePathRel);
      let content = await readFile(fullPath, "utf8");
      let changed = false;

      for (const item of items) {
        const escapedOld = item.oldImageUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(imageUrl:\\s*)(["']?)(${escapedOld})(["']?)`, "g");
        if (regex.test(content)) {
          content = content.replace(regex, (match, prefix, quote1, val, quote2) => {
            const q = quote1 || quote2 || '"';
            return `${prefix}${q}${item.newImageUrl}${q}`;
          });
          changed = true;
        }
      }

      if (changed) {
        await writeFile(fullPath, content, "utf8");
        rewrittenFilesCount++;
      }
    }
    console.log(`Updated frontmatter in ${rewrittenFilesCount} markdown files.`);
  }

  const elapsedMs = Date.now() - startTime;
  const inputMb = (totalInputBytes / (1024 * 1024)).toFixed(2);
  const outputMb = (totalOutputBytes / (1024 * 1024)).toFixed(2);

  console.log("\n==================================================");
  console.log("Summary");
  console.log("==================================================");
  console.log(`Completed in:              ${(elapsedMs / 1000).toFixed(2)}s`);
  console.log(`Input size:                ${inputMb} MB`);
  if (!options.dryRun) {
    console.log(`Output size:               ${outputMb} MB`);
    if (processedItems.length > 0 && totalInCorpus > processedItems.length) {
      const avgBytes = totalOutputBytes / processedItems.length;
      const projectedTotalMb = ((avgBytes * totalInCorpus) / (1024 * 1024)).toFixed(2);
      console.log(`Projected full library:    ~${projectedTotalMb} MB across ${totalInCorpus} files`);
    }
  }
  console.log("==================================================");

  return {
    totalInCorpus,
    processedCount: processedItems.length,
    countHighTier,
    countStandardTier,
    totalInputBytes,
    totalOutputBytes,
    missingSourceFiles,
    elapsedMs,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildThumbnails().catch((err) => {
    console.error("Thumbnail build failed:", err);
    process.exit(1);
  });
}
