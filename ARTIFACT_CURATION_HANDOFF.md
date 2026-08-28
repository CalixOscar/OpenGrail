# OpenGrail artifact curation — Antigravity handoff

Take over the unfinished visual-artifact overhaul in `/Users/calmdownoscar/Documents/Projects/OpenGrail`.
Read `AGENTS.md` and the current Handoff in `PROJECT_NOTES.md` first, then check `git log -5`,
`git status`, and `git diff`. The repository is the source of truth.

## Objective

For each of the 573 tracked Markdown traditions, deliver exactly two iconic, authentic,
high-quality images:

1. core iconography, deity, founder, figurehead, or central theological symbol;
2. principal sanctuary, manuscript, inscription, or defining ritual artifact.

Use Wikimedia Commons exact `File:` pages (or another clearly free institutional source only if
the pipeline is deliberately extended). Reject video/lecture screenshots, talking heads with
subtitles, generic fabric/paper textures, blank placeholders, unrelated wildlife, maps/flags,
AI-generated art, and restricted/secret Indigenous materials. A candidate must be visibly and
semantically about the intended tradition, not merely a unique image.

## Current state

- `scripts/artifact-curation/abrahamic.json`: complete, 181/181 IDs.
- `scripts/artifact-curation/dharmic.json`: complete, 123/123 IDs.
- `scripts/artifact-curation/other.json`: partial, currently 158/269 IDs; complete the remaining
  Indigenous & Diasporic, Ancient Near East, Ancient Mediterranean, Iranian, East Asian,
  Esoteric & Modern, Ancient European, Philosophical & Ethical Systems, and Speculative IDs.
- `scripts/curate-iconic-artifacts.js`: staged Commons discovery/download/apply pipeline.
- `scripts/audit-artifacts.js`: offline integrity audit; `package.json` now exposes
  `curate:artifacts`, `apply:artifacts`, `audit:artifacts`, and runs the audit after `build:graph`.
- No Markdown artifact blocks or live assets have been replaced yet.

## Required workflow

1. Validate query-manifest coverage against **tracked** files only:
   `git ls-files -z 'data/**/*.md'` (573 files). Ignore untracked Finder/iCloud conflict copies.
   Each ID must have two distinct `{query,intent}` objects.
2. Complete `other.json` and validate its JSON/coverage before downloading.
3. Run `npm run curate:artifacts`. It serializes Commons API requests, caches selections and
   staged files under `/tmp/opengrail-artifact-curation`, and resumes safely. Fix unresolved
   queries in the manifest and rerun until all 1,146 slots stage successfully.
4. Make contact sheets of staged images and inspect them visually. Correct any weak or
   semantically mismatched selection by refining its query (do not accept a random first hit).
   Pay special attention to the known bad examples: Catholicism, Confucian traditions, Inuit
   religion, and Guarani religions. Re-run discovery for corrected queries and inspect again.
5. Before applying, move the untracked conflict copies whose names end in ` 2`, ` 3`, or ` 4`
   out of the repository to a timestamped `/tmp/opengrail-untracked-conflicts-*` backup after
   verifying they are Finder/iCloud duplicates. Do not use `git reset --hard` or remove tracked
   source files. These copies currently include duplicate `data/`, `public/`, `scripts/`, and
   `src/` paths and will otherwise break graph validation.
6. Run `npm run apply:artifacts`. It validates protected content, backs up the previous live
   artifact directory under `/tmp`, copies exactly two canonical `<id>-1/2.jpg|png` files,
   replaces only each `artifacts` frontmatter block, and writes the exact-source/license
   manifest at `scripts/artifact-curation/selected.json`.
7. Run `npm run build:graph` and then `npm run build`; both must pass with zero errors. The
   graph build now invokes `audit-artifacts.js`, which fails on missing files, wrong MIME,
   non-Commons source pages, boilerplate metadata, non-canonical names, unapproved licenses,
   or anything other than exactly two artifacts per tracked tradition.
8. Review `git diff -- data` to confirm IDs, relations, canonical texts, all non-artifact
   frontmatter, and Markdown bodies remain intact. Confirm `git status` has no accidental
   duplicate-conflict files. Update the Handoff and append a Session Log entry in
   `PROJECT_NOTES.md` with the final counts and build results.

Do not run the legacy first-result scrapers (`crawl-all-1100-images.js`,
`rebuild-100-percent-authentic-article-images.js`, `batch-fetch-wikipedia-artifacts.js`,
`deep-fetch-wikipedia.js`, `curate-authentic-artifacts.js`, or `generate-local-artifacts.js`).
