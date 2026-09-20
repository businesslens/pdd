---
kind: edge
routes:
  local: Local
steps:
  - text: The Developer expands an Interface tree and opens a resource by its name
    kind: actor
    actor: developer
    entities:
      - { entity: interface, effect: reads }
      - { entity: experience, effect: reads }
      - { entity: screen, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-collection
  - text: The Developer selects Structure on an Interface or Experience to inspect its children and shared Screen references
    kind: actor
    actor: developer
    entities:
      - { entity: interface, effect: reads }
      - { entity: experience, effect: reads }
      - { entity: screen, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-reading
  - text: The Product uses the same tree rows and group counts, identifying shared references by their owning Interface
    kind: product
    entities:
      - { entity: interface, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-reading
---

# Browse Interface structure

## Trigger

The Developer wants to see how an Interface is organized and inspect a contained
Experience or Screen.

## Outcome

The collection and Structure readings use the same hierarchy and expansion
controls. Resource names open readings; chevrons only expand and collapse.
Returning restores expansion, and the working collection stays in place.

## Edge cases

- Shared Screens appear once under their Interface in the full tree. An Experience's shared references show “From” with a link to that Interface.
- Structure starts with children because the inspected resource is already named in the header.
- Group counts name Experiences, Screens or Shared Screens; empty groups and mixed resource totals are absent.
- A resource with no children still opens by its name. Screens have no Structure tab.
- Structure shows containment and availability. Audience is read in Overview; capability exposure is read in Connections.
- Tab changes, related-resource navigation, refresh and valid recompilation preserve expansion choices.
