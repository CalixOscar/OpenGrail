# OpenGrail licensing

OpenGrail uses a dual-license model for new application code, with a separate
license for the authored atlas content and documentation.

## Application source

The OpenGrail application source is available under either:

1. the [GNU Affero General Public License, version 3 or any later version](LICENSE); or
2. the [OpenGrail Commercial License](LICENSE-COMMERCIAL.md).

The AGPL option is the default when no separate commercial agreement exists. A
commercial agreement is intended for organizations that need to keep changes to
the application proprietary or need other rights outside the AGPL. Anyone may
still use the AGPL option, including for commercial purposes, provided they meet
its source-sharing and notice requirements.

This scope covers the authored application and build source, including `src/`,
`scripts/`, `index.html`, `vite.config.ts`, the TypeScript configuration files,
and application metadata in `package.json`. Third-party dependencies remain
under their own licenses.

## Atlas data and documentation

Unless a file states otherwise, authored Markdown under `data/`, generated
`public/graph.json`, project documentation, and configuration guidance remain
under the [MIT content license](LICENSE-CONTENT-MIT.md). This keeps the data
license explicit instead of accidentally applying AGPL terms to research notes
or generated content.

The retained `TheoGraph.png` reference image is not relicensed by this notice;
its embedded provenance and any third-party rights remain separate.

## Licensing transition

The published history through commit `007686a` (including the initial `0.1.0`
release state) was released under MIT. That permission is not revoked. The
dual-license policy in this file applies to new application code added from the
commit that introduced this notice onward.

This document describes the intended license scope; the license texts linked
above control if there is any conflict. It is not legal advice.
