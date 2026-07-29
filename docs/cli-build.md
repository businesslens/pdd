---
title: build
description: Compile a valid local Product Model into a portable, source-free Product Report.
section: open-source
group: CLI
order: 25
---

# `businesslens build`

Compile `.businesslens/` into a Product Report:

```bash
npx businesslens@latest build
```

The command must run inside a Git repository with a valid Product Model.
It runs the same rules as [`validate`](./cli-validate.md) and stops without
producing a report when validation has errors. Warnings, including missing
evidence warnings on a draft model, do not block the build.

## Outputs

The build writes:

| Path | Contents |
| --- | --- |
| `.businesslens/build/report.json` | Portable Product Report v4 |
| `.businesslens/cache/build.json` | Timestamp and schema metadata for the latest build |

Both directories are generated CLI output and should stay ignored by Git. The
standard `.businesslens/.gitignore` already ignores `build/` and `cache/`.
The CLI refuses to traverse or overwrite symbolic links in these output paths.

The report contains the model and its code-reference metadata, but no source
files. Repository URL, branch, and commit provenance are deliberately absent,
which makes the report reusable as a Product Model artifact or Blueprint
revision.

## Local-only behavior

`build` does not contact the BusinessLens Platform and does not require:

- `BUSINESSLENS_API_KEY`;
- a Git remote;
- a clean worktree;
- a checked-out branch; or
- complete evidence while coverage is `draft`.

Use [`publish`](./cli-publish.md) when the report should become an immutable
Platform Version with pinned Git provenance. Use
[`open`](./cli-open.md) to expand a report into a canonical Product Model in
another directory.
