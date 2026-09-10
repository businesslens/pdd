---
kind: edge
routes:
  local: Local
steps:
  - text: The Developer opens a grouped named view of a collection holding many resources
    kind: actor
    actor: developer
    entities:
      - { entity: product, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-collection
  - text: The Product shows each group with its count and makes larger groups explicitly expandable
    kind: product
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-collection
  - text: The Developer expands a group and opens one resource from it
    kind: actor
    actor: developer
    entities: []
    contexts:
      local:
        place: local-report-web::resource-collection
  - text: The Product presents that resource with its incoming and outgoing connections, and keeps disconnected resources reachable in the view behind it
    kind: product
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-page
---

# Read a large grouped model

## Trigger

A Product Model holds more resources than one named view can draw at a readable
size, and the Developer wants one of them.

## Outcome

The Developer can reach any resource the view groups without losing track of the
visible scope, and reads its connections on its own page.
