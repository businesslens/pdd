---
kind: primary
routes:
  local: Local
steps:
  - text: The Developer asks to view the current Product Model
    kind: actor
    actor: developer
    contexts:
      local:
        place: businesslens-cli
  - text: The Product checks the model's structure, serves it on the Developer's own machine, prints the address, and opens a browser
    kind: product
    contexts:
      local:
        place: businesslens-cli
  - text: The Developer reads what the Product is and how much of it is modeled
    kind: actor
    actor: developer
    contexts:
      local:
        place: local-report-web::product-overview
  - text: The Developer moves to a kind's collection and opens the entity they came for
    kind: actor
    actor: developer
    contexts:
      local:
        place: local-report-web::entity-collection
  - text: The Product opens that entity's page at its own address, with a breadcrumb back to the collection
    kind: product
    contexts:
      local:
        place: local-report-web::entity-page
---

# Open the model on localhost

## Trigger

The Developer wants to read the model they are authoring rather than the files
it is stored in.

## Outcome

The model is readable on the Developer's own machine, the open entity is in the
address bar, and nothing has been written or transmitted.

## Edge cases

- Asking for a specific port, or for the address to be printed without opening a browser, changes only how the report is reached.
- Searching by name lands on the entity's page directly, for the same reason a collection row does.
