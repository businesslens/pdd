---
title: blueprint export
description: Compile a Product Model into a Blueprint — the same behavior with this repository's code evidence removed.
section: open-source
group: CLI
order: 29
---

# `businesslens blueprint export`

Compile `.businesslens/` into a **Blueprint**:

```bash
npx businesslens@latest blueprint export
```

The Blueprint is written to `.businesslens/build/report.json`. It is a
generated artifact: gitignored, never edited, and regenerated on every run.

## No code evidence leaves this repository

Export strips every `codeRef`, along with repository-relative links and entry
points. A `codeRef` names a path in *this* checkout and proves nothing in any
other, so a Blueprint states what the product does without claiming where any
of it lives.

Coverage keeps its `mapped` counts, so a Blueprint still records how much of
the original model was evidence-backed — just not by what.

`export` validates before it compiles. A model with validation errors does not
produce a report; a draft model with missing-evidence warnings does.

## Why "export"

The command turns a model into a transport artifact, which is what "export"
says. "Build" now means writing the software a model describes, which BusinessLens
deliberately leaves to whatever tool you already use.

The output directory keeps its name. Renaming `.businesslens/build/` would make
every existing model's `.gitignore` stale for no user-visible benefit.

## The deprecated `build` alias

`businesslens build` still works and prints a deprecation warning. It is purely
local, so renaming it outright would break CI scripts that nothing else in this
release affects. The alias is undocumented in help and will be removed after
0.6.x.

## Where the report goes

- [`contribute`](./cli-contribute.md) builds one and opens a pull request
  proposing it as a catalog Blueprint.
- [`blueprint open`](./cli-open.md) expands one back into a Product Model.
- The catalog serves stored Blueprints to [`blueprint pull`](./cli-pull.md).
