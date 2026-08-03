---
title: From an idea
description: Decide a product, approve its Product Model, build it with your own flow, and let verify resolve the result.
section: open-source
group: Get started
order: 5
---

# Start from an idea

Use this door when no established implementation exists.

1. Install BusinessLens and invoke ideate:

   ```bash
   npx businesslens@latest install
   ```

   ```text
   /businesslens-ideate
   ```

2. If the idea is open, ideate proposes genuinely different product shapes and
   writes nothing. Once you choose—or if you already know the outcome—it drafts
   actors, experiences, optional Screens, domains, features, rules, journeys,
   scenarios, and limitations.
3. Approve the exact Product Model delta. Only then does ideate write
   `.businesslens/`, including its canonical README. Lint checks structure:

   ```bash
   npx businesslens@latest lint
   ```

   Coverage status describes model breadth, not implementation. Optional
   `codeRefs` may be absent at any status.
4. Hand the approved scenario and rule contract to your normal plan/build flow.
   BusinessLens does not own implementation.
5. Invoke verify once:

   ```text
   /businesslens-verify
   ```

   If code is wrong, verify hands the approved contract to the builder injected
   by your harness and checks again. If intended behavior changed while building,
   it drafts the smallest model delta, asks for approval, writes it, and checks
   again. If neither side is right, it resolves intent before building.

The result is aligned for the inspected scope or a precise blocker—not a request
for you to manually invoke another BusinessLens skill.
