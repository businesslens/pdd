---
title: From an idea
description: Decide what a new product does, approve its Product Model, then implement it your way and check it against the model.
section: open-source
group: Get started
order: 4
---

# Start from an idea

Use this door when there is no code yet, or none worth describing.

1. Create a folder for the product as a Git repository (the skills check the
   model only inside one) and [install the pdd-kit skills](./installation.md)
   into it:

   ```bash
   mkdir dog-walking && cd dog-walking
   git init
   npx pdd-toolkit install
   ```

   Then describe the product you want to your agent:

   ```text
   I want to build a booking app for dog walkers
   ```

   Or run `/pdd-ideate` by name.

2. If the idea is still open, ideate proposes a few genuinely different product
   shapes and writes nothing. Once you choose (or if you already know what you
   want), it drafts who uses the product, where, what it can do, and the rules.
   You approve before anything is written.
3. Approve the change. Only then does ideate write `product-model/`, including
   the model's README (`product-model/README.md`). Check the files are
   well-formed:

   ```bash
   npx pdd-toolkit lint
   ```

4. Implement it your usual way: ask your agent to "implement it" with plan
   mode, an SDD tool, or freestyle. The model's README tells your agent what
   the code must honor, and to bring product questions back to you rather
   than settle them in code. pdd-kit never writes code itself.
5. Ask your agent to check the code against the model, or run `/pdd-verify`.
   [Verify](./skill-pdd-verify.md) reports every gap and fixes the ones you
   choose. Check again whenever you want to be sure, for example before a
   release. To have verify plan the work in phases and check each one as it
   lands instead, [opt in to implement with verify](./skill-pdd-verify.md#implement-with-verify-opt-in).

Next: [Development loop](./index.md#the-development-loop)
