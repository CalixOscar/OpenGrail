# OpenGrail

OpenGrail is a local, visual atlas for exploring relationships among religious traditions, theological developments, and comparative concepts. It pairs Markdown source documents with a force-directed graph and keeps academically supported, confessional, minority-scholarly, and fringe claims visibly distinct.

## Run locally

```bash
npm install
node scripts/build-graph.js
npm run dev
```

Open the local URL printed by Vite. The development command also rebuilds `public/graph.json`, so edits to frontmatter can be picked up by restarting the server.

For a production check:

```bash
npm run build
npm run preview
```

## Content model

Each file below `data/` is the source of truth for one tradition. YAML frontmatter supplies graph metadata and outgoing relations; the remaining Markdown becomes the document reader body. `scripts/build-graph.js` validates every record, resolves relation targets, deduplicates links, computes inbound and outbound backlinks, and writes deterministic JSON to `public/graph.json`.

The included atlas contains 536 traditions, denominations, schools, historical religions, and modern movements across ten clusters, connected by 805 documented graph relations. A dedicated `branch_of` relation builds a nested family tree for denominations and schools, while cross-cluster links preserve influence, divergence, syncretism, conceptual parallels, schisms, and clearly marked fringe reinterpretations. Relation certainty is stored independently from node-level epistemic tier so a well-established tradition can still carry a debated or speculative comparison without conflating the two.

Node size is a presentation aid, not an estimate of adherent population. Every node grows modestly with its number of graph connections, while the optional `display_weight` frontmatter field (validated from `0.75` to `3`) keeps major umbrella traditions legible at overview zoom. Records without that field default to `1`. Optional `aliases` improve discovery across self-designations, common historical names, transliterations, and languages; search also tolerates small spelling mistakes.

## Licensing

New application code is dual-licensed: you may use it under the [GNU AGPL v3-or-later](LICENSE)
or obtain a separate [OpenGrail Commercial License](LICENSE-COMMERCIAL.md) for proprietary
modifications and deployments. See [LICENSING.md](LICENSING.md) for the exact scope and the
transition from the initial MIT release.

Authored atlas data, generated graph content, and documentation remain under the
[MIT content license](LICENSE-CONTENT-MIT.md). Third-party dependencies and the retained
`TheoGraph.png` reference image have separate rights and provenance.

## Interface

- Search the atlas or the nested tradition tree to focus a node; matching descendants keep their parent context visible.
- Click any node or sidebar entry to open its Markdown document.
- Use parent, branch, influence, and backlink cards to travel directly between related traditions.
- Toggle epistemic tiers and relation types to reshape the visible graph.
- Switch cluster attraction on or off, drag nodes, pan the canvas, or use the camera controls to refit the atlas.
