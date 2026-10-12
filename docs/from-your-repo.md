---
title: From your repo
description: Map what an existing repository already does into a Product Model, review it, then check the code against it.
section: open-source
group: Get started
order: 3
---

# Start from your repository

Use this door when you already have code and no `product-model/` you trust.

1. [Install the pdd-kit skills](./installation.md), then run the mapping
   skill in your agent:

   ```text
   /pdd-map
   ```

   It reads the repository without running any of it, asks what the code can't
   answer, and shows you the proposed model before writing anything.

2. Review and approve. New to the folder? The
   [Model overview](./product-model.md) explains it in five minutes. Which code
   the model accounts for, and what map left out or couldn't establish, is
   listed in `coverage.md`.

3. See what you got:

   ```bash
   npx pdd-kit view
   ```

4. Lint and commit:

   ```bash
   npx pdd-kit lint
   git add product-model
   git commit -m "docs: add pdd-kit Product Model"
   ```

5. Once, ask your agent to check the whole product against the code.

Map is not a daily step. Return to it only to cover more of the product or to
remap an area you no longer trust. Every change after this runs
[the development loop](./index.md#the-development-loop).

Next: [Model overview](./product-model.md)
