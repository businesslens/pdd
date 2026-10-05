---
kind: validation
routes:
  web: Web
steps:
  - text: The Operator enters a name another component already has
    kind: actor
    actor: operator
    entities:
      - { entity: component, effect: reads, facts: [Name] }
    contexts:
      web:
        place: status-web::operator-console::component-list
  - text: The Product explains that component names must be unique and keeps what was entered
    kind: product
    actor: operator
    entities:
      - { entity: component, effect: reads, facts: [] }
    contexts:
      web:
        place: status-web::operator-console::component-list
  - text: No component is added
    kind: condition
    entities:
      - { entity: component, effect: reads, facts: [] }
    contexts:
      web:
        place: status-web::operator-console::component-list
---

# Refuse a duplicate component name

## Trigger

The Operator adds a component under a name the page already lists.

## Outcome

The page's components are unchanged and the Operator can choose another name without retyping the description.
