---
title: blueprint pull
description: Pull a Blueprint from the public catalog into the current directory.
section: open-source
group: CLI
order: 33
---

# `businesslens blueprint pull`

Pull a Blueprint into the current directory:

```bash
npx businesslens blueprint pull <blueprint-slug>
```

The argument is the Blueprint's catalog slug: lowercase kebab-case, at most 80
characters. **No account, sign-in, or credential is involved** — the catalog is
anonymous to read.

`pull` fetches and validates the Blueprint and its optional Product logo from
the same catalog, then passes them to [`open`](./cli-open.md) for portable
expansion.

## Result

The Blueprint becomes a canonical `.businesslens/` Product Model with its
orientation README. It follows the same
[portable projection](./cli-export.md#portable-export) and Coverage handling as
`open`. Nothing outside `.businesslens/` is touched.

Use `-c, --cwd <path>` to choose the target directory. By default `pull`
refuses a non-empty `.businesslens/`; `--force` first moves it to a timestamped
backup.

## Choosing a catalog

```bash
npx businesslens blueprint pull <slug> --catalog http://localhost:3200
```

Precedence is `--catalog`, then `BUSINESSLENS_CATALOG_URL`, then the public
catalog at `https://businesslens.io`.

You may run your own catalog. Its URL must be a bare origin without credentials,
a path, a query, or a fragment. HTTPS is required except for a loopback
development host.

## Safety

Before writing any Product Model files, `pull` refuses:

- a slug that is not lowercase kebab-case;
- a plaintext catalog origin that is not loopback;
- redirects;
- reports larger than 8 MiB;
- a missing or malformed report digest, or one that does not match the body;
- a response served for a different Blueprint;
- a report served for a different Product Report version than this CLI reads;
  and
- not-found, withdrawn, and catalog-unavailable responses.

## Catalog contract

```text
GET /api/v1/blueprints/:slug/report.json
GET /api/v1/blueprints/:slug/logo.svg
```

Both requests are anonymous and carry `user-agent: businesslens/<version>`, so
catalog operators can tell a CLI pull from a page view. A successful report
response is the Product Report body and must include
`x-businesslens-blueprint` and `x-businesslens-report-digest`. The logo endpoint
keeps visual identity on the same catalog and revision as the report; a missing
logo does not prevent the Product Model itself from being pulled.

### Report version

`pull` asks for the one Product Report version it reads, by name:

```text
accept: application/vnd.businesslens.report+json; version=13, application/json
```

The `version` parameter is the report schema's major alone, and it is the whole
compatibility statement: there is no compatibility reader, so a report of
another major is refused rather than migrated. `application/json` is the
fallback for a catalog that does not negotiate media types.

Answer with either content type. If you answer with the report media type,
carry the `version` parameter of the report you are serving — a response whose
`version` differs from the one asked for is refused before its body is read,
naming both versions. A response with no `version` parameter is read, and a
mismatched `schemaVersion` inside the body is refused by validation instead.

If you serve more than one report version, use the requested `version` to choose
the representation. Any other failing status is reported with its code and, when
the body is JSON, its `message`.

| Status | Meaning |
| --- | --- |
| `200` | The Product Report |
| `404` | No such Blueprint |
| `410` | The Blueprint was withdrawn from the catalog |
| `503` | The catalog is temporarily unavailable |

## After pulling

Continue with [Start from a Blueprint](./from-a-blueprint.md) to review, adapt,
build, and verify the model.
