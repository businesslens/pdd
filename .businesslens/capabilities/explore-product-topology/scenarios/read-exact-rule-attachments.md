---
kind: edge
routes:
  local: Local
steps:
  - text: The Developer opens Rule attachments and reads a Business Rule
    kind: actor
    actor: developer
    entities:
      - { entity: business-rule, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-collection
  - text: The Product shows its direct Capability, Journey, Scenario, Entity, and Context attachments
    kind: product
    entities:
      - { entity: product-model, effect: reads }
      - { entity: capability, effect: reads }
      - { entity: journey, effect: reads }
      - { entity: entity, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-collection
  - text: The Developer inspects an attachment scoped by an Entity operation, State, fact, or Context
    kind: actor
    actor: developer
    entities:
      - { entity: entity, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-collection
  - text: The Product retains every authored selector and its scope with the target and provides links to the target or Rule page
    kind: product
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-collection
---

# Read exact Rule attachments

## Trigger

The Developer wants to know which resources and places a Business Rule directly names.

## Outcome

The Developer can distinguish authored applicability from derived reach. An empty attachment makes no permission or enforcement claim.
