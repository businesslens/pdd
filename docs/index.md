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

## What the model covers, and what it doesn't

The model keeps what any rebuild of your web app, CLI or API would have to
keep, and nothing a rebuild is free to change:

| In the model | Left to design |
| --- | --- |
| Who can reach each place | Colors, typography, copy |
| What it shows and asks for | Components, layout, modals |
| What can be done there | Tabs, wizards and menus |
| Which rules apply | CLI syntax and flags |
| What happens next | API style: CRUD or RPC |

That is why [Interfaces](./interfaces.md) and their Screens are in it: a refund
operators issue in an admin console is a different product from one shoppers
request on the website.

## The development loop

Every product change runs the same loop:

::development-loop
```text
ideate → implement ⇄ verify
   ▲                     │
   └──── next change ────┘

implement: your agent, slice by slice, your usual way
```
::

You talk to your agent; it picks the skill. You don't have to name one.

- **Ideate**: ask for a change, such as "add guest checkout to the product".
  [`businesslens-ideate`](./skill-businesslens-ideate.md) decides it with you
  and records it in the Product Model.
- **Implement**: ask your agent to build it.
  [`businesslens-verify`](./skill-businesslens-verify.md) splits the work into
  slices, and your agent implements each one your usual way: plan mode, an
  SDD tool, or freestyle.
- **Verify**: each slice is checked against the model before the next one
  starts, until the code and the Product Model agree. Run
  `/businesslens-verify` yourself whenever you want to be sure, for example
  before a release.

Ideate changes the model only with your approval. Your agent changes the code
and never the model. A product question that comes up while building comes
back to you; it is never decided in code.

## See the model at any time

At any point in the loop, open the model as a local report in your browser:

```bash
npx businesslens view
```

![The local report open on a Blueprint's overview page](./images/report-overview.webp)

It updates as the files change, so you can keep it open while you ideate,
review a change, or verify. See [`view`](./cli-view.md) for the options.

## What BusinessLens never does

- Run your code to check it: the skills read it, they never execute it. While
  building, your agent runs your tests the way it always does.
- Write outside `.businesslens/`, or edit your AGENTS.md, CLAUDE.md or README.
- Commit for you.

## Next

- [Installation](./installation.md): install the skills into your coding agent.
- [Model overview](./product-model.md): the `.businesslens/` folder in five
  minutes.
