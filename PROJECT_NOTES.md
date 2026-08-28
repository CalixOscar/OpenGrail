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

**Status:** None — clean state. Auto-minimize search highlight labels implemented across Brain Cluster and World Map views with search box hover/interaction restore.
**Task:** Auto-minimize search labels feature complete and verified.
**Files touched:** `src/state/AtlasState.tsx`, `src/App.tsx`, `src/components/GraphCanvas.tsx`, `src/components/WorldMapView.tsx`.
**Next step:** Expand deep theological and mythological lore across remaining regional clusters.
**Gotchas:** Maintain zero server dependency. Search match highlight rings remain persistent while labels fade cleanly.
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

### 2026-08-27 — AGPL plus commercial application licensing
New authored application code is dual-licensed under AGPL-3.0-or-later or a separate
OpenGrail Commercial License. The existing MIT release remains valid for historical
commits, while authored atlas data and documentation continue under a separate MIT
content license. This preserves open-source access while creating a path for proprietary
commercial deployments to obtain a direct license.

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

