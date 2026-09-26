---
entities:
  - { entity: product-model, shows: [Product] }
  - { entity: product, shows: [Identity] }
  - { entity: interface, shows: [Actors] }
  - { entity: experience, shows: [Container, Audience] }
  - { entity: screen, shows: [Exposure, Nesting] }
  - { entity: domain, shows: [Region] }
  - { entity: entity, shows: [Relations] }
  - { entity: capability, shows: [Availability, Domain] }
  - { entity: capability-scenario, shows: [Routes and Contexts] }
  - { entity: journey, shows: [Actors] }
  - { entity: journey-scenario, shows: [Routes and Contexts] }
  - { entity: business-rule, shows: [Reach] }
---

# Connections

The resource's complete relationship list, grouped by direction and
relationship, including links that also appear in Overview. It is offered only
when relationships exist, and each target opens its own reading. Selecting
Connections while reading a Scenario opens its parent's Connections.
