---
title: "Tutorial: build from a Blueprint"
description: Pull a curated Product Model from the catalog and turn it into working software.
section: open-source
group: Tutorials
order: 13
---

# Build from a Blueprint

The fastest path from nothing to a working product: start from a Product Model
someone already got right.

## 1. Find a Blueprint

Browse [businesslens.io/blueprints](https://businesslens.io/blueprints). No
account is needed, to browse or to pull.

Each Blueprint is an **executable brief** — small enough to build end to end,
complete enough that an agent handed nothing but the model produces a working
product.

## 2. Pull it

```bash
mkdir my-reader && cd my-reader
git init
npx businesslens@latest pull content-feed-reader
```

You now have:

- `.businesslens/` — the complete Product Model: actors, experiences, domains,
  features, business rules, journeys, and scenarios;
- `AGENTS.md` — a managed block telling a coding agent what this repository is.

Nothing is implemented. `coverage.md` says `status: draft`, and validation
reports missing evidence as warnings. That is the worklist, not a problem:

```bash
npx businesslens@latest validate
```

## 3. Read it yourself first

Worth ten minutes. Start with `.businesslens/product.md` for what the product is
and the outcome it protects, then the business rules — those are the invariants
that hold across everything else.

## 4. Build it

Two paths.

**Straight to implementation**, when the Blueprint is what you want: hand the
repository to your coding agent and tell it to build. `pull` already wrote the
contract into `AGENTS.md`, so the agent knows the model is the specification,
that the scenarios are the acceptance contract, and that nothing here
prescribes a stack.

Work journey by journey, with a test per scenario.

**Refine first**, when you want something adjacent:

```text
/businesslens-plan
```

Change the model to describe your product — add an actor, drop a journey, revise
a rule — then implement. Editing the model first is what keeps it true; editing
the code first is how models start lying.

Not sure what to change? `/businesslens-ideate` reads the model and proposes
what is missing, without writing anything.

## 5. Attach evidence

Once it runs:

```text
/businesslens-verify
```

This adds `codeRefs` linking journeys and scenarios to the code that implements
them, and moves coverage off `draft`. From then on `validate` requires evidence,
and the model stays honest as the product changes.

```bash
npx businesslens@latest validate
```

## What you end up with

A working product **and** a live Product Model of it — so the next feature can
be planned in the model, implemented, and verified, rather than guessed at from
the code.

## Where to go next

- [Ship a feature](./tutorial-ship-a-feature.md) — the loop, on a live model.
- [Contributing a Blueprint](./contributing-blueprints.md) — propose your own.
