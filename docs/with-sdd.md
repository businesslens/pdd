---
title: With SDD tools
description: Keep product intent durable in BusinessLens while technical proposals and build tasks remain in your spec-driven workflow.
section: open-source
group: Integration
order: 19
---

# With a spec-driven framework

BusinessLens owns product meaning: actors, capabilities, optional Screens,
rules, journeys, and observable scenarios. OpenSpec, spec-kit, and similar
frameworks own technical design and task decomposition.

```text
businesslens-ideate       → approved product delta
OpenSpec / spec-kit       → technical proposal citing affected entity IDs
builder                   → implementation
businesslens-verify       → semantic comparison and automatic resolution loop
businesslens lint         → deterministic structure
```

Model entities may link to technical documents without copying them:

```yaml
links:
  - rel: spec
    href: openspec/specs/checkout/spec.md
    title: Checkout spec
```

Conversely, technical proposals should cite stable Product Model IDs. The model
stays after a proposal is archived.

`businesslens-map` detects established SDD roots during adoption and records
them in `config.yaml`; ideate can add a relevant link while planning. Verify
hands the model acceptance contract to the builder injected by the harness and
returns to inspection after implementation.
