---
title: Overview
description: The .businesslens/ folder — what each entity answers, where it lives, and the files that hold the model together.
section: open-source
group: Product model
order: 7
---

# The Product Model

The Product Model is the one artifact BusinessLens keeps: a git-tracked
directory of Markdown describing what your product does, for whom, under which
rules, and where the code proves it.

**The folder is the vocabulary.** Every directory is one entity type, every file
is one entity, and the filename is its ID.

## What each entity answers

The model answers one question from connected angles: *what does this product
do, for whom, under which rules, and where does the code prove it?*

| Entity | Answers | Lives in |
| --- | --- | --- |
| [Actor](./actors.md) | Who | `actors/<id>.md` |
| [Experience](./experiences.md) | Where | `experiences/<id>.md` |
| [Domain](./domains.md) | Which area | `domains/<id>.md` |
| [Feature](./features.md) | What capability exists | `features/<id>.md` |
| [Journey](./journeys.md) | What users accomplish | `journeys/<id>/journey.md` |
| [Scenario](./scenarios.md) | How it observably plays out | `journeys/<id>/scenarios/<id>.md` |
| [Business rule](./business-rules.md) | What must remain true | `business-rules/<id>.md` |
| [Evidence](./evidence.md) | Where the code proves it | `codeRefs:` on any entity |

They nest like this:

```text
Product
├── Actors
├── Experiences ── surfaces available to actors
├── Domains
│   └── Features ── capabilities available through experiences
├── Journeys ── actor goals in a domain, using features
│   └── Scenarios ── observable paths through a journey
│       └── Decision points ── conditional forks inside a scenario
└── Business rules ── constraints on domains, features, journeys, or scenarios
```

## `product.md` — the root

The one file with an `id:`, because it names the Product Model rather than an
entity inside it. It may differ from the repository name and is capped at 64
characters for portability.

```md [.businesslens/product.md]
---
id: acme-shop
tags: [commerce]
limitations: []
---

# Acme Shop

One-paragraph description of the product.

## Intent

Why this product should exist and the outcome it protects.
```

Unrecognized sections are preserved as supporting Markdown, so a model can be
exported and re-expanded without losing authored context.

## `coverage.md` — how honest the model is

Coverage records how the model was built and what it deliberately leaves out.

```md [.businesslens/coverage.md]
---
status: partial                    # complete | partial | draft
method: ["Static review of the pinned revision without executing code"]
sourceAreas: [src, server]
unmapped: ["deployment/"]
limitations: ["Background jobs not yet mapped"]
---

# Coverage

Free prose rationale retained with the coverage assessment.
```

| Status | Meaning |
| --- | --- |
| `complete` | The claimed product scope is mapped |
| `partial` | Useful evidence-backed coverage, with known gaps |
| `draft` | A planned greenfield model whose implementation evidence has not been earned yet |

`draft` is the one status that changes validation — see
[Evidence & coverage](./evidence.md#the-draft-rule).

## `config.yaml` and `taxonomies.yaml`

```yaml [.businesslens/config.yaml]
schema: 1
sdd:
  paths: [openspec/]               # detected SDD roots; empty if none
```

`config.yaml` has no other keys. See [With SDD tools](./with-sdd.md) for what
`sdd.paths` is for.

```yaml [.businesslens/taxonomies.yaml]
scenarioKinds:
  - id: primary
    name: Primary
    description: Expected path through a user goal.
    colorSlot: 1
  - id: edge
    name: Edge case
    description: Alternative or failure path.
    colorSlot: 6
```

`taxonomies.yaml` defines the vocabulary a [scenario](./scenarios.md)'s `kind`
must come from. The vocabulary is yours.

## Generated files

`build/` and `cache/` hold derived artifacts — the portable Product Report and
the repository inventory. Both are gitignored by `businesslens-init`. Never
edit or commit them.

---

The authoring rules every entity shares — how IDs, titles, and descriptions are
derived — are in [Conventions](./conventions.md).
