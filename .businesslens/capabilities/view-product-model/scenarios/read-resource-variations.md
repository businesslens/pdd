---
kind: edge
routes:
  local: Local
steps:
  - text: The Developer reads an Experience row and its Variation count in the Interfaces list
    kind: actor
    actor: developer
    entities:
      - { entity: interface, effect: reads, facts: [Type] }
      - { entity: experience, effect: reads, facts: [Container, Audience, Variation] }
    contexts:
      local: { place: local-report-web::resource-collection }
  - text: The Product annotates the Experience with a subtype and a linked count including itself without treating them as children
    kind: product
    entities:
      - { entity: experience, effect: reads, facts: [Variation] }
    contexts:
      local: { place: local-report-web::resource-collection }
  - text: The Developer opens the Variations tab, expands selection conditions and follows a member without losing the underlying list
    kind: actor
    actor: developer
    entities:
      - { entity: experience, effect: reads, facts: [Variation] }
    contexts:
      local: { place: local-report-web::resource-reading::variations }
---

# Read resource Variations

## Trigger

The Developer wants to find the current alternatives of an Experience and read
each one in context.

## Outcome

Alternatives remain peers under their owning Interface. Each list row shows the
shared subtype and total count, linking to its Variations tab. The tab includes
the inspected member marked Current and every peer in a stable title order.
Selection conditions expand independently, with the current member open initially.
Different containers are named where necessary. Opening a peer reads its Overview;
Back restores the Variations tab, expansion and reading position. Overview states
its own When used and links to the full set. Closing restores the working list.

## Edge cases

- An Experience without alternatives has no empty relation label or tab.
- Peer links never become containment children or inflate expansion counts.
- The same peer annotation appears in Interface Delivery and every supported collection.
- Conditional permission Rules disclose applicability and are not drawn as unconditional prohibitions.
- A Variation link does not choose a default or inherit content from another resource.
