## What this changes

<!-- One or two sentences. If this adds or edits a tradition, name it and its cluster. -->

## Type of change

- [ ] New tradition (a new file under `data/`)
- [ ] Correction to an existing tradition (dates, geography, relations, summary)
- [ ] Artifact or attribution change (`public/artifacts/`, `provenance`, `ATTRIBUTIONS.md`)
- [ ] Application code (`src/`, `scripts/`, build or tooling)
- [ ] Documentation only

## Sourcing

<!-- Required for any data change. Cite what supports it: scholarly works, encyclopedias
     of religion, primary texts. "It is commonly known" is not a source. -->

- Epistemic tier / relation certainty used, and why:
- Sources:

## Checklist

- [ ] I ran `npm run verify` locally and it passed (graph build + typecheck + tests).
- [ ] I edited `data/**/*.md` only — I did not hand-edit `public/graph.json`.
- [ ] Any new image is a permissively licensed (PD, CC0, CC-BY, CC-BY-SA) WebP committed
      to `public/artifacts/`, never hotlinked, with accurate `provenance`, and I re-ran
      `npm run derive:attributions`.
- [ ] I added no backend calls, analytics, trackers, or remote font/image dependencies.
- [ ] My tone is scholarly and neutral, and I documented claims rather than asserting them.
