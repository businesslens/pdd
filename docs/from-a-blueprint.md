---
title: From a Blueprint
description: Pull a reviewed Product Model, preserve its completeness, adapt it if needed, then build and verify.
section: open-source
group: Get started
order: 4
---

# Start from a Blueprint

Browse [businesslens.io/blueprints](https://businesslens.io/blueprints), then
pull a canonical name:

```bash
mkdir my-reader && cd my-reader
git init
npx businesslens@latest blueprint pull content-feed-reader
```

The command writes only `.businesslens/`, including its orientation README.
Source-repository and implementation References are removed because they cannot
navigate or describe this new repository. The Blueprint's model-completeness
status is preserved because Coverage is independent from References.

Lint the imported structure:

```bash
npx businesslens@latest lint
```

Read `product.md`, then its Actors, Interfaces, Experiences, Capabilities,
Business Rules, Journeys, and Scenarios. Confirm that exact availability matches
the web, mobile, CLI, API, or integration commitments you want. If it does,
send the model to your normal plan/build flow. If you want adjacent behavior,
run `businesslens-ideate`, approve the model delta, then build.

After implementation, invoke:

```text
/businesslens-verify
```

Verify treats the existing model as the intended contract even if it was
committed before the implementation branch. A Git diff narrows inspection; it
does not erase the plan or choose authority.

Next: [The loop](./the-loop.md) ·
[`blueprint contribute`](./cli-contribute.md)
