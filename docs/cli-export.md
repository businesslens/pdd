---
title: blueprint export
description: Compile a Product Model into a source-free Product Report with repository-specific navigation removed.
section: open-source
group: CLI
order: 31
---

# `businesslens blueprint export`

Compile schema 3 `.businesslens/` into a **source-free Product Report v6**:

```bash
npx businesslens@latest blueprint export
```

The report is written to `.businesslens/build/report.json`. It is a generated
artifact: gitignored, never edited, and regenerated on every run. It is the
profile the catalog accepts, which is what makes it a Blueprint once merged.

## Portable export

Export projects `referenceProfile: workspace` to `referenceProfile: portable`.
It removes code References, implementation References, repository-relative
Reference targets and entry points, and Coverage source areas. Only HTTP(S)
intent and context References survive.

Coverage never counts References. Entity totals live in the report Summary;
Coverage remains a model-breadth assessment.

`export` lints before it compiles. A model with lint errors does not produce a
report. Missing References are valid for every Coverage status.

## Why "export"

The command turns a model into a transport artifact, which is what "export"
says. "Build" now means writing the software a model describes, which BusinessLens
deliberately leaves to whatever tool you already use.

The output directory keeps its name. Renaming `.businesslens/build/` would make
every existing model's `.gitignore` stale for no user-visible benefit.

## Retired spellings

`businesslens build`, and the bare `export`, `open`, `pull`, and `contribute`,
are refused with a message naming the replacement. They are not aliases.

That is deliberate. An alias would have blocked reusing `export` at the top
level for a different report profile later—and reusing it while the alias
existed could silently change what a disclosure-relevant command emits. A
command that no longer exists can say so; a command that quietly means
something else cannot.

## Where it lands

- [`contribute`](./cli-contribute.md) builds one and opens a pull request
  proposing it as a catalog Blueprint.
- [`blueprint open`](./cli-open.md) expands one back into a Product Model.
- The catalog serves stored Blueprints to [`blueprint pull`](./cli-pull.md).
