---
title: Introduction
description: BusinessLens is Product-Driven Design for coding agents — a git-tracked product map in .businesslens/ with code evidence.
order: 1
---

# Introduction

**BusinessLens is Product-Driven Design (PDD) for coding agents.** It builds a
git-tracked product map in `.businesslens/`: who the product serves, what they
accomplish, and where the code proves it.

The map is Markdown, reviewable in pull requests, and useful without a hosted
service.

```text
.businesslens/
├── product.md
├── actors/
├── experiences/
├── domains/
├── journeys/<id>/journey.md
│   └── scenarios/<id>.md
└── coverage.md
```

## Why a product map

- Agents read the map before building, so work starts from product context
  instead of repository archaeology.
- Every claim carries `codeRefs` — evidence validated against `git ls-files`,
  so the map cannot silently drift into fiction.
- The map records what **is**. Prescriptive change intent (what will be built
  next) belongs to your SDD tool of choice — see
  [PDD ♥ SDD](./pdd-and-sdd.md).

## The pieces

| Piece | What it does |
| --- | --- |
| `businesslens` CLI | Installs the skills and validates the map deterministically — [CLI reference](./cli.md) |
| Agent skills | Build and maintain the map inside your AI harness — [Skills reference](./skills.md) |
| `.businesslens/` | The durable, git-tracked product map — [format contract](./format.md) |
| Platform (optional) | Hosts published commit-pinned snapshots for topology, release changes, and comparison |

Start with the [Quickstart](./quickstart.md).
