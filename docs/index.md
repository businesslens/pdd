---
title: Introduction
description: BusinessLens brings Product-Driven Development to coding agents through a Git-tracked Product Model and an automatic verification loop.
section: open-source
group: Get started
order: 1
---

# BusinessLens: Product-Driven Development for coding agents

BusinessLens is Product-Driven Development for coding agents. It keeps a
durable Product contract in `.businesslens/`: what your product does, for whom,
where, and under which rules, including where it works more than one way
([Variations](./variations.md): feature flags, plan tiers, A/B tests, API
versions). The [Model overview](./product-model.md) explains the folder in five
minutes.

The Product Model says what the product is intended to do. It does not prescribe
the stack or replace your plan mode, SDD framework, coding agent, or tests.

## The development loop

Every product change runs the same loop:

::development-loop
```text
ideate → implement → verify
   ▲                     │
   └──── next change ────┘

implement: plan mode, an SDD tool, or freestyle
```
::

Ideate with BusinessLens. Implement in your own workflow. Verify with
BusinessLens.

- **Ideate** with [`/businesslens-ideate`](./skill-businesslens-ideate.md):
  Decide the next change and record it in the Product Model.
- **Implement** in your existing workflow: Plan mode, an SDD tool, or
  freestyle.
- **Verify** with [`/businesslens-verify`](./skill-businesslens-verify.md):
  Check and improve the code and Product Model until they agree.

BusinessLens installs no implement skill, and PDD does not prescribe how you
implement. It defines only the order and the handoff: the approved Product
Model is what you implement against.

## See the model at any time

At any point in the loop, open the model as a local report in your browser:

```bash
npx businesslens view
```

![The local report open on a Blueprint's overview page](./images/report-overview.webp)

It updates as the files change, so you can keep it open while you ideate,
review a change, or verify. See [`view`](./cli-view.md) for the options.

## What BusinessLens never does

- Run your code: the skills read it, they never execute it.
- Write outside `.businesslens/`, or edit your AGENTS.md, CLAUDE.md or README.
- Commit for you.

## Next

- [Installation](./installation.md): install the skills into your coding agent.
- [Model overview](./product-model.md): the `.businesslens/` folder in five
  minutes.
