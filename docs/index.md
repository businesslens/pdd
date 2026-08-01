---
title: Introduction
description: BusinessLens is Product-Driven Development for coding agents — a git-tracked product model with code evidence, where planning is editing the model and validation green means done.
section: open-source
group: Get started
order: 1
---

# Introduction

**Product-Driven Development is a practice: plan behavior into a Product Model,
implement from that model, and check the evidence when the code lands.**

**BusinessLens is the open-source implementation of it** — an open format, a
CLI, and a set of agent skills that create and maintain the model. It keeps one
artifact: a git-tracked Product Model in `.businesslens/` describing who the
product serves, what they accomplish, and where the code proves it.

The model is Markdown, reviewable in pull requests, MIT licensed, and fully
useful without the catalog or any hosted service.

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
scenarios that still lack evidence. Implement, then `businesslens-sync`
checks every planned addition, change, and removal from the complete model diff
and attaches evidence to implemented behavior. Verification complete plus
validation green means done. Git is the change model: branches hold plans,
pull requests review them, history archives them.

## Two ways in, one loop after

- **Existing product** — `/businesslens-init` inspects the code and builds
  the evidence-backed model.
- **Blank repository** — `/businesslens-ideate` interviews you and authors the
  whole product as a draft model (evidence relaxed until the code exists).

Then, for every feature:

```text
/businesslens-ideate →   implement   →   /businesslens-sync   →   green
```

Code changed without a plan? `/businesslens-sync` repairs the model.

## The pieces

| Piece | What it does |
| --- | --- |
| `businesslens` CLI | Installs the skills and validates the model deterministically — [CLI reference](./cli.md) |
| Agent skills | Plan, build, reconcile, and maintain the model inside your AI harness — [Skills reference](./skills.md) |
| `.businesslens/` | The durable, git-tracked product model — [format contract](./format.md) |
| The catalog (optional) | A curated, anonymously browsable collection of Blueprints at [businesslens.io/blueprints](https://businesslens.io/blueprints) — pull one and build from it |
| [Find your flow](./flows.md) | Every situation a model can be in, and which surface handles it |

Pick the door that matches where you are: [From your repo](./from-your-repo.md),
[From a Blueprint](./from-a-blueprint.md), or [From an idea](./from-an-idea.md).
