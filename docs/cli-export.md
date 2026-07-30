---
title: export
description: Compile a Product Model into a source-free Product Report.
section: open-source
group: CLI
order: 28
---

# `businesslens export`

Compile `.businesslens/` into a Product Report:

```bash
npx businesslens@latest export
```

The report is written to `.businesslens/build/report.json`. It is a generated
artifact: gitignored, never edited, and regenerated on every run.

`export` validates before it compiles. A model with validation errors does not
produce a report; a draft model with missing-evidence warnings does.

## Why "export"

The command turns a model into a transport artifact, which is what "export"
says. "Build" now means implementing the software a model describes — the job of
the `businesslens-implement` skill.

The output directory keeps its name. Renaming `.businesslens/build/` would make
every existing model's `.gitignore` stale for no user-visible benefit.

## The deprecated `build` alias

`businesslens build` still works and prints a deprecation warning. It is purely
local, so renaming it outright would break CI scripts that nothing else in this
release affects. The alias is undocumented in help and will be removed after
0.7.x.

## Where the report goes

- [`contribute`](./cli-contribute.md) builds one, redacts it, and opens a pull
  request proposing it as a catalog Blueprint.
- [`open`](./cli-open.md) expands a local report back into a Product Model.
- The catalog serves stored reports to [`pull`](./cli-pull.md).
