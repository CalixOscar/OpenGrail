# OpenGrail Agent Guide

Before changing this project, read `PROJECT_NOTES.md`, especially Handoff, then check
`git log -5`, `git status`, and `git diff` in the project root. The repository state is
the source of truth if notes and files disagree.

## Project rules

- Keep `data/**/*.md` as the source of truth. Do not edit `public/graph.json` by hand;
  run `npm run build:graph` after data changes.
- Preserve the distinction between a documented tradition and the truth of its claims.
  Use relation `certainty` and node `epistemic_tier` explicitly, and qualify contested
  genealogies in the Markdown body.
- Give branches a valid `branch_of` target, use aliases for transliterations and common
  names, and use `display_weight` only for editorial visual prominence—not population.
- Keep the web layer static-first, accessible, and tracker-free. Do not add analytics,
  remote font dependencies, or a backend without a recorded decision.
- Keep `PROJECT_NOTES.md` lean: overwrite Handoff in place, append Decisions Log and
  Session Log entries, and preserve all six fixed Handoff fields.

## Verification

Run `npm run build` before handing off frontend or data changes. For UI changes, run the
local Vite app and check search, filters, graph selection, document panes, backlinks, and
nested branch navigation in a browser. Generated graph invariants should have no duplicate
IDs, missing targets, isolated nodes, or branch cycles.
