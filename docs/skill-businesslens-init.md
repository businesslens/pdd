---
title: init
description: Build the initial evidence-backed product model by inspecting an existing codebase.
section: open-source
group: Skills
order: 15
---

# businesslens-init

Builds the repository's durable description of what the product does today:
inspects the codebase statically, authors the complete `.businesslens/` Product Model
with `codeRefs` on every behavioral claim, installs the managed `AGENTS.md`
guidance block, and validates until green.

## When to use it

- Adopting BusinessLens in a repository that already has code.
- Replacing an incomplete scaffold or rebuilding the model from scratch.
- Not for blank repositories — a new product is planned as a draft model with
  [`businesslens-plan`](./skill-businesslens-plan.md), and init will route
  you there.

## Invocation

```text
/businesslens-init
```

Codex users invoke skills as `$businesslens-init`.

## What it reads and writes

Reads repository instructions (`AGENTS.md`, `CLAUDE.md`, READMEs), docs,
detected SDD roots (`openspec/`, `specs/`, `.kiro/`), and the high-signal
files surfaced by its bundled inventory script. Writes the whole authored
`.businesslens/` tree — `config.yaml`, `taxonomies.yaml`, `product.md`,
`coverage.md`, all entity files — plus the managed
`<!-- businesslens:begin/end -->` block in the root `AGENTS.md`.

## How it works

It forms repository-backed hypotheses for actors, experiences, domains,
features, business rules, and journeys, then traces behavior from entry points
through handlers, services, persistence, integrations, configuration, and
tests. Scenarios cover primary, permission, validation, conflict, and
external-failure paths, including decision points where behavior genuinely
branches. It asks you only about ambiguity the repository cannot resolve,
finishes `coverage.md` honestly, and runs
`npx businesslens validate --json` until green.

## Guardrails

- Describes evidenced behavior, never desired behavior; no guarantees
  inferred from names.
- Never executes the repository's application, build, migrations, or tests.
- Never overwrites a mature existing model without explicit approval (that is
  [`businesslens-sync`](./skill-businesslens-sync.md)'s job).
- Never contacts the platform.

Tutorial: [Map existing code](./tutorial-map-existing-product.md).
