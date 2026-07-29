---
title: validate
description: Run the deterministic validator and explain every error, warning, and count — strictly read-only.
section: open-source
group: Skills
order: 18
---

# businesslens-validate

The read-only agent interface to the deterministic CLI validator: it runs
`npx businesslens validate --json`, treats the CLI as the authority, and
explains every finding without changing a single file.

## When to use it

- Checking a model after authoring, syncing, or planning.
- Confirming CI readiness before opening a pull request.
- Understanding what a specific finding means — it reads the referenced
  files for context and points at the fix.
- For repairs or drift investigation, use
  [`businesslens-doctor`](./skill-businesslens-doctor.md) instead.

## Invocation

```text
/businesslens-validate
```

## What it reports

- **Result** — pass or fail, with the exit status.
- **Errors and warnings** — every finding, grouped by file, explained
  against the [validation rules](./validation-rules.md).
- **Counts** — actors, experiences, domains, features, journeys, scenarios,
  and business rules.
- **Next action** — `businesslens-init` for a missing model,
  `businesslens-verify` when `needs at least one codeRef` findings mean
  planned-but-unverified behavior, `businesslens-doctor` when diagnosis or
  repair is needed.

It states explicitly that a green result proves format and relationship
integrity — not complete or current product coverage.

## Guardrails

- Strictly read-only, even when validation fails.
- Never suppresses, rewrites, or reinterprets validator findings.
- Never executes target code, never contacts the platform.
