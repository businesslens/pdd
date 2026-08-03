---
title: blueprint open
description: Expand a Blueprint held in a local file into a canonical Product Model while preserving model completeness.
section: open-source
group: CLI
order: 31
---

# `businesslens blueprint open`

Parse and check a strict Product Report v6, then expand it into a canonical
schema 3 `.businesslens/` directory:

```bash
npx businesslens@latest blueprint open ./report.json
```

`open` also writes `.businesslens/README.md`, telling a coding agent that this
model is a specification and its scenarios are the acceptance contract. It is
the same file [`pull`](./cli-pull.md) writes, for the same reason. Nothing
outside `.businesslens/` is touched.

The target directory does not need to be a Git repository. Use `--cwd` to
choose where `.businesslens/` will be created:

```bash
npx businesslens@latest --cwd ./new-product blueprint open ./report.json
```

## Report source

The local report works offline and must be a regular, non-symbolic-link file no
larger than 8 MiB. Catalog users do not download Product Reports manually; use
[`businesslens blueprint pull`](./cli-pull.md) with the Blueprint's canonical name.
`pull` retrieves the report and invokes this expansion path internally.

A relative report path resolves against the current shell directory, not
against `--cwd`. `--cwd` chooses the repository that receives
`.businesslens/`; the report argument is an ordinary input file. In the
example above, `./report.json` is read from the shell's directory while the
model is written into `./new-product`.

## Imported navigation

A Product Report may describe behavior from a different repository, so `open`
projects every input to the portable Reference profile and therefore:

- removes code, implementation, and repository-relative References;
- preserves the report's model-breadth coverage status;
- records that implementation alignment must be verified locally; and
- preserves Product behavior, Interfaces, Experiences, exact availability,
  Capabilities, relationships, intent, Screens, Product routes,
  mobile deep links, portable HTTP(S) References, and supporting content.

The resulting model lints and exports. Missing References are valid because
attachments are not implementation state.

## Existing targets

By default, `open` refuses a non-empty `.businesslens/` directory:

```bash
npx businesslens@latest blueprint open ./report.json --force
```

With `--force`, the existing directory is first moved to a timestamped
`.businesslens.backup-*` sibling. The backup is not deleted. A
`.businesslens` symbolic link or non-directory target is always refused.

The report is fully expanded and linted in a temporary staging directory
before the target is prepared. The command does not install skills, execute
target code, connect an account, or publish anything.
