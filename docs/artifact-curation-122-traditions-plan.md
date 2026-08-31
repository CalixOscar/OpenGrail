# OpenGrail — Artifact Curation for the 122 New Traditions

**Author:** Claude (planning pass, 2026-08-31)
**Executor:** Antigravity swarm — **one dispatch per batch, 13 batches**
**Scope:** Artifact curation only, for the 122 traditions added by
`docs/corpus-expansion-122-traditions-plan.md`. No UI, no schema, no pipeline changes.
**Predecessor:** the corpus expansion is complete — 695 nodes / 1088 links, suite green.

---

## 0. Read first

Read `AGENTS.md` and the `PROJECT_NOTES.md` Handoff block. Then `git log -5`,
`git status`, `git diff`. The repo is ground truth.

**You have been dispatched to complete ONE batch — the section named in your dispatch
prompt.** Each batch starts green and ends green. Do not attempt another section.

### 0.1 The rule that defines this work

**Do NOT use `scripts/curate-iconic-artifacts.js` discover mode, or any keyword-matching
automation, to select images.** That pipeline produced the existing corpus's artifacts and
has an error rate of roughly one in four. Real examples now live in the corpus:

| Title in the corpus | What the image actually is |
|---|---|
| Spiritualist founders the Fox sisters | *Charles James Fox* by Joshua Reynolds, an 18th-c politician |
| Portrait of A. B. Maston, Churches of Christ leader | WWI enlistment record for *Roswell Maston* |
| Portrait of John Knox, Presbyterian reformer | "Leading Theologians of the Middle Ages" |
| United Church of God home office, Milford Ohio | Interior of *St Andrew's Catholic Church, Roanoke VA* |
| Original A∴A∴ *Equinox* publication | A photograph of the **cruise ship Celebrity Equinox** |

These are surname and keyword collisions. **Every image in this pass is selected and
verified by hand.** You must open the Commons file page and confirm the image actually
depicts what you claim before you use it.

Repairing those pre-existing errors is **explicitly out of scope** for this plan — the
user scoped this pass to the 122 new traditions only. The existing defect is recorded in
§6 as a known, tracked issue. Do not fix it here and do not let it change any pinned
constant beyond what your own additions require.

### 0.2 Progress ledger — update your row before you finish

| batch | section | traditions | status | artifacts after |
|---|---|---|---|---|
| 1 | 4.1 Christian dissent and medieval heresy | 6 | DONE | 1156 (103 high / 1053 standard) |
| 2 | 4.2 Radical Reformation and English radicals | 5 | DONE | 1161 (104 high / 1057 standard) |
| 3 | 4.3 Russian spiritual Christianity | 6 | DONE | 1171 (105 high / 1066 standard) |
| 4 | 4.4 Jewish messianic movements | 3 | DONE | 1177 (105 high / 1072 standard) |
| 5 | 4.5 Islamic heterodox and millenarian | 7 | DONE | 1187 (106 high / 1081 standard) |
| 6 | 4.6 Christian-derived NRMs and communal | 20 | DONE | 1215 (107 high / 1108 standard) |
| 7 | 4.7 Ancient and classical cults | 10 | DONE | 1235 (108 high / 1127 standard) |
| 8 | 4.8 Syncretic, folk and entheogenic | 15 | DONE | 1268 (108 high / 1160 standard) |
| 9 | 4.9 East Asian | 15 | DONE | 1306 (108 high / 1198 standard) |
| 10 | 4.10 Southeast Asian maritime | 6 | DONE | 1277 (108 high / 1169 standard) |
| 11 | 4.11 Indian heterodox, tantric and guru | 9 | DONE | 1322 (108 high / 1214 standard) |
| 12 | 4.12 Indigenous North American revitalization | 3 | DONE | 1239 (108 high / 1131 standard) |
| 13 | 4.13 Esoteric, Left-Hand Path and modern NRMs | 17 | DONE | 1337 (108 high / 1229 standard) |

Baseline before batch 1: **1146 artifacts, 102 high / 1044 standard.**

---

## 1. The inclusion bar

For each tradition, aim for **1-2 artifacts**. One strong image beats two weak ones.

**Include an image only if it is:**

1. **A direct depiction** — the tradition's practice, architecture, texts, ritual objects,
   material culture, or a documented portrait of a founder; **or**
2. **A strong oblique** — its historical site, a landmark central to it, its sacred
   geography, or a relevant material object of the right place and period.

**If neither is available, the tradition ships text-only. Skip it and record it in §5.**
Skipping is a correct outcome, not a failure. Do not reach for a generic regional
landscape to fill a slot — coverage is not the goal, accuracy is. Expect a substantial
number of skips, especially among recent NRMs and living esoteric orders where nearly all
available imagery is press photography or the movement's own copyrighted material.

### 1.1 Subjects that are excluded by policy

**Do not use images of perpetrators, victims, crime scenes, or atrocity sites** for any
tradition with a `## Documented harms and controversies` section. This is a standing
editorial decision, not a case-by-case judgement.

Affected nodes include `peoples-temple`, `aum-shinrikyo`, `manson-family`,
`order-solar-temple`, `restoration-ten-commandments`, `ant-hill-kids`, `nuwaubian-nation`,
`synanon`, `order-of-nine-angles`, `temple-of-the-black-light`, `lumpa-church`,
`holy-spirit-movement-uganda`, `lapiang-malaya`, `nation-of-yahweh`, `children-of-god`,
`rajneesh-movement`, `taiping-heavenly-kingdom`, `qarmatians`.

A photograph of a murderer or a massacre site shifts a reference entry's register toward
true crime, which is exactly what the prose in these nodes was written to avoid.

**Fall back instead to** a historical site, a landmark, a building, or the sacred or
civic geography of the place — for example the Rajneeshpuram site in Wasco County, the
Guyanese landscape at Port Kaituma, Mount Banahaw for the Rizalista traditions, or the
architecture of a movement's surviving buildings where those are neutral. If no such
neutral image exists, skip the node.

---

## 2. Sourcing and licensing — the hard constraints

1. **Wikimedia Commons only.** `sourceUrl` must be exactly
   `https://commons.wikimedia.org/wiki/File:<Filename>` — the licensing test enforces
   this. It is the attribution and licence chain and cannot point anywhere else.
2. **Verify the licence on the file page.** Acceptable: Public Domain, CC0, CC BY, CC
   BY-SA (any version). **Not acceptable:** anything non-commercial, no-derivatives, fair
   use, or "permission" files. If the licence is unclear, do not use the file.
3. **`provenance` must be exactly `<Author>; <License>`** — a single semicolon separating
   them, because `parseProvenance()` in `scripts/derive-attributions.js` splits on the
   *last* semicolon. Copy the author credit and licence string from the Commons file page.
   Example: `Dosseman; CC BY-SA 4.0`.
4. **Verify the image depicts the subject.** Open the file page, read its description and
   categories, and satisfy yourself. This is the whole point of the pass — see §0.1.

### 2.1 Where the "good neutral article" requirement lands

The user asked that where an oblique image is used, the reader can reach the best
available non-copyrighted, neutral article on the subject. `sourceUrl` is pinned to
Commons and cannot carry that. So:

- The artifact **`description`** must plainly state *what the image actually shows* and
  *how it relates to the tradition* — especially for an oblique. A reader must never be
  misled into thinking a landscape is a portrait.
- The tradition's **`sources:`** list must contain the best neutral scholarly article on
  the subject (Britannica, Oxford Reference, Brill, a university press, or a
  peer-reviewed work). Most nodes already have these from the corpus pass; where the
  existing sources are thin for a node you illustrate, strengthen them.

### 2.2 Descriptions — no boilerplate

1,145 of the existing 1,146 artifacts carry the same generated sentence: *"This image
shows X, selected as a defining visual reference for Y."* **Do not reproduce that
pattern.** Write a real one- or two-sentence description of what the image is. For an
oblique, say so explicitly — e.g. "The Nikolskoye cemetery chapel at Rogozhskoye, the
Moscow centre of the priested Old Believer community since 1771," not "This image shows
Old Believers."

---

## 3. Per-artifact mechanics

For each selected image:

1. Download the file from Commons at a reasonable source resolution.
2. Convert to WebP and resize so the **long edge is ≤ 640px** (standard tier).
   Use `detail: high` **only** for text-bearing artifacts — manuscripts, inscriptions,
   printed pages — where legibility matters; those may go to a long edge of ≤ 1600px.
   Prefer standard; `high` is the exception.
3. Save as `public/artifacts/<slug>-<n>.webp`, where `<slug>` is the tradition's node id
   and `<n>` starts at 1. The filename must be unique corpus-wide and contain no `/`.
4. Add the artifact block to the tradition's `.md` frontmatter:

```yaml
artifacts:
  - title: Nikolskoye chapel at Rogozhskoye Cemetery
    imageUrl: /artifacts/old-believers-staroobryadtsy-1.webp
    sourceUrl: https://commons.wikimedia.org/wiki/File:Example.jpg
    provenance: Author Name; CC BY-SA 4.0
    period: Photographed 2012
    description: >-
      The Rogozhskoye Cemetery complex in Moscow, the spiritual centre of the
      priested (Popovtsy) Old Believer community since 1771.
```

`sharp` is already a dependency and `scripts/build-thumbnails.js` shows the existing
resize-and-encode approach — reuse its method rather than inventing one. You may write a
small throwaway script for the fetch-and-convert step; delete it before you finish.

---

## 4. Count reconciliation — INSIDE your batch, never deferred

Adding artifacts turns `tests/artifact-licensing.test.js` red until you update it. Run:

```bash
npm run counts:artifacts
```

It prints every number the test pins, plus orphan/missing/non-webp checks that must all
read 0. Read the numbers from that output; do not guess them. Then patch
`tests/artifact-licensing.test.js`:

- the graph artifact count (~line 24, `graphArtifacts.length`)
- the disk file count (~line 70, `diskFiles.length`)
- the `.webp` file count (~line 99, `webpFiles.length`)
- `highDetailCount` (currently 102) and `standardDetailCount` (currently 1044)
- the assertion message strings, which quote the numbers

Then regenerate the attributions file:

```bash
npm run derive:attributions
```

`ATTRIBUTIONS.md` is generated deterministically from `graph.json` and the test compares
it byte-for-byte. Never hand-edit it.

Do **not** touch `tests/data-invariants.test.js` or `tests/count-agreement.test.js` —
this pass adds no nodes and no links, so 695 / 1088 must not move. If either changes, you
edited a node's data beyond its `artifacts:` block and `sources:`.

---

## 5. Recording skips — required

Skipped traditions are a documented outcome, not a silent gap. Maintain a table at the
end of this file, `## Skipped — no acceptable free image`, with one row per skipped
tradition: `| slug | reason |`. Reasons should be specific — "only available imagery is
press photography", "policy exclusion under §1.1, no neutral site image found",
"Commons holds no image of this movement or its sites".

Append your batch's skips to that table before you finish.

---

## 6. Known pre-existing defect — do not fix here

Roughly 250-350 of the 1,146 pre-existing artifacts link to images that do not depict
their stated subject, and 1,145 of 1,146 carry generated boilerplate descriptions. This
predates the expansion, is **out of scope** for this plan by the user's explicit scoping
decision, and is recorded here so it is tracked rather than forgotten. The artifact suite
does not catch it because it checks counts, licences, dimensions and orphans — never
whether an image depicts its subject.

A future pass should audit and repair it. Do not attempt it in this plan.

---

## 7. Verification gate

```bash
npm run verify
```

Green before handoff. Confirm from the output that:

- the artifact suite reports your new totals, with 0 orphans and 0 missing files
- node and link counts are still **695 / 1088** — unchanged
- `ATTRIBUTIONS.md` matches `generateAttributionsMarkdown()` exactly
- no artifact exceeds its tier's dimension limit

Then run the dev server and open two or three of the traditions you illustrated. Confirm
the image renders in the document pane and the caption reads correctly.

---

## 8. Handoff

Mark your batch `DONE` in the §0.2 ledger with the real post-batch artifact count, and
append your skips to the §5 table.

On the **final** batch only: overwrite the `PROJECT_NOTES.md` Handoff block per
`AGENTS.md`, append a dated Decisions Log entry recording (a) the hand-verified curation
model and why the automated discover pipeline was rejected, (b) the §1.1 policy exclusion
of perpetrator and atrocity imagery with the neutral-site fallback, and (c) the final
coverage figure — how many of the 122 got images and how many shipped text-only. Append a
Session Log entry.

**Do not commit or push.** The user has instructed that the working tree stay uncommitted
until this pass is complete. Report the real `git diff --stat`.

---

## Skipped — no acceptable free image

| slug | reason |
|---|---|
| ranters | No authentic seventeenth-century Ranter tracts, portraits, or contemporary hostile pamphlet woodcuts are held in Wikimedia Commons. |
| seekers-tradition | The Seekers were an unorganized, non-institutional seventeenth-century dissenting tendency with no dedicated buildings, iconography, or surviving material culture; Wikimedia Commons holds no authentic distinct visual record of the movement. |
| nuqtavism | The Nuqtavi movement was an underground esoteric current whose texts and material culture were systematically purged by the Safavids; Wikimedia Commons holds no authentic manuscript folios of Mahmud Pasikhani's treatises or verified Nuqtavi art. |
| al-ahbash | Al-Ahbash is a contemporary Lebanese movement whose available imagery comprises press photography, copyrighted institutional material, or low-resolution organizational logos; Wikimedia Commons holds no verified free cultural or architectural artifacts. |
| children-of-god | Policy exclusion under §1.1 strictly prohibits imagery of victims, members, and children; Wikimedia Commons holds no acceptable neutral architectural or historical document artifacts for the movement. |
| church-of-almighty-god | Contemporary Chinese millenarian movement whose available imagery comprises press photography, copyrighted institutional media, or organizational logos; Wikimedia Commons holds no verified free cultural, manuscript, or architectural artifacts. |
| ant-hill-kids | Policy exclusion under §1.1 strictly prohibits perpetrator and harm imagery; Wikimedia Commons holds no neutral architectural or historical records for the remote communal sites. |
| nation-of-yahweh | Policy exclusion under §1.1 strictly prohibits perpetrator and leader portraiture; Wikimedia Commons holds no neutral architectural or historical photography of the Liberty City Temple of Love. |
| dream-dance-ojibwe | The sacred Big Drum (Bwaanidewe'igan) is the tradition's central living altar and is protected from outside publication under Indigenous ceremonial custodianship; Wikimedia Commons holds no neutral architectural or unappropriated historic artifacts. |
| sumarah-javanese-mysticism | Sumarah is an internal Javanese mystical practice (Kebatinan) centered on silent meditation (sujud) without outward physical iconography or permanent temple architecture; Wikimedia Commons holds no verified free cultural artifacts or distinct historical visual documentation. |
| aum-shinrikyo | Policy exclusion under §1.1 strictly prohibits perpetrator, victim, attack, and crime-scene imagery; Commons holds no acceptable neutral architectural or historical documentary artifacts for the movement. |
| fraternitas-saturni | German occult magical order whose twentieth-century lodge records, publications, and founder portraits are unavailable under verified permissive licensing in Wikimedia Commons. |
| order-of-nine-angles | Policy exclusion under §1.1 strictly prohibits citing or reproducing operative Left-Hand Path material, insignia, sigils, or violent subversion publications; Commons holds no acceptable neutral architectural or historical documentary artifacts. |
| dragon-rouge | Contemporary Swedish Left-Hand Path magical order whose available imagery comprises copyrighted modern organizational publications; Commons holds no verified free cultural, architectural, or photographic records. |
| temple-of-the-black-light | Policy exclusion under §1.1 strictly prohibits citing or reproducing anti-cosmic operative material, insignia, or crime-scene and perpetrator records; Commons holds no acceptable neutral documentary artifacts. |
| order-solar-temple | Policy exclusion under §1.1 strictly prohibits imagery of the 1994–1997 deaths, chalets, or victims; Commons holds no acceptable neutral historical documentary artifacts for the movement. |
| chen-tao | The movement's core historical event is the unphotographable 1998 failed prophecy in Garland, Texas; Wikimedia Commons holds no authentic free photographic or manuscript artifacts of the movement or its leaders. |
| manson-family | Policy exclusion under §1.1 strictly prohibits perpetrator mugshots and portraits, victim photographs, crime scenes, or Spahn Ranch crime-scene framing; node ships text-only per editorial policy. |
