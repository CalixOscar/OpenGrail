# Sacred Sites Plan

**Status:** planned, not built. Written 2026-08-31.
**Sequencing:** After Phase 1 of `origin-geo-fallback-remediation-plan.md`, and ideally
after Phase 2. Sites and origins share the same geo plumbing; anchoring famous places while
43% of origin pins are still cluster defaults would put verified and unverified geography on
the same globe with no way to tell them apart.
**Goal:** Give each tradition the physical places it actually built and used — Giza, Angkor
Wat, Borobudur, Ise, Mecca, Chartres, Cusco — so the globe shows religion as architecture on
the ground, not only as one abstract origin dot per tradition.

---

## Why this is a new field, not more `origin_geo`

`origin_geo` answers "where did this begin" and takes exactly one point. Sacred sites are a
different relation: many per tradition, often shared between traditions, usually much better
attested than the origin, and each with its own date. The Hagia Sophia belongs to
`eastern-orthodoxy` and `sunni-islam` and `byzantine-christianity`; Angkor Wat is Vaishnava
then Theravada. Squeezing that into a single origin coordinate is what produced the defects
in the remediation plan.

Sites are also the strongest content in the corpus epistemically. A tradition's origin year
and birthplace are often contested; the coordinates of Borobudur are not. That makes them a
good candidate for a visually prominent layer.

---

## Step 1 — Content model

Add an optional `sacred_sites` array to the frontmatter contract in `scripts/schema.js`,
alongside `artifacts` (which is the closest existing precedent — an optional array of
structured records with provenance):

```yaml
sacred_sites:
  - name: Angkor Wat
    lat: 13.4125
    lng: 103.8670
    place_name: 'Angkor, Siem Reap, Cambodia'
    site_type: temple          # temple | shrine | monastery | pilgrimage | burial | sacred-natural | ruin
    built: 'c. 1113-1150 CE'
    status: unesco             # active | ruin | museum | unesco | destroyed
    role: >-
      State temple of Suryavarman II, dedicated to Vishnu; converted to Theravada
      Buddhist use from the late 13th century.
    source:
      title: 'UNESCO World Heritage: Angkor'
      url: 'https://whc.unesco.org/en/list/668'
```

Rules to encode in the contract and enforce in `tests/data-invariants.test.js`:

- Every site needs `name`, `lat`, `lng`, `place_name`, and a `source`. Coordinates without a
  citation are the exact failure mode Phase 1-3 exists to stop; do not reintroduce it here.
- `site_type` and `status` are closed vocabularies, validated like `epistemic_tier` and
  `EDGE_STYLES` already are.
- A shared site is duplicated in each tradition that used it, with its own `role` text
  describing that tradition's relationship to it. No cross-file references, no site registry
  — the Markdown-as-database decision (2026-08-27) stays intact.
- Coordinates must be real, checkable, and precise to the structure. UNESCO, Pleiades, and
  the relevant national heritage register are acceptable sources; a bare Wikipedia infobox
  is not, matching the standard the corpus already applies to artifacts.

## Step 2 — Seed set

Do not attempt comprehensive coverage. Target roughly 120-150 sites across a first pass,
chosen so every cluster and every populated region gets representation, and prioritising
places a general reader can name. Suggested batches, one commit each:

| Batch | Focus | Examples |
| :--- | :--- | :--- |
| 1 | Ancient Near East & Egypt | Giza, Karnak, Abu Simbel, Ziggurat of Ur, Göbekli Tepe |
| 2 | Dharmic | Angkor Wat, Borobudur, Bodh Gaya, Varanasi ghats, Kashi Vishwanath, Meenakshi, Golden Temple, Shatrunjaya, Ellora |
| 3 | Abrahamic - Levant & Arabia | Kaaba, Al-Masjid an-Nabawi, Temple Mount / Western Wall, Church of the Holy Sepulchre, Dome of the Rock, Mount Sinai |
| 4 | Christian Europe & Ethiopia | Hagia Sophia, St Peter's, Chartres, Santiago de Compostela, Mount Athos, Lalibela |
| 5 | East Asian | Ise Jingu, Todai-ji, Shaolin, Wudang, Qufu Temple of Confucius, Potala Palace, Haeinsa, Bulguksa |
| 6 | Americas & Oceania | Teotihuacan, Chichén Itzá, Tikal, Machu Picchu, Cusco Coricancha, Cahokia, Uluru, Rapa Nui moai |
| 7 | Africa & Indigenous | Ile-Ife Ooni's palace grove, Osun-Osogbo grove, Great Zimbabwe, Tsodilo Hills, Bandiagara |
| 8 | Esoteric, modern & contested | Salt Lake Temple, Bahá'í Gardens Haifa, Glastonbury, Stonehenge |

Batch 7 is worth doing early rather than last: Osun-Osogbo is a UNESCO site attached to a
tradition the corpus already covers well, and it gives Sub-Saharan Africa real verified
geography at the same time Phase 2 is stripping its fake pins.

## Step 3 — Build and rendering

`scripts/build-graph.js` emits `sacred_sites` onto each node unchanged, plus a flattened
`sites` array on the graph root for the map layer to iterate without walking every node.

On the globe (`src/components/WorldMapView.tsx`):

- Render sites as a distinct mark — small diamond or square outline, not the filled circle
  used for traditions — so a verified building is never confused with an abstract origin
  point. Colour by the owning tradition's cluster colour.
- Sites are a **toggleable layer**, off by default, consistent with the "chrome is summoned,
  not resident" decision (2026-08-30). Adding 150 always-on marks to a globe that already
  struggles with pin collapse (see Step 4.4 of the remediation plan) would make it worse.
- Selecting a tradition reveals its sites and draws a thin tether from each site to the
  tradition's origin pin. Selecting a site opens a small card: name, `role`, `built`,
  `status`, source link.
- A site used by several traditions is drawn once and lists all claimants in its card. That
  shared-site view is the most interesting thing this feature buys — it shows syncretism and
  conquest geographically, which the link graph can only state abstractly.

In `DocumentPane.tsx`, add a **Sites** section listing the tradition's sites with their role
text, sitting alongside the existing artifacts block.

## Step 4 — Guardrails

- Extend `npm run verify:schema` and the contributor contract so a community PR adding a site
  is validated the same way a tradition is.
- Extend `scripts/derive-attributions.js` and `ATTRIBUTIONS.md` if any site carries an image;
  otherwise sites are text and coordinates only for now.
- Add a count to `npm run counts` and the README badges once the seed set lands.

---

## Explicitly out of scope for this plan

- Site photography. Artifacts already carry the image-licensing burden; adding site imagery
  means another Wikimedia curation pass and should be its own plan.
- Pilgrimage routes as lines (Hajj, Camino, Shikoku). Attractive, but it needs a path
  primitive the renderer does not have.
- Modern congregation-level places of worship. The corpus is about traditions, not premises;
  the seed set is capped at sites of recognised historical or architectural significance.

## Decided — orphan sites attach to the nearest umbrella

**Decision (2026-08-31, confirmed by user):** a site always belongs to a tradition. Sites with
no clear owner in the corpus — Göbekli Tepe, Stonehenge, Newgrange, Çatalhöyük — attach to the
nearest defensible umbrella node, with the uncertainty carried in the site's own `role` text.
No standalone-site model for now.

How to hedge honestly, so the attachment is not read as a claim of descent:

- Write the uncertainty into `role` in the first clause, not as a trailing caveat. For
  Stonehenge under `european-traditions` or `ancient-european-religions`: *"Builders are
  unidentified and predate any named tradition in this atlas; grouped here for geography, not
  descent."*
- Prefer the broadest umbrella available over a specific tradition. Stonehenge does **not**
  go under `celtic-religion` — the monument predates Celtic-speaking Britain by roughly two
  millennia, and that is precisely the error the remediation plan exists to stop repeating in
  a new field.
- Where the owning node is an umbrella that Phase 1 marked `origin_geo_precision: none`, the
  site still renders. A concept with no birthplace can still have attested places attached to
  it, and that is a feature: it gives the umbrellas real geography without giving them a fake
  origin pin.
- Add `attribution_certainty` to each site record, reusing the existing `epistemic_tier`
  vocabulary (`academic_consensus`, `minority_scholarly`, `theological_claim`,
  `speculative_fringe`). Default `academic_consensus`; orphan attachments get
  `minority_scholarly` or lower. This makes the hedge machine-readable and filterable rather
  than buried in prose, and it reuses a vocabulary the corpus and UI already validate.

**Revisit trigger:** if the seed set ends with more than about a dozen orphans, or if any one
umbrella accumulates several unrelated ones, the model is straining and standalone sites
should be reconsidered. Note the count when Batch 1 (Ancient Near East & Egypt) lands, since
that batch carries Göbekli Tepe and will be the first real test.
