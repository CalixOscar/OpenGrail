---
project: "OpenGrail"
path: "/Users/calmdownoscar/Documents/Projects/OpenGrail"
type: web
created: 2026-08-27
tags: [second-brain, project]
---

# OpenGrail

## Overview

Open-source, static-first visual atlas for comparative religion, theology, and ancient
mythology. A Vite + React + TypeScript interface reads a generated `public/graph.json`
from 536 Markdown source records under `data/`. The atlas has 805 relationships across
ten clusters, nested `branch_of` navigation, epistemic-tier filters, fuzzy alias search,
Markdown document panes, backlinks, and a force-directed Canvas graph. No backend,
analytics, trackers, or AI service is required.

## Handoff (current unfinished work — check this FIRST, before anything else)
<!-- Agents: overwrite this block in place when work is unfinished. Decisions Log and
Session Log are append-only. Check git log/status/diff in the destination repo; the repo
is ground truth if this note ever disagrees with it. -->

**Status:** Ready — Full MIT open source transition, deep linking, community contribution workflow, and README overhaul completed and verified.
**Task:** Open source transition to 100% MIT, add deep linking URL hash state, create CONTRIBUTING.md, and overhaul README for GitHub discoverability.
**Files touched:** `LICENSE`, `package.json`, `README.md`, `CONTRIBUTING.md`, `data/_template.md`, `src/state/AtlasState.tsx`, `scripts/build-graph.js`, all 17 source/script SPDX headers, `PROJECT_NOTES.md`.
**Next step:** Sync to deployment repo and push to GitHub.
**Gotchas:** `findMarkdownFiles` in `scripts/build-graph.js` skips any `.md` file starting with `_` to keep `data/_template.md` out of compiled `public/graph.json`.
**Left by:** Antigravity (2026-08-28)

## Decisions Log
<!-- Append dated decisions below. Keep entries short; put detailed plans in repo docs. -->

### 2026-08-27 — Markdown source of truth
The individual files under `data/` remain the editable source of truth. `scripts/build-graph.js`
validates frontmatter, resolves links, computes backlinks, and deterministically regenerates
`public/graph.json` so the UI never needs a server-side content layer.

### 2026-08-27 — Editorial prominence is not population
Node size combines graph connections with the optional `display_weight` field. It is a
visual hierarchy aid for umbrella traditions and major branches, not an estimate of
adherent population or a ranking of religious importance.

### 2026-08-27 — Open-source license
The project uses the MIT License for the authored application, source data, and documentation
to match the open-source brief. This can be replaced with a different license before future
releases if the founder wants separate code/data terms.

### 2026-08-27 — Static-first and privacy-preserving web
The app remains a local/static web experience with no custom backend, trackers, analytics,
remote font dependency, or account system. This keeps the atlas portable and limits data
collection by design.

### 2026-08-28 — Exact-source curated visual artifact overhaul
Replaced all legacy scraper imagery with a curator-directed Wikimedia Commons discovery and
verification pipeline (`scripts/curate-iconic-artifacts.js` and `scripts/audit-artifacts.js`).
Every tradition defines exactly two curated query specifications (Slot 1: iconography/deity/founder;
Slot 2: sanctuary/manuscript/ritual artifact) backed by exact `https://commons.wikimedia.org/wiki/File:`
links, verified permissive licensing (Public domain, CC0, CC-BY, CC-BY-SA), strict JPEG/PNG raster
integrity, and zero placeholder boilerplate.

## Session Log
<!-- Append a dated summary at the end of each significant session. -->

### 2026-08-27 — Atlas expansion and consolidation preparation
Expanded the atlas from 332 to 536 records, adding Abrahamic branches, Dharmic schools,
ancient Near Eastern and Mediterranean traditions, Iranian and European reconstructions,
East Asian movements, African and Indigenous traditions, Oceanic traditions, and modern
esoteric or fiction-derived movements. The production build passed with 536 nodes and 805
links; relationship audits found no duplicate IDs, broken targets, isolated nodes, or
branch cycles. Search and parent/backlink navigation were browser-checked. The next step is
to consolidate the project under `Documents/Projects/OpenGrail` and publish it.

### 2026-08-27 — Consolidation paused by host permissions
The production build still passes after creating the project guidance and MIT license, but
the host rejected the cross-folder move and cannot create `.git/index.lock` for a local
commit. The destination `TheoGraph.png` remains untouched. Resume by granting filesystem
write access to the destination and Git metadata, then re-authenticate GitHub CLI before
creating and pushing the public `OpenGrail` repository.

### 2026-08-27 — Project consolidated under OpenGrail root
Moved the complete project from `Documents/ChatGPT/TheoGraph` into
`Documents/Projects/OpenGrail` and preserved the existing `TheoGraph.png` mockup. The
destination contains 536 Markdown data records, the React/Vite app, generated graph,
project guidance, and ignored local dependencies. The destination is now the canonical
working and Git root; only GitHub authentication and publication remained at the time.

### 2026-08-27 — GitHub publication completed
Committed the consolidated project on `main` and published it as the public repository
`https://github.com/CalixOscar/OpenGrail`. The production build passed immediately before
publication, and `main` now tracks `origin/main`.

### 2026-08-27 — AGPL and commercial licensing policy published
Added the full AGPL-3.0-or-later text for new application code, SPDX headers across the
authored app/build sources, a separate OpenGrail Commercial License, and an MIT content
license for the authored atlas data and documentation. Updated the README and package
metadata, verified `npm run build`, and pushed commit `b3b53f5` to `main`. Historical MIT
permissions through `007686a` remain explicitly preserved.

### 2026-08-28 — Philosophical & Ethical Systems cluster
Added the 11th cluster (`Philosophical & Ethical Systems`, `#38bdf8`) to model the evolution
of human moral philosophy (Ma'at, Hammurabi, Ubuntu, Ahimsa, Confucianism, Aristotle, Stoicism,
Islamic Akhlaq, Kantian Deontology, Utilitarianism, Universal Human Rights).

### 2026-08-28 — Full-corpus search & community feedback
Upgraded search ranking from simple title match to an 8-tier weighted index covering scriptures,
theological tenets, places, artifacts, and full markdown content. Added static-compatible community
accuracy voting (localStorage) and correction drawer with GitHub Issue and mailto integration.
Added archival watermark seal for screen reading and high-resolution print/PDF exports.

### 2026-08-28 — Global regional pillars and ethical expansion
Integrated 19 regional pillars across the Ancient Americas, Africa, Sahara, Central Asia,
Siberia, and Mainland Southeast Asia with verified coordinates, texts, and 38 authentic artifacts.
Corrected coordinates for Lalibela (Ethiopian Orthodoxy) and Mount Kailash (Bön). Built the
complete Philosophical & Ethical Systems cluster with 11 foundational moral philosophy pillars.
Production build verified at 573 nodes and 903 links, and deployed live to `calmdownoscar.com/opengrail`.

### 2026-08-28 — Auto-minimize search highlight labels
Implemented 4-second auto-fade timer for search match text boxes on both Brain Cluster graph
and 3D World Map views. Search match rings persist for location identification, and text boxes
instantly restore when hovering over or focusing the search box. Cleaned up on node selection.

### 2026-08-28 — Iconic artifact curation handoff
Audited the 573-record corpus and found 141 missing image references, 121 mislabeled raster
files, 974 boilerplate artifact descriptions, and 48 orphan assets. Added curator-directed
Wikimedia Commons query manifests for all 181 Abrahamic and 123 Dharmic records, plus a new
staging/apply pipeline that preserves every non-artifact frontmatter/body byte, validates exact
Commons File pages, licenses, MIME, dimensions, and prohibited-content patterns, and creates an
offline artifact audit. The non-Abrahamic/non-Dharmic manifest is only partially generated;
Antigravity should complete it, visually review staged selections, apply the replacement, remove
untracked conflict copies, rebuild the graph, and verify the production build.

### 2026-08-28 — Background stage watermark branding
Added a faint, deep shaded blue watermark behind both the interactive Brain Cluster force graph
and the 3D World Map orthographic globe. Configured large typography ("OpenGrail" at ~100px font size)
with a right-aligned byline below ("by calmdownoscar") with non-intrusive pointer-events: none,
subtle text glow, and transparent canvas backgrounds. Verified build passes and clean graph invariants.

### 2026-08-28 — Complete 1,146 iconic artifact overhaul across all 573 traditions
Completed query manifests for all 269 non-Abrahamic / non-Dharmic traditions, bringing full
manifest coverage to 573/573 tracked records (1,146 slots). Enhanced pipeline validation with
strict JPEG/PNG byte-level MIME checks, expanded subject heuristics, and download rate-limiting.
Discovered, staged, and verified all 1,146 assets. Isolated untracked duplicate conflict files,
applied frontmatter `artifacts:` updates across all 573 Markdown traditions without modifying
surrounding content, and verified clean passes across `scripts/audit-artifacts.js`, `build:graph`
(573 nodes, 903 links), and `vite build`.

### 2026-08-28 — Full MIT open-source transition, deep linking & GitHub readiness
Transitioned project from dual AGPL/commercial licensing to 100% standard MIT across the codebase,
documentation, and metadata. Removed legacy commercial and internal handoff files. Updated SPDX
headers across all 17 source/script files. Added bidirectional URL deep linking (`#tradition=id&view=map|brain`)
supporting direct node focus and browser history navigation. Created `CONTRIBUTING.md` and `data/_template.md`
for open community contributions. Rewrote `README.md` with badges, live demo links, comprehensive
feature overviews, and acknowledgements crediting Simon E. Davies / Mythopia (*The Great Tree of Religion*).
Production build verified cleanly at 573 nodes, 11 clusters, and 903 links.

