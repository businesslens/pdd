---
kind: edge
routes:
  local: Local
steps:
  - text: The Developer expands an Interface tree and opens a resource by its name
    kind: actor
    actor: developer
    entities:
      - { entity: interface, effect: reads, facts: [Type, Actors] }
      - { entity: experience, effect: reads, facts: [Container, Audience] }
      - { entity: screen, effect: reads, facts: [Exposure, Container] }
    contexts:
      local:
        place: local-report-web::resource-collection
  - text: The Developer selects Delivery on an Interface, Experience or Screen to inspect what it holds, what it delivers and through which Scenarios
    kind: actor
    actor: developer
    entities:
      - { entity: interface, effect: reads, facts: [Type] }
      - { entity: experience, effect: reads, facts: [Container] }
      - { entity: screen, effect: reads, facts: [Exposure, Container] }
    contexts:
      local:
        place: local-report-web::resource-reading
  - text: The Product uses the same tree rows and group counts, identifying shared references by their owning Interface
    kind: product
    entities:
      - { entity: interface, effect: reads, facts: [] }
    contexts:
      local:
        place: local-report-web::resource-reading
---

# Browse Interface structure

## Trigger

The Developer wants to see how an Interface is organized and inspect a contained
Experience or Screen.

## Outcome

The collection and every Delivery tab use the same hierarchy and expansion
controls, with each place's Capabilities and their Scenarios as items. Resource names open readings; chevrons only expand and collapse.
Returning restores expansion, and the working collection stays in place.

## Edge cases

- Shared Screens appear once under their Interface in the full tree. An Experience's shared references show “From” with a link to that Interface.
- Each Delivery tab starts with children because the inspected resource is already named in the header.
- Group counts name Experiences, Screens or Shared Screens; empty groups and mixed resource totals are absent.
- A resource with no children still opens by its name. A Capability's Scenarios start folded.
- Each place reads its own Delivery; nothing is summed. Audience is read in Overview.
- Tab changes, related-resource navigation, refresh and valid recompilation preserve expansion choices.
