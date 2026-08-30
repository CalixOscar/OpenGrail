# Topbar Glass Pass, Rail View Switcher, and the Kongo Artifact

**Status:** planned, not built. Written 2026-08-31.
**Decision (owner):** option B from the mockup — glass topbar with equal-width tiles, and
the Brain Cluster / World Map / List View switcher moved to the left rail.

Measured against the working tree at `fb4ae0c`.

---

## 1. What is actually wrong with the bar today

Three separate problems, often mistaken for one:

- **Tiles are not equal.** `.layer-toggle-btn` (`src/index.css:778`) sets `width: auto` with
  `padding: 0 12px`, so each tile is as wide as its own label. Filters / Timeline / Legend
  step unevenly because "Timeline" is a longer word than "Filters".
- **The bar is not glassy.** `.topbar` (`src/index.css:670`) already has
  `backdrop-filter: blur(18px)`, but its background is `rgba(16, 19, 26, 0.92)` — 92%
  opaque. Almost nothing shows through, so the blur is invisible. Adding more blur will not
  help; the alpha is what is wrong.
- **Three button idioms share one bar.** A bordered group with internal dividers
  (`.layer-toggle-btn`), a segmented pill (`.view-switcher`), and lone outline buttons
  (`.cluster-toggle`). They do not read as one system.

Note also `.layer-toggle-btn` carries `!important` on fourteen consecutive declarations.
Restyling it means either continuing that or unwinding it. **Unwind it.** Find what it was
fighting, fix the specificity properly, and drop the `!important`s — otherwise every future
change to this bar pays the same tax.

## 2. The glass pass

- `.topbar` background drops to roughly `rgba(22, 27, 36, 0.65)`, ideally a subtle vertical
  gradient (lighter at the top), with `backdrop-filter: blur(22px) saturate(140%)`.
- Add an inset top highlight — `box-shadow: 0 1px 0 rgba(255,255,255,0.05) inset` — and keep
  the existing bottom border. That highlight is most of what reads as "glass".
- Tiles become a grid, not a flex row: `grid-auto-flow: column` with a fixed
  `grid-auto-columns` (96px for labelled tiles, 40px for icon-only), so every tile is
  identical and the group reads as one control.
- Give the active tile a gradient fill and an inset accent line rather than a flat wash.

### The constraint that governs this whole section

The project already has a recorded decision, 2026-08-30, *"translucent overlays make
contrast contextual"*: `.btn--secondary` passed axe only because the timeline and filter bar
happened to sit behind it, and failed at 3.85:1 the moment they stopped being mounted by
default. **More transparency makes that worse, not better.**

So: every control that sits on the glass needs an opaque background of its own, rather than
inheriting whatever the graph happens to render underneath. `npm run verify` runs axe and
will catch violations — do not resolve a failure by lowering the blur and calling it done;
give the control its own backing.

## 3. The rail view switcher

Move the three view buttons out of `.topbar__tools` and into the collapsed sidebar rail,
above the existing expand control, separated by a divider.

- Icon-only at 36x36 in the 58px rail. Keep the existing lucide icons — `Network`, `Globe2`,
  `List` — so the visual language does not change, and keep each button's `aria-pressed`
  and its full text as `aria-label` and `title`.
- The active view gets the accent gradient and a border, matching the topbar's active tile.
- `ViewSwitcher.tsx` should grow a variant rather than being forked — the same component
  rendering either a labelled row or an icon column. Do not copy it.

### This does not work on mobile, and that is the important part

**At `max-width: 720px` the sidebar is not a rail.** It becomes an off-canvas drawer:
`position: fixed`, `width: min(85vw, 340px)`, `transform: translateX(-100%)`
(`src/index.css:3386`). There is no 58px strip on a phone, so a rail-only switcher would
simply vanish on mobile.

There is already a `.mobile-bottom-nav` with six items — Browse, Filters, Compare, Timeline,
Search, Details — and it is full. A seventh through ninth will not fit.

**So on mobile the view switcher stays in the topbar tools where it is today.** The rail
placement applies at `min-width: 721px` only. Verify explicitly at a phone viewport that all
three views are still reachable; that check is not optional, and the earlier chrome pass was
mobile-first for a reason.

If the mobile topbar becomes too crowded, the fallback is a single cycling View button in
the mobile bar — but only if the browser check shows a real problem. Do not build it
speculatively.

## 4. The tab-order test must be rewritten by intent, not by number

`tests/keyboard-smoke.test.js` asserts the collapsed sidebar contains **exactly 1** tabbable
control. Adding three view buttons makes it 4, and the test will fail.

**Do not simply change 1 to 4.** That number was never the point. The invariant it protects
is that *the tradition navigator is not resident in the collapsed rail* — the 114 unlabelled
colour dots that used to sit ahead of everything else in the tab order.

Rewrite it to assert what is actually meant:

- the collapsed rail contains no tradition-selection controls (nothing matching `Open <name>`)
- every control in the rail has a non-empty accessible name
- the rail's tabbable count stays at or below a small explicit bound, with the bound
  commented as "expand control plus the view switcher" so the next person knows what may
  legitimately change it

A test whose number is bumped every time it fails is not protecting anything.

## 5. Dead CSS to remove

The previous pass deleted the rail node JSX but left its styles behind. These are now unused
and should go with this change, since they occupy the exact selector space the view switcher
will use:

- `.sidebar-rail__nodes` (`src/index.css:627`)
- `.sidebar-rail__node`, `:hover`, `--selected` (`:638`, `:649`, `:650`)
- `.sidebar-rail__node-dot` and its hover/selected variants (`:654`, `:663`, `:664`)

Confirm each is genuinely unreferenced before deleting.

## 6. The Kongo artifact

Separate concern, same dispatch. `kongo-religion-2` currently points at a corrupt local file
and a `sourceUrl` for a cathedral in Brazil.

**Commons has no photograph of the Mbanza Kongo ruins.** `Category:Catedral de São Salvador
do Congo` exists, is linked from Wikidata `Q5697145` (Kikongo *Kulumbimbi*), and is empty.
Neither the English nor the Portuguese article carries one. The original curation did not
pick the wrong file by accident — there was nothing to pick.

**Replacement:** `File:Clevelandart 2010.444.jpg` — a complete Kongo *nkangi kiditu*
crucifix, CC0, Cleveland Museum of Art, 2240x3400.

```yaml
  - title: "Nkangi kiditu crucifix cast for Kongo Christian devotion"
    imageUrl: "/artifacts/kongo-religion-2.webp"
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Clevelandart_2010.444.jpg"
    provenance: "Cleveland Museum of Art; CC0"
    period: "19th century"
    description: "A brass corpus with Kongo facial features mounted on a wooden cross, with a
      kneeling orant figure at Christ's feet - a Christian form cast by Kongo artisans within
      Kongo ideas of sacred authority."
```

Steps: download the original from Commons, run it through `scripts/build-thumbnails.js`
tiering (standard 640px — it is an object, not text), replace `kongo-religion-2.jpg` with
`kongo-religion-2.webp`, delete the corrupt JPEG, update the frontmatter above, then
`npm run build:graph` and `npm run derive:attributions`.

Then **remove the single-exception carve-out** in `tests/artifact-licensing.test.js`: with
the JPEG gone, every artifact is WebP and the exception list should be empty rather than
carrying a stale name.

Why not the obvious alternative: `File:The Bansa, or residence of the King of Kongo, called
St. Salvador (M'Banza Kongo), Astley 1745.jpg` is public domain and does show the capital's
churches, but it is an 18th-century European engraving whose own legend includes "E. Slaves
carrying water to the City". Putting a colonial outsider's frame on a record that explicitly
criticises outsider framings of Kongo practice is the wrong call for this atlas.

## Verification gate

- `npm run verify` green, including axe. Section 2's contrast constraint is the most likely
  failure and must be fixed properly, not by backing off the design.
- Browser pass on all three views at desktop **and** at a phone viewport, confirming every
  view is reachable in both.
- Screenshots before and after, desktop and mobile.
- Confirm the rail switcher is keyboard reachable, that `aria-pressed` tracks the active
  view, and that focus is visible against the glass.
