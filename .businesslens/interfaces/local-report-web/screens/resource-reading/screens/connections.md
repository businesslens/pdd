---
entities:
  - { entity: product-model, facts: [Product] }
  - { entity: product, facts: [Identity] }
  - { entity: interface, facts: [Actors] }
  - { entity: experience, facts: [Container, Audience] }
  - { entity: screen, facts: [Exposure, Nesting] }
  - { entity: domain, facts: [Region] }
  - { entity: entity, facts: [Relations] }
  - { entity: capability, facts: [Availability, Domain] }
  - { entity: capability-scenario, facts: [Routes and Contexts] }
  - { entity: journey, facts: [Actors] }
  - { entity: journey-scenario, facts: [Routes and Contexts] }
  - { entity: business-rule, facts: [Reach] }
capabilities: [view-product-model]
---

# Connections

The resource's complete relationship list, grouped by direction and
relationship, including links that also appear in Overview. It is offered only
when relationships exist, and each target opens its own reading. Selecting
Connections while reading a Scenario opens its parent's Connections.
