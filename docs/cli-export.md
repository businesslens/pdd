---
title: blueprint export
description: Compile a Product Model into a source-free Product Report — the same behavior with this repository's code evidence removed.
section: open-source
group: CLI
order: 22
---

# `businesslens blueprint export`

Compile `.businesslens/` into a **source-free Product Report**:

```bash
npx businesslens@latest blueprint export
```

The report is written to `.businesslens/build/report.json`. It is a generated
artifact: gitignored, never edited, and regenerated on every run. It is the
profile the catalog accepts, which is what makes it a Blueprint once merged.

## No code evidence leaves this repository

Export strips every `codeRef`, along with repository-relative links and entry
points. A `codeRef` names a path in *this* checkout and proves nothing in any
other, so the report states what the product does without claiming where any of
it lives.

Coverage keeps its `mapped` counts, so the report still records how much of the
original model was evidence-backed — just not by what.

`export` validates before it compiles. A model with validation errors does not
produce a report; a draft model with missing-evidence warnings does.

## Why "export"

The command turns a model into a transport artifact, which is what "export"
says. "Build" now means writing the software a model describes, which BusinessLens
deliberately leaves to whatever tool you already use.

The output directory keeps its name. Renaming `.businesslens/build/` would make
every existing model's `.gitignore` stale for no user-visible benefit.

## The retired `build` and bare spellings

`businesslens build`, and the bare `export`, `open`, `pull`, and `contribute`,
are refused with a message naming the replacement. They are not aliases.

That is deliberate. An alias would have blocked reusing `export` at the top
level for the evidenced report profile later — and reusing it while the alias
existed would have silently changed what a disclosure-relevant command emits.
A command that no longer exists can say so; a command that quietly means
something else cannot.

## Where the report goes

- [`contribute`](./cli-contribute.md) builds one and opens a pull request
  proposing it as a catalog Blueprint.
- [`blueprint open`](./cli-open.md) expands one back into a Product Model.
- The catalog serves stored Blueprints to [`blueprint pull`](./cli-pull.md).
