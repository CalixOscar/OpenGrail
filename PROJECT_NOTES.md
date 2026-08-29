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

**Status:** Sprint 01 complete. Track F item 5 (keyboard-only browser smoke test) complete. 90 tests green (verified: npm run verify 2026-08-30).
**Task:** All Sprint 01 remediation tracks (A, C, D, E, F) complete and verified.
**Files touched:** `tests/keyboard-smoke.test.js` (new), `PROJECT_NOTES.md`.
**Next step:** Sprint 01 review and release preparation.
**Gotchas:** Keyboard smoke tests use CDP `page.keyboard` events via Puppeteer to drive search focus, typing, arrow navigation, Enter selection, document pane inspection, comparison opening, and Escape dismissal. Server rebuilds `dist/` unconditionally.
**Left by:** Antigravity 2026-08-30

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

### 2026-08-29 — Absence of data is never a positive claim
The atlas must not render a missing relation as evidence of historical independence.
Comparison mode previously stated that two traditions "evolved independently" when no direct
edge existed; the correct statement is that no direct relation is recorded in this dataset.
This extends the existing rule separating a documented tradition from the truth of its claims.

### 2026-08-29 — Sprint 01 planned, not built
Under the studio pipeline Claude plans and reviews OpenGrail; the build swarm implements.
The review's remediation items were verified against the working tree and written up as six
ordered tracks in `docs/sprint-01-remediation-plan.md` rather than patched directly.

### 2026-08-29 — Single machine-readable source of truth for tradition schema
Defined the canonical tradition frontmatter and relationship schema once in `scripts/schema.js`.
All validation in `scripts/build-graph.js`, documentation tables in `CONTRIBUTING.md`, TypeScript
types in `src/types/schema.ts`, and `data/_template.md` are derived from this single module,
preventing multi-artifact drift. Added `verify:schema` / `test` script to mechanically verify
synchronization and template compilation acceptance.

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

### 2026-08-29 — Side-by-side tradition comparison mode
Implemented interactive comparative analysis modal (`src/components/ComparisonModal.tsx`) allowing
users to compare any two traditions across all 573 records. Features automatic direct relationship
detection with citations and certainty tiers, graph intersection discovery (shared ancestral influences
and common offshoots), chronological time-delta calculation, geographic distance measurement, parallel
tenets and canonical texts side-by-side matrices, and authentic visual artifacts galleries. Integrated
URL hash deep linking (`#compare=stoicism+buddhism`), quick tradition switcher search, and comparison
entry points in topbar, mobile nav, and document reader. Build passes cleanly.

### 2026-08-29 — Review triage and Sprint 01 plan
Verified the 2026-08-29 codebase review against the working tree at `694f554` rather than
taking it at face value: z-index layering, the comparison lightbox class mismatch, the
`_template.md` / `build-graph.js` / `CONTRIBUTING.md` three-way disagreement, the
`origin_year`-only visibility filter in `App.tsx`, the year-blind hit-test in
`WorldMapView.tsx`, the `onMouseDown`-only search results, the footer-level timeline key
handler, the stale AGPL header in `vite.config.ts`, the print rule hiding `.graph-stage`,
and the single-parent `branchMap` in `detectBranchCycles`. All confirmed as described.
Wrote `docs/sprint-01-remediation-plan.md`. No source or data files were changed.

### 2026-08-29 - Track A landed via swarm, verified at runtime
Two dispatches were needed; both reported ERROR on a ~292s bridge timeout while still writing
usable code. Final state verified rather than trusted: `npm run build` passes; the comparison
overlay computes z-index 1250 above the mobile nav at 850 and the timeline drawer at 900; the
artifact lightbox backdrop computes 1400 above the modal; no horizontal overflow at a 375px
viewport and no element inside the overlay exceeds the viewport width; artifact cards are real
labelled buttons; opening a card moves focus to its close control and closing restores focus to
the originating card. 30 of 31 z-index declarations are now tokenised, the exception being a
local `z-index: -1` on the comparison backdrop.

### 2026-08-29 — Track C contributor contract repair landed
Implemented Track C of Sprint 01 remediation plan (`docs/sprint-01-remediation-plan.md` and `PLAN.md`).
Created unified schema module `scripts/schema.js`, derivation script `scripts/derive-schema.js`, and
mechanical verification script `scripts/verify-contributor-contract.js`. Refactored `scripts/build-graph.js`
to use shared schema validation and multi-parent cycle detection. Derived `data/_template.md`,
`CONTRIBUTING.md`, and `src/types/schema.ts`. Verified `npm test` and `npm run build` pass cleanly with
573 nodes and 903 links. Tracks D, E, and F remain untouched.

### 2026-08-29 - Emergent is the default temporal mode
The timeline exposes two explicit modes. `emergent` (`origin_year <= year`) is the default
because the atlas is primarily read as cumulative history: scrubbing forward should add
traditions rather than remove them. `active` (`origin_year <= year && year < extinct_year`)
is opt-in for reading a single era. The extinction year itself counts as extinct, which is
what the map already did before the modes existed; the rule is now shared rather than local
to one component.

### 2026-08-29 - Track D verified at runtime
Toggling the modes at the present day gives 573 of 573 traditions and 903 of 903 relations
in `emergent`, against 491 and 735 in `active` - 82 extinct traditions correctly excluded,
where previously nothing excluded them on any surface but the map's own drawing code.

### 2026-08-29 — Track E (E1 & E2) accessible search and timeline slider landed
Implemented Track E parts 1 and 2 of Sprint 01 remediation (`PLAN.md` and `docs/sprint-01-remediation-plan.md`).
Created shared `SearchCombobox` component (`src/components/SearchCombobox.tsx`) with full ARIA combobox pattern
(`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `role="listbox"`, `role="option"`,
`aria-selected`), supporting ArrowUp/ArrowDown navigation, Enter selection, Escape dismissal, and polite live region
announcements. Replaced standalone search forms in both `App.tsx` and `Sidebar.tsx`. Updated `TimelineScrubber.tsx`
to move keyboard navigation from the `<footer>` container directly to the `role="slider"` track element with `tabIndex={0}`,
added PageUp/PageDown large stepping (100 years in historic mode, 5,000 years in deep mode), and verified that arrow keys
on child footer buttons no longer scrub the timeline. Verified via headless Chrome automation test, `npm test`, and `npm run build`.
E3 and Track F remain untouched.

### 2026-08-30 - A parallel DOM view, not an accessible canvas
Both canvases declared `role="application"` while containing no focusable node or relation,
so assistive technology was handed a region that announced itself as interactive and offered
nothing to operate. Rather than building a focus model inside drawing code, the atlas now
ships a third view mode, `list`, rendering the same filtered set as a semantic table with
shared selection. The canvases became `role="img"` with labels that summarise the current
content - counts, year and temporal mode - instead of naming the widget.

### 2026-08-30 - Track E verified at runtime
List row count matches the header exactly in both temporal modes: 573 of 573 in `emergent`,
491 of 491 in `active`. Rows are real `<button type="button">` elements; activating one opens
the document pane and updates the hash to `#tradition=...&view=list`, the same state the
graph and globe produce. No `role="application"` remains in `src/`.

### 2026-08-30 - Track F landed items 1-3; 4-5 deferred
The suite covers data invariants over the real corpus, the temporal selector including the
`year == extinct_year` boundary, count agreement across surfaces, and the Track C contract
check folded in as a test rather than a separate script. Items 4 (axe) and 5 (keyboard
browser smoke) were not written, though the dispatch added `axe-core` and `puppeteer-core`
to devDependencies and applied the accessibility fixes an axe run surfaced: `role="img"`
moved off containers holding focusable controls onto the canvases themselves, raised
contrast on the filter bar, and focusable scrollable regions in the comparison modal.

### 2026-08-30 - The suite was proven able to fail, not just to pass
A green suite that asserts nothing is indistinguishable from a working one on a passing run.
Flipping the extinction boundary in `temporalVisibility.ts` from `>=` to `>` turned 4 of the
20 temporal tests red and restoring it turned them green; adding a node with a dangling
relation target failed the data-invariants file and removing it restored the 12 passes.

### 2026-08-30 - Browser tests must rebuild, not reuse dist
The first version of `startStaticAppServer` ran `npm run build` only when `dist/index.html`
was missing. Once `dist/` existed it was never refreshed, so the axe suite validated a stale
bundle: a deliberately injected nameless button in `src/App.tsx` passed cleanly. The helper
now rebuilds on every run and `npm run verify` calls `npm run build` rather than `tsc -b`,
which alone does not emit `dist/`. The few seconds this costs buys the tests their meaning.

### 2026-08-30 - Prove a failure proof is valid, not just that it failed
The dispatch that wrote item 4 tried to demonstrate the suite could fail by injecting a
nameless button into `.topbar__mobile-header`. That element is `display: none` outside the
mobile media query and the suite runs at 1280x800, so axe correctly ignored it - the proof
established nothing, and the injected markup was left behind in `src/App.tsx` when the run
timed out. A valid proof needs the injected fault to be reachable under the exact conditions
the test runs in. Re-run against a visible element, axe reported `[CRITICAL] button-name`
as expected.

### 2026-08-30 — Keyboard-only browser smoke test (Track F item 5) completed
Implemented `tests/keyboard-smoke.test.js` covering the full keyboard-driven navigation path:
(1) verified Tab moves `document.activeElement` away from BODY, (2) focused search input,
(3) typed query to trigger combobox suggestions, (4) cycled highlight across suggestions using ArrowDown,
(5) selected highlighted option via Enter, (6) verified document pane opens displaying the exact highlighted
tradition, (7) focused comparison button via keyboard and opened comparison modal via Enter,
and (8) dismissed comparison modal via Escape. Verified test failure validity by temporarily disabling Enter
key handling in `SearchCombobox.tsx` (causing test timeout and failure on selection), reverted cleanly with no
leftover scaffolding, and verified 90 tests green (verified: npm run verify 2026-08-30). Sprint 01 complete.

