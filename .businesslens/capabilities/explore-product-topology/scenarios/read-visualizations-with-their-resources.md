---
kind: primary
routes:
  local: Local
steps:
  - text: The Developer opens a Journey's Scenarios tab and expands a Scenario
    kind: actor
    actor: developer
    entities:
      - { entity: journey, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-reading
  - text: The Product presents the Scenario's Steps in order, showing each Step's Capability and location breadcrumbs
    kind: product
    entities:
      - { entity: product-model, effect: reads }
      - { entity: journey, effect: reads }
      - { entity: journey-scenario, effect: reads }
      - { entity: capability, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-reading
  - text: The Developer opens an Interface's Overview
    kind: actor
    actor: developer
    entities:
      - { entity: interface, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-reading
  - text: The Product presents the Interface's delivery and Connections without repeating the same relation in both readings
    kind: product
    entities:
      - { entity: product-model, effect: reads }
      - { entity: interface, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-reading
---

# Read visualizations with their resources

## Trigger

The Developer wants to inspect one Journey's Scenarios and their Capability chains, or one Interface's delivery.

## Outcome

The reading appears with its owning resource — Scenarios are read on their parent Journey's page, and an Interface page keeps its delivery tree — and every referenced resource can be opened. Product-wide comparisons remain available through each collection's Graph and the rail's Compare delivery.

## Edge cases

- An Entity, Domain, Capability, Interface, Experience, Screen, Journey, or Business Rule can open its collection's Graph, or its relevant cross-collection view, with that resource in focus. Scenarios remain readings inside their parent.
- Connections distinguish incoming and outgoing relationships and retain their distinct derivations.

- Domains opens a map of classified Capabilities and Entities; unassigned resources stay visible without creating a Domain.
- Interfaces opens a connected containment map or an expandable directory; shared Screens appear once under the Interface, with references from its Experiences.
- An Experience or Screen opened from search or a direct link keeps Interfaces selected and shows its actual ownership breadcrumb.
- Collection readings and their valid focus, directory search, type filters, and expansion survive Back, refresh and model edits.
