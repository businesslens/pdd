---
kind: edge
routes:
  local: Local
steps:
  - text: The Developer is reading the report while editing the model
    kind: actor
    actor: developer
    contexts:
      local:
        place: local-report-web::entity-page
  - text: A save leaves the model temporarily unable to pass its structural check
    kind: condition
    contexts:
      local:
        place: local-report-web::entity-page
  - text: The Product keeps the last valid report on screen and says that the latest edit is not valid yet
    kind: product
    contexts:
      local:
        place: local-report-web::entity-page
  - text: The Product recompiles once the edit is fixed and returns the reader to what they were reading
    kind: product
    contexts:
      local:
        place: local-report-web::entity-page
---

# Keep the last valid report while an edit is invalid

## Trigger

The model is saved mid-edit while the report is open.

## Outcome

The reader never loses the report to a half-finished save, and they can see that
what they are looking at is not the newest version.
