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

## Frontmatter Reference

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Yes | Lowercase kebab-case identifier (e.g. `vajrayana`, `stoicism`). |
| `title` | `string` | Yes | Primary display name. |
| `cluster` | `string` | Yes | One of the 11 recognized clusters (e.g. `Abrahamic`, `Dharmic`, `East Asian`, `Philosophical & Ethical`). |
| `color` | `string` | Yes | 6-digit hex color code matching the cluster (e.g. `#3b82f6`). |
| `display_weight` | `number` | Optional | Visual prominence multiplier (`0.75` to `3.0`, default `1.0`). |
| `era_start` | `string` | Yes | Approximate start date (e.g. `c. 500 BCE`, `16th century CE`). |
| `origin_year` | `number` | Yes | Numeric year for the timeline scrubber (e.g. `-500`, `1517`). |
| `origin_geo` | `[lat, lng]` | Yes | Geographic coordinates for the 3D globe view (e.g. `[31.7683, 35.2137]`). |
| `epistemic_tier` | `string` | Yes | Academic certainty level: `academic_consensus`, `minority_scholarly`, `theological_claim`, or `speculative_fringe`. |
| `summary` | `string` | Yes | 1-2 sentence summary of the tradition. |
| `aliases` | `string[]` | Optional | Alternative names, transliterations, or historical designations. |
| `canonical_texts`| `string[]` | Optional | Key scriptures, foundational treatises, or primary texts. |
| `key_tenets` | `string[]` | Optional | Bullet points of primary doctrines or practices. |
| `relations` | `array` | Optional | Outgoing relationship links to other traditions (see below). |

### Relation Fields

```yaml
relations:
  - target: christianity
    type: branch_of
    certainty: academic_consensus
    citation: "Historical consensus on apostolic roots"
```

- `target`: Valid `id` of another existing tradition.
- `type`: `branch_of`, `diverged_from`, `influenced_by`, `syncretized_with`, `parallel_concept`, `schism`, or `fringe_reinterpretation`.
- `certainty`: `academic_consensus`, `minority_scholarly`, `theological_claim`, or `speculative_fringe`.

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
