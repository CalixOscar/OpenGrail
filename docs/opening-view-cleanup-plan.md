# Opening View Cleanup Plan

**Status:** planned, not built. Written 2026-08-30.
**Goal:** OpenGrail should open as the atlas itself, with as little resident chrome as
possible. Everything else is summoned.

This is a review of how far the "chrome is summoned, not resident" decision (2026-08-30)
actually got, plus the work still outstanding. Measured in the browser against the running
dev server, not read off the source.

---

## What already landed

Verified in `src/App.tsx:64-71` and confirmed on screen:

| Surface | Default | Status |
| :--- | :--- | :--- |
| Filter bar | `showFilters = false` | hidden ✅ |
| Timeline scrubber | `showTimeline = false` | hidden ✅ |
| Sidebar | `sidebarCollapsed = true` | collapsed ✅ |
| Document pane | `documentOpen = false` | hidden ✅ |
| Mobile sidebar / timeline | `false` | hidden ✅ |
| Comparison modal | `false` | hidden ✅ |

The atlas does open on the graph. That part of the ask is done and should not be
re-litigated. What follows is what is still resident.

---

## Finding 1 — The collapsed sidebar is not collapsed, it is narrow (highest priority)

Measured on the opening view at 1280x720:

```
.sidebar-wrapper   58px wide   114 focusable controls   0 marked inert or aria-hidden
```

The "collapsed" sidebar still renders the full tradition navigator — 114 buttons
(`Open Christianity`, `Open Islam`, `Open Judaism`, …) squeezed into a 58px rail where
they appear as a column of coloured dots with no visible labels. All 114 are in the tab
order, ahead of everything else on the page.

This has two consequences:

- **Visually**, the opening view still carries a persistent vertical band of decoration
  down the entire left edge. It is the most prominent chrome left.
- **For keyboard users**, reaching the search box or the view switcher means tabbing past
  114 unlabelled dots. This is worse than the pre-collapse state, because at least an
  expanded sidebar showed what the controls were.

It also means the recorded decision is only half-true: the sidebar was made *narrow*, not
*summoned*. Worth correcting in `PROJECT_NOTES.md`, because the next agent will otherwise
read that decision as complete.

**Fix.** When collapsed, the rail should render only the expand control. The tradition
list should not be in the DOM at all — not merely hidden with CSS, and not left tabbable.
Removing it from the DOM is preferable to `inert`/`aria-hidden`, because it also removes
the visual band. Keep the collapse/expand affordance itself obvious and labelled; the
existing `Expand tradition navigator` button is the right anchor for it.

Whatever the approach, the acceptance test is mechanical: on the opening view,
`.sidebar-wrapper` contains exactly one tabbable control.

## Finding 2 — Two controls for the same destination

- `ref_27` — "Accessible tabular list view", in the topbar view switcher
- `ref_35` — "Switch to accessible list view", floating over the canvas at the top right,
  in its own bordered `VIEW / List` box

Both go to list view. The floating one sits on top of the graph, which is exactly the
surface the redesign is trying to clear, and duplicates a control already present in the
persistent topbar.

**Fix.** Remove the floating box. Keep the topbar switcher, which already offers all three
views. Before removing, confirm it is not serving a screen-reader-specific skip affordance
that the topbar switcher does not — `tests/accessibility-smoke.test.js` and
`tests/keyboard-smoke.test.js` are the places that would show it. If it *is* load-bearing
for accessibility, keep it but render it visually hidden until focused, rather than as a
permanent box over the canvas.

## Finding 3 — Six labelled tool groups, always on

`.topbar__tools` is 907px wide with 12 controls across six groups, each carrying a
small-caps label: `LAYERS`, the view switcher, `COMPARE`, `ZOOM`, `PAN`, `LAYOUT`,
`SEARCH ATLAS`.

Three of those groups — `ZOOM`, `PAN`, `LAYOUT` — are graph-manipulation controls that
duplicate direct manipulation the canvas already supports (scroll to zoom, drag to pan),
and are only meaningful in the Brain Cluster view.

**Fix, in order of confidence:**

1. **Drop the group labels.** Six small-caps words above thirteen already-labelled buttons
   is redundant furniture. The buttons carry `title` and `aria-label` already; the visible
   caption tier adds nothing a tooltip does not. This alone reclaims a row of the topbar.
2. **Collapse `ZOOM` / `PAN` / `LAYOUT` behind a single toggle**, in the same way Filters
   and Timeline already work — the same pattern, applied to the controls that were left
   out of the first pass. They are the graph's own controls, so summoning them from the
   graph surface rather than the topbar is also defensible.
3. **Hide them entirely outside Brain Cluster view.** Zoom/pan/layout do not apply to the
   list view. Check the World Map view before acting — it may need its own zoom.

Do 1 unconditionally. Do 2 and 3 only if they survive a browser check on all three views.

## Finding 4 — The topbar prose block

`.topbar__context` is four stacked lines: an eyebrow `COMPARATIVE RELIGION ATLAS`, an `<h1>`
reading "Historical & theological relations", a `SYNCHRONIZED ATLAS` status pill, and a
subline "Showing 573 of 573 traditions · 903 of 903 relations".

**Fix.** Reduce to two lines: the product name, and the counts. Specifically:

- The eyebrow and the `<h1>` say roughly the same thing twice. Keep one. The `<h1>` must
  survive in the accessibility tree for document structure — if the visible text is
  trimmed, keep an `<h1>` with the accessible name intact.
- Drop the `SYNCHRONIZED ATLAS` pill. It reports the state of a static JSON file that
  cannot be out of sync; it is decoration implying live infrastructure the project
  deliberately does not have.
- Keep the counts line. It is the one element that changes as filters are applied, and it
  is how a user knows a filter is active while the filter bar is hidden — load-bearing
  precisely *because* the chrome is hidden.

## Finding 5 — The cluster legend

`.cluster-legend` is a 1083x25 bar pinned along the bottom: a size key plus all eleven
cluster colours, always on, no interactive elements.

**Decision (owner, 2026-08-30): hidden by default.** It becomes a summoned surface like the
filter bar and the timeline, rather than resident chrome with a dismiss affordance.

Implementation:

- `legendVisible` starts `false`.
- Add a third toggle to the existing `LAYERS` group in the topbar, beside Filters and
  Timeline. That group is already the established home for summoned surfaces, so this adds
  a button to an existing cluster of them rather than introducing a new pattern.
- Persist the user's choice in `localStorage` so someone who summons the legend keeps it
  across visits. Default-hidden means the stored key records *shown*, the inverse of the
  dismissal flag — wrap the read and the write in `try`/`catch`, since private browsing
  throws on access.
- The dismiss `X` inside the legend can stay; with a toggle present it is a convenience,
  not the only way out. Keep whichever reads more cleanly, but the toggle is required.

Note this is a reversal of the earlier recommendation in this plan, which was
dismissible-but-visible. The reasoning behind that — that the legend is useful on a first
visit — still holds, and is the cost of the decision: a first-time visitor now meets eleven
unexplained cluster colours. That is accepted in exchange for an opening view that is only
the atlas. The colours are also named in the filter bar and on every node's document pane,
so the information is not lost, only not pushed.

---

## Out of scope

- The stage watermark (`OpenGrail` / `by calmdownoscar`). Deliberate branding, recorded
  2026-08-28, `pointer-events: none`, not chrome.
- The search box. Primary navigation for an atlas of 573 traditions; it stays.
- Any change to the graph rendering, layout physics, or cluster colours.

## Verification gate

- `npm run verify` green, including `tests/accessibility-smoke.test.js` and
  `tests/keyboard-smoke.test.js` — findings 1 and 2 both touch the tab order, so these are
  the tests most likely to catch a regression and most likely to need updating.
- **Add a test asserting the opening view's tab order.** The collapsed sidebar contains
  exactly one tabbable control. This is the invariant that keeps Finding 1 fixed; without
  it, the same regression returns the next time the sidebar is touched.
- Browser pass per `AGENTS.md` on all three views — search, filters, graph selection,
  document panes, backlinks, nested branch navigation — confirming each hidden surface can
  still be summoned and dismissed.
- Mobile viewport check. The first pass was explicitly a mobile-first posture; confirm
  none of these changes regress the phone layout.
- Screenshot the opening view before and after, at desktop and mobile.
