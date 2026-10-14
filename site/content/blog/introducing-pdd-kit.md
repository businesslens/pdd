---
title: "Introducing pdd-kit: PDD for coding agents"
description: PDD gives agents and humans a shared product model that is git-tracked, reviewable, and verifiable. Open source and MIT licensed.
date: 2026-10-07
image: /brand/heroes/product-model-wide.webp
authors:
  - name: Itai Gendler
    description: "@itai-gendler"
    to: https://github.com/itai-gendler
    avatar:
      src: /team/itai-gendler.png
      alt: Itai Gendler
---

Coding agents write code faster than anyone can explain to them what the product
is. So they guess, and the guesses ship. That problem is laid out in
[AI is writing code for products it doesn’t understand](/blog/your-agent-is-guessing),
and why spec-driven development does not solve it in
[SDD describes the change, not the product](/blog/pdd-and-spec-driven-development).

**Today I am releasing pdd-kit, an open-source implementation of
Product-Driven Development (PDD).** It gives you and your agent one
definition of the product to build from and check against.

## What you get

**A Product Model.** A `product-model/` folder of Markdown files that says what
your product does: who it serves, where they reach it, what it keeps, what it
can do, and which rules must stay true. **It lives beside the code and changes in
the same pull requests.** It defines the product, not the implementation, so
colors, layout and frameworks stay yours to choose.

**Three agent skills** for Claude Code, Codex, Gemini CLI and more:

- `map` reads an existing codebase and drafts the model from it.
- `ideate` decides the next change with you and writes only what you approve.
- `verify` checks the code against the model and works through the gaps with
  you until the two agree, or until something blocks it.

**A CLI.** `pdd-kit lint` checks the model's files. `pdd-kit view`
opens the model as a local report that follows your edits.

**Blueprints.** Reviewed Product Models of common products in a
[public catalog](/blueprints). Pull one into an empty directory and hand it to
your agent.

Every Blueprint is tested the same way: **a fresh agent gets the model and the
words "build this", and has to ship a working product.**

## One loop, run on every change

::development-loop
```text
ideate → implement ⇄ verify
  ▲                     │
  └──── next change ────┘

implement: your agent, your way
```
::

Ideate and verify with pdd-kit. Your own agent implements, your way.

## Get started

```bash
npx pdd-toolkit install
```

Then start from where you are: [existing code](/docs/from-your-repo),
[an idea](/docs/from-an-idea), or [a Blueprint](/docs/from-a-blueprint).

To see a real model first, run `npx pdd-toolkit view itai-gendler/pdd-kit`.
pdd-kit is developed with pdd-kit, and that command opens its own
Product Model.

**It is MIT licensed and local-first.** The skills read your code and never
run it.

## What comes next

This is an early release, and the
[open issues](https://github.com/itai-gendler/pdd-kit/issues) are the roadmap:

- **More Blueprints** across different kinds of product, such as a storefront,
  a booking app, a project tracker and an API service.
- **Review model changes as product changes.** A compare mode in the report
  that shows what a branch changes in the product, not just in the Markdown.
- **Products that don’t fit one repository.** One product spread across several
  repositories, and several products in one repository.
- **KPIs in the model**, so it can say how the product's value is measured.
- **GitHub issues linked to the model**, so tracked work keeps its product
  context.
- **Talk to your agent from the report**, without switching back to the
  terminal.

Try it on a repository you know well and compare the model it drafts with the
one in your head. Where they disagree, and where pdd-kit gets in your way,
[open an issue](https://github.com/itai-gendler/pdd-kit/issues). Contributions,
Blueprints included, are welcome through pull requests on
[itai-gendler/pdd-kit](https://github.com/itai-gendler/pdd-kit).
