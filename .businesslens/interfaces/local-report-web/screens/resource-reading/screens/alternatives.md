---
entities:
  - { entity: variation, shows: [Subtype, Alternatives] }
  - { entity: interface, shows: [Variation] }
  - { entity: experience, shows: [Container, Variation] }
  - { entity: screen, shows: [Nesting, Variation] }
  - { entity: entity, shows: [Variation] }
  - { entity: capability, shows: [Variation] }
  - { entity: journey, shows: [Variation] }
  - { entity: business-rule, shows: [Assertion, Variation] }
references:
  - kind: code
    role: implementation
    target: layers/nuxt/report-viewer/app/components/BlrVariationAlternatives.vue
---

# Alternatives

A Variation's alternatives, each read in its own words: its statement or
description, its Version label, and the condition that selects it, in stable
title order. Alternatives under different owners each say where they sit;
membership moves nothing. Selecting an alternative opens its own reading, and
Back returns here with the reading position kept. The reading exists only for a
Variation.
