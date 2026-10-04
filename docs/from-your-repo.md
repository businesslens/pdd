---
title: From your repo
description: Map what an existing repository already does into a Product Model, review it, then check the code against it.
section: open-source
group: Get started
order: 3
---

# Start from your repository

Use this door when you already have code and no `.businesslens/` you trust.

## Steps

1. [Install the BusinessLens skills](./installation.md).

2. Run the mapping skill in your agent:

   ```text
   /businesslens-map
   ```

   It reads the repository (instructions, entry points, data, integrations,
   configuration and tests) without running any of it, and shows you the
   proposed model before writing anything.

3. Review the `.businesslens/` diff. New to the folder? The
   [Model overview](./product-model.md) explains it in five minutes:

   - Interfaces are products people or systems use (a web app, a CLI, a
     webhook), not technologies such as a framework or a database.
   - Each Capability is one thing the product does; its cases (success,
     refusal, edge) are its Scenarios, not more Capabilities.
   - Flags and settings that switch behavior appear as
     [Variations](./variations.md), not duplicate Capabilities.
   - Who may do what is in [Business Rules](./business-rules.md).
   - What map couldn't see is listed in `coverage.md`.

4. See what you got:

   ```bash
   npx businesslens view
   ```

5. Lint and commit:

   ```bash
   npx businesslens lint
   git add .businesslens
   git commit -m "docs: add BusinessLens Product Model"
   ```

6. Check the whole product against the code once:

   ```text
   /businesslens-verify current
   ```

`map` is not a daily command. Return to it only to cover more of the product or
to remap an area you no longer trust. Day to day, use `verify`.

Next: [Development loop](./index.md#the-development-loop) · [Model overview](./product-model.md)
