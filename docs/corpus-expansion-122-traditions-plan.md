# OpenGrail — Corpus Expansion: 122 Missing Traditions

**Author:** Claude (planning pass 2026-08-31; revised for batched execution 2026-08-31)
**Executor:** Antigravity swarm — **one dispatch per batch, 13 batches total**
**Scope:** Data authoring only. No UI, no schema, no build-pipeline changes.

---

## 0. Read first

Read `AGENTS.md` and the Handoff block of `PROJECT_NOTES.md` before touching anything.
Then `git log -5`, `git status`, `git diff`. The repo is ground truth.

This plan adds **122 new tradition nodes** covering historical heresies, sectarian
movements, ancient cults, syncretisms and New Religious Movements the atlas is missing.

### How this plan is executed — read this before anything else

**You have been dispatched to complete exactly ONE batch — the section of §4 named in
your dispatch prompt. Do not attempt any other section.** A previous run tried to author
all 122 nodes in a single pass, completed §4.1, and stalled. Each batch is now an
independent, separately-dispatched unit of work that starts green and ends green.

Your batch is complete when, and only when:

1. Every node in your assigned §4 section exists as a `data/**/*.md` file.
2. `npm run build:graph` succeeds.
3. The pinned counts have been reconciled per **§5** — *in this batch, not deferred*.
4. `npm run verify` is green.
5. The ledger row for your batch in **§0.1** is marked `DONE` with the real counts.

Do not commit, push, or open a branch unless explicitly asked. Report the real
`git diff --stat`, not a summary of intent.

### 0.1 Progress ledger — update your row before you finish

| batch | §4 section | nodes | status | corpus nodes / links after |
|---|---|---|---|---|
| 1 | 4.1 Christian dissent and medieval heresy | 6 | **DONE** | 579 / 914 |
| 2 | 4.2 Radical Reformation and English radicals | 5 | **DONE** | 584 / 922 |
| 3 | 4.3 Russian spiritual Christianity | 6 | **DONE** | 590 / 929 |
| 4 | 4.4 Jewish messianic movements | 3 | **DONE** | 593 / 934 |
| 5 | 4.5 Islamic heterodox and millenarian | 7 | **DONE** | 600 / 945 |
| 6 | 4.6 Christian-derived NRMs and communal | 20 | **DONE** | 620 / 969 |
| 7 | 4.7 Ancient and classical cults | 10 | **DONE** | 630 / 982 |
| 8 | 4.8 Syncretic, folk and entheogenic | 15 | **DONE** | 645 / 1004 |
| 9 | 4.9 East Asian | 15 | **DONE** | 660 / 1029 |
| 10 | 4.10 Southeast Asian maritime | 6 | **DONE** | 666 / 1041 |
| 11 | 4.11 Indian heterodox, tantric and guru | 9 | **DONE** | 675 / 1058 |
| 12 | 4.12 Indigenous North American revitalization | 3 | **DONE** | 678 / 1064 |
| 13 | 4.13 Esoteric, Left-Hand Path and modern NRMs | 17 | **DONE** | 695 / 1088 |

Batch 1 landed 6 nodes and 11 links and is fully reconciled. The corpus baseline for
batch 2 is therefore **579 nodes / 914 links**, not the 573 / 903 quoted in the original
draft of this plan.

---

## 1. Hard constraints (violating any of these fails `npm run verify`)

1. `data/**/*.md` is the only source of truth. **Never** hand-edit `public/graph.json`.
   Run `npm run build:graph` after every batch.
2. **Do not add `artifacts:` to any new node.** `tests/artifact-licensing.test.js` pins
   exactly 1146 artifacts, 1146 `.webp` files on disk, 102 high-detail / 1044 standard.
   New nodes ship text-only. Imagery is a separate, later curation pass.
3. Every new node needs **at least one relation** — `tests/data-invariants.test.js`
   forbids isolated nodes. Relations must resolve to an existing node `id` and must not be
   self-referential.
4. **No `branch_of` cycles.** Where a genealogy is circular or contested, use
   `influenced_by`, `diverged_from`, or `syncretized_with` instead of `branch_of`.
5. `cluster` must be one of the 11 values in `scripts/schema.js` `CLUSTERS`. `color` must
   sit in the same hue family as sibling nodes in that cluster (copy a neighbour file's
   color and jitter it slightly — the corpus already uses per-node hue jitter).
6. `origin_geo` must have real `lat`/`lng` and a non-empty `place_name`.
7. `epistemic_tier` and relation `certainty` must be one of `academic_consensus`,
   `minority_scholarly`, `theological_claim`, `speculative_fringe`.
8. IDs are lowercase kebab-case. Use the exact slugs in the table below.

Anchor relation targets below are given as node ids that were verified to exist, except
where the row says "verify id" — in those cases grep `data/` for the real id first
(e.g. the root Islam, Nichiren, Shingon, Vajrayana, Kabbalah, Pure Land, Roman religion,
Stone-Campbell, and Chinese folk religion nodes) and use what you find. Never invent a
target.

---

## 2. Editorial standard

This batch is unusually sensitive: it includes homicidal groups, coercive movements, and
living communities that outsiders label "cults". Hold the project's existing line.

- **Neutral, scholarly register.** Describe what a movement taught and did. Use the
  scholarly term (new religious movement, millenarian movement, sect) in preference to
  "cult" except where "cult" is the technical classicist usage (`cult of Sol Invictus`).
- **Documented harms are stated plainly, as fact, in the body** — Jonestown, the Tokyo
  subway attack, Solar Temple, Ant Hill Kids, Kanungu. Do not sanitise and do not
  editorialise. State what happened, with dates and figures, and cite it.
- **Preserve the claim/truth distinction.** A movement's self-understanding is a
  `theological_claim`; its documented history is `academic_consensus`. Contested
  genealogies (e.g. Bogomil→Cathar transmission, Hurufi→Bektashi influence) get
  `minority_scholarly` certainty and an explicit qualification in the Markdown body.
- **Living communities are not history.** Doukhobors, Molokans, Old Believers, Bauls,
  Donyi-Polo, Sanamahism, Aladura, ZCC — `extinct_year: null`, present tense.
- Set `extinct_year` only where dissolution is documented (e.g. Peoples Temple 1978,
  Münster 1535, Qarmatian state 1077, Ant Hill Kids 1989). When in doubt, `null`.

---

## 3. Per-file authoring recipe

Copy `data/_template.md` into the destination folder from the table, name it
`<slug>.md`, and fill:

```yaml
id: <slug>                    # exactly as in the table
title: <Title>                # primary display name
cluster: <Cluster>            # from the table
color: '#xxxxxx'              # hue-matched to cluster siblings
era_start: 'c. 1955 CE'       # human-readable
origin_year: 1955             # numeric, negative for BCE
origin_geo: { lat, lng, place_name }
extinct_year: null            # or numeric year
epistemic_tier: academic_consensus
summary: >-                   # 1-2 sentences, factual
aliases: [...]                # transliterations, popular names, official names
canonical_texts: [...]        # required; scriptures, founder's writings, primary corpus
key_tenets: [...]             # 3 entries, matching the corpus house pattern:
                              #   "Foundational Doctrine: ..."
                              #   "Distinctive Practice: ..."
                              #   "Core Orientation: ..."
sources: [ { title, url } ]   # 2-3 minimum; Britannica / Oxford Reference / Brill /
                              #   university presses / peer-reviewed. No blogs, no
                              #   apologetics sites, no anti-cult advocacy sites.
relations: [ ... ]            # see table; at least one
```

Body sections, matching the existing corpus (see `data/esoteric-modern/aa-thelema.md`):

```markdown
# <Title>

## Historical context

## Distinctives and comparative notes
```

Where a movement has a documented record of violence, coercion, or criminal conviction,
add a third section `## Documented harms and controversies` stating it factually with
dates and sourced figures.

---

## 4. The 122 nodes

Columns: `slug | Title | cluster | destination folder | era hint | anchor relations`.
Era hints are guides — verify against sources and set `origin_year` accordingly.
Anchor relations are the minimum; add more where well documented.

New folders to create are marked **(new)**.

### 4.1 Christian dissent and medieval heresy — cluster `Abrahamic`  ✅ DONE (batch 1)
Folder: `data/abrahamic/christian/heresies-dissent/` (created)

**This section is complete and reconciled. Do not re-author it.** Retained here as the
reference example of the expected output quality — read `catharism.md` before writing
your own batch.

| slug | Title | era | anchors |
|---|---|---|---|
| `catharism` | Catharism | c. 1140 CE, extinct c. 1350 | `influenced_by: bogomilism` (certainty `minority_scholarly` — direct transmission is contested), `diverged_from: catholicism` |
| `bogomilism` | Bogomilism | c. 950 CE, extinct c. 1450 | `influenced_by: paulicianism`, `diverged_from: eastern-orthodoxy` |
| `paulicianism` | Paulicianism | c. 650 CE, extinct c. 1000 | `diverged_from: eastern-orthodoxy`, `influenced_by: marcionite-christianity` (`minority_scholarly`) |
| `waldensians` | Waldensians | 1173 CE, living | `diverged_from: catholicism` |
| `hussites` | Hussites | 1415 CE | `diverged_from: catholicism`, `influenced_by: lollardy` |
| `lollardy` | Lollardy | c. 1380 CE, extinct c. 1530 | `diverged_from: catholicism` |

Note on `waldensians`: the modern Waldensian Evangelical Church is living
(`extinct_year: null`); the body should record the 1532 Chanforan alignment with the
Reformation.

### 4.2 Radical Reformation and English radicals — cluster `Abrahamic`

| slug | Title | folder | era | anchors |
|---|---|---|---|---|
| `munster-rebellion-anabaptist` | Münster Anabaptist Rebellion | `data/abrahamic/christian/protestant/anabaptist/` | 1534, extinct 1535 | `branch_of: anabaptism` |
| `diggers-true-levellers` | Diggers (True Levellers) | `data/abrahamic/christian/protestant/radical-english/` **(new)** | 1649, extinct 1650 | `influenced_by: protestantism`, `parallel_concept: ranters` |
| `ranters` | Ranters | same | c. 1649, extinct c. 1680 | `influenced_by: protestantism` |
| `muggletonians` | Muggletonians | same | 1651, extinct 1979 | `diverged_from: ranters` (`minority_scholarly`), `influenced_by: protestantism` |
| `seekers-tradition` | Seekers | same | c. 1620, extinct c. 1700 | `influenced_by: protestantism`, `parallel_concept: quakers` |

### 4.3 Russian spiritual Christianity — cluster `Abrahamic`
Folder: `data/abrahamic/christian/orthodox/eastern/russian-sectarian/` **(new)**

| slug | Title | era | anchors |
|---|---|---|---|
| `old-believers-staroobryadtsy` | Old Believers | 1666, living | `schism: eastern-orthodoxy` |
| `khlysts` | Khlysts | c. 1645 | `diverged_from: eastern-orthodoxy` |
| `skoptsy` | Skoptsy | c. 1771, extinct c. 1930 | `diverged_from: khlysts` |
| `doukhobors` | Doukhobors | c. 1740, living | `diverged_from: eastern-orthodoxy` |
| `molokans` | Molokans | c. 1765, living | `diverged_from: doukhobors` |
| `subbotniks` | Subbotniks | c. 1770, living | `diverged_from: molokans` (`minority_scholarly`), `influenced_by: judaism` |

Skoptsy: state the castration practice factually and clinically; do not sensationalise.

### 4.4 Jewish messianic movements — cluster `Abrahamic`
Folder: `data/abrahamic/jewish/historical/`

| slug | Title | era | anchors |
|---|---|---|---|
| `sabbateanism` | Sabbateanism | 1665 | `diverged_from: judaism`, `influenced_by:` the Kabbalah/Lurianic node (verify id) |
| `donmeh` | Dönmeh | 1683, living | `branch_of: sabbateanism`, `syncretized_with: sufism` |
| `frankism` | Frankism | 1755, extinct c. 1820 | `diverged_from: sabbateanism` |

### 4.5 Islamic heterodox and millenarian — cluster `Abrahamic`

| slug | Title | folder | era | anchors |
|---|---|---|---|---|
| `kharijite-movement` | Kharijites | `data/abrahamic/islamic/major/` | 657, extinct c. 900 (the trunk; Ibadism survives) | `schism:` root Islam node (verify id), `parallel_concept: ibadi-islam` |
| `qarmatians` | Qarmatians | `data/abrahamic/islamic/shia/` | 899, extinct 1077 | `diverged_from: ismailism` |
| `bektashism` | Bektashism | `data/abrahamic/islamic/sufi/` | c. 1300, living | `branch_of: sufism`, `syncretized_with: alevi-traditions` |
| `hurufism` | Hurufism | `data/abrahamic/islamic/mystical/` | c. 1386, extinct c. 1600 | `influenced_by: sufism` |
| `nuqtavism` | Nuqtavi Movement | `data/abrahamic/islamic/mystical/` | c. 1397, extinct c. 1650 | `diverged_from: hurufism` |
| `sudanese-mahdiyya` | Sudanese Mahdiyya | `data/abrahamic/islamic/modern/` | 1881, extinct 1899 | `influenced_by: sufism` |
| `al-ahbash` | Al-Ahbash | `data/abrahamic/islamic/sunni/` | 1983, living | `branch_of: sufism`, or the Ash'ari node if one exists — check first |

Bektashism↔Hurufism influence is scholarly-contested: use `minority_scholarly` and say so
in the body.

### 4.6 Christian-derived NRMs and communal movements — cluster `Abrahamic`

Folder `data/abrahamic/christian/restorationist/communal/` **(new)**:

| slug | Title | era | anchors |
|---|---|---|---|
| `shakers` | Shakers | 1747, living (tiny remnant; `extinct_year: null`) | `diverged_from: quakers` |
| `oneida-community` | Oneida Community | 1848, extinct 1881 | `influenced_by: protestantism` |
| `peace-mission-father-divine` | Peace Mission Movement | c. 1919, living | `influenced_by: protestantism` |
| `twelve-tribes-movement` | Twelve Tribes Communities | 1972, living | `influenced_by: protestantism` |

Folder `data/abrahamic/christian/new-religious-movements/` **(new)**:

| slug | Title | era | anchors |
|---|---|---|---|
| `peoples-temple` | Peoples Temple | 1955, extinct 1978 | `diverged_from:` the Stone-Campbell/Disciples node if present, else `influenced_by: pentecostalism` |
| `children-of-god` | Children of God (The Family International) | 1968, living | `influenced_by: pentecostalism` |
| `church-of-almighty-god` | Church of Almighty God | 1991, living | `influenced_by: protestantism` |
| `shincheonji` | Shincheonji Church of Jesus | 1984, living | `influenced_by: protestantism` |
| `restoration-ten-commandments` | Movement for the Restoration of the Ten Commandments of God | 1989, extinct 2000 | `diverged_from: catholicism` |
| `ant-hill-kids` | Ant Hill Kids | 1977, extinct 1989 | `diverged_from: adventism` |
| `the-fellowship-the-family` | The Fellowship | 1935, living | `influenced_by: evangelicalism` |

Peoples Temple, Restoration of the Ten Commandments, and Ant Hill Kids each require the
`## Documented harms and controversies` section: 918 deaths at Jonestown (18 Nov 1978),
the Kanungu fire and associated mass deaths (17 Mar 2000, 778+ documented),
and Thériault's convictions.

Folder `data/abrahamic/christian/african-initiated/` **(new)**:

| slug | Title | era | anchors |
|---|---|---|---|
| `kimbanguism` | Kimbanguism | 1921, living | `diverged_from: protestantism`, `syncretized_with: kongo-religion` |
| `aladura-movement` | Aladura Movement | c. 1918, living | `influenced_by: pentecostalism` |
| `zion-christian-church-zcc` | Zion Christian Church | 1924, living | `influenced_by: pentecostalism` |
| `lumpa-church` | Lumpa Church | 1953, extinct 1964 | `diverged_from: protestantism` |
| `legio-maria` | Legio Maria | 1963, living | `diverged_from: catholicism` |
| `holy-spirit-movement-uganda` | Holy Spirit Movement | 1986, extinct 1987 | `syncretized_with:` an Acholi/Nilotic node if one exists, else `influenced_by: catholicism` |

Folder `data/abrahamic/adjacent/hebrew-israelite/` **(new)**:

| slug | Title | era | anchors |
|---|---|---|---|
| `black-hebrew-israelites` | Black Hebrew Israelites | c. 1896, living | `influenced_by: judaism`, `influenced_by: protestantism` |
| `nation-of-yahweh` | Nation of Yahweh | 1979, living | `branch_of: black-hebrew-israelites` |

Folder `data/abrahamic/islamic/modern/`:

| slug | Title | era | anchors |
|---|---|---|---|
| `moorish-science-temple` | Moorish Science Temple of America | 1913, living | `influenced_by:` root Islam node (verify id), `parallel_concept: nation-of-islam` |

Epistemic care: the historical and genealogical claims of the Hebrew Israelite and
Moorish Science traditions are `theological_claim`, not `academic_consensus`. Set the
node `epistemic_tier` to `academic_consensus` (the movements are documented) but mark
descent-claim relations `theological_claim`.

### 4.7 Ancient and classical cults — cluster `Ancient Mediterranean` (except where noted)
Folder: `data/ancient-mediterranean/mystery-cults/` for the cults;
`data/ancient-mediterranean/` for the civilisational religions.

| slug | Title | era | anchors |
|---|---|---|---|
| `minoan-religion` | Minoan Religion | c. 3000 BCE, extinct c. 1100 BCE | `parallel_concept: ancient-greek-religion` |
| `mycenaean-religion` | Mycenaean Religion | c. 1600 BCE, extinct c. 1100 BCE | `influenced_by: minoan-religion`, `parallel_concept: ancient-greek-religion` |
| `etruscan-religion` | Etruscan Religion | c. 800 BCE, extinct c. 100 CE | `influenced_by: ancient-greek-religion`; note the Roman augural inheritance in the body |
| `sol-invictus-cult` | Cult of Sol Invictus | 274 CE, extinct c. 400 CE | `branch_of:` the Roman religion node (verify id), `influenced_by: elagabal-sun-cult` |
| `elagabal-sun-cult` | Cult of Elagabal | c. 200 CE, extinct c. 222 CE at Rome | `influenced_by:` the Roman religion node |
| `glycon-cult` | Cult of Glycon | c. 150 CE, extinct c. 250 CE | `branch_of: asclepius-cult` (`minority_scholarly`) |
| `sabazios-cult` | Cult of Sabazios | c. 500 BCE, extinct c. 400 CE | `syncretized_with: dionysian-mysteries` |
| `despoina-arcadian-cult` | Cult of Despoina | c. 600 BCE, extinct c. 400 CE | `branch_of: ancient-greek-religion` |
| `trophonius-oracle-cult` | Cult of Trophonius | c. 700 BCE, extinct c. 400 CE | `branch_of: ancient-greek-religion` |
| `zalmoxianism` | Thracian Orphism & Zalmoxianism | c. 500 BCE, extinct c. 300 CE | cluster **`Ancient European`**, folder `data/european-traditions/historical/`; `influenced_by: ancient-greek-religion`, `parallel_concept: dionysian-mysteries` |

**`cabiri-cult` is NOT created.** It duplicates the existing
`data/ancient-mediterranean/mystery-cults/samothracian-mysteries.md`, which already
carries the alias `Cabeirian mysteries`. Instead: add the aliases `Cult of the Cabiri`,
`Kabeiroi`, `Great Gods of Samothrace` to that node, and extend its body with a short
paragraph on the wider Kabeiroi cult at Lemnos and Thebes. Do not add a second node.
This is why the plan adds 122 nodes and not the 123 slugs originally listed.

### 4.8 Syncretic, folk and entheogenic — cluster `Indigenous & Diasporic`

Folder `data/indigenous-diasporic/americas/` (or its `mesoamerican`/`amazonian`/`andean`
subfolders where the fit is clear):

| slug | Title | era | anchors |
|---|---|---|---|
| `santa-muerte` | Santa Muerte | c. 1795 documented, public since 2001 | `syncretized_with: catholicism` |
| `santo-daime` | Santo Daime | 1930 | `syncretized_with: catholicism`, `influenced_by: spiritism` |
| `uniao-do-vegetal` | União do Vegetal | 1961 | `parallel_concept: santo-daime` |
| `maria-lionza-cult` | Cult of María Lionza | c. 1920 | `syncretized_with: catholicism`, `influenced_by: spiritism` |
| `tupi-guarani-land-without-evil` | Land Without Evil (Yvy Marãne'ỹ) | pre-1500 | `influenced_by:` an existing Amazonian node — check `shipibo-konibo-religion`'s neighbours first |
| `mapuche-machi-tradition` | Mapuche Cosmovision & Machi Traditions | pre-1500, living | link into the `andean` folder's existing nodes |

Folder `data/indigenous-diasporic/african/diaspora/`:

| slug | Title | era | anchors |
|---|---|---|---|
| `abakua-society` | Abakuá | 1836 | `influenced_by:` a Cross River/Efik node if present, else `parallel_concept: palo` |
| `quimbanda` | Quimbanda | c. 1900 | `diverged_from: umbanda` |
| `winti-religion` | Winti | c. 1700, living | `parallel_concept: candomble`, `influenced_by: kongo-religion` |
| `kumina-tradition` | Kumina | c. 1850, living | `influenced_by: kongo-religion` |

Folder `data/indigenous-diasporic/african/continental/`:

| slug | Title | era | anchors |
|---|---|---|---|
| `bwiti-tradition` | Bwiti | c. 1890, living | `syncretized_with: catholicism` |
| `mwari-cult` | Mwari Cult | pre-1500, living | `branch_of: shona-religion` |

Folder `data/indigenous-diasporic/south-asian/` **(new)**:

| slug | Title | era | anchors |
|---|---|---|---|
| `sarnaism-adivasi` | Sarnaism | pre-modern, living | `parallel_concept:` an existing Hindu or tribal node; keep it out of `branch_of` — Sarna self-identification is explicitly non-Hindu, say so in the body |
| `sanamahism` | Sanamahism | pre-1700, living | `influenced_by: vaishnavism` (post-18th-c. contact) — `influenced_by`, never `branch_of` |
| `donyi-polo` | Donyi-Polo | pre-modern, revived 1970s, living | `parallel_concept: sanamahism` |

### 4.9 East Asian — cluster `East Asian`

Folder `data/east-asian/japanese/new-religions/` **(new)**:

| slug | Title | era | anchors |
|---|---|---|---|
| `kurozumikyo` | Kurozumikyō | 1814 | `branch_of: sect-shinto` |
| `tensho-kotai-jingukyo` | Tenshō Kōtai Jingūkyō | 1945 | `influenced_by: shinto` |
| `pl-kyodan` | PL Kyōdan | 1946 | `influenced_by: shinto` |
| `seicho-no-ie` | Seichō-no-Ie | 1930 | `influenced_by: shinto`, plus a New Thought node if one exists |
| `reiyukai` | Reiyūkai | 1925 | `branch_of:` the Nichiren node (verify id) |
| `rissho-kosei-kai` | Risshō Kōsei-kai | 1938 | `diverged_from: reiyukai` |
| `shinnyo-en` | Shinnyo-en | 1936 | `branch_of:` the Shingon node (verify id) |
| `agon-shu` | Agon Shū | 1978 | `influenced_by:` the Shingon/esoteric Buddhist node |
| `sukyo-mahikari` | Sūkyō Mahikari | 1978 | `influenced_by: shinto` |
| `happy-science` | Happy Science | 1986 | `influenced_by: shinto`, plus a Japanese Buddhist node |

Folder `data/east-asian/chinese/salvationist/`:

| slug | Title | era | anchors |
|---|---|---|---|
| `white-lotus-bailianjiao` | White Lotus | c. 1133, extinct c. 1860 | `branch_of: chinese-salvationist-religions`, `influenced_by:` a Pure Land node |
| `taiping-heavenly-kingdom` | Taiping Heavenly Kingdom | 1851, extinct 1864 | `influenced_by: protestantism`, `syncretized_with:` the Chinese folk religion node |

Folder `data/east-asian/vietnamese/`:

| slug | Title | era | anchors |
|---|---|---|---|
| `buu-son-ky-huong` | Bửu Sơn Kỳ Hương | 1849 | `influenced_by:` the Mahayana/Pure Land node |
| `tu-an-hieu-nghia` | Tứ Ân Hiếu Nghĩa | 1867 | `branch_of: buu-son-ky-huong` |
| `coconut-religion-vietnam` | Coconut Religion (Đạo Dừa) | 1963, extinct 1990 | `syncretized_with: caodaism` |

If `data/east-asian/vietnamese/hoa-hao.md` currently has no ancestor relation, add
`branch_of: buu-son-ky-huong` to it — that is the one permitted edit to an existing data
file in this section, alongside the `samothracian-mysteries` alias edit in §4.7.

### 4.10 Southeast Asian maritime — folder `data/southeast-asian-maritime/` **(new)**

| slug | Title | cluster | era | anchors |
|---|---|---|---|---|
| `babaylanism-revival` | Babaylanism & Philippine Folk Shamanic Revival | Indigenous & Diasporic | pre-1521, revived 20th c. | `parallel_concept:` an existing Philippine node |
| `rizalista-traditions` | Rizalista Movements | Indigenous & Diasporic | c. 1900 | `syncretized_with: catholicism` |
| `lapiang-malaya` | Lapiang Malaya | Indigenous & Diasporic | 1949, extinct 1967 | `influenced_by: rizalista-traditions` |
| `pbma-tradition` | Philippine Benevolent Missionaries Association | Indigenous & Diasporic | 1965, living | `influenced_by: rizalista-traditions` |
| `subud` | Subud | Indigenous & Diasporic | 1924, living | `influenced_by: kejawen-javanese-mysticism`, `influenced_by: sufism` |
| `sumarah-javanese-mysticism` | Sumarah | Indigenous & Diasporic | 1935, living | `branch_of: kejawen-javanese-mysticism` |

`kejawen-javanese-mysticism` currently sits in `data/oceanic-australasian/`. Leave it
there; only reference it.

Lapiang Malaya requires the harms section — the 1967 Taft Avenue killing of its members
by state forces. The movement was the victim; state that accurately.

### 4.11 Indian heterodox, tantric and guru movements — cluster `Dharmic`
Folder: `data/dharmic/hindu/` (flat, matching existing convention)

| slug | Title | era | anchors |
|---|---|---|---|
| `kapalika-tradition` | Kāpālika Tradition | c. 500 CE, extinct c. 1400 | `diverged_from: pashupata-shaivism`, `influenced_by: shakta-tantra` |
| `kalamukha-tradition` | Kālāmukha Tradition | c. 800 CE, extinct c. 1300 | `diverged_from: pashupata-shaivism`, `parallel_concept: kapalika-tradition`; note the Lingayat displacement in the body |
| `bauls-of-bengal` | Bauls of Bengal | c. 1500, living | `syncretized_with: sufism`, `influenced_by: gaudiya-vaishnavism` |
| `brahma-kumaris` | Brahma Kumaris | 1937, living | `influenced_by: vedanta` |
| `sahaja-yoga` | Sahaja Yoga | 1970, living | `influenced_by: classical-yoga` |
| `ananda-marga` | Ananda Marga | 1955, living | `influenced_by: shakta-tantra` |
| `sathya-sai-baba-movement` | Sathya Sai Baba Movement | 1940, living | `influenced_by: bhakti-movement` |
| `rajneesh-movement` | Rajneesh Movement (Osho) | 1970, living | `influenced_by: shakta-tantra`, `influenced_by: advaita-vedanta` |

Rajneesh requires the harms section: the 1984 Dalles Salmonella attack (751 cases) and
the subsequent convictions.

Folder `data/dharmic/buddhist/modern/`:

| slug | Title | cluster | era | anchors |
|---|---|---|---|---|
| `aum-shinrikyo` | Aum Shinrikyo (Aleph / Hikari no Wa) | Dharmic | 1984, living (as successor groups) | `influenced_by:` the Vajrayana node (verify id), `influenced_by: classical-yoga` |

Aum requires the harms section: Matsumoto (1994) and the Tokyo subway sarin attack
(20 Mar 1995, 13 deaths, thousands injured), and the 2018 executions.

### 4.12 Indigenous North American revitalization — cluster `Indigenous & Diasporic`
Folder: `data/indigenous-diasporic/americas/north/`

| slug | Title | era | anchors |
|---|---|---|---|
| `code-of-handsome-lake` | Code of Handsome Lake (Gaiwiio) | 1799, living | `branch_of: haudenosaunee-religion` |
| `indian-shaker-church` | Indian Shaker Church | 1882, living | `syncretized_with: catholicism`, `influenced_by: tlingit-religions` |
| `dream-dance-ojibwe` | Dream Dance (Drum Dance) | c. 1876, living | `branch_of: anishinaabe-religions` |

### 4.13 Esoteric, Left-Hand Path and modern NRMs — cluster `Esoteric & Modern`
Folder: `data/esoteric-modern/` (flat)

| slug | Title | era | anchors |
|---|---|---|---|
| `bavarian-illuminati` | Bavarian Illuminati | 1776, extinct 1787 | `influenced_by: freemasonry` |
| `martinism-elus-coens` | Martinism & Ordre des Élus Coëns | 1767, living | `influenced_by: hermeticism`, `influenced_by: freemasonry` |
| `fraternitas-saturni` | Fraternitas Saturni | 1926, living | `influenced_by: thelema`, `influenced_by: rosicrucianism` |
| `amorc-rosicrucian` | AMORC | 1915, living | `branch_of: rosicrucianism` |
| `builders-of-the-adytum` | Builders of the Adytum | 1922, living | `diverged_from: hermetic-order-golden-dawn` |
| `order-of-nine-angles` | Order of Nine Angles | 1974, living | `diverged_from: modern-satanism`; body must flag that the network is decentralised, that much of its literature is pseudonymous, and that it is designated an extremist network in several jurisdictions |
| `dragon-rouge` | Dragon Rouge | 1989, living | `influenced_by: luciferianism`, `influenced_by: shakta-tantra` |
| `temple-of-the-black-light` | Temple of the Black Light | 1995, living | `diverged_from: modern-satanism` |
| `order-solar-temple` | Order of the Solar Temple | 1984, extinct 1997 | `influenced_by: rosicrucianism`, `influenced_by: theosophy` — harms section: 74 deaths across Switzerland, France and Quebec, 1994-1997 |
| `ramthas-school-enlightenment` | Ramtha's School of Enlightenment | 1988, living | `branch_of: new-age-movement` |
| `findhorn-foundation` | Findhorn Foundation | 1962, living | `branch_of: new-age-movement` |
| `chen-tao` | Chen Tao | 1993, living | `branch_of: ufo-religions` |
| `fiat-lux-movement` | Fiat Lux | 1980, living | `branch_of: ufo-religions`, `syncretized_with: catholicism` |
| `universe-people` | Universe People | 1997, living | `branch_of: ufo-religions` |
| `nuwaubian-nation` | Nuwaubian Nation | 1967, living | `branch_of: ufo-religions`, `influenced_by: moorish-science-temple` — harms section: York's 2004 conviction |
| `synanon` | Synanon | 1958, extinct 1991 | `influenced_by: new-age-movement`; body must note it began as a drug-rehabilitation community and only later declared itself a religion |
| `manson-family` | Manson Family | 1967, extinct 1971 | `influenced_by: new-age-movement`, `influenced_by: process-church` (`minority_scholarly`) — harms section: the Tate-LaBianca murders, August 1969, and the convictions |

---

## 5. Count reconciliation — do this INSIDE your batch, never defer it

This is the step whose deferral broke the first run. The corpus counts are pinned as
regression constants in two test files. The moment your batch's nodes land,
`npm run verify` goes red until you update them. **A red suite at the end of your batch
is your bug, not an expected mid-flight state.**

After your nodes are written and `npm run build:graph` succeeds, run:

```bash
npm run counts
```

`scripts/print-counts.js` mirrors the test logic exactly and prints every number you
need, including the extinct split. **Read the numbers from that output. Never guess them
and never hand-compute the active/extinct split.** Then patch:

- `tests/data-invariants.test.js`
  - `seenIds.size` (~line 44) → corpus nodes
  - `graphData.nodes.length` / `graphData.links.length` (~220-221) → corpus nodes / links
  - `onDisk.nodes.length` / `onDisk.links.length` (~226-227) → same two numbers
  - `clusters.length` stays `11`
- `tests/count-agreement.test.js`, the "Present day (year 2026) canonical regression
  counts" block — emergent nodes, emergent links, active nodes, active links. Update the
  two inline comments and both assertion messages to carry the new numbers too.
- `README.md` lines 9-10 — the `Traditions-` and `Graph%20Links-` badge URLs.
- `package.json` `description` — the "atlas of NNN world religions" string.

Leave alone: `tests/artifact-licensing.test.js` (unchanged — if an artifact assertion
moves, a node got `artifacts:` in violation of §1.2; fix the data, not the test), the
README alt-text on line 26 (it describes a screenshot as captured), and every dated entry
in the `PROJECT_NOTES.md` Decisions/Session logs (append-only history).

---

## 6. Execution order within your batch

Some nodes in a batch reference nodes created earlier in the *same* batch. Author in the
order listed in your §4 section, and run `npm run build:graph` as you go to catch an
unresolved target early. Intra-batch dependencies:

- §4.2 Ranters before Muggletonians
- §4.3 in listed order (Khlysts → Skoptsy; Doukhobors → Molokans → Subbotniks)
- §4.4 in listed order (Sabbateanism → Dönmeh, Frankism)
- §4.5 Hurufism before Nuqtavism
- §4.6 `black-hebrew-israelites` before `nation-of-yahweh`
- §4.7 `elagabal-sun-cult` before `sol-invictus-cult`; `minoan-religion` before
  `mycenaean-religion`
- §4.8 `santo-daime` before `uniao-do-vegetal`; `sanamahism` before `donyi-polo`
- §4.9 `reiyukai` before `rissho-kosei-kai`; `buu-son-ky-huong` before `tu-an-hieu-nghia`
- §4.10 `rizalista-traditions` before `lapiang-malaya` and `pbma-tradition`
- §4.11 `kapalika-tradition` before `kalamukha-tradition`

One **cross-batch** dependency exists: §4.13's `nuwaubian-nation` anchors on
`moorish-science-temple`, which is created in §4.6. Batch 13 must run after batch 6. The
dispatch order below already guarantees this.

Then §5, then the gate.

---

## 7. Verification gate

```bash
npm run verify
```

Green before handoff — no exceptions. Confirm from the output that:

- no duplicate IDs, no unresolved relation targets, no isolated nodes, no branch cycles
- every cluster, relation type, certainty and epistemic tier validates
- every new node has valid `origin_geo`
- the artifact suite still reports 1146 / 1146 / 102 / 1044 — proof no artifacts leaked in

If the only failures are count assertions, you skipped or mis-applied §5. Go back and do
it; do not hand off red and do not relax an assertion to make it pass.

---

## 8. Handoff

Mark your batch `DONE` in the §0.1 ledger with the real post-batch counts from
`npm run counts`.

On the **final** batch only, per `AGENTS.md`: overwrite the `PROJECT_NOTES.md` Handoff
block in place with all six fixed fields, and append a dated Decisions Log entry
recording (a) the text-only, no-artifact decision for this expansion and why, and (b) the
decision to fold the Cabiri cult into `samothracian-mysteries` rather than create a
duplicate node. Append a Session Log entry. Intermediate batches update the ledger only.

Do not commit or push unless explicitly asked. Report the real `git diff --stat`.
