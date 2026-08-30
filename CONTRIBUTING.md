# Contributing to OpenGrail

Thank you for helping expand and refine OpenGrail. We welcome contributions ranging from adding missing religious traditions and philosophical schools to correcting historical lineages, improving geographic coordinates, or refining UI visualizations.

---

## Adding or Editing a Tradition

Every tradition in OpenGrail is represented by a single Markdown file with YAML frontmatter in the `data/` directory.

### Quick Start
1. Fork the repository and create a new branch.
2. Copy `data/_template.md` to the appropriate subfolder in `data/` (e.g. `data/dharmic/my-tradition.md`).
3. Fill out the frontmatter fields and write the Markdown body.
4. Run `npm run build:graph` to validate your changes.
5. Submit a Pull Request.

---

<!-- BEGIN_FRONTMATTER_SCHEMA -->
## Frontmatter Reference

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Yes | Lowercase kebab-case identifier (e.g. `vajrayana`, `stoicism`). |
| `title` | `string` | Yes | Primary display name. |
| `cluster` | `string` | Yes | One of the 11 recognized clusters (e.g. `Abrahamic`, `Dharmic`, `East Asian`, `Philosophical & Ethical Systems`). |
| `color` | `string` | Yes | 6-digit hex color code matching the cluster (e.g. `#3b82f6`). |
| `display_weight` | `number` | Optional | Visual prominence multiplier (`0.75` to `3.0`, default `1.0`). Editorial visual hierarchy, not population. |
| `era_start` | `string` | Yes | Approximate start date (e.g. `c. 500 BCE`, `16th century CE`). |
| `origin_year` | `number` | Yes | Numeric year for timeline navigation and filtering (e.g. `-500`, `1517`). |
| `origin_geo` | `{ lat, lng, place_name }` | Yes | Geographic coordinates and place name for the 3D globe view (`{ lat, lng, place_name }`). |
| `extinct_year` | `number | null` | Optional | Numeric year of extinction/dissolution, or `null` if the tradition is living/ongoing. |
| `epistemic_tier` | `string` | Yes | Academic certainty level: `academic_consensus`, `minority_scholarly`, `theological_claim`, or `speculative_fringe`. |
| `summary` | `string` | Yes | 1-2 sentence summary of the tradition. |
| `aliases` | `string[]` | Optional | Alternative names, transliterations, or historical designations. |
| `canonical_texts` | `string[]` | Yes | Key scriptures, foundational treatises, or primary texts. |
| `key_tenets` | `string[]` | Optional | Primary philosophical or theological tenets, ethical principles, or practices. |
| `sources` | `array` | Optional | Bibliographic citations or academic references (`string` or `{ title, url }`). |
| `artifacts` | `array` | Optional | Curated visual artifacts, manuscripts, or sacred iconography (`{ title, imageUrl, sourceUrl, provenance, period, description }`). |
| `relations` | `array` | Optional | Outgoing relationship links to other traditions (see Relation Fields below). |

### Recognized Clusters

The 11 recognized clusters are:
- `Abrahamic`
- `Dharmic`
- `East Asian`
- `Indigenous & Diasporic`
- `Iranian`
- `Ancient Near East`
- `Ancient Mediterranean`
- `Ancient European`
- `Esoteric & Modern`
- `Philosophical & Ethical Systems`
- `Speculative`

### Epistemic Tiers

- `academic_consensus`: Broadly supported by the current academic literature.
- `minority_scholarly`: A documented scholarly position without broad consensus.
- `theological_claim`: A confessional or tradition-internal theological claim.
- `speculative_fringe`: A highly speculative claim outside mainstream scholarship.

### Relation Fields

```yaml
relations:
  - target: christianity
    type: branch_of
    certainty: academic_consensus
    citation: "Historical consensus on apostolic roots"
```

- `target`: Valid `id` of another existing tradition in the atlas.
- `type`: One of `branch_of`, `diverged_from`, `influenced_by`, `syncretized_with`, `parallel_concept`, `fringe_reinterpretation`, `schism`.
- `certainty`: Academic certainty level: `academic_consensus`, `minority_scholarly`, `theological_claim`, or `speculative_fringe`.
- `citation`: Optional scholarly citation or explanation.
<!-- END_FRONTMATTER_SCHEMA -->

---

## Local Development & Testing

```bash
# Install dependencies
npm install

# Validate data and generate graph.json
npm run build:graph

# Start local development server with hot-reload
npm run dev

# Run full TypeScript check and production build
npm run build
```

---

## Standards and Guidelines

- **Epistemic Honesty**: Preserve the distinction between historical academic consensus and devotional/theological claims.
- **Neutral & Scholarly Tone**: Avoid confessional bias or dismissive language.
- **Source of Truth**: Always edit `data/**/*.md`. Never edit `public/graph.json` directly.
- **Verification gate**: Run `npm run verify` before opening a pull request. It runs the
  graph build, the TypeScript build, and the test suite. `npm run build` alone does not run
  the tests.
- **Static-first and tracker-free**: the atlas has no backend, analytics, trackers, or
  remote font or image dependencies, and images are always served from our own origin
  rather than hotlinked. Please do not add any of these.
- **Document, do not assert**: keep the distinction between recording that a tradition
  makes a claim and asserting the claim is true. Use relation `certainty` and node
  `epistemic_tier` explicitly, and qualify contested genealogies in the Markdown body.
