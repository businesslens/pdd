---
title: From an idea
description: Decide a product, approve its Product Model, build it with your own flow, and let verify resolve the result.
section: open-source
group: Get started
order: 5
---

# Start from an idea

Use this door when no established implementation exists.

1. [Install the BusinessLens skills](./installation.md), then invoke ideate:

   ```text
   /businesslens-ideate
   ```

2. If the idea is open, ideate proposes genuinely different product shapes and
   writes nothing. Once you choose—or if you already know the outcome—it drafts
   Actors, Interfaces, Experiences, optional Screens and Domains,
   Capabilities, Business Rules, Journeys, Scenarios, and limitations.
3. Approve the exact Product Model delta. Only then does ideate write
   `.businesslens/`, including its canonical README. Lint checks structure:

   ```bash
   npx businesslens@latest lint
   ```

4. Hand the approved Scenario and Business Rule contract to your normal plan/build flow.
   BusinessLens does not own implementation.
5. Invoke verify once:

   ```text
   /businesslens-verify
   ```

   Verify resolves the inspected scope or returns a precise blocker. See the
   [`verify` skill](./skill-businesslens-verify.md) for resolution behavior.
