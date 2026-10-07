---
title: blueprint pull
description: Pull a Blueprint from the public catalog into the current directory.
section: open-source
group: CLI
order: 27
---

# `businesslens blueprint pull`

Pull a [Blueprint](./from-a-blueprint.md#what-a-blueprint-is) from the catalog by
name into `.businesslens/`, to start a product from a reviewed model.

```bash
npx businesslens blueprint pull <name> [--catalog <origin>] [--force]
```

## Options

| Option | Meaning |
| --- | --- |
| `<name>` | The Blueprint's catalog slug: lowercase kebab-case, at most 80 characters |
| `--catalog <origin>` | Catalog to pull from. Otherwise `BUSINESSLENS_CATALOG_URL`, then `https://businesslens.io` |
| `--force` | Move a non-empty `.businesslens/` aside to a backup first |

`--cwd` picks the directory that receives `.businesslens/`.

## What it does

1. Fetches the report from the catalog, anonymously (no account or sign-in).
2. Checks it, then fetches the Product logo and cover if the catalog has them.
   A missing or invalid one is skipped, not an error, and a cover comes only
   with a logo.
3. Expands it exactly as [`blueprint open`](./cli-open.md) does, with the logo
   restored as `.businesslens/product/logo.svg` and the cover as
   `.businesslens/product/cover.webp`.

## Safety

`pull` writes only after the report matches its digest, its Blueprint name, this
CLI's report version and the 8 MiB limit, and it never follows a redirect. A
refusal writes nothing.

A catalog origin must be bare (no credentials, path, query or fragment) and
use HTTPS, except on `localhost`, `127.x.x.x` or `::1`.

Exits 0 when the model is written, 1 when the catalog, the network or the
target refuses it, and 2 for an invalid name, catalog origin or option.

## Run your own catalog

Serve two anonymous endpoints:

| Request | Answer |
| --- | --- |
| `GET /api/v1/blueprints/:slug/report.json` | The report, with `x-businesslens-blueprint: <slug>` and `x-businesslens-report-digest: <sha-256 hex of the canonical report JSON>`; `404` unknown, `410` withdrawn, `503` unavailable |
| `GET /api/v1/blueprints/:slug/logo.svg` | The Product logo, optional |
| `GET /api/v1/blueprints/:slug/cover.webp` | The Product cover, optional |

`pull` asks for `application/vnd.businesslens.report+json; version=18` and
also accepts `application/json`.

## Next

- [Start from a Blueprint](./from-a-blueprint.md#steps) to review, adapt and
  implement it.
