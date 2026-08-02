---
title: Overview
description: Where BusinessLens sits next to your harness's plan mode and your spec-driven framework — three layers, three lifetimes.
section: open-source
group: Integration
order: 16
---

# Integrating BusinessLens

You almost certainly already plan. Claude Code and Codex have a plan mode; you
may run OpenSpec or spec-kit on top. **BusinessLens does not replace either.**
It sits above both, and the difference is *how long the artifact lives*.

| Layer | Artifact | Answers | Lives |
| --- | --- | --- | --- |
| **Product** | `.businesslens/` | What the product does, for whom, proven where | As long as the product |
| **Change** | OpenSpec / spec-kit proposal | How this change is designed and split up | Until it lands, then archived |
| **Session** | Your harness's plan mode | What the agent types next | Dies with the conversation |

Each layer narrows the one above it. That is the whole relationship.

The practical consequence: **plan mode has no durable memory of what your
product does.** It re-derives your product from the code every session, and the
product decisions you make inside it evaporate when the conversation ends. The
Product Model is what gives it a memory.

BusinessLens is an *input* to plan mode, not a competitor to it.

## Which skill, by which side moved

Three skills carry the loop, separated by one question — **which side is the
source of truth for this edit?**

| Skill | Source of truth | What you end up with |
| --- | --- | --- |
| [`businesslens-init`](./skill-businesslens-init.md) | The code (there is no model yet) | A model describing today |
| [`businesslens-ideate`](./skill-businesslens-ideate.md) | **Your intent** | A model running ahead of the code, on purpose |
| [`businesslens-sync`](./skill-businesslens-sync.md) | The code | A model caught up to what got built |

Shortest form: **`ideate` is where you decide. `sync` is where you settle up.**

## Pick your setup

| You use | Read |
| --- | --- |
| Claude Code or Codex | [With plan mode](./with-plan-mode.md) |
| OpenSpec, spec-kit, or another SDD framework | [With SDD tools](./with-sdd.md) |
| GitHub Actions or any CI | [Validate in CI](./ci.md) |
| Just git and a coding agent | [Your commit loop](./commit-loop.md) |

Nothing in BusinessLens requires a framework. With neither plan mode nor SDD,
the loop is just `ideate` → implement however you like → `sync`.
