---
title: From an idea
description: Decide what a new product does, approve its Product Model, build it with your own flow, and let verify check the result.
section: open-source
group: Get started
order: 5
---

# Start from an idea

Use this door when there is no code yet, or none worth describing.

1. [Install the BusinessLens skills](./installation.md), then run ideate in your
   agent:

   ```text
   /businesslens-ideate
   ```

2. If the idea is still open, ideate proposes a few genuinely different product
   shapes and writes nothing. Once you choose (or if you already know what you
   want), it drafts who uses the product, where, what it can do, and the rules.
   You approve before anything is written.
3. Approve the change. Only then does ideate write `.businesslens/`, including
   the model's README (`.businesslens/README.md`). Check the files are
   well-formed:

   ```bash
   npx businesslens lint
   ```

4. Hand the approved model to your normal plan and build flow. BusinessLens does
   not build anything itself.
5. When the build is done, check the code against the model:

   ```text
   /businesslens-verify
   ```

   Verify fixes what disagrees, or stops and says exactly what blocks it. See
   the [`verify` skill](./skill-businesslens-verify.md).

Next: [Development loop](./index.md#the-development-loop)
