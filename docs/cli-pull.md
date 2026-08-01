---
title: blueprint pull
description: Pull a Blueprint from the public catalog into the current directory.
section: open-source
group: CLI
order: 31
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
passes it to the same expansion primitive as [`open`](./cli-open.md).

## Result

The pulled report becomes a canonical `.businesslens/` Product Model:

- `coverage.md` is written with `status: draft`;
- product behavior, relationships, intent, routes, HTTP(S) links, and supporting
  content are preserved;
- there are no `codeRefs`, because nothing is implemented yet; and
- missing implementation evidence remains visible as validation warnings — that
  is the worklist.

`pull` also writes a managed block into `AGENTS.md` telling a coding agent what
it is looking at: a specification for a product that has not been built, whose
scenarios are the acceptance contract. Without it, "hand the model to your
agent" would depend on you writing that prompt yourself.

The expansion is a fixed point. What lands in your directory is byte-identical
to the model committed under `blueprints/<slug>/` in `businesslens/pdd`.

Use `--cwd <path>` to choose the target directory. By default `pull` refuses a
non-empty `.businesslens/`; `--force` first moves it to a timestamped backup.

## Choosing a catalog

```bash
npx businesslens@latest blueprint pull <slug> --catalog http://localhost:3200
```

Precedence is `--catalog`, then `BUSINESSLENS_CATALOG_URL`, then the public
catalog at `https://businesslens.io`.

Any origin is accepted, so you may run your own catalog. The origin allowlist
that used to guard this path existed to protect an API key that the read path no
longer sends. The shape is still checked: a bare origin, no credentials, path,
query, or fragment, and https except on a loopback development host.

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
| `304` | Your `if-none-match` matched; nothing changed |
| `404` | No such Blueprint |
| `410` | The Blueprint was withdrawn from the catalog |
| `503` | The catalog is temporarily unavailable |

## After pulling

```bash
npx businesslens@latest blueprint pull content-feed-reader
```

Then either hand the directory to a coding agent and ask it to build the
product, or refine the model first with `businesslens-plan` and build after. See
[Build from a Blueprint](./tutorial-build-from-a-blueprint.md).
