# Public Release Plan

**Status:** Plan only.
**Author:** Claude Code, 2026-08-30
**Question answered:** what has to be true before `CalixOscar/OpenGrail` flips from private to public.

Two things block the flip, and one decision has a deadline attached. Verified against the
working tree on 2026-08-30; re-check with `git diff` before acting.

---

## The blocker: the licence claims rights over images it does not hold

`LICENSE` is unqualified MIT and `README.md:117` says the project "is licensed under the MIT
License" with no carve-out. The repository bundles 1,146 third-party images under
`public/artifacts/`. Their actual terms, parsed from the `provenance` field of every artifact
in `public/graph.json`:

| Terms | Count | Obligation |
|---|---|---|
| Public domain | 360 | none |
| CC0 | 66 | none |
| CC-BY-SA 2.0 / 2.5 / 3.0 / 4.0 | 556 | attribution **and** share-alike |
| CC-BY 2.0 / 2.1 / 2.5 / 3.0 / 4.0 | 164 | attribution |

720 of 1,146 images carry obligations, and 556 are share-alike. MIT permits sublicensing and
relicensing; the project cannot grant that over works it does not own. As written the repo
tells downstream users they may do things the upstream licences forbid.

**The substance is already right.** Every artifact carries an exact
`https://commons.wikimedia.org/wiki/File:` `sourceUrl` (1,146 of 1,146) and a `provenance`
string naming author and licence, and the UI surfaces both — `DocumentPane.tsx:668` and
`Lightbox.tsx:150`. The defect is confined to the top-level claim.

### Fix

1. **Scope `LICENSE`.** Keep MIT, and state that it covers the application source, the
   authored Markdown records under `data/`, and the documentation — not the contents of
   `public/artifacts/`.
2. **Add `NOTICE.md`** stating that bundled images are third-party works, each under its own
   terms, with per-file attribution in `ATTRIBUTIONS.md` and machine-readable attribution in
   `public/graph.json`.
3. **Generate `ATTRIBUTIONS.md` mechanically** from `graph.json` — title, author, licence,
   Commons URL, and the local filename, one row per image. The data is already present, so
   this is a script, not a research task. Add it to `scripts/`, wire it into
   `npm run derive:schema` or its own `derive:attributions`, and assert in the test suite
   that every artifact resolves to a row. Drift here is a licence violation, not a
   formatting nit, so it belongs under the same drift discipline as the schema.
4. **Correct `README.md:117`** to point at the split rather than claiming blanket MIT.
5. **Keep the CC-BY-SA images as-is.** Share-alike binds derivative works of *those images*.
   Bundling them unmodified beside separately-licensed code does not force MIT code to
   become CC-BY-SA. Do not let anyone "solve" this by relicensing the project.

---

## The decision with a deadline: 1.02 GiB of git history

`git count-objects` reports a 1.02 GiB pack. The current images account for 821 MB; the rest
is history, across the 11 commits that touched `public/artifacts/`. Every clone pays this,
including someone fixing a typo in `CONTRIBUTING.md`.

**This is cheap to fix now and expensive later.** The repository has never been public, so
nobody has cloned it and history can be rewritten freely. After publication, rewriting
history breaks every fork and clone in existence. If the images are ever coming out of git,
they have to come out *before* the flip.

### Options, ranked

**A. Ship the manifest, not the bytes — recommended.**
All 1,146 artifacts already carry exact Commons `File:` URLs. Track the manifest and a fetch
script; drop the binaries from the tree and from history. `npm run fetch:artifacts`
populates `public/artifacts/` locally and in the deploy build. Clone drops to roughly 20 MB.
Costs: the build gains a network dependency, and Commons files can be renamed or deleted, so
the fetch script must fail loudly and be pinned by checksum. Mitigate by keeping a mirrored
copy in the deploy repo, which already vendors the built output.

**B. Git LFS.** Keeps `git clone` small and the workflow familiar, but LFS bandwidth on
GitHub is metered and a popular public repo can exhaust it. Also requires every contributor
to install LFS.

**C. Optimise in place and keep them tracked.** Measured on real files, not estimated:
a random 30-file sample re-encoded at 1600px / JPEG q70 shrinks 33% (821 MB to about
551 MB); the eight largest files shrink 91% (47.2 MB to 4.3 MB), because the tail is a
handful of 6-9 MB PNGs while the median file is already about 570 KB. WebP would take
another 25-30% off but `sips` on this machine cannot write it, so it needs `cwebp` or
`sharp`. Even at its best this lands in the high hundreds of MB and does not fix history.
Worth doing regardless of which option wins, as a display-quality improvement.

**Recommendation: A, with C applied to whatever gets fetched.** Do it before the flip.

---

## On generating the images instead

Asked directly: **yes it is technically possible and it would be cheap in money — and it is
the wrong trade for this project.** I could not get per-image pricing from the model catalogue,
so treat any figure as unverified; budget-tier text-to-image runs on the order of cents per
image, which puts 1,146 images plausibly in the tens of dollars. The cost is not the problem.

**It would destroy the thing the atlas is for.**

- These are photographs of specific real objects — the Nestorian Stele, Göbekli Tepe,
  particular Kabbalah manuscripts. A generated "Nestorian Stele" is not that stele. It is a
  plausible fake of a real object that exists and has been photographed.
- The project's own standing rule (`AGENTS.md`) is to "preserve the distinction between a
  documented tradition and the truth of its claims", and the 2026-08-28 Decisions Log entry
  commits to exact-source curation with "zero placeholder boilerplate". Sprint 01 Track B
  removed a claim that two traditions "evolved independently" because the dataset only
  recorded absence of evidence. Swapping verified artifacts for synthetic ones is the same
  error at 1,146x scale, and it would sit directly beneath scholarly provenance metadata.
- Much of this is sacred imagery of living traditions. Synthetic deity iconography,
  sanctuaries and ritual objects presented as representative invites reasonable objection
  from those communities, and the errors would be invisible to non-specialists — which is
  exactly the audience an atlas serves.
- It does not even solve the stated problems well. Licensing is fixed far more cheaply by
  items 1-4 above, and size is fixed by option A.

**Where generation is legitimate here:** as an explicitly-labelled fallback for a tradition
with no suitable freely-licensed image, rendered in a visibly non-photographic style, stored
in a separate directory, flagged in the data with something like
`artifact_kind: illustration`, and captioned in the UI as an illustration rather than an
artifact. That is additive and honest. Replacing the curated library is neither.

---

## Also worth settling before the flip

Not blockers; judgement calls.

- `PROJECT_NOTES.md:3` hardcodes `/Users/calmdownoscar/Documents/Projects/OpenGrail`.
- `PROJECT_NOTES.md` and `AGENTS.md` document the internal studio process, agent handoffs and
  the deploy path into the site repository. Publishing them is a choice; some projects gain
  from that transparency and some do not.
- `calix@` and `research@calmdownoscar.com` appear in scraper User-Agent strings. These are
  deliberate — Wikimedia asks for a contact address — and should stay.

## Already fine

No secrets (`token` matches are z-index tokens and a tokeniser function). No stale AGPL or
commercial licence references in code; only historical mentions in the notes. `dist/` and
`node_modules/` correctly ignored. The contributor contract works, which is the first thing a
public repository gets judged on.
