---
title: Introduction
description: BusinessLens is Product-Driven Development for coding agents — a git-tracked product model with code evidence, where planning is editing the model and validation green means done.
section: open-source
group: Get started
order: 1
---

# Introduction

**BusinessLens is Product-Driven Development (PDD) for coding agents.** It keeps
one artifact: a git-tracked product model in `.businesslens/` — who the
product serves, what they accomplish, and where the code proves it.

The model is Markdown, reviewable in pull requests, and useful without a
hosted service.

```text
.businesslens/
├── product.md
├── actors/
├── experiences/
├── domains/
├── features/
├── business-rules/
├── journeys/<id>/journey.md
│   └── scenarios/<id>.md
└── coverage.md
```

## One artifact, one rule

Every behavioral claim (journeys and scenarios) must cite tracked code —
`codeRefs` validated against `git ls-files`. A green `validate` means the
model and the code agree.

That one rule makes planning simple: **plan by editing the model.** Describe
the intended behavior on your branch; `validate` lists new journeys and
scenarios that still lack evidence. Implement, then `businesslens-verify`
checks every planned addition, change, and removal from the complete model diff
and attaches evidence to implemented behavior. Verification complete plus
validation green means done. Git is the change model: branches hold plans,
pull requests review them, history archives them.

## Two ways in, one loop after

- **Existing product** — `/businesslens-init` inspects the code and builds
  the evidence-backed model.
- **Blank repository** — `/businesslens-plan` interviews you and authors the
  whole product as a draft model (evidence relaxed until the code exists).

Then, for every feature:

```text
/businesslens-plan   →   implement   →   /businesslens-verify   →   green
```

Code changed without a plan? `/businesslens-sync` repairs the model.

## The pieces

| Piece | What it does |
| --- | --- |
| `businesslens` CLI | Installs the skills and validates the model deterministically — [CLI reference](./cli.md) |
| Agent skills | Plan, build, verify, and maintain the model inside your AI harness — [Skills reference](./skills.md) |
| `.businesslens/` | The durable, git-tracked product model — [format contract](./format.md) |
| The catalog (optional) | A curated, anonymously browsable collection of Blueprints at [businesslens.io/blueprints](https://businesslens.io/blueprints) — pull one and build from it |

Start with the [Quickstart](./quickstart.md), then read
[How BusinessLens works](./guide.md).
