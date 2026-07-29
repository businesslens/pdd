---
title: pull
description: Pull the latest or an exact BusinessLens Hub Blueprint version by canonical name.
section: open-source
group: CLI
order: 28
---

# `businesslens pull`

Pull a Hub Blueprint into the current directory:

```bash
npx businesslens@latest pull <blueprint-name>
```

The argument is the Blueprint's globally unique canonical Hub name. Omitting a
version selects the latest version available to the logged-in user. Pin an
exact immutable version when reproducibility matters:

```bash
npx businesslens@latest pull <blueprint-name> --version 3
```

Run [`businesslens login`](./cli-login.md) first. `pull` fetches the Product
Report with that stored session, verifies its mandatory SHA-256 digest and
resolved version, and passes it directly to the same expansion primitive as
[`open`](./cli-open.md). The report is not offered as, or saved as, a
user-facing download.

## Result

The pulled report becomes a canonical `.businesslens/` Product Model:

- repository-specific `codeRefs` are removed;
- `coverage.md` is written with `status: draft`;
- product behavior, relationships, intent, product routes, HTTP(S) links, and
  supporting content are preserved; and
- missing local implementation evidence remains visible as validation
  warnings.

Use `--cwd <path>` to choose the target directory. By default, `pull` refuses
a non-empty `.businesslens/`; `--force` first moves it to a timestamped backup.

## Safety

Before writing any Product Model files, `pull` refuses:

- an invalid canonical name or version;
- a missing or expired CLI login;
- redirects;
- responses larger than 8 MiB;
- missing or invalid report digests;
- a response for a different Blueprint or requested version; and
- authentication, entitlement, withdrawn-version, and not-found responses.

## Platform contract

Canonical names use lowercase kebab-case and are at most 80 characters. Pull
requests reuse the stable Hub report endpoints:

```text
GET /api/v1/hub/blueprints/:canonicalName/report.json
GET /api/v1/hub/blueprints/:canonicalName/releases/:version/report.json
```

The stored login is sent as a Bearer token. A successful response is the
Product Report body and must include
`x-businesslens-blueprint`, `x-businesslens-revision`, and
`x-businesslens-report-digest`. Latest resolution happens on the Platform;
the resolved immutable version is always returned in the version header.

## Hub modal

The Hub Blueprint page presents a single **Use this Blueprint** modal with
three vertical steps. Each command has its own copy action.

```bash
npx businesslens@latest install
npx businesslens@latest login
npx businesslens@latest pull content-feed-reader
```

Selecting **Pin version N** adds `--version N` to the third command.
