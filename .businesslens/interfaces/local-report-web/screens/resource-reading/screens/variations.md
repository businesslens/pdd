---
entities:
  - { entity: interface, shows: [Variation] }
  - { entity: experience, shows: [Container, Variation] }
  - { entity: screen, shows: [Nesting, Variation] }
  - { entity: entity, shows: [Variation] }
  - { entity: capability, shows: [Variation] }
  - { entity: journey, shows: [Variation] }
  - { entity: business-rule, shows: [Variation] }
references:
  - kind: code
    role: implementation
    target: layers/nuxt/report-viewer/app/components/BlrPageBlock.vue
---

# Variations

The resource's currently supported alternatives, including itself marked Current,
in stable title order. The shared subtype and total count introduce the set.
Each member has independently expandable When used fields, including linked
selection Entities and facts, conditions, timing and stability; the inspected
member starts expanded. Ownership distinguishes members in different containers.
Selecting a peer opens its Overview. Back restores expansion and reading position.
The reading is absent for resources without Variations.
