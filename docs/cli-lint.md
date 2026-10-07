---
title: lint
description: Check that a Product Model is structurally sound (files, relationships, Steps, Rules and References) without claiming it matches the code.
section: open-source
group: CLI
order: 24
---

# `businesslens lint`

Check that the Product Model is structurally sound, after every edit and
[in CI](#run-it-in-ci).

```bash
npx businesslens lint [--json]
```

## Options

| Option | Meaning |
| --- | --- |
| `--json` | Print the result as JSON instead of lines |

## What it does

1. Finds the model. See [Choosing the Product Model](./cli.md#choosing-the-product-model).
2. Checks every file against the rules for its resource type. Each rule is listed
   on its type's page: [the model as a whole](./product-model.md#what-lint-checks),
   [the Product](./product.md#what-lint-checks),
   [Entities](./entities.md#what-lint-checks),
   [Interfaces, Experiences and Screens](./interfaces.md#what-lint-checks),
   [Domains](./domains.md#what-lint-checks),
   [Capabilities](./capabilities.md#what-lint-checks),
   [Journeys](./journeys.md#what-lint-checks),
   [Business Rules](./business-rules.md#what-lint-checks),
   [Variations](./variations.md#what-lint-checks) and
   [References](./references.md#what-lint-checks).
3. Checks that every code Reference points at a file Git tracks.
4. Prints each error and warning, then a one-line verdict.

It only reads. A clean result means the model is well formed, not that it
matches the code. Use [`businesslens-verify`](./skill-businesslens-verify.md)
for that. [Trust model](./trust-model.md) sets the two side by side with your
tests and your own review.

## JSON output

```json
{
  "ok": false,
  "errors": ["/repo/.businesslens/capabilities/place-order/capability.md: missing H1 title"],
  "warnings": [],
  "counts": {
    "interfaces": 3, "experiences": 2, "screens": 1, "domains": 2, "entities": 6,
    "capabilities": 3, "capabilityScenarios": 4, "journeys": 2,
    "journeyScenarios": 3, "businessRules": 2
  }
}
```

Each error and warning is one string, prefixed with the file it concerns
(for a resource, its absolute path). When no model is found, the output is
`{ "ok": false, "errors": ["<message>"], "warnings": [], "counts": {} }`.

Exits 0 when there are no errors (warnings never fail lint), 1 when there are
errors or no model is found, and 2 for an unknown option.

## Run it in CI

Run lint on every pull request, not only when `.businesslens/` changes: a code
rename can break a code Reference. Add `businesslens` as a devDependency at the
version your skills were installed from (recorded in `.businesslens-install.json`
beside the skills), so CI and your agent agree:

```yaml [.github/workflows/businesslens.yml]
name: BusinessLens
on: pull_request

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22 # any version from 20.12
          cache: npm
      - run: npm ci
      - run: npx businesslens lint
```

Warnings never fail the job; errors do. A green lint checks structure only:
whether the code does what the model says is
[`businesslens-verify`](./skill-businesslens-verify.md)'s job.

## Next

- [`view`](./cli-view.md) to read the model as a report.
