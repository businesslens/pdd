---
title: From your repo
description: Map established repository behavior into an honest Product Model, then verify the current state.
section: open-source
group: Get started
order: 3
---

# Start from your repository

Use this door when implementation already exists and `.businesslens/` is absent
or deliberately untrusted.

## Steps

1. Install the skills:

   ```bash
   npx businesslens@latest install
   ```

2. Run the mapping skill:

   ```text
   /businesslens-map
   ```

   Codex: `$businesslens-map`. It statically inspects repository instructions,
   entry points, services, persistence, integrations, configuration, and tests.
   It never executes target code. It shows the proposed model and coverage
   assessment before writing product meaning.

3. Review the `.businesslens/` diff. Check relationships, scenario contracts,
   explicit unmapped areas, limitations, and any optional code bookmarks.

4. Lint and commit:

   ```bash
   npx businesslens@latest lint
   git add .businesslens
   git commit -m "docs: add BusinessLens Product Model"
   ```

5. Run a semantic current-state audit:

   ```text
   /businesslens-verify current
   ```

`map` is not a daily command. Return to it only to expand coverage or remap a
named area you deliberately stopped trusting. Use `verify` for routine changes,
refactors, suspected drift, and release checks.
