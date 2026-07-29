---
title: open
description: Expand a local or trusted BusinessLens Hub Product Report into a canonical draft Product Model.
section: open-source
group: CLI
order: 27
---

# `businesslens open`

Validate a Product Report v4 and expand it into a canonical `.businesslens/`
directory:

```bash
npx businesslens@latest open ./report.json
```

The target directory does not need to be a Git repository. Use `--cwd` to
choose where `.businesslens/` will be created:

```bash
npx businesslens@latest --cwd ./new-product open ./report.json
```

## Report sources

A local report works offline and must be a regular, non-symbolic-link file no
larger than 8 MiB.

Remote reports are limited to the official BusinessLens Hub report endpoint
or its loopback development equivalent:

```bash
npx businesslens@latest open \
  https://app.businesslens.io/api/v1/hub/blueprints/example/report.json
```

Accepted Hub paths identify either the current Blueprint report or a numbered
release. Remote URLs may not contain credentials, query strings, or fragments.
The command refuses redirects, enforces an 8 MiB response limit and a
15-second timeout, and verifies the advertised SHA-256 report digest when the
response includes one. HTTP is accepted only for literal loopback development
hosts.

## Imported evidence

A Product Report may describe behavior from a different repository, so its
source `codeRefs` are not valid evidence in the new target. `open` therefore:

- removes repository evidence from every imported entity;
- writes `coverage.md` with `status: draft`;
- records that implementation evidence must be established locally; and
- preserves product behavior, relationships, intent, links, and supporting
  content.

The resulting draft validates and builds. Missing journey and scenario
evidence remains visible as warnings until the new implementation is verified.

## Existing targets and `--force`

By default, `open` refuses a non-empty `.businesslens/` directory:

```bash
npx businesslens@latest open ./report.json --force
```

With `--force`, the existing directory is first moved to a timestamped
`.businesslens.backup-*` sibling. The backup is not deleted. A
`.businesslens` symbolic link or non-directory target is always refused.

The report is fully expanded and validated in a temporary staging directory
before the target is prepared. The command does not install skills, execute
target code, connect an account, or publish anything.
