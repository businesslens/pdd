---
title: Introduction
description: BusinessLens is Product-Driven Design for coding agents — a git-tracked product map with code evidence, where planning is editing the map and validation green means done.
section: open-source
group: Get started
order: 1
---

# Introduction

**BusinessLens is Product-Driven Design (PDD) for coding agents.** It keeps
one artifact: a git-tracked product map in `.businesslens/` — who the
product serves, what they accomplish, and where the code proves it.

The map is Markdown, reviewable in pull requests, and useful without a
hosted service.

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

## One artifact, one rule

Every behavioral claim (journeys and scenarios) must cite tracked code —
`codeRefs` validated against `git ls-files`. A green `validate` means the
map and the code agree.

That one rule makes planning simple: **plan by editing the map.** Describe
the intended behavior on your branch; `validate` lists new journeys and
scenarios that still lack evidence. Implement, then `businesslens-verify`
checks every planned addition, change, and removal from the complete map diff
and attaches evidence to implemented behavior. Verification complete plus
validation green means done. Git is the change model: branches hold plans,
pull requests review them, history archives them.

## Two ways in, one loop after

- **Existing product** — `/businesslens-init` inspects the code and builds
  the evidence-backed map.
- **Blank repository** — `/businesslens-plan` interviews you and authors the
  whole product as a draft map (evidence relaxed until the code exists).

Then, for every feature:

```text
/businesslens-plan   →   implement   →   /businesslens-verify   →   green
```

Code changed without a plan? `/businesslens-sync` repairs the map.

## The pieces

| Piece | What it does |
| --- | --- |
| `businesslens` CLI | Installs the skills and validates the map deterministically — [CLI reference](./cli.md) |
| Agent skills | Plan, build, verify, and maintain the map inside your AI harness — [Skills reference](./skills.md) |
| `.businesslens/` | The durable, git-tracked product map — [format contract](./format.md) |
| Platform (optional) | Hosts published commit-pinned snapshots for topology, release changes, and comparison — covered in the **Platform** section of the docs |

Start with the [Quickstart](./quickstart.md), then read
[How BusinessLens works](./guide.md).
