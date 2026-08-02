---
title: Conventions
description: The authoring rules every entity file shares — how IDs, titles, and descriptions are derived, and what belongs in frontmatter.
section: open-source
group: Reference
order: 36
---

# Authoring conventions

Every entity file in `.businesslens/` follows the same five rules. They are what
let the format stay this small: nothing is declared twice, and nothing is
declared that the filesystem already knows.

## ID = filename stem

An entity's ID is its filename without `.md`. For [journeys](./journeys.md), it
is the directory name.

```text
actors/store-admin.md              → store-admin
journeys/browse-and-buy/journey.md → browse-and-buy
```

IDs are lowercase kebab-case, matching `^[a-z0-9]+(?:-[a-z0-9]+)*$`.

**Never write `id:` in frontmatter.** The filesystem is the ID authority, so an
ID cannot disagree with the file that holds it. Renaming the file renames the
entity, and `validate` catches every relation that still points at the old name.

The one exception is `product.md`, whose `id:` names the whole Product Model
rather than an entity inside it. It may differ from the repository name and is
capped at 64 characters for portability.

[Scenario](./scenarios.md) IDs are unique across the **whole model**, not just
within their journey, so any scenario can be referenced unambiguously from
anywhere.

## H1 = title

The first `# Heading` in the body is the entity's title. [Actors](./actors.md)
and [domains](./domains.md) call it `name`.

## Lead paragraph = description

The prose between the H1 and the first `##` is the description — the summary for
journeys. Later sections are supporting context, except where an entity requires
a structured section.

```md [actors/shopper.md]
---
codeRefs:
  - src/routes/storefront.ts
---

# Shopper

A visitor who browses the catalog and buys products.
```

`Shopper` is the name. The sentence below it is the description. Neither is
declared in frontmatter.

## Frontmatter = relations and evidence only

Frontmatter holds IDs, `codeRefs`, `links`, and structured values such as
`access` or `kind`. **Never prose.**

The schema is a **strict allowlist** — an unrecognized key is an error, not a
value that gets ignored:

```text
unknown frontmatter key "actor"
```

Typos fail loudly and immediately rather than silently dropping a relation.

## `## Intent` is a recognized section

Intent explains why the product or entity exists and which outcome its shape
protects. It is available on the product, [actors](./actors.md),
[experiences](./experiences.md), [domains](./domains.md),
[features](./features.md), [journeys](./journeys.md), and
[business rules](./business-rules.md).

Intent is structured prose, not a separate entity — it adds meaning to an entity
without inventing another relationship graph.

## The format contract

This page is the authoring view. The machine contract that the parser, the
validator, and the catalog server agree on — including the portable Product
Report schema and the source-evidence redaction projection — lives in
`spec/format.md` in the
[`businesslens/pdd`](https://github.com/businesslens/pdd) repository.
