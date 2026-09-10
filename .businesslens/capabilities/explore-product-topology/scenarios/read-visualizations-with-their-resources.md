---
kind: primary
routes:
  local: Local
steps:
  - text: The Developer opens a Journey and selects composition in its Scenarios
    kind: actor
    actor: developer
    entities:
      - { entity: journey, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-page
  - text: The Product presents that Journey's Scenario compositions with each Capability occurrence in Step order and a way to read the full Scenario
    kind: product
    entities:
      - { entity: product-model, effect: reads }
      - { entity: journey, effect: reads }
      - { entity: journey-scenario, effect: reads }
      - { entity: capability, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-page
  - text: The Developer opens an Interface's Overview
    kind: actor
    actor: developer
    entities:
      - { entity: interface, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-page
  - text: The Product presents the Interface's delivery and Connections without repeating the same relation in both readings
    kind: product
    entities:
      - { entity: product-model, effect: reads }
      - { entity: interface, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-page
---

# Read visualizations with their resources

## Trigger

The Developer wants to inspect one Journey's composition or one Interface's delivery.

## Outcome

The reading appears with its owning resource, and every referenced resource can be opened. Product-wide comparisons remain available through named resource visualizations and Compare delivery from the Interfaces collection.

## Edge cases

- An Entity, Domain, Capability, Interface, Experience, Screen, or Business Rule can open its relevant global comparison with that resource in focus. Journey composition and Scenarios remain readings inside their parent.
- Connections distinguish incoming and outgoing relationships and retain their distinct derivations.

- Domains opens a map of classified Capabilities and Entities; unassigned resources stay visible without creating a Domain.
- Interfaces opens a connected containment map or an expandable directory; shared Screens appear once under the Interface, with references from its Experiences.
- An Experience or Screen opened from search or a direct link keeps Interfaces selected and shows its actual ownership breadcrumb.
- Collection readings and their valid focus, directory search, type filters, and expansion survive Back, refresh and model edits.
