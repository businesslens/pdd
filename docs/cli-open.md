---
title: blueprint open
description: Expand a local Product Report into a canonical Product Model.
section: open-source
group: CLI
order: 35
---

# `businesslens blueprint open`

Parse and validate a Product Report v8, apply the portable projection, then
expand it into a canonical schema 4 `.businesslens/` directory:

```bash
npx businesslens blueprint open ./report.json
```

`open` also writes the model's orientation README. Nothing outside
`.businesslens/` is touched.

The target directory does not need to be a Git repository. Use
`-c, --cwd <path>` to choose where `.businesslens/` will be created:

```bash
npx businesslens --cwd ./new-product blueprint open ./report.json
```

## Report source

The local report works offline and must be a regular, non-symbolic-link file no
larger than 8 MiB. Catalog users do not download Product Reports manually; use
[`businesslens blueprint pull`](./cli-pull.md) with the Blueprint's catalog slug.
`pull` retrieves the report and invokes this expansion path internally.

A relative report path resolves against the current shell directory, not
against `--cwd`. `--cwd` chooses the repository that receives
`.businesslens/`; the report argument is an ordinary input file. In the
example above, `./report.json` is read from the shell's directory while the
model is written into `./new-product`.

## Imported navigation

`open` uses the same [portable projection](./cli-export.md#portable-export) as
`export`. Product behavior, relationships, exact availability, Capability
Scenarios, goal-focused Journeys, Journey Scenario flows, derived Journey
Capability projections, structured supporting sections, Product routes,
commands, non-file deep links, and portable References are preserved.
Repository-specific navigation is removed.

Coverage status, unmapped Product areas, and limitations are preserved. The
expanded model records that implementation alignment must be verified in its
new repository. See [Coverage](./product-model.md#coverage) for what the status
means.

## Existing targets

By default, `open` refuses a non-empty `.businesslens/` directory:

```bash
npx businesslens blueprint open ./report.json --force
```

With `--force`, the existing directory is first moved to a timestamped
`.businesslens.backup-*` sibling. The backup is not deleted. A
`.businesslens` symbolic link or non-directory target is always refused.

The report is fully expanded and linted in a temporary staging directory
before the target is prepared. The command does not install skills, execute
target code, connect an account, or publish anything.
