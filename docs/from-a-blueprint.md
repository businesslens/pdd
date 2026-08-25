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
mkdir my-product && cd my-product
git init
npx businesslens blueprint pull your-blueprint-slug
```

The command writes only `.businesslens/`, including its orientation README, and
applies the [portable projection](./cli-export.md#portable-export).

Lint the imported structure:

```bash
npx businesslens lint
```

Read `product.md` or `product/product.md`, then its Actors and Interfaces, optional Experiences,
Screens, and Domains, followed by Capabilities, Capability Scenarios, Business
Rules, optional Journeys, and Journey Scenarios. Confirm that every Capability
has direct local acceptance coverage and that its Scenarios are genuine
variations rather than hidden operations. Confirm that every Journey defines a
deliberate Goal and every Journey Scenario traces a supported multi-Capability
route. If the contract fits, send the model to your normal plan/build flow. If
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
