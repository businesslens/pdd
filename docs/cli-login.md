---
title: login
description: Authorize the BusinessLens CLI through the Platform browser flow without handling passwords or publishing keys.
section: open-source
group: CLI
order: 27
---

# `businesslens login`

Authorize the CLI to pull accessible Hub Blueprints:

```bash
businesslens login
```

The command starts a browser-based device authorization flow. It never asks
for a password, reads browser cookies, or reuses `BUSINESSLENS_API_KEY`.
After approval, the Platform returns a dedicated CLI session that is stored in
an owner-only credentials file and is never printed.

If the browser cannot open automatically, the command prints the same
verification URL and short code so the user can continue manually.

## Local Platform development

The official Platform is the default. A literal loopback origin may be
selected for local development:

```bash
businesslens login --platform http://localhost:3000
```

Only `https://app.businesslens.io`, `localhost`, `127.x.x.x`, and `::1` are
accepted. Paths, query strings, fragments, and embedded credentials are
refused before authorization begins.

## Session safety

The CLI uses the stored session only for Blueprint access.
[`pull`](./cli-pull.md) sends it only to the trusted origin recorded during
login. Redirects are refused so the credential cannot be forwarded to another
host.

## Platform contract

The CLI uses the OAuth device authorization grant with client ID
`businesslens-cli` and requests the `blueprints:read` scope:

```text
POST /api/auth/device/code
POST /api/auth/device/token
```

The code response supplies a same-origin browser verification URL. The token
response supplies a Bearer session and expiry; passwords and browser cookies
never cross into the CLI process.
