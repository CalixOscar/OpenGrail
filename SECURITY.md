# Security Policy

OpenGrail is a fully static site: no backend, no database, no accounts, no analytics, and
no remote runtime dependencies. The realistic risk surface is therefore the build and
supply chain (dependencies, scripts, CI), the data pipeline, and cross-site scripting via
tradition content rendered as Markdown.

## Supported versions

Only the `main` branch and the deployed atlas are supported. Fixes land on `main`.

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Report it privately through GitHub's
[private vulnerability reporting](https://github.com/CalixOscar/OpenGrail/security/advisories/new),
which notifies the maintainer directly and keeps the discussion confidential until a fix
ships.

Please include: what the issue is, how to reproduce it, the affected file or route, and
what an attacker could achieve. A working proof of concept helps but is not required.

Expect an initial acknowledgement within 7 days. There is no bug bounty; credit is given
in the advisory unless you prefer otherwise.

## In scope

- Cross-site scripting or HTML injection through tradition Markdown, frontmatter, or
  artifact metadata rendered in the atlas.
- Dependency, lockfile, install-script, or GitHub Actions workflow compromise.
- Path traversal or arbitrary file write in the `scripts/` data pipeline.
- Anything that causes the deployed static site to load a remote resource, tracker, or
  third-party script.

## Out of scope

- Missing security headers on the static host, and other hosting configuration outside
  this repository.
- Denial of service against GitHub or the static host.
- Automated scanner output with no demonstrated impact.
- Disputes about the historical or theological content of the atlas — those are
  [issues](https://github.com/CalixOscar/OpenGrail/issues) or
  [discussions](https://github.com/CalixOscar/OpenGrail/discussions), not vulnerabilities.
