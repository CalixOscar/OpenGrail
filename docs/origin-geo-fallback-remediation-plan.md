# Origin-Geo Fallback Remediation Plan

**Status:** planned, not built. Written 2026-08-31.
**Sequencing:** Do NOT start until the 122-tradition corpus expansion and the 13-batch
artifact curation pass are finished and the working tree is committed. This plan edits
`origin_geo` frontmatter across `data/` and touches `tests/data-invariants.test.js`;
running it concurrently with the expansion session guarantees conflicts.
**Goal:** Every pin on the globe should be a sourced claim. Today, 301 of 696 traditions
(43%) carry a coordinate that is an unverified cluster default, and 833 of 1,088
relationship arcs (77%) touch at least one of them. Phase 4 folds in three adjacent defects
found in the same audit.

---

## The finding

The question that surfaced this: does OpenGrail claim all religions descend from Nigerian
shamanic ritual? The link data says no. The globe says yes to the naked eye.

**The link data is innocent.** `shamanic-traditions` carries 11 of 1,088 links
(6 `branch_of`, 5 `parallel_concept`), and its own body text in
`data/comparative-frameworks/shamanic-traditions.md` disclaims exactly that reading:
"an analytical family resemblance, not a claim that all ritual mediators descend from one
prehistoric religion."

**The geography is not.** Thirteen nodes are pinned to Ile-Ife, Osun State — among them
three high-degree comparative umbrellas (`animist-frameworks` 35 links,
`ancestor-veneration` 19, `shamanic-traditions` 11). `WorldMapView.tsx:312-323` draws an
arc for every link whose endpoints both carry geo, so a node's visual weight on the globe
is its degree, not its historical standing. Roughly 65 great-circle arcs converge on one
point in southwestern Nigeria. The deterministic lat/lng jitter applied at the tail of
`scripts/enrich-all-locations.js` spreads the thirteen pins a few kilometres apart, which
disguises the fact that they are one value.

**Root cause:** `scripts/enrich-all-locations.js:646-658`. After a long id/path matcher
comes a cluster fallback block, ending in a global `return HISTORICAL_PLACES.geneva`:

```js
if (node.cluster === "Abrahamic")             return HISTORICAL_PLACES.jerusalem;
if (node.cluster === "Dharmic")               return HISTORICAL_PLACES.varanasi;
if (node.cluster === "Indigenous & Diasporic") return HISTORICAL_PLACES.ile_ife;
…
return HISTORICAL_PLACES.geneva;
```

The matcher's Yoruba rule (`:559`) is correct. The fallback below it silently extends
Ile-Ife to Senegambia, Ethiopia, Igboland, Trinidad, the Americas, and to umbrella concepts
that have no origin at all — and does the same thing in every other cluster.

**Measured extent.** Re-running the resolver read-only over `data/` and comparing its output
to each file's current frontmatter: 437 of 696 files fall through the matcher to a cluster
default. 136 of those have since been hand-corrected and now hold a real pin. The remaining
**301 still sit on the default**:

| Cluster | Default pin | Defaulted nodes |
| :--- | :--- | ---: |
| Abrahamic | Jerusalem | 128 |
| Dharmic | Varanasi | 79 |
| Esoteric & Modern | London | 35 |
| East Asian | Qufu | 17 |
| Ancient Near East | Babylon | 16 |
| Ancient Mediterranean | Athens | 9 |
| Indigenous & Diasporic | Ile-Ife | 9 |
| Ancient European | Old Uppsala | 7 |
| Speculative | Geneva | 1 |

Every one of the fifteen highest-degree nodes in the graph is on a defaulted pin:
`christianity` (51), `animist-frameworks` (35), `buddhism` (29), `protestantism` (26),
`hinduism` (24), `catholicism` (22), `western-esotericism` (21), `sufism` (20),
`eastern-orthodoxy` (19), `ancient-greek-religion` (19), `ancestor-veneration` (19),
`daoism` (19), `judaism` (17), `shinto` (17), `confucianism` (15).

Some defaults are near-harmless (`judaism` on Jerusalem). Others are plainly wrong and are
currently rendering as fact: `ancient-egyptian-religion` pinned to **Babylon**;
`shinto` and `quanzhen-daoism` to **Qufu**; `celtic-religion` and `gaulish-religion` to
**Old Uppsala**; `mithraism` and `cult-of-isis` to **Athens**; `mandaeism` and `yazidism`
to **Jerusalem**; `ancient-astronaut-theory` to **Geneva**.

---

## Three treatments

| Class | Treatment |
| :--- | :--- |
| Real tradition, real origin | pin it, with a citation |
| Real tradition, wrong pin | correct the coordinates |
| Comparative umbrella, no origin | remove `origin_geo`; set `origin_geo_precision: none` |

Removing geo is the right call for umbrellas, not relocating them. `animist-frameworks` has
no birthplace to be wrong about; any pin is a fabricated claim, and the highest-degree nodes
do the most damage. `WorldMapView.tsx:312` and `:374` already skip nodes and links without
geo, so they drop off the globe cleanly and remain fully present in the graph, list, search,
and document views.

---

# Phase 1 — The Nigeria cluster (small, self-contained, do first)

Nine Indigenous & Diasporic nodes plus four matched ones sit on Ile-Ife. `ifa` and
`yoruba-religion` are correct and stay.

## Step 1.1 — Correct the mislocated traditions

Coordinates below are proposals. Each must be checked against the project's sourcing
standard and carry a defensible citation before it lands.

| Node | Current | Proposed | Rationale |
| :--- | :--- | :--- | :--- |
| `serer-religion` | Ile-Ife | Diakhao, Sine, Fatick, Senegal (14.3392, -16.4114) | Serer heartland is Senegambian; the Sine royal seat is the conventional anchor |
| `waaqeffanna` | Ile-Ife | Odaa Nabee, near Bishoftu, Oromia, Ethiopia (8.7522, 38.9969) | Oromo tradition; Odaa Nabee is a *gadaa* assembly site |
| `odinani` | Ile-Ife | Nri, Anambra, Nigeria (6.0833, 6.9667) | Igbo, not Yoruba; Nri is the ritual centre |
| `trinidad-orisha` | Ile-Ife | Port of Spain, Trinidad (10.6549, -61.5019) | Trinidadian; its Yoruba descent belongs in `relations`, not in the pin |
| `aladura-movement` | Ijebu-Ode / Abeokuta | verify only | Plausible already; confirm it was matched, not defaulted |

Edit frontmatter in place. Do **not** re-run `enrich-all-locations.js` to do this — it is a
one-shot backfill and re-running it re-applies the fallback.

## Step 1.2 — Remove geo from the six umbrellas

`shamanic-traditions`, `animist-frameworks`, `ancestor-veneration`,
`african-indigenous-traditions`, `african-diasporic-traditions`,
`indigenous-american-religions`. Delete the `origin_geo` block; add
`origin_geo_precision: none`. This trips an existing gate, which Step 1.3 handles.

## Step 1.3 — Relax the origin_geo invariant

`tests/data-invariants.test.js:187` asserts *every* node has `origin_geo`, so Step 1.2 fails
the suite as written. Change the assertion to: a node must either carry a valid `origin_geo`
or declare `origin_geo_precision: none`.

`origin_geo_precision` already exists end-to-end — `scripts/schema.js:251,562,599` and
`src/types/schema.ts:237` — and no data file uses it yet. Adding `none` as a recognised
value makes "this concept has no birthplace" explicit, greppable, and reviewable rather
than a silent omission. Document the value in the contributor contract
(`npm run verify:schema` covers it) so future traditions inherit the convention.

---

# Phase 2 — The remaining 292 defaulted pins

Same defect, larger surface. Work it cluster by cluster, largest first, as independent
committable passes. This is deliberately the bulk of the effort and should not be attempted
in one sitting.

## Step 2.1 — Land an audit script

Promote the throwaway used to produce the table above into `scripts/audit-origin-geo.js`,
wired as `npm run audit:geo`. It re-runs the resolver read-only over `data/`, compares
against current frontmatter, and reports every node whose pin still equals its cluster
default. Output: cluster, id, current pin, degree — sorted by degree, because degree is what
the globe amplifies. This is the progress meter for the rest of Phase 2 and the guard in
Step 3.2.

## Step 2.2 — Triage by degree, not by cluster order

Within each cluster, correct highest-degree nodes first. A wrong pin on `christianity` (51
arcs) distorts the globe fifty times more than a wrong pin on a leaf node. The fifteen nodes
listed above are the first fifteen fixes in the whole of Phase 2, regardless of cluster.

## Step 2.3 — Cluster passes

| Pass | Cluster | Nodes | Notes |
| :--- | :--- | ---: | :--- |
| 2.3a | Ancient Near East | 16 | Most clearly wrong and smallest cost to fix — `ancient-egyptian-religion` on Babylon. Good pilot for the review rhythm. |
| 2.3b | Ancient European | 7 | Celtic/Gaulish/Baltic/Slavic/Finnish each need their own anchor, not Uppsala. |
| 2.3c | Ancient Mediterranean | 9 | Mithraism and the Isis cult are diffusion traditions; several may warrant `origin_geo_precision: region`. |
| 2.3d | East Asian | 17 | Qufu is Confucius's hometown and is wrong for every Daoist, folk, and salvationist node. |
| 2.3e | Esoteric & Modern | 35 | London is doing what Ile-Ife was doing. Many are 20th-c. US or continental; several parody religions may be genuinely place-less. |
| 2.3f | Dharmic | 79 | Largest after Abrahamic. Many schools have a real monastic or textual seat; expect a long tail. |
| 2.3g | Abrahamic | 128 | Do last. Jerusalem is defensible for a handful and indefensible for most; the volume makes it the biggest research load. |
| 2.3h | Speculative | 1 | `ancient-astronaut-theory` — almost certainly `origin_geo_precision: none`. |

Each pass: correct what can be sourced, mark what cannot with `origin_geo_precision: none`,
regenerate, run `npm run audit:geo` to confirm the cluster's count reached zero, commit.

## Step 2.4 — Allow honest imprecision

Not every tradition has a point origin, and forcing one is how this defect started. Where a
tradition is genuinely regional or diffuse, set `origin_geo_precision: region` (already a
documented value, per `scripts/schema.js:255`) alongside a deliberately coarse coordinate,
and leave a note in the body text. Reserve `none` for concepts with no origin at all.
Consider — but do not build in this plan — rendering `region` pins differently on the globe
so imprecision is visible rather than implied.

---

# Phase 3 — Make the defect unrepeatable

## Step 3.1 — Kill the silent fallbacks

In `scripts/enrich-all-locations.js`, replace the cluster fallback block and the `geneva`
catch-all with a hard failure: log the unresolved node id and exit non-zero rather than
inventing a location. Any future backfill surfaces its gaps instead of burying them. The
script is not in `npm run verify` or any build path, so this is a safety change for the next
person who runs it, not a pipeline change.

## Step 3.2 — Regression-guard the count

Add an assertion to `tests/data-invariants.test.js` (or a new `origin-geo.test.js`) that the
number of nodes still sitting on a cluster default does not increase. Seed the threshold at
whatever Phase 2 leaves behind and ratchet it down as passes land. This is what stops the
next 122 traditions from quietly re-introducing the problem — the current expansion authors
real coordinates by hand, but nothing in the suite requires that.

## Step 3.3 — Write the rule down

Append to the `PROJECT_NOTES.md` Decisions Log: **a node gets a pin only where a real origin
can be cited; regional traditions get `origin_geo_precision: region`; comparative umbrellas
get `origin_geo_precision: none` and stay off the globe.** Mirror it in `CONTRIBUTING.md`
next to the frontmatter contract.

---

---

# Phase 4 — Adjacent defects found in the same audit

Folded in 2026-08-31 after the Korea question. Same family — a silent default standing in
for a fact — but different mechanisms, so they are tracked separately from the fallback work
above. Do them in the same window as Phase 2; the research effort overlaps heavily.

## Step 4.1 — Substring false positives in the matcher

The id matcher uses bare `id.includes()` with short literals, so unrelated traditions get
captured by rules meant for something else. `scripts/enrich-all-locations.js:513`:

```js
if (id.includes("thelema") || id.includes("oto") || id.includes("ordo-templi")) return HISTORICAL_PLACES.cairo;
```

`"oto"` matches **`soto-zen`** and **`omoto`** — a Japanese Zen school and a Japanese
Shinto-derived new religion, both currently pinned in **Cairo, Egypt**. Verified in
`public/graph.json`.

Other short-literal rules that capture more than one id and need review:
`"shaker"` (`:508`, catches `indian-shaker-church` alongside `shakers` — the Pacific
Northwest pin happens to be right, by luck of rule order), `"wicca"` (`:514`, sends
`dianic-wicca` to the New Forest when it is 1970s Los Angeles), `"vodun"` (`:560`),
`"latter-day-saint"` (`:496`).

Fix: anchor the rules — exact id match or `startsWith`/`endsWith` with explicit id lists —
and correct the nodes already mis-pinned by them. Cheap and high-value: these are unambiguous
errors, not judgement calls.

## Step 4.2 — `era_start` strings that do not parse, silently becoming year 0

49 nodes carry `origin_year: 0`. None of them began in 1 CE. `parseYear` in
`scripts/enrich-all-locations.js` returns 0 for any `era_start` it cannot read, and the
narrative values in the corpus defeat it:

| Node | `era_start` | Stored `origin_year` |
| :--- | :--- | ---: |
| `korean-shamanism` | `ancient` | 0 |
| `shinto` | `ancient` | 0 |
| `chinese-folk-religion` | `ancient` | 0 |
| `ifa` | `precolonial era` | 0 |
| `dangun-veneration` | `medieval roots; modern revival` | 0 |
| `mizrahi-judaism` | `Ancient–modern` | 0 |

The affected set is overwhelmingly Indigenous, African, Oceanic, and East Asian —
`african-indigenous-traditions`, `ainu-religion`, `akan-religion`, `anishinaabe-religions`,
`aymara-religions`, `cherokee-religions`, `dine-religion`, `dinka-religion`,
`dogon-religion`, `guarani-religions`, `hopi-religion`, `inuit-religion`, `lakota-religion`,
`maasai-religion`, `malagasy-religion`, `melanesian-religions`, `micronesian-religions`,
`mongolian-shamanism`, `odinani`, `quechua-religions`, `ryukyuan-religion`,
`samoan-religious-traditions`, `serer-religion`, `shona-religion`, and more. Precisely the
traditions whose `era_start` was written as prose rather than a date.

Consequence: `isNodeTemporallyVisible` (`src/state/temporalVisibility.ts:29-30`) hides any
node whose `origin_year` exceeds the scrubber year, so on the timeline these 49 traditions
do not exist before 1 CE and then all appear at once. Shinto and Korean shamanism postdate
Christianity on the scrubber. This is an editorial defect, not just a cosmetic one, and it
falls disproportionately on non-Western traditions.

Fix, in order:

1. Extend `parseYear` to recognise the narrative vocabulary actually used in the corpus
   (`ancient`, `prehistoric`, `precolonial`, `medieval`, `antiquity`, ranges with an en
   dash), or reject them loudly rather than returning 0.
2. Set a real `origin_year` per node, using `origin_year_precision` — already in the schema
   at `scripts/schema.js:244` and unused — to mark it as approximate.
3. Add a data invariant: `origin_year === 0` requires an explicit
   `origin_year_precision` acknowledging it, so the silent-zero case cannot come back.

## Step 4.3 — The regional coverage gaps this produces

Binning all 695 nodes by their current pin:

```
Levant/Arabia 191 · Europe 150 · South Asia 127 · N America 72 · East Asia 66
Sub-Saharan Africa 34 · SE Asia 20 · C/S America 17 · Oceania 10 · N Africa 1 · Siberia 1
```

**North Africa holds one pin** for the whole corpus. Not because the corpus lacks North
African traditions but because they were defaulted away: `ancient-egyptian-religion` sits in
Babylon, `coptic-orthodoxy` in Jerusalem, `coptic-catholic-church` in Rome, `hermeticism` in
London. Egypt's actual pins are the Theban cult nodes plus, absurdly, `soto-zen` and `omoto`
via Step 4.1. Fixing Phase 2 and Step 4.1 will repopulate these regions on its own — the
blank areas are a symptom, and the coverage table above is the honest measure of progress.

## Step 4.4 — Korea specifically

Checked, because it prompted this phase. Korea is **not** empty in the data: `cheondoism`,
`daejonggyo`, `dangun-veneration`, `jeungsanism`, `korean-shamanism`, `shincheonji`,
`unification-movement`, and `won-buddhism` all carry correct South Korean coordinates.
`korean-confucianism` is the exception — pinned to **Qufu, China** by the `/korean/` path
rule losing to an earlier Confucian rule. Fix it with Step 2.3d.

Why it reads as empty is a rendering problem, not a data one. The eight pins span 1.8° of
latitude and 0.5° of longitude. At the default globe scale (`WorldMapView.tsx:553`,
radius = `min(w,h) * 0.42`) that is about 10 x 3 px at 1280x720, against a node core radius
of 4.2px and a halo of 2.8x that (`:406`). Eight overlapping halos merge into a single
smudge on the edge of the dense China/Japan mass. Labels only render on hover, select, or
search (`:439`), so nothing names it. The same collapse will affect any tight national
cluster — Japan, the Levant, Punjab.

Worth a separate look after Phase 2, since the fix is a globe-rendering decision
(cluster-aware spiderfying at low zoom, or scale-dependent radii) and not a data edit.
**North Korea genuinely has zero traditions** and that is a real corpus gap: Juche as a
political religion, the Chondoist Chongu Party, and the pre-1945 Pyongyang Protestant
mission are all candidates. Route it to the corpus expansion backlog, not here.

---

## Verification

```bash
npm run build:graph && npm run audit:geo && npm test
```

Then confirm on the globe: Ile-Ife carries only `ifa` and `yoruba-religion`; no arc
originates from a node marked `origin_geo_precision: none`; and the Jerusalem, Varanasi, and
London pin clusters have visibly thinned.

## Handoff

Phase 4 is independent of Phases 1-3 and can be picked up by a second person; Step 4.1 is
the cheapest win in the whole plan. Phase 1 is eleven data files and one test — a single sitting. Phase 2 is the real work and
is structured as eight independently committable passes. Phase 3 is small and should land
immediately after Phase 1 so that Phase 2 has a meter to work against. Start only after the
expansion session commits.
