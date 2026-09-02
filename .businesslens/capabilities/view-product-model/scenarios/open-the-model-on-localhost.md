---
kind: primary
routes:
  local: Local
steps:
  - text: The Developer asks to view the current Product Model
    kind: actor
    actor: developer
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: businesslens-cli
  - text: The Product checks the model's structure, serves it on the local machine, prints the address, and opens a browser
    kind: product
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: businesslens-cli
  - text: The Developer reads what the Product is and how much of it is modeled
    kind: actor
    actor: developer
    entities:
      - { entity: product, effect: reads }
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: local-report-web::product-overview
  - text: The Developer moves to a kind's collection and opens the resource they came for
    kind: actor
    actor: developer
    entities: []
    contexts:
      local:
        place: local-report-web::resource-collection
  - text: The Product opens that resource's page at its own address, with a breadcrumb back to the collection
    kind: product
    entities: []
    contexts:
      local:
        place: local-report-web::resource-page
---

# Open the model on localhost

## Trigger

The Developer wants to read the model they are authoring rather than the files
it is stored in.

## Outcome

The model is readable on the Developer's own machine, the open resource is in the
address bar, and nothing has been written or transmitted.

## Edge cases

- Asking for a specific port, or for the address to be printed without opening a browser, changes only how the report is reached.
- Searching by name lands on the resource's page directly, for the same reason a collection row does.
