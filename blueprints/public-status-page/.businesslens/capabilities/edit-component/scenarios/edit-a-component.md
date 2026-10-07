---
kind: primary
routes:
  web: Web
steps:
  - text: The Operator changes the component's name or description
    kind: actor
    actor: operator
    entities:
      - { entity: component, effect: reads, facts: [Name, Description] }
    contexts:
      web:
        place: status-web::operator-console::component-detail
  - text: The Product saves the new name and description
    kind: product
    actor: operator
    entities:
      - { entity: component, facts: [Name, Description] }
    contexts:
      web:
        place: status-web::operator-console::component-detail
  - text: The public page shows the component under its new name, with its status unchanged
    kind: condition
    entities:
      - { entity: component, effect: reads, facts: [Name, Status] }
    contexts:
      web:
        place: status-web::operator-console::component-detail
---

# Edit a component

## Trigger

The Operator wants a component described differently to visitors.

## Outcome

Visitors see the new name and description; the component's status and the incidents and maintenance naming it are unchanged.

## Edge cases

- The new name is already used by another component → the change is refused, the old name kept, and the Operator can choose another.
