---
title: blueprint contribute
description: Open a pull request proposing your Product Model as a catalog Blueprint.
section: open-source
group: CLI
order: 34
---

# `businesslens blueprint contribute`

Propose your Product Model for the public Blueprint catalog:

```bash
npx businesslens@latest blueprint contribute --slug my-blueprint
```

A [Blueprint](./cli-export.md) is a portable Product Report. This command opens
a pull request containing its canonical expanded Product Model and manifest.

Authentication uses your GitHub identity through the
[GitHub CLI](https://cli.github.com):

```bash
gh auth login
```

`contribute` refuses to run without it, rather than failing halfway through.

## Options

| Option | Effect |
| --- | --- |
| `--slug <name>` | Override the product ID used as the lowercase kebab-case catalog slug. |
| `--yes` | Skip the confirmation prompt; required when no interactive terminal is available. |

## A good Blueprint

A Blueprint should be small enough to build end to end and complete enough that
a coding agent can produce a recognizable product from the pulled model alone.

Check these before contributing:

- **Focused scope:** one product, not a platform or suite.
- **Complete contract:** all necessary Actors, Journeys, Business Rules, and meaningful
  success, permission, validation, conflict, and external-failure Scenarios.
- **Observable Scenarios:** each path can be checked against implementation.
  Prefer “submitting an empty cart shows an error and keeps the cart” over
  “cart validation works.”
- **Product-level prose:** describe what users observe, not frameworks,
  databases, or architecture.
- **Generic shape:** model an archetype rather than a named third-party product.
- **Portable content:** no code or implementation References, local Reference
  targets, Coverage source areas, or repository-relative entry points.

The portability rules are enforced automatically. Author a greenfield model
with [`businesslens-ideate`](./skill-businesslens-ideate.md), then test it by
pulling it into an empty directory and asking an agent to build it without extra
product instructions.

## What it does

1. Loads and lints the Product Model. Lint errors stop the run.
2. Exports it through the [portable projection](./cli-export.md#portable-export).
3. Expands that Blueprint into canonical `.businesslens/` files.
4. Derives the slug from `--slug` or the Product ID.
5. Writes `blueprints/<slug>/{blueprint.yaml,.businesslens/}` on a
   `blueprint/<slug>` branch.
6. Opens or updates the pull request and prints its URL.

## Your repo is safe

The contribution is prepared in a temporary directory. Your repository is only
read; it does not gain a branch, remote, commit, or catalog files.

Only the canonical portable expansion is submitted, so repository-specific
source navigation is never copied into the pull request.

## Contributing again

Run the same command to revise a contribution. It syncs the fork, force-pushes
only the command-owned `blueprint/<slug>` branch, and updates an existing pull
request when one is open. If the fork cannot be synchronized, the command stops.

Leave the fork in your GitHub account until the pull request is merged.

## The manifest

`contribute` writes a `blueprint.yaml` with what it can infer and placeholders
for what it cannot:

```yaml
slug: content-feed-reader
title: Content & Feed Reader
summary: One sentence on what the product is.
category: Content
tags: [content, reading]
icon: i-lucide-rss
accent: "#b8965c"
authors: [Your Name]
license: MIT
```

Expect to edit `category`, `icon`, `accent`, and `authors` in the pull request.
Blueprint content is MIT, the same as the code.

## Destination and publication

The default upstream is `businesslens/pdd`. Set
`BUSINESSLENS_CONTRIBUTE_UPSTREAM` to another `owner/repo` when contributing to
a custom catalog source.

Merging approves the Blueprint. A maintainer publishes it to the catalog, and
catalog listing remains a separate decision.
