---
title: From a Blueprint
description: Pull a reviewed Product Model for a common kind of product instead of starting blank, adapt it if needed, then implement and verify.
section: open-source
group: Get started
order: 4
---

# Start from a Blueprint

Use this door when your product is a familiar kind (a webshop, a booking app, a
help desk) and you would rather adapt a reviewed model than write one from
nothing.

## What a Blueprint is

**A Blueprint is a reviewed Product Model for a common kind of product, shared
through a catalog, that you pull instead of starting blank.** It holds only
product meaning: no code, no file paths, nothing tied to the repository it came
from.

Its life in one line: someone [exports](./cli-export.md) a model and
[contributes](./cli-contribute.md) it, it is reviewed into the catalog, and you
[pull](./cli-pull.md) it by name, or [open](./cli-open.md) a Blueprint file you
were given.

## Steps

1. Browse [businesslens.io/blueprints](https://businesslens.io/blueprints),
   create the project, [install the skills](./installation.md) into it, and
   pull the Blueprint by name:

   ```bash
   mkdir my-product && cd my-product
   git init
   npx businesslens install
   npx businesslens blueprint pull your-blueprint-slug
   ```

   It writes only `.businesslens/`; nothing else in the repo changes.

2. Read the Product (`.businesslens/product/product.md`, or `product.md` when
   the Blueprint has no logo), then skim the rest with:

   ```bash
   npx businesslens view
   ```

3. If it fits, implement it in your existing workflow. If you want something
   more or different, run `/businesslens-ideate`, approve the model change,
   then implement.

4. After implementing, check the code against the model:

   ```text
   /businesslens-verify
   ```

