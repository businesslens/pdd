---
title: SDD tools
description: Keep product intent durable in BusinessLens while technical proposals and build tasks remain in your spec-driven workflow.
section: open-source
group: Integrations
order: 23
---

# Use BusinessLens with spec-driven development tools

BusinessLens owns Product meaning: Actors and Interfaces, optional Experiences,
Screens, and Domains, plus Capabilities, exact availability, Business Rules,
local Capability Scenarios, optional coherent Journeys, and end-to-end Journey
Scenarios.
OpenSpec, spec-kit, and similar frameworks own technical design and task
decomposition.

```text
businesslens-ideate       → approved product delta
OpenSpec / spec-kit       → technical proposal citing affected entity IDs
builder                   → implementation
businesslens-verify       → semantic resolution and final structural lint
```

Model entities may attach technical documents without copying them:

```yaml
references:
  - kind: spec
    role: intent
    target: openspec/specs/checkout/spec.md
    title: Checkout spec
```

Conversely, technical proposals should cite stable Product Model IDs. The model
stays after a proposal is archived.

`businesslens-map` detects established SDD roots during adoption and records
them in `config.yaml`; ideate can add a relevant intent Reference while
planning. Verify
hands the model acceptance contract to the builder injected by the harness and
returns to inspection after implementation.
