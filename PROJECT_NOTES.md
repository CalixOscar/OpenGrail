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

**Status:** In progress — dual-license policy applied; verification and publication remain.
**Task:** Verify the AGPL/commercial licensing transition and publish the updated `main` branch.
**Files touched:** `LICENSE`, `LICENSE-COMMERCIAL.md`, `LICENSE-CONTENT-MIT.md`, `LICENSING.md`, `README.md`, `package.json`, and this note.
**Next step:** Run `npm run build`, commit the licensing transition, and push `main`.
**Gotchas:** The published history through commit `007686a` remains MIT and cannot be relicensed retroactively. `public/graph.json` is generated but intentionally tracked; `node_modules/` and `dist/` are ignored. Do not overwrite the existing mockup image.
**Left by:** Codex (2026-08-27)

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
