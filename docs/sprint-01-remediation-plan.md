# Sprint 01 — Remediation Plan

**Status:** Plan only. No implementation in this document's authoring session.
**Author:** Claude Code (plan + architecture stage), 2026-08-29
**Build target:** every task below must leave `npm run build` passing.

This plan covers the five highest-priority remediation items from the 2026-08-29 codebase
review. Feature additions (path explorer, evidence mode, faceted explorer, shareable state,
guided tours, research workspace) are explicitly **out of scope** and are not planned here.

Every claim below was verified against the working tree at commit `694f554` before this plan
was written. File:line references are from that commit and should be re-checked with
`git diff` before editing, per `AGENTS.md`.

---

## Ordering and rationale

Work the tracks in the listed order. Track A and Track B both touch `ComparisonModal.tsx`
and `index.css`; doing B first means re-editing the same JSX twice. Track C is data-layer
only and can run in parallel with A/B by a separate agent. Track E depends on A–D being
settled, because the tests encode the behaviour those tracks define.

| Track | Name | Depends on | Parallelizable |
|---|---|---|---|
| A | Comparison mode correctness | — | with C |
| B | Comparison scholarly language | A | no |
| C | Contributor contract repair | — | with A |
| D | Unified temporal visibility | — | with C |
| E | Accessible search, modals, timeline | A, D | no |
| F | Regression test harness | A–E | no |

---

## Track A — Comparison mode correctness

Four defects, all verified.

### A1. Mobile bottom nav paints over the comparison modal

`.mobile-bottom-nav` is `z-index: 850` (`src/index.css:3172`) and `.timeline-wrapper` is
`z-index: 900` (`src/index.css:3152`), both inside the mobile media query. The comparison
layers are `.comparison-overlay` at `z-index: 90` (`src/index.css:3675`) and
`.comparison-picker-overlay` at `z-index: 100` (`src/index.css:4252`). On a mobile viewport
the nav and the timeline drawer both render above the modal.

**Fix:** introduce a z-index token scale at the top of `index.css` under `:root` and convert
every existing `z-index` in the file to a token. The file currently carries 30 hardcoded
values spanning `-1` to `1100` with no ordering rationale; patching only the comparison
values leaves the same trap for the next overlay.

Proposed scale — the exact numbers are a design decision, but the *ordering* is not:

```
--z-base, --z-graph-chrome, --z-sidebar, --z-topbar,
--z-mobile-nav, --z-timeline-drawer,
--z-modal-backdrop, --z-modal, --z-lightbox, --z-toast
```

Modal must sit above mobile nav and the timeline drawer. Lightbox must sit above modal.

### A2. Artifact cards are mouse-only

Artifact cards in `src/components/ComparisonModal.tsx` are `<div>` elements with `onClick`
and no keyboard affordance. Same pattern, same fix as E1: render a real `<button
type="button">`, or add `role="button"` + `tabIndex={0}` + Enter/Space handling. Prefer the
real button — the styling is reachable with `appearance: none`.

### A3. Lightbox class names do not match any stylesheet rule

`ComparisonModal.tsx:745,750,753,762,764` emit `document-lightbox`,
`document-lightbox__dialog`, `document-lightbox__close`, `document-lightbox__image`,
`document-lightbox__info`. `grep -rn "document-lightbox" src/` returns those five lines and
nothing else — the stylesheet defines `artifact-lightbox-backdrop`, `-dialog`, `-close`,
`-img-wrap`, `-img`, `-content`, `-title`, `-badges`, `-desc` (`src/index.css:2904-2989`).
The comparison lightbox is therefore rendering unstyled.

**Fix:** do not simply rename the classes. Extract one `<Lightbox>` component used by both
`DocumentPane` and `ComparisonModal`, owning the backdrop, the dialog, the close button,
focus trapping, focus restoration, Escape-to-close, and `inert` on the background. Two
call sites drifting apart is what produced this bug; a shared primitive is what prevents
the next one. Delete whichever of the two class families ends up unused.

### A4. Comparison grids overflow on narrow viewports

At a 390px viewport the artifact cards expand the grid to roughly 805px, because nowrap
content sets the grid item's automatic minimum size. This is the standard CSS Grid
`min-width: auto` trap.

**Fix:** add `min-width: 0` to every comparison grid child, and `overflow-wrap: anywhere`
on the text content. Verify at 390px, 414px, and 768px.

**Acceptance:** on a 390px viewport, open comparison mode — the modal is fully above the
bottom nav and the timeline drawer, the lightbox is styled, Tab reaches every artifact card
and Enter opens it, Escape closes the lightbox then the modal, focus returns to the element
that opened each, and the page body does not scroll horizontally.

---

## Track B — Comparison scholarly language

Two claims in `ComparisonModal.tsx` overstate what the dataset records. This matters more
than a normal copy bug: `AGENTS.md` makes "preserve the distinction between a documented
tradition and the truth of its claims" a standing project rule, and these strings break it.

### B1. "Shared Lineage" is computed as an undirected, untyped intersection

The shared-connections set discards both relation direction and relation type, then labels
the result as shared lineage. A node reached by `influenced_by` in one tradition and
`syncretism` in the other is presented identically to a genuine shared `branch_of` parent.

**Fix:** rename the section to something the computation actually supports — "Shared
Connections" — and group the results by relation type (`branch_of`, `diverged_from`,
`influenced_by`, syncretic, conceptual parallel), showing each entry's `certainty` and
whether a `citation` is present. Preserve direction in the rendered phrasing.

### B2. Absence of an edge is presented as evidence of independence

Where no direct relation exists between the two nodes, the modal asserts the traditions
"evolved independently". The dataset cannot support that: a missing edge means nothing was
recorded, not that nothing exists.

**Fix:** replace with "No direct relation is recorded in this dataset." Add a Decisions Log
entry in `PROJECT_NOTES.md` stating that the atlas never renders absence of data as a
positive historical claim, so this does not regress.

**Acceptance:** no string in `ComparisonModal.tsx` asserts a historical fact that the
underlying `graph.json` does not record. Shared connections display type, direction, and
certainty.

---

## Track C — Contributor contract repair

`data/_template.md` cannot pass `scripts/build-graph.js`. Verified failures, in the order
the builder would hit them:

| Template field | Builder requirement | Source |
|---|---|---|
| `id: example_tradition` | must match `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` — underscores rejected | `build-graph.js:293` |
| `geographic_origin` + `coordinates: [lat, lng]` | requires `origin_geo` **object** with `lat`, `lng`, `place_name` | `build-graph.js:103-116,311` |
| `origin_year` | required, absent from template entirely | `build-graph.js` / `CONTRIBUTING.md:30` |
| `core_tenets` | builder reads `key_tenets` / `keyTenets` | `build-graph.js:318` |
| `certainty: documented` | must be one of the four epistemic tiers | `build-graph.js:13-18,238` |

`CONTRIBUTING.md:31` independently documents `origin_geo` as `[lat, lng]`, which is also
wrong. A contributor following either the guide or the template produces a file that fails
the build.

**Fix — single source of truth.** Define the node schema once in a machine-readable form
(a plain JS module exporting field descriptors is sufficient and adds no dependency), and
derive from it:

1. the validation currently hand-written in `build-graph.js`,
2. the field table in `CONTRIBUTING.md`,
3. the `src/types` TypeScript definitions,
4. `data/_template.md`.

If full derivation is too large for one sprint, the minimum viable version is: fix the
template and the guide by hand **and** add the test in Track F that builds an untouched
copy of `_template.md`. Without that test the three artefacts will drift apart again.

**Acceptance:** copying `data/_template.md` to `data/example-tradition.md`, changing only
the `id` and the relation `target`, and running `npm run build:graph` succeeds.

---

## Track D — Unified temporal visibility

Four surfaces disagree about what exists at the scrubbed year.

- `src/App.tsx:184` filters visible nodes on `origin_year <= currentYear` only — extinct
  traditions stay in the count forever.
- `src/App.tsx:196-199` filters links on `max(sourceYear, targetYear) <= currentYear`,
  also ignoring extinction.
- `src/components/WorldMapView.tsx:345,411` correctly computes both `isFuture` and
  `isExtinct` for **drawing** and for label badges.
- `src/components/WorldMapView.tsx:542-560` — the hit-test loop — filters on
  `activeTiers` only. It never reads `currentYear`. A node that has not yet emerged is
  still hoverable and, via `handleCanvasClick` at `:570`, still selectable.

**Fix:** add one shared selector module (e.g. `src/state/temporalVisibility.ts`) exporting
a single predicate with two explicit modes:

- `emergent` — `origin_year <= year`. Cumulative history; what has appeared by now.
- `active` — `origin_year <= year && (extinct_year == null || year < extinct_year)`.

Surface the mode in the timeline UI so the semantics are the user's choice rather than an
accident of which component they are looking at. Then route **all** of these through it:
graph physics and rendering, map drawing, **map hit-testing**, search results, the
"Showing N of M" counts at `App.tsx:294-295`, comparison mode, and the sidebar.

Note the boundary condition already in the map code: `currentYear >= extinctYear` counts the
extinction year itself as extinct. Whatever the selector picks, it must be consistent
everywhere — the map currently defines it and nothing else does.

**Acceptance:** for any scrubbed year, the header count, the search result set, the rendered
graph nodes, the rendered map nodes, and the set of map nodes that respond to hover/click
are all identical.

---

## Track E — Accessible search, modals, timeline

### E1. Main search results are unreachable by keyboard

`src/App.tsx:446` renders each result as `<button type="button" onMouseDown={...}>` with no
`onClick` and no `onKeyDown`. A `<button>` fires `click` on Enter and Space, but never
`mousedown` — so keyboard activation does nothing at all in the rendered app.

**Fix:** implement the input and its result list as a proper ARIA combobox —
`role="combobox"` with `aria-expanded` and `aria-controls` on the input, `role="listbox"` on
the results, `role="option"` with `aria-selected` on each, `aria-activedescendant` tracking,
and Up/Down/Enter/Escape handling. Keep `onMouseDown` only if blur-ordering requires it, and
add `onClick` alongside — do not rely on `onMouseDown` as the sole activation path.

The sidebar has its own separate search. Both should use the same combobox component; the
review's proposed unified faceted explorer is a later feature, but sharing the widget now
means that feature has one place to land.

### E2. Timeline key handling is bound to the whole footer

`src/components/TimelineScrubber.tsx:244-247` puts `onKeyDown` on the `<footer>` element.
Keyboard events from every child control bubble to it, so pressing Space on a child button
can also toggle playback, and arrow keys pressed anywhere in the footer scrub the year.

**Fix:** move the handler onto a single focusable slider element with `role="slider"`,
`aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext` (the formatted era
label, not the raw integer), and `tabIndex={0}`. Home/End jump to the range ends;
PageUp/PageDown step by a larger interval. The footer itself stops handling keys.

### E3. Graph and globe are `role="application"` with no keyboard model

`src/components/GraphCanvas.tsx:994` declares `role="application"`, which tells a screen
reader to hand all keys to the widget — but no node or relation is focusable, so the user
is trapped in a region with nothing to operate. `WorldMapView` has the same shape.

**Fix:** provide a synchronized list/table view of the same filtered node and relation set,
reachable by keyboard and exposed to assistive tech, with selection state shared with the
canvas. This is the standard canvas-visualization accommodation and is far cheaper than
building a focus model inside the canvas. Drop `role="application"` in favour of
`role="img"` with a meaningful `aria-label` summarising the current view, plus a visible
"view as list" control.

**Acceptance:** every primary workflow — find a tradition, open it, scrub the timeline,
compare two traditions — is completable with the keyboard alone, and each interactive
element announces a name, a role, and a value.

---

## Track F — Regression test harness

`package.json` has no `test` and no `lint` script; `npm run build` (`build:graph` + `tsc -b`
+ `vite build`) is the only verification gate in the repo. Nothing above is safe from
regression without this track.

Add, in this order:

1. **Data invariants** — no duplicate ids, every relation `target` resolves, no isolated
   nodes, no branch cycles, every `certainty` in `EPISTEMIC_TIERS`, every `epistemic_tier`
   valid. These checks already exist informally inside `build-graph.js`; expose them as
   assertions a test can call.
2. **Template build test** — Track C's acceptance criterion, automated.
3. **Temporal selector unit tests** — the `emergent`/`active` predicate, including the
   `year == extinct_year` boundary and null `extinct_year`.
4. **Accessibility smoke tests** — axe against the main view, the comparison modal, and the
   lightbox.
5. **Browser smoke test** — search → select → open document → compare → close, keyboard-only.

Wire the suite into a `verify` script (`build:graph && tsc -b && test`) and note in
`AGENTS.md` that it is the handoff gate.

---

## Deferred, with reasons

These were in the review and are deliberately **not** in this sprint:

- **Graph render performance** (pause redraw; animate particles only for selected/hovered
  links — `GraphCanvas.tsx:1039` currently animates every link continuously) and **context
  splitting** so timeline playback does not rerender the app each frame. Both are real, both
  are perf rather than correctness, and the context split will be easier once Track D has
  centralised the temporal state.
- **Asset and payload work** — responsive WebP/AVIF thumbnails for the ~823 MiB artifact
  library, and splitting the 3.96 MB `graph.json` into an index plus lazy node documents.
  Large, independent, and better as its own sprint.
- **URL state coverage** — `AtlasState.tsx:103` uses `replaceState` exclusively, so browser
  Back never steps through atlas states, and only node/compare/view are encoded. Expanding
  this is a feature (shareable atlas states), not a fix.

## Small independent fixes

Not worth their own track; fold into whichever track touches the file.

- **`vite.config.ts:1-2`** carries `SPDX-License-Identifier: AGPL-3.0-or-later OR
  LicenseRef-OpenGrail-Commercial` and points at a `LICENSE-COMMERCIAL.md` that does not
  exist. The project is MIT (`LICENSE`, `package.json`). Sweep all source headers for
  the same stale banner and remove it.
- **Print CSS** — `src/index.css:3486-3492` hides `.atlas-workspace > .graph-stage`, and
  `DocumentPane` is rendered inside that `.graph-stage` section (`App.tsx:478,547`). Printing
  a tradition therefore hides the document being printed, along with the watermark rule at
  `:3520` that targets `.document-pane::before`. Hide the graph canvas specifically, not the
  stage.
- **`detectBranchCycles`** (`scripts/build-graph.js:374-395`) stores parents in a
  `Map` keyed by child, so a node with two `branch_of` relations silently keeps only the last
  one — a cycle through the discarded parent is never detected. Use `Map<string, string[]>`
  and walk all parents, or reject multiple `branch_of` relations at validation time as an
  explicit modelling rule.
