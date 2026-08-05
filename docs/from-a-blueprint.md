---
title: From a Blueprint
description: Pull a reviewed Product Model, preserve its completeness, adapt it if needed, then build and verify.
section: open-source
group: Get started
order: 4
---

# Start from a Blueprint

[Install the BusinessLens skills](./installation.md), browse
[businesslens.io/blueprints](https://businesslens.io/blueprints), then pull a
catalog slug:

```bash
mkdir my-reader && cd my-reader
git init
npx businesslens blueprint pull content-feed-reader
```

The command writes only `.businesslens/`, including its orientation README, and
applies the [portable projection](./cli-export.md#portable-export).

Lint the imported structure:

```bash
npx businesslens lint
```

Read `product.md`, then its Actors and Interfaces, optional Experiences,
Screens, and Domains, followed by Capabilities, Business Rules, Journeys, and
Scenarios. Confirm that exact availability matches the web, mobile, CLI, API,
or integration commitments you want. The
[Content Feed Reader walkthrough](./feed-reader-example.md) demonstrates this
review. If the contract fits, send the model to your normal plan/build flow. If
you want adjacent behavior, run `businesslens-ideate`, approve the model delta,
then build.

After implementation, invoke:

```text
/businesslens-verify
```

Verify treats the existing model as the intended contract. See the
[`verify` skill](./skill-businesslens-verify.md) for scope and resolution modes.

Next: [Development loop](./the-loop.md) ·
[`blueprint contribute`](./cli-contribute.md)
