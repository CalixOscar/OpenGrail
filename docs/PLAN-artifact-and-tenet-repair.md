# Plan — repair truncated tenets and unverifiable artifact captions

Written by Claude 2026-09-04 after auditing this repo at `1eb7549`. Baseline verified
before writing: `npm run build:graph` regenerates `public/graph.json` byte-identically,
`npm test` passes 102/102, `npm run audit:geo` reports **0 defaulted pins**.

**Do not touch origin data.** The origin-geo work recorded in the Handoff and in
`docs/origin-geo-resolutions.md` is correct and finished. Quakers resolves to Pendle Hill,
Lancashire; the largest shared `place_name` is Baghdad with 7 nodes. Leave `origin_geo`,
`origin_year` and `origin_geo_precision` alone in every record. **Never run
`scripts/enrich-all-locations.js`** — the Handoff is explicit about this.

**Never widen an audit's exemptions to make a count go green.** A previous execution pass
did exactly that to `scripts/audit-origin-geo.js` and turned a true count of 2 into a
reported 0. It was reverted. If a number will not come down, say so in the Handoff; do not
adjust the instrument.

Work in two phases. **Finish and verify Phase A before starting Phase B**, and commit them
separately.

---

## Context: why this repo and the deployed site disagree

`~/Documents/Projects/CalmdownOscar/opengrail/` is a vendored copy of this project's build
output. It was hand-patched there rather than here, so the two have diverged and **neither
is currently shippable**:

| | Origin pins | Truncated tenets |
|---|---|---|
| Deployed copy (CalmdownOscar) | broken — 127 nodes on "Jerusalem, Southern Levant" | 0 — hand-patched |
| This repo | correct — max 7 nodes share a place | **934 of 2086** |

So a naive rebuild-and-redeploy would fix the origins and *regress* the tenets. Phase A
closes that gap. The redeploy itself is handled outside this plan — do not write anything
into the CalmdownOscar folder.

---

## Phase A — repair the 934 truncated tenets

`key_tenets` entries were cut mid-word by a generator character budget, e.g. in
`data/abrahamic/christian/protestant/quakers.md`:

```
- >-
    Foundational Doctrine: The Religious Society of Friends arose amid the
    religious upheaval of seventeenth-century England. George Fox and other
    traveling ministers rejected compulsory ...
```

**These are recoverable with no content generation.** Each truncated tenet is a literal
prefix of a paragraph already present in the same file's Markdown body. For the example
above, the `## Historical context` section begins with exactly that text and continues
"...rejected compulsory tithes, a professional clergy, and fixed sacramental rites,
enduring imprisonment and public hostility."

I verified this across the whole corpus: **934 truncated tenets, 934 of which prefix-match
a body paragraph in their own file. Zero exceptions.**

The mapping is consistent:
- `Foundational Doctrine:` → the `## Historical context` section
- `Distinctive Practice:` → the `## Distinctives and comparative notes` section
- `Core Orientation:` → the `summary` frontmatter field (these are generally not truncated)

### How to repair

Write a script (`scripts/repair-truncated-tenets.js`) that, for each record:

1. Finds each `key_tenets` entry ending in `...` or `…`.
2. Strips the `Foundational Doctrine: ` / `Distinctive Practice: ` label prefix.
3. Normalises whitespace and locates that fragment as a prefix of a body-section paragraph
   in the same file.
4. Extends the fragment forward to the **next sentence boundary at or after the truncation
   point**, then re-attaches the label. Do not paste the entire paragraph — end on a clean
   `.`/`?`/`!` so the tenet stays a tenet, not a wall of prose.
5. Rewrites the YAML frontmatter preserving the existing block style and indentation.

Hard requirements:
- **Recovered text must be copied verbatim from the body.** Never paraphrase, summarise,
  or invent a completion. If a fragment does not prefix-match a body paragraph, leave it
  untouched and list it in the run's report.
- Do not alter any field other than `key_tenets`.
- The script must be idempotent — a second run makes no changes.

### Phase A verification

```
node scripts/repair-truncated-tenets.js          # then run it a second time: 0 changes
npm run build:graph
npm test                                          # must stay 102/102
npm run audit:geo                                 # must stay 0 defaulted pins
node -e "const g=require('./public/graph.json');const t=g.nodes.flatMap(n=>n.keyTenets||[]);console.log('tenets',t.length,'truncated',t.filter(x=>/(\.\.\.|…)\s*$/.test(x)).length)"
```

The last command must print `truncated 0`. Commit Phase A on its own.

---

## Phase B — stop asserting captions the sources do not support

This is the finding that matters most, and the reason this plan exists.

Artifact captions were generated *alongside* the image search rather than *derived from*
the file that was actually retrieved, so a caption can describe something the image is not.
Confirmed examples in this repo's own data:

- `data/esoteric-modern/aa-thelema.md` — captioned **"A∴A∴ founder Aleister Crowley"**,
  sourced from `File:Tree_of_life_kircher_plain_color.png`, a Kabbalistic diagram. Not a
  portrait of anyone.
- The same record's second artifact is captioned **"Original A∴A∴ Equinox publication"**
  and sourced from `File:Aboard_the_Celebrity_Equinox_on_a_Transatlantic_Cruise_(6690584345).jpg`
  — a photograph of a cruise ship, matched on the word "Equinox".
- `data/abrahamic/.../advent-christian-church.md` — captioned **"Portrait of George Storrs,
  formative Advent Christian conditionalist preacher"**, sourced from
  `File:Imperial_War_Cabinet_in_1917.jpg`.

A caption-vs-source-filename heuristic flags **408 of 1184** artifacts. That number is a
review queue, not a defect count — it produces false positives on concatenated filenames
(`File:KaufmannManuscript.jpg` genuinely matches "Kaufmann Mishnah manuscript") and it
cannot see a wrong image behind a camera-roll filename like `File:101_0123.JPG`. Treat 408
as where to look first, not as the answer.

### The architecture, not a re-run

Do **not** re-run a caption-generation pass. That is the process that produced these
errors, and it will produce a fresh set. Apply the pattern that already worked for origin
pins in `docs/origin-geo-resolutions.md`: **a claim is derived from a source and the
derivation is recorded so a reviewer re-derives it instead of trusting it.**

For every artifact across all 696 records:

1. Fetch the real file metadata from the Wikimedia Commons API for its `sourceUrl`
   (`action=query&prop=imageinfo&iiprop=extmetadata|user|url`). Reuse the polite
   `User-Agent` pattern already in `scripts/batch-fetch-wikipedia-artifacts.js`, throttle
   requests, and cache responses to disk so the pass is resumable and re-runnable without
   re-fetching.
2. Compare the file's **actual** subject — its `ObjectName`, `ImageDescription`, and
   categories — against the tradition the artifact is attached to.
3. Then classify each artifact:
   - **Supported** — the file's real subject plainly belongs to this tradition. Rewrite
     `title` so it describes what the file actually depicts, grounded in the Commons
     metadata. Refresh `provenance` from the real `Artist`/`LicenseShortName`.
   - **Unsupported** — the file's real subject is unrelated (the cruise ship, the War
     Cabinet). **Remove the artifact from the record.** Do not re-caption it, and do not
     go looking for a replacement image in this pass.
   - **Undetermined** — metadata too thin to tell (bare camera filenames, no description).
     **Remove it as well.** Under-illustrating is recoverable; a confident wrong caption is
     the thing we are fixing.
4. Delete the boilerplate `description` field wording
   `"This image shows X, selected as a defining visual reference for Y."` It asserts an
   editorial selection that never happened. Either carry the real Commons description or
   drop the field.
5. Record every decision in `docs/artifact-source-resolutions.json` — one entry per
   artifact with its `sourceUrl`, the Commons `ObjectName`/description you read, the
   verdict, and the resulting caption. This file is the evidence trail; a reviewer must be
   able to re-derive any caption from it without network access.

Records may end up with fewer than two artifacts, or none. That is an acceptable and
expected outcome. If `scripts/audit-artifacts.js` enforces "expected exactly two
artifacts", relax **that specific structural rule** to a minimum of zero and note it —
this is not the same thing as widening an exemption to hide a defect, and it should be
called out explicitly in your report.

### Phase B verification

```
npm run build:graph
npm test
npm run audit:geo                                 # still 0 defaulted pins
node scripts/print-artifact-counts.js
```

Then confirm by hand that all three canaries above are resolved — each is either removed
or carries a caption that matches its actual Commons file. State the final artifact count
and how many were removed. Commit Phase B separately from Phase A.

---

## When you finish

Overwrite the Handoff section of `PROJECT_NOTES.md` using its existing fixed fields, and
append one dated Decisions Log entry (under ~150 words) recording the principle that a
caption must be derived from its source and the derivation recorded — pointing at
`docs/artifact-source-resolutions.json` and this plan by path rather than restating them.
Preserve the existing Handoff note about Step 3.1 of the origin-geo plan still being open;
that work is unrelated to this plan and must not be marked done.

Move this plan file from the repo root to `docs/PLAN-artifact-and-tenet-repair.md` as your
last action. Leave all commits local — do not push.
