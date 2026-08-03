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
npx businesslens@latest blueprint pull <blueprint-slug>
```

The argument is the Blueprint's catalog slug: lowercase kebab-case, at most 80
characters. **No account, sign-in, or credential is involved** — the catalog is
anonymous to read.

`pull` fetches the Product Report, verifies its mandatory SHA-256 digest, and
passes it to [`open`](./cli-open.md) for portable expansion.

## Result

The Blueprint becomes a canonical `.businesslens/` Product Model with its
orientation README. It follows the same
[portable projection](./cli-export.md#portable-export) and Coverage handling as
`open`. Nothing outside `.businesslens/` is touched.

Use `--cwd <path>` to choose the target directory. By default `pull` refuses a
non-empty `.businesslens/`; `--force` first moves it to a timestamped backup.

## Choosing a catalog

```bash
npx businesslens@latest blueprint pull <slug> --catalog http://localhost:3200
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
- responses larger than 8 MiB;
- a missing or malformed report digest, or one that does not match the body;
- a response served for a different Blueprint; and
- not-found, withdrawn, and catalog-unavailable responses.

## Catalog contract

```text
GET /api/v1/blueprints/:slug/report.json
```

The request is anonymous and carries `user-agent: businesslens/<version>`, so
catalog operators can tell a CLI pull from a page view. A successful response is
the Product Report body and must include `x-businesslens-blueprint` and
`x-businesslens-report-digest`.

| Status | Meaning |
| --- | --- |
| `200` | The Product Report |
| `404` | No such Blueprint |
| `410` | The Blueprint was withdrawn from the catalog |
| `503` | The catalog is temporarily unavailable |

## After pulling

Continue with [Start from a Blueprint](./from-a-blueprint.md) to review, adapt,
build, and verify the model.
