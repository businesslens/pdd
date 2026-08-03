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
Source-repository bookmarks are removed because they cannot navigate this new
repository. The Blueprint's model-completeness status is preserved; it is not
downgraded merely because codeRefs were redacted.

Lint the imported structure:

```bash
npx businesslens@latest lint
```

Read `product.md`, the business rules, and the scenarios. If the model is what
you want, send it to your normal plan/build flow. If you want adjacent behavior,
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
