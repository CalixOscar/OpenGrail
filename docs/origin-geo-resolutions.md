# Origin-Geo Resolutions — researched pins for the 301 defaulted traditions

**Written:** 2026-08-31. **Status:** research complete, not yet applied to `data/`.
**Companion to:** `docs/origin-geo-fallback-remediation-plan.md` (the finding and the phasing).
**Machine-readable output:** `docs/origin-geo-resolutions.json` — 305 entries, keyed by node id.

This document is the missing input to Phase 1, Phase 2 and Step 4.1 of the remediation plan.
The plan established *that* 301 of 695 pins are unresearched cluster defaults and *how* to
treat them. It left the per-node research undone, with its own coordinate proposals marked
"proposals … must be checked before they land." This is that research.

---

## What the audit actually shows

`npm run audit:geo` reports 301 defaulted pins over 695 traditions. Two things about that
number were not visible from the count alone:

**The defaults are jittered, not stacked.** The 128 Abrahamic nodes carrying the place name
`Jerusalem, Southern Levant` are spread across latitude 30.921–32.618 and longitude
34.214–36.212 — a box roughly 190 km by 190 km. The deterministic jitter at the tail of
`scripts/enrich-all-locations.js` disguises a single fabricated value as 128 distinct
"researched" coordinates. `catholicism` currently sits at 31.7717, 34.4991, which is west of
the Israeli coastline. A reader inspecting one node cannot tell a default from a real pin;
only re-running the resolver against the frontmatter reveals it.

**Every treatment class is populated.** Of the 301:

| Treatment | Count | Meaning |
| :--- | ---: | :--- |
| `pin` | 158 | Real tradition with a defensible point origin |
| `region` | 128 | Real tradition, genuinely diffuse — coarse anchor + `origin_geo_precision: region` |
| `none` | 15 | Comparative umbrella with no birthplace — drop `origin_geo`, set `origin_geo_precision: none` |

Plus **4 additional nodes** from Step 4.1 that are not in the 301 because they were captured
by a *matcher* bug rather than the cluster fallback: `soto-zen` and `omoto` (pinned in Cairo
by the `"oto"` substring rule), `dianic-wicca` (New Forest, should be Los Angeles) and
`korean-confucianism` (Qufu, should be Seoul). Total: **305 entries**.

---

## Method — why these coordinates are sourceable

The plan's goal is that "every pin on the globe should be a sourced claim." Coordinates
written from memory cannot meet that standard, so none here were. Each entry is:

1. **An editorial decision** — which place, if any, is this tradition's origin? That is the
   judgement call, and it carries a `note` wherever the choice is contestable.
2. **A gazetteer resolution** — the chosen place resolved to a Wikidata entity, and the
   coordinate read from that entity's `P625` claim. Every entry records the `wikidata` QID
   and the `wikidata_label` the QID actually resolved to, so any reviewer can re-derive the
   number rather than trust it.

`scripts/resolve-place-coordinates.mjs` performs step 2 and is reproducible.

The review step is not ceremonial. It caught, among others:

- **Kassel** — remembered as 51.3127, 9.4797; actually 51.3158, 9.4979.
- **Hydesville, New York** (Fox sisters, origin of Spiritualism) — has no gazetteer entry at
  all; naive search returns Hydesville, **California**. Resolved instead to adjacent Newark,
  Wayne County, NY, and flagged.
- **Wrong-continent collisions** on first-hit search: Tiberias (Indonesia), Gondar
  (Portugal), Surat (France), Guadalajara (Spain), Salemabad (Iran), Pella (Macedon rather
  than the Decapolis), and "Petra" returning a particle accelerator.
- **The plan's own proposals** — `serer-religion` was proposed at 14.3392, -16.4114; Diakhao
  commune is at 14.4628, -16.2902, about 20 km away. `odinani` was proposed at 6.0833,
  6.9667; the Kingdom of Nri resolves to 6.1528, 7.0306.

Eight entries carry `needs_verification: true`. These are modern movements whose founding
locale is plausible but not confirmed in a general reference: `chaos-magic`,
`church-of-all-worlds`, `pastafarianism`, `theodism`, `kemetism`, `dvaitadvaita-vedanta`,
`messianic-judaism`, `akhbari-twelver-shia`. They should be sourced or downgraded to
`region` before they land — do not treat a flagged pin as researched.

---

## Effect on the globe

Measured by re-binning all 695 nodes against the resolutions, counting nodes within 0.6° of
each fabricated anchor:

| Fabricated default | Before | After |
| :--- | ---: | ---: |
| Jerusalem | 28 | 14 |
| Babylon | 24 | 14 |
| London | 24 | 14 |
| Varanasi | 27 | 3 |
| Athens | 19 | 13 |
| Qufu | 17 | 6 |
| Ile-Ife | 12 | 3 |
| Old Uppsala | 11 | 6 |
| Geneva | 5 | 4 |

The residual counts are mostly *true* — Jerusalem really is the origin of a dozen
traditions, and Rome, Baghdad and Alexandria genuinely carry several each. Ile-Ife retains
`ifa`, `yoruba-religion` and one matched node, which is the plan's stated success condition.

**One new concentration is worth flagging:** eight nodes resolve to Baghdad city centre
(`hanbali-school`, `ashari-theology`, `bahai-faith`, `islamic-akhlaq-ethics`,
`karaite-judaism`, `mizrahi-judaism`, `qadiriyya`, `zahiri-school`). Each is historically
correct. This is the same rendering problem the plan identifies for Korea in Step 4.4 — a
true tight cluster collapsing into one smudge — and it argues for doing that rendering work
rather than dispersing the pins with fiction.

---

## How to apply this

Per node id in `docs/origin-geo-resolutions.json`:

- `decision: "pin"` — set `origin_geo` to the given `lat`/`lng`/`place_name`.
- `decision: "region"` — same, and add `origin_geo_precision: region`.
- `decision: "none"` — delete the `origin_geo` block, add `origin_geo_precision: none`.
  This requires the Step 1.3 change to `tests/data-invariants.test.js:187` first, which
  asserts every node has `origin_geo`.

Where an entry has a `note`, put it in the node's `origin_note` or body text — the
contestable ones are contestable on purpose and should say so in the document pane.

Then: `npm run build:graph && npm run audit:geo && npm test`, and re-seed the ratchet with
`npm run audit:geo -- --write-baseline`. Applying all 305 should take `maxDefaultedPins` to
**0**. It does not touch `maxZeroOriginYears`, which stays at 49 — that is Step 4.2 and is
independent research.

## Not covered here

- **Step 4.2 (49 unparsed `era_start` values → `origin_year: 0`).** Separate research; the
  affected set is overwhelmingly Indigenous, African, Oceanic and East Asian, so it carries
  the same editorial weight as the geography and should not be folded in casually.
- **Step 3.1** — killing the silent fallback in `scripts/enrich-all-locations.js`.
- **Rendering** — the Korea/Baghdad cluster-collapse problem.

---

# Second pass — matcher-assigned pins (`origin-geo-resolutions-matcher.json`)

Applying the 305 above took `npm run audit:geo` to 0, but the audit only ever measured one
of **two** populations. It detects *cluster fallbacks*. It is structurally blind to
*matcher-assigned* pins — the broad id/path rules earlier in `enrich-all-locations.js`,
which fire first and therefore never reach the fallback block the audit inspects.

That second population was 149 nodes sharing a pin with at least two others. Many were
plainly wrong:

| Node(s) | Was | Mechanism |
| :--- | :--- | :--- |
| `burmese-buddhism`, `cambodian-buddhism`, `lao-buddhism`, `thai-buddhism` | Anuradhapura, **Sri Lanka** | path rule `/buddhist/theravada` (`:626`) |
| `parsi-zoroastrianism` | Isfahan, **Iran** | path rule `/iranian/` (`:643`) — the Parsis are defined by migration *to* Gujarat |
| 11 Eastern Catholic churches | **Rome** | Catholic rule, ignoring each church's own see |
| `scientology` | **Azusa Street** | Pentecostal rule |
| `micronesian-religions`, `polynesian-religions` | Tanna Island, **Vanuatu** | Oceania rule — both pinned in Melanesia |
| `enlil-cult-nippur` | **Babylon** | Mesopotamia rule, despite "Nippur" in its own id |
| `japanese-confucianism`, `vietnamese-confucianism` | Qufu, **China** | the same rule that sent `korean-confucianism` there |

**121 nodes were corrected**, resolved by the same Wikidata method. Groups sharing a
place_name fell from 166 nodes to 107, and distinct pin locations rose to 619.

Nodes deliberately left co-located, because the sharing is historically true: Baghdad (7
genuinely Baghdadi traditions), London (17th-c English radicals), Athens (Epicureanism,
Stoicism, Middle Platonism), Ctesiphon (Manichaeism, Mazdakism, Zurvanism), Jerusalem
(Pharisees, Sadducees, Second Temple), Tanna Island (John Frum, Prince Philip, cargo
cults), San Francisco (Church of Satan, Temple of Set, Reclaiming). `latin-church` and
`eastern-catholic-churches` correctly remain at Rome; `theravada` and `sri-lankan-buddhism`
correctly remain at Anuradhapura.

**The audit still cannot see this class.** It reports 0 because it only measures cluster
fallbacks. Step 3.1 of the remediation plan (replacing the fallback and the broad matcher
rules with a hard failure) is what stops the class returning; until then, the check to run
is "how many nodes share a place_name with 2+ others, and is that sharing true?"
