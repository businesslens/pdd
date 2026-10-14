---
title: From a Blueprint
description: Pull a reviewed Product Model for a common kind of product instead of starting blank, adapt it if needed, then implement it your way and check it against the model.
section: open-source
group: Get started
order: 5
---

# Start from a Blueprint

Use this door when your product is a familiar kind (a kanban board, a habit
tracker, a URL shortener) and you would rather adapt a reviewed model than
write one from nothing.

## What a Blueprint is

**A Blueprint is a reviewed Product Model for a common kind of product,
published in the pdd-kit repository, that you pull instead of starting
blank.** It holds only
product meaning: no code, no file paths, nothing tied to the repository it came
from.

Its life in one line: someone [exports](./cli-export.md) a model and
[contributes](./cli-contribute.md) it, merging its pull request publishes it,
and you [pull](./cli-pull.md) it by name, or [open](./cli-open.md) a Blueprint
file you were given.

## Steps

1. Find one with `npx pdd-toolkit blueprint list`, or browse
   [`blueprints/`](https://github.com/itai-gendler/pdd-kit/tree/main/blueprints)
   on GitHub. Create the project, [install the skills](./installation.md) into
   it, and pull the Blueprint by name:

   ```bash
   mkdir my-product && cd my-product
   git init
   npx pdd-toolkit install
   npx pdd-toolkit blueprint pull kanban-board
   ```

   It writes only `product-model/`; nothing else in the repo changes.

2. Read the Product (`product-model/product/product.md`, or `product.md` when
   the Blueprint has no logo), then skim the rest with:

   ```bash
   npx pdd-toolkit view
   ```

3. If you want something more or different, ask your agent for the change,
   such as "add due dates to cards", and approve it first.

4. Implement it your usual way: ask your agent to "implement the Product
   Model" with plan mode, an SDD tool, or freestyle. The model's README tells
   your agent what the code must honor.
5. Ask your agent to check the code against the model, or run `/pdd-verify`.
   [Verify](./skill-pdd-verify.md) reports every gap and fixes the ones you
   choose. To have verify plan the work in phases and check each one as it
   lands instead, [opt in to implement with verify](./skill-pdd-verify.md#implement-with-verify-opt-in).

