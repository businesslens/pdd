---
kind: primary
routes:
  web: Web
steps:
  - text: The Operator chooses a new status for a component
    kind: actor
    actor: operator
    entities:
      - { entity: component, effect: reads, facts: [Name, Status] }
    contexts:
      web:
        place: status-web::operator-console::component-list
  - text: The Product sets the component to that status
    kind: product
    actor: operator
    entities:
      - { entity: component, facts: [Status] }
    contexts:
      web:
        place: status-web::operator-console::component-list
  - text: The Product works out the page's overall status again from every component
    kind: product
    actor: operator
    entities:
      - { entity: component, effect: reads, facts: [Status] }
    contexts:
      web:
        place: status-web::operator-console::component-list
  - text: No subscription is emailed
    kind: condition
    entities:
      - { entity: subscription, effect: reads, facts: [] }
---

# Change a component's status

## Trigger

The Operator sees that a component is not working as it should, or is working again, and wants the page to say so.

## Outcome

Visitors see the component's new status and the overall status that follows from it; subscribers are not emailed, because no incident was declared.

## Edge cases

- The component is affected by an unresolved incident → its status still changes, and the incident and its timeline are untouched.
