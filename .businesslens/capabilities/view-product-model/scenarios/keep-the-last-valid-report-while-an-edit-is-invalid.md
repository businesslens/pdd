---
kind: edge
routes:
  local: Local
steps:
  - text: The Developer is reading the report while the model is being edited elsewhere
    kind: actor
    actor: developer
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-page
  - text: A save leaves the model temporarily unable to pass its structural check
    kind: condition
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-page
  - text: The Product keeps the last valid report in view and says that the latest edit is not valid yet
    kind: product
    entities: []
    contexts:
      local:
        place: local-report-web::resource-page
  - text: The Product recompiles once the edit is fixed and returns the reader to what they were reading
    kind: product
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-page
---

# Keep the last valid report while an edit is invalid

## Trigger

The model is saved mid-edit while the report is open.

## Outcome

The reader never loses the report to a half-finished save, and they can see that
what they are looking at is not the newest version.
