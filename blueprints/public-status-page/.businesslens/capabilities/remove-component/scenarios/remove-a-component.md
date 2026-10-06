---
kind: primary
routes:
  web: Web
steps:
  - text: The Operator removes the component and confirms it should go for good
    kind: actor
    actor: operator
    entities:
      - { entity: component, effect: removes }
    contexts:
      web:
        place: status-web::operator-console::component-detail
  - text: The Product takes the component off the page and works out the overall status again from the components left
    kind: product
    actor: operator
    entities:
      - { entity: component, effect: reads, facts: [Status] }
    contexts:
      web:
        place: status-web::operator-console::component-list
  - text: Past incidents and maintenance that affected it still show it in the page's history
    kind: condition
    entities:
      - { entity: incident, effect: reads, facts: [Affected components] }
      - { entity: maintenance, effect: reads, facts: [Affected components] }
---

# Remove a component

## Trigger

A component no longer exists, or visitors no longer need its status.

## Outcome

The component is gone from the page and the overall status follows from the components left; the page's history still reads as it did.

## Edge cases

- The component is affected by an unresolved incident or by maintenance not yet completed → it cannot be removed until that is over.
- The Operator declines to confirm → the component stays on the page.
