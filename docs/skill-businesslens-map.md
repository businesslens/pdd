---
title: map
description: Create or expand a Product Model from established repository behavior without executing target code.
section: open-source
group: Skills
order: 24
---

# `businesslens-map`

Use map for first adoption in an existing repository, a named area absent from
the model, an area you deliberately no longer trust, or coverage expansion.

It inventories tracked files without writing or dumping the whole file list,
then statically traces behavior from entry points through effects and outcomes.
It treats deployables, routes, commands, APIs, and integrations as evidence—not
automatic Interfaces—and drafts only supported Product contracts with exact
Interface–Experience availability. It asks for approval, writes only inside
`.businesslens/`, and runs structural lint in an isolated runner.

Map never executes target code and never silently replaces a mature model.
Optional implementation References can provide useful navigation, not proof.

Do not schedule map daily. Use [`businesslens-verify`](./skill-businesslens-verify.md)
for freshness, refactors, drift, release checks, and current-state audits.
