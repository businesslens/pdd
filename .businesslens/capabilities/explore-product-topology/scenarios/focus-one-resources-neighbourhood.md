---
kind: edge
routes:
  local: Local
steps:
  - text: The drawn view holds more relations than can be read at once
    kind: condition
    entities: []
    contexts:
      local:
        place: local-report-web::product-topology
  - text: The Developer focuses one resource, or hides a kind they are not asking about
    kind: actor
    actor: developer
    entities: []
    contexts:
      local:
        place: local-report-web::product-topology
  - text: The Product redraws only that resource's neighbourhood, at the report's full width
    kind: product
    entities: []
    contexts:
      local:
        place: local-report-web::product-topology
---

# Focus one resource's neighbourhood

## Trigger

A named view is too dense to answer the reader's narrower question.

## Outcome

The reader sees one resource and what reaches it, without leaving the view or
losing the question the view was answering.
