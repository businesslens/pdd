---
title: open
description: Expand a local Product Report into a canonical draft Product Model.
section: open-source
group: CLI
order: 32
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

## Report source

The local report works offline and must be a regular, non-symbolic-link file no
larger than 8 MiB. Catalog users do not download Product Reports manually; use
[`businesslens pull`](./cli-pull.md) with the Blueprint's canonical name.
`pull` retrieves the report and invokes this expansion path internally.

A relative report path resolves against the current shell directory, not
against `--cwd`. `--cwd` chooses the repository that receives
`.businesslens/`; the report argument is an ordinary input file. In the
example above, `./report.json` is read from the shell's directory while the
model is written into `./new-product`.

## Imported evidence

A Product Report may describe behavior from a different repository, so its
source `codeRefs` are not valid evidence in the new target. `open` therefore:

- removes repository evidence from every imported entity;
- writes `coverage.md` with `status: draft`;
- records that implementation evidence must be established locally; and
- preserves product behavior, relationships, intent, product routes, HTTP(S)
  links, and supporting content.

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
