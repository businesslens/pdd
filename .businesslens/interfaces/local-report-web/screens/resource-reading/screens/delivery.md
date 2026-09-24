---
entities:
  - { entity: interface, facts: [Type] }
  - { entity: experience, facts: [Container] }
  - { entity: screen, facts: [Exposure, Nesting] }
  - { entity: capability, facts: [Availability] }
  - { entity: capability-scenario, facts: [Classification] }
capabilities: [view-product-model]
---

# Delivery

A place's own branch of the Interfaces tree, as the same expandable tree the
Interfaces collection draws: a Screen's own Capabilities, each holding the
Scenarios with a Step for it placed exactly there, then the Screens nested
inside it; an Interface's Experiences and Screens, or an Experience's own
Screens and the shared Screens it reaches. An Experience or Interface lists a
Capability of its own only as a gap, or, with no Screens, as delivered
directly. A nested place reads its own; nothing is summed. Chevrons expand and
collapse, every item opens its complete reading, a Capability's Scenarios start
folded, and expansion is retained across reading changes, related-resource
lookups, refresh and valid recompilation.
