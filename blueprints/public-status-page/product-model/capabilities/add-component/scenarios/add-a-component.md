---
kind: primary
routes:
  web: Web
steps:
  - text: The Operator enters the name and description of a new component
    kind: actor
    actor: operator
    entities:
      - { entity: component, effect: reads, facts: [] }
    contexts:
      web:
        place: status-web::operator-console::component-list
  - text: The Product adds the component to the page as Operational
    kind: product
    actor: operator
    entities:
      - { entity: component, effect: creates, facts: [Name, Description, Status] }
    contexts:
      web:
        place: status-web::operator-console::component-list
  - text: The component is listed with its status
    kind: condition
    entities:
      - { entity: component, effect: reads, facts: [Name, Status] }
    contexts:
      web:
        place: status-web::operator-console::component-list
---

# Add a component

## Trigger

The Operator chooses to add a component visitors should see the status of.

## Outcome

The component is on the page, Operational, after the components already listed.
