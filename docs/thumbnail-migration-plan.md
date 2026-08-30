# Thumbnail Migration Plan

**Status:** planned, not built. Written 2026-08-30.
**Scope:** replace the bundled full-size artifact library with committed thumbnails that
link out to Wikimedia Commons, delete the fetch/manifest machinery this makes redundant,
restore GitHub licence detection, and fix the fresh-clone failure.

This is a plan for the build swarm. Nothing here has been implemented. Every number below
was measured against the working tree on 2026-08-30, not carried over from notes.

---

## 1. Why

`public/artifacts/` is 823 MB across 1,146 files. To keep the repository clonable, the
current design splits it: 120 unreproducible derivatives are committed (26 MB), the other
1,026 are downloaded from Commons at first run by `scripts/fetch-artifacts.js` and verified
against sha256 pins in `data/artifact-manifest.json`.

That design has one structural defect and one live consequence.

- **Pinning checksums against a live archive rots.** Commons re-encodes files. It already
  happened to `Jigten Sumgon.JPG` (977,836 bytes served against 977,888 pinned). More will
  drift. There is no version of this design where it stops happening.
- **A fresh clone is broken right now.** `npm run fetch:artifacts` exits 1 at 1,145/1,146
  and `npm run verify` then reports 96/98. The repository is public, so this is what any
  contributor gets today. It is invisible locally: `node --test tests/artifact-manifest.test.js`
  passes 8/8 on this machine, because the pre-drift bytes are still on disk.

Thumbnails remove the failure mode rather than patching it. Nothing tracks upstream bytes
any more, so nothing can drift.

## 2. What the atlas actually needs from an image

Measured against the real CSS, not assumed:

| Surface | CSS box | Source |
| :--- | :--- | :--- |
| Artifact card in the document pane | ~130 x 98, `object-fit: cover` | `src/index.css:3140` (`minmax(130px, 1fr)`, `aspect-ratio: 4/3`) |
| Comparison modal card | same 4:3 cover box | `src/index.css:4785` |
| Lightbox | max 680 wide, max 52dvh tall, `object-fit: contain` | `src/index.css:3255`, `:3306` |

So 480px on the long edge is comfortably enough for every card at any DPR, and slightly
soft in the 680px lightbox at 1x. That is the *design* answer. It is not the whole answer,
because of section 3.

## 3. Legibility gate — 480px is not enough for everything

The notes flagged that manuscripts might not survive 480px. They do not. Rendered from
`public/artifacts/aristotelian-virtue-ethics-2.jpg` (1920 x 2833, a Greek manuscript leaf
of the *Nicomachean Ethics*):

- **480px long edge** (325 x 480): the Greek text block resolves to grey texture. Not
  letterforms. The artifact stops being a manuscript and becomes a picture of a page.
- **640px wide** (640 x 944): individual letterforms separate. Readable as script,
  borderline word-readable.
- **1024px long edge** (694 x 1024): word-readable. The artifact does its job.

By contrast `nestorianism-historical-category-2.jpg` (the Xi'an Stele, large incised
characters) is entirely legible at 480px long edge. The requirement is not uniform across
the library, so a single flat size either wastes megabytes on stelae or destroys
manuscripts.

## 4. Measured sizes (sharp, WebP q80, `fit: inside`, `withoutEnlargement: true`)

Budget set by the owner: **80 MB is acceptable.** That changes the answer — the earlier
43 MB proposal was optimising against a constraint that does not exist.

Ordinary artifacts projected from a 131-file sample of the 1,044 non-text artifacts;
the 102 text-bearing artifacts measured in full, not sampled.

| Ordinary tier | Library share | | Text tier | Library share |
| :--- | :--- | :--- | :--- | :--- |
| 480 | 30.3 MB | | 1024 | 10.5 MB |
| 640 | 51.4 MB | | 1280 | 14.5 MB |
| 800 | 77.5 MB | | 1600 | 20.1 MB |

Combinations:

| | text 1024 | text 1280 | text 1600 |
| :--- | :--- | :--- | :--- |
| **ordinary 480** | 41 MB | 45 MB | 50 MB |
| **ordinary 640** | 62 MB | 66 MB | **71 MB** |
| **ordinary 800** | 88 MB | 92 MB | 98 MB |

Current library: 823 MB on disk.

### Decision: ordinary 640px, text-bearing 1600px, ~71 MB

Sizes are on the long edge. The reasoning, given the 80 MB budget:

- **640 for ordinary artifacts** is the natural stopping point, not an arbitrary one. The
  lightbox is capped at 680px wide (`src/index.css:3255`), so 640 is effectively the
  native display size — every ordinary artifact renders at or near 1:1 with no visible
  softness, and cards have resolution to spare at any DPR.
- **Going to 800 for ordinary artifacts buys nothing.** It adds 26 MB to render pixels the
  680px lightbox cannot show. That is the whole budget spent below the fold.
- **Spend the headroom on the text tier instead.** Manuscripts are the artifacts where
  extra pixels are still doing work at any size — the reader wants to look *closer*, and
  1600px supports zooming into a script the 480px version erased entirely. Upgrading the
  102 text artifacts from 1024 to 1600 costs 9.6 MB, roughly a third of what the ordinary
  800px upgrade costs, for far more visible benefit.

71 MB sits inside the budget with room to absorb the inevitable additions, and still cuts
the library by 91%.

If the tiering later proves too coarse, `detail` is an enum, not a boolean — a third tier
can be added without reworking anything.

## 5. Correction to the notes: clone size does not drop on its own

The Decisions Log projects "clone lands near 40 MB, half of today's 81 MB." That does not
follow, and the plan should not promise it.

- Current pack: **79.47 MiB**. Only ~26 MB of that is the current tree's 120 vendored files.
  The remaining ~53 MB is superseded revisions of those same paths still in history
  (`messianic-judaism-2.jpg` alone carries a 2.4 MB earlier blob against 676 KB on disk).
- Adding ~71 MB of new thumbnail blobs takes the pack to roughly **150 MB**. A fresh clone
  gets *bigger* than today's 97 MB, not smaller.

Getting to ~40 MB needs a second history rewrite purging `public/artifacts/**` from history
entirely. That was free in the pre-publication window; it is not free now. The mitigating
facts, verified: `CalixOscar/OpenGrail` is public with **0 forks and 0 stars**, so the
practical blast radius is one person re-cloning.

**Decision (owner, 2026-08-30): purge history.** The pack drops from ~150 MB to ~45 MB and
a fresh clone finally matches the working tree. This breaks every existing clone and fork;
verified blast radius is 0 forks, 0 stars, one machine.

### Sequencing — this is the last step, not the first

The rewrite runs **after** Tracks 1–4 have landed, been verified, and been pushed. Rewriting
before the thumbnails are committed would purge history and then immediately add 71 MB of
new blobs to it, achieving nothing. The order is not negotiable:

1. Tracks 1–4 land on `main` and are pushed.
2. A clean clone of the pushed state passes `npm run verify`.
3. Fresh backup, alongside `~/Documents/Projects/_backups/opengrail-pre-rewrite-20260830-093834/`.
4. Purge `public/artifacts/**` from all history, keeping the tip tree intact.
5. Verify: all 1,146 `.webp` files present on disk and tracked, `npm run verify` green,
   pack under 50 MB, `git log` still shows the full commit history.
6. Force-push. Re-clone locally to confirm what is actually on GitHub.

### Constraints on the rewrite

- **Not the swarm's work.** A force-push to a public repository is irreversible and
  outward-facing. It is run by hand, with the owner present, against a verified backup.
- The tip tree must be byte-identical before and after. The rewrite removes historical
  blobs at `public/artifacts/**`, not the current files.
- Expect commits that touched only artifact paths to become empty and be pruned. That
  happened in the first rewrite and was correct then.
- `ATTRIBUTIONS.md`, `NOTICE.md` and the `data/` records are untouched — the licensing
  record survives the rewrite intact, which is what makes it safe to do.

---

## Track 1 — Unblock the fresh clone (do first, ship separately)

The migration is several sessions of work. The public repository is broken now. Land the
minimum fix on its own so contributors are unblocked while the rest proceeds.

1. Move the one drifted file out of the fetched set: append its filename to
   `docs/unreproducible-artifacts.txt`, `git add -f` the local copy, rerun
   `npm run build:manifest` and `npm run derive:attributions`.
2. The counts asserted in `tests/artifact-manifest.test.js` are hard-coded at 120/1026 in
   two places (`:120`, `:128`, `:132`, `:159`) — update to 121/1025.
3. `npm run verify` must return green, and a genuine clean-clone test must pass before this
   is called done. The last one was skipped and that is how the defect shipped.

This is throwaway work that Track 3 deletes. Do it anyway; it costs an hour and it is the
difference between a broken public repository and a working one for however long the
migration takes.

## Track 2 — Restore MIT licence detection

Independent of everything else, no code involved.

1. `LICENSE` becomes **verbatim MIT**, byte-identical to the canonical template — no
   preamble, no heading, no scoping paragraph, no `---`. GitHub's licence matcher is a text
   comparison and the current preamble is why the repository reports NOASSERTION while the
   README shows an MIT badge.
2. Move the scoping sentence into `NOTICE.md`, which already carries the artifact terms.
   It needs to say plainly what `LICENSE` no longer says: the MIT grant covers the
   application source, the authored records under `data/`, and the documentation, and does
   not extend to third-party works under `public/artifacts/**`.
3. `README.md`'s License section already states the split correctly and links both files.
   Verify it still reads true after the edit; no change expected.
4. Confirm after push that GitHub's sidebar reports "MIT License".

Note for Track 4: `NOTICE.md` currently cites `data/artifact-manifest.json` as the
machine-readable provenance record. That file is being deleted — the pointer becomes
`public/graph.json` alone.

## Track 3 — The migration

**3a. Add the encoder.** `sharp` as a `devDependency`. It is the only new dependency and it
is build-time only — nothing ships to the client. `cwebp` is not installed on this machine
and `sips` cannot write WebP, so this is not optional.

**3b. Write `scripts/build-thumbnails.js`.** One script, replacing three.

- Reads the artifact list from `public/graph.json` (which already carries every
  `imageUrl`, `sourceUrl`, `title` and `provenance` for all 1,146).
- Source images come from whatever is on disk under `public/artifacts/` — this script is
  run **once**, by the maintainer, against the full-size library that exists locally today.
  It is not part of `npm run build` and contributors never run it.
- `sharp(...).resize({ width: N, height: N, fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 80 })` where N is 1024 when the artifact carries `detail: high`, else
  480. `withoutEnlargement` matters: one file in a 61-file sample is already under 640px
  and must not be upscaled.
- Writes `<basename>.webp` and rewrites the corresponding `imageUrl` in the tradition's
  Markdown frontmatter under `data/`, preserving every other byte — the same
  frontmatter-surgical discipline the curation pipeline already uses. All 1,146 filenames
  change extension (1,098 `.jpg`, 48 `.png`), so this rewrite is not optional.
- `sourceUrl` is never touched. It already points at the exact Commons `File:` page for all
  1,146 artifacts (verified), and it is what the click-through opens.

**Runtime is not a constraint.** Measured: `sharp` encodes the whole 1,146-file library at
640px in about **8 seconds** on this machine, running the resizes in parallel. Do not build
batching, resumability, or progress checkpointing around a non-problem. The thing that runs
long in this migration is the agent authoring the changes, not the encode.

**3c. Run it, commit the WebP files, delete the originals.** Expected: ~71 MB across 1,146
`.webp` files, all tracked.

**3d. Delete the redundant machinery.**

- `scripts/fetch-artifacts.js`
- `scripts/build-artifact-manifest.js`
- `data/artifact-manifest.json`
- `docs/unreproducible-artifacts.txt`
- The `fetch:artifacts` and `build:manifest` scripts in `package.json`
- The entire vendored/fetched block in `.gitignore` — `public/artifacts/**` plus 120 `!`
  re-inclusion lines, roughly 4.5 KB of the 5.6 KB file. `public/artifacts/` becomes
  ordinarily tracked, with no ignore rules at all.
- The 795 MB fetch step and its explanatory blockquote in `README.md`'s Quick Start.

**3e. Repoint `derive-attributions.js` at `graph.json`.** This is the one non-mechanical
piece of the deletion. `scripts/derive-attributions.js:131` reads
`data/artifact-manifest.json`; `generateAttributionsMarkdown()` needs only `filename`,
`title`, `provenance` and `sourceUrl` per entry, all of which are in `graph.json` node
artifacts. Build the same shape from `graph.json`, sorted by filename for determinism, and
keep the generated `ATTRIBUTIONS.md` output byte-identical apart from the `.jpg`/`.png` →
`.webp` filenames in the first column. The drift check on this file stays — as the notes
put it, drift there is a licence violation rather than a formatting nit.

**3f. Rewrite `tests/artifact-manifest.test.js`.** Rename to `tests/artifact-licensing.test.js`.
The checksum, size, vendored/fetched-classification and `.gitignore` subtests all delete
with the manifest. What must survive, rewritten against `graph.json` and disk:

- exactly 1,146 artifacts in `graph.json`, each with a non-empty `title`, `provenance`, an
  `imageUrl` under `/artifacts/`, and a `sourceUrl` matching
  `https://commons.wikimedia.org/wiki/File:`
- `public/artifacts/` contains exactly 1,146 files, all `.webp`, one per `imageUrl`, with
  no orphans in either direction
- **no file exceeds 1600px on its long edge**, and no artifact without `detail: high`
  exceeds 640 — this is the invariant that stops the library silently re-inflating
- `ATTRIBUTIONS.md` matches `generateAttributionsMarkdown()` exactly and has a row per
  artifact

That last size assertion is the replacement for checksum pinning: it constrains *our* bytes
rather than Wikimedia's, so it cannot rot.

**3g. Lightbox affordance.** `src/components/Lightbox.tsx:93` already resolves `sourceUrl`
and renders it, so the click-through works today with no change. But the link currently
reads "Verify entry on Wikipedia / Archive", which described a verification link sitting
under a full-resolution image. It is now the only route to the full-size original, and the
label should say so — "View the full-size original on Wikimedia Commons" or similar. This
is a navigation to a new tab, not a subresource, so the deploy CSP `img-src 'self' data:`
is untouched and no request reaches Wikimedia until a user deliberately clicks. Keep
`target="_blank" rel="noopener noreferrer"`.

Do not add a hotlinked `<img>` anywhere, under any conditional. The CSP would block it, it
would leak every visitor's IP and referrer to Wikimedia in a project that is deliberately
tracker-free, and Wikimedia asks people not to.

**3h. Print stylesheet.** `src/index.css:4018` sets `.artifact-card__image { max-height: 240px }`
for the PDF/print export path. At 640px a 240px print box is fine at ~2x, so the export
survives the change intact. No action needed; noted so it is not re-investigated.

## Track 4 — Documentation

1. **`CONTRIBUTING.md` — new "Editing a tradition's artifacts" section**, placed after the
   Frontmatter Reference. It should say:
   - artifacts live in the tradition's own Markdown frontmatter as
     `{ title, imageUrl, sourceUrl, provenance, period, description }` (plus optional
     `detail`), and that file is the only place to edit them
   - `imageUrl` and `sourceUrl` are independent: the committed thumbnail and the page it
     links to can be changed separately, and neither has to come from Commons
   - to replace an image: drop a WebP of 640px (or 1600px with `detail: high`) long edge
     into `public/artifacts/`, point `imageUrl` at it, run `npm run build:graph` and
     `npm run derive:attributions`, and commit both
   - `provenance` must name the author and licence, because `ATTRIBUTIONS.md` is generated
     from it and a wrong value is a licence violation
   - only permissively licensed images (Public Domain, CC0, CC-BY, CC-BY-SA) may be added
   - the existing "static-first and tracker-free" standard already forbids hotlinking; the
     new section should point at it rather than restate it

   Once the manifest is gone, editing an image is edit-and-rebuild, with no checksum layer
   to defeat. Say that explicitly — it is the contributor-facing point of this whole change.

2. **`README.md`**: delete the fetch step and its blockquote from Quick Start (Quick Start
   becomes clone → `npm install` → `npm run dev`), and adjust "Museum-Grade Visual
   Artifacts" so it does not imply full-resolution originals ship with the repository —
   thumbnails, with a click-through to the original on Commons.

3. **`AGENTS.md`**: no change needed. Its rules survive intact.

4. **`PROJECT_NOTES.md`**: overwrite the Handoff block; append a Decisions Log entry
   recording the measured two-tier size choice and the clone-size correction in section 5.

## Track 5 — Deploy repository

`~/Documents/Projects/CalmdownOscar` is not a second migration. Verified: its `opengrail/`
directory is a committed copy of this project's `dist/`, and `dist/` is 828 MB purely
because Vite copies `public/artifacts/` into it. Rebuild here after Track 3 and `dist/`
comes out at roughly 45 MB on its own.

So the working-tree fix is the existing deploy procedure with nothing added: build here,
replace `CalmdownOscar/opengrail/` with the fresh `dist/`, commit, push, Vercel deploys.
Confirm afterwards that `img-src 'self' data:` in that repo's `vercel.json` is unchanged
and that the Commons links open in a new tab from the live site.

Its history is the same decision as section 5, and carries the same answer. That
repository's pack is **1.06 GiB** and deleting 823 MB from the working tree does not shrink
it; it is public with 0 forks. **Decision (owner, 2026-08-30): purge it too.** Same
sequencing and same constraints as section 5 — after the deploy lands and is verified live,
by hand, against a fresh backup, never by the swarm. Do both rewrites in the same sitting
so there is one window in which clones break rather than two.

---

## Verification gate

`npm run verify` must be green at the end of every track, not just at the end. Beyond that:

- **A real clean-clone test.** `git clone` to a fresh directory, `npm install`,
  `npm run verify`, `npm run dev`, and load the app. This was skipped before the repository
  went public and that is precisely how the current defect shipped. It is the one check
  that cannot be substituted.
- **Browser pass** per `AGENTS.md`: search, filters, graph selection, document panes,
  backlinks, nested branch navigation. Specifically confirm artifact cards render, the
  lightbox opens, and the Commons link opens the right file page in a new tab.
- **Spot-check legibility** on several `detail: high` artifacts at 1600px and several
  ordinary ones at 640px, in the lightbox at real size, before committing 1,146 files.
- **Confirm no network request reaches Wikimedia** on page load, in the network panel.
- Graph invariants unchanged: 573 nodes, 903 links, no duplicate IDs, missing targets,
  isolated nodes, or branch cycles.

## Out of scope

- Any change to which artifacts are curated, or to their titles, provenance, or descriptions.
- Generated or AI imagery. Rejected on 2026-08-30 and not reopened here.
- The history rewrites in section 5 and Track 5 — decisions for the owner, sequenced after
  this work lands.
- The untracked `* 2.md` / `* 2.js` conflict copies in the working tree
  (`AGENTS 2.md`, `ATTRIBUTIONS 2.md`, `PROJECT_NOTES 2.md`,
  `scripts/derive-attributions 2.js`, `tests/artifact-manifest.test 2.js`). Unrelated sync
  debris, safe to delete, not this plan's business.
