---
title: From an idea
description: Decide what a new product does, approve its Product Model, then ask your agent to implement it while verify checks each part.
section: open-source
group: Get started
order: 4
---

# Start from an idea

Use this door when there is no code yet, or none worth describing.

1. [Install the BusinessLens skills](./installation.md), then describe the
   product you want to your agent:

   ```text
   I want to build a booking app for dog walkers
   ```

   Or run `/businesslens-ideate` by name.

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

4. Ask your agent to implement it: "implement it", or "implement our PDD".
   [Verify](./skill-businesslens-verify.md) plans the work in phases, your
   agent implements each phase your usual way (plan mode, an SDD tool, or
   freestyle), and verify checks it before the next. Say "in one go" to skip
   phases, or "one slice at a time" to go slower; see
   [Choose the pace](./skill-businesslens-verify.md#choose-the-pace). Questions
   the model doesn't answer come back to you. BusinessLens never writes code
   itself.
5. Ask your agent to check the code against the model whenever you want to be
   sure, for example before a release.

Next: [Development loop](./index.md#the-development-loop)
